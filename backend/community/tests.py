from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from backend_project.asgi import application
from community.models import (
    ChatMessage,
    ChatParticipant,
    ChatRoom,
    Community,
    CommunityMembership,
    CommunityPost,
    MessageReaction,
    PostComment,
)

User = get_user_model()


class CommunityMembershipTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="member@example.test", password="CommunityPass123!")
        self.client.force_authenticate(self.user)
        self.community = Community.objects.create(
            slug="anxiety-support",
            name="Anxiety Support",
            description="A peer-support space.",
        )

    def test_community_list_returns_public_communities_with_member_counts(self):
        response = self.client.get("/api/community/list/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(item["slug"] == self.community.slug for item in response.data))
        community_data = next(item for item in response.data if item["slug"] == self.community.slug)
        self.assertEqual(community_data["member_count"], 0)
        self.assertEqual(community_data["post_count"], 0)

    def test_join_saves_identity_choice_and_creates_shared_chat_room(self):
        response = self.client.post(
            "/api/community/membership/",
            {"community_id": self.community.pk, "display_anonymously": False},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        membership = CommunityMembership.objects.get(user=self.user, community=self.community)
        self.assertFalse(membership.display_anonymously)
        self.assertTrue(ChatRoom.objects.filter(community=self.community, is_private=False).exists())

    def test_chat_room_returns_selected_display_name_for_active_member(self):
        CommunityMembership.objects.create(
            user=self.user,
            community=self.community,
            display_anonymously=False,
        )
        self.user.display_name = "Mindful Member"
        self.user.save(update_fields=["display_name"])

        response = self.client.get(f"/api/community/{self.community.slug}/chat-room/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["display_name"], "Mindful Member")
        self.assertFalse(response.data["display_anonymously"])

    def test_non_boolean_identity_choice_is_rejected(self):
        response = self.client.post(
            "/api/community/membership/",
            {"community_id": self.community.pk, "display_anonymously": "false"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(CommunityMembership.objects.filter(user=self.user).exists())

    def test_member_can_create_a_post_comment(self):
        post = CommunityPost.objects.create(
            community=self.community,
            author=self.user,
            title="A supportive post",
            body="Sharing a little hope.",
        )

        response = self.client.post(
            f"/api/community/{self.community.slug}/posts/{post.pk}/comments/",
            {"body": "Thank you for sharing this."},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["body"], "Thank you for sharing this.")
        self.assertTrue(PostComment.objects.filter(post=post, author=self.user).exists())


class CommunityWebSocketTests(TransactionTestCase):
    def setUp(self):
        self.member = User.objects.create_user(email="chat-member@example.test", password="CommunityPass123!")
        self.other_user = User.objects.create_user(email="not-a-member@example.test", password="CommunityPass123!")
        self.community = Community.objects.create(
            slug="peer-chat",
            name="Peer Chat",
            description="A peer-support space.",
        )
        CommunityMembership.objects.create(user=self.member, community=self.community, display_anonymously=False)
        self.room = ChatRoom.objects.create(community=self.community, title="Community Lounge")
        self.token = str(RefreshToken.for_user(self.member).access_token)
        self.other_token = str(RefreshToken.for_user(self.other_user).access_token)

    def test_active_member_can_send_a_persisted_realtime_message(self):
        async def exercise_socket():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/community/{self.room.pk}/?token={self.token}",
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.receive_json_from()
            await communicator.send_json_to({"type": "chat.message", "body": "You are not alone."})
            event = await communicator.receive_json_from()
            await communicator.disconnect()
            return event

        event = async_to_sync(exercise_socket)()

        self.assertEqual(event["type"], "chat.message.created")
        self.assertEqual(event["message"]["body"], "You are not alone.")
        self.assertEqual(event["message"]["author_handle"], "Community member")
        self.assertTrue(ChatMessage.objects.filter(room=self.room, author=self.member).exists())

    def test_non_member_cannot_connect_to_chat_room(self):
        async def exercise_socket():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/community/{self.room.pk}/?token={self.other_token}",
            )
            connected, _ = await communicator.connect()
            await communicator.disconnect()
            return connected

        self.assertFalse(async_to_sync(exercise_socket)())

    def test_member_can_toggle_a_realtime_message_reaction(self):
        message = ChatMessage.objects.create(
            room=self.room,
            author=self.member,
            body="Sending support.",
        )

        async def exercise_socket():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/community/{self.room.pk}/?token={self.token}",
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.receive_json_from()
            await communicator.send_json_to({
                "type": "chat.reaction",
                "message_id": message.pk,
                "emoji": "💚",
            })
            added_event = await communicator.receive_json_from()
            await communicator.send_json_to({
                "type": "chat.reaction",
                "message_id": message.pk,
                "emoji": "💚",
            })
            removed_event = await communicator.receive_json_from()
            await communicator.disconnect()
            return added_event, removed_event

        added_event, removed_event = async_to_sync(exercise_socket)()

        self.assertFalse(added_event["removed"])
        self.assertTrue(removed_event["removed"])
        self.assertEqual(added_event["emoji"], "💚")
        self.assertFalse(MessageReaction.objects.filter(message=message, user=self.member).exists())

    def test_private_support_rooms_remain_limited_to_participants(self):
        private_room = ChatRoom.objects.create(
            community=self.community,
            title="Private support",
            is_private=True,
        )
        ChatParticipant.objects.create(room=private_room, user=self.member)

        async def connect_with(token):
            communicator = WebsocketCommunicator(
                application,
                f"/ws/community/{private_room.pk}/?token={token}",
            )
            connected, _ = await communicator.connect()
            await communicator.disconnect()
            return connected

        self.assertTrue(async_to_sync(connect_with)(self.token))
        self.assertFalse(async_to_sync(connect_with)(self.other_token))
