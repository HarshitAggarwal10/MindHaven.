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
    AnonymousIdentity,
    MessageReaction,
    Notification,
    PostComment,
    UserPresence,
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

    def test_community_counts_are_correct_with_multiple_members_and_posts(self):
        other_user = User.objects.create_user(email="another-member@example.test", password="password")
        CommunityMembership.objects.create(user=self.user, community=self.community)
        CommunityMembership.objects.create(user=other_user, community=self.community)
        for index in range(3):
            CommunityPost.objects.create(
                community=self.community,
                author=self.user,
                title=f"Supportive post {index}",
            )

        list_response = self.client.get("/api/community/list/")
        detail_response = self.client.get(f"/api/community/{self.community.slug}/")
        membership_response = self.client.get("/api/community/membership/")

        self.assertEqual(list_response.status_code, 200)
        list_community = next(item for item in list_response.data if item["slug"] == self.community.slug)
        self.assertEqual(list_community["member_count"], 2)
        self.assertEqual(list_community["post_count"], 3)
        self.assertEqual(detail_response.data["member_count"], 2)
        self.assertEqual(detail_response.data["post_count"], 3)
        self.assertEqual(membership_response.data[0]["community"]["member_count"], 2)
        self.assertEqual(membership_response.data[0]["community"]["post_count"], 3)

    def test_online_counts_include_distinct_online_active_members(self):
        other_user = User.objects.create_user(email="online-member@example.test", password="test-password")
        inactive_user = User.objects.create_user(email="offline-member@example.test", password="test-password")
        CommunityMembership.objects.create(user=self.user, community=self.community)
        CommunityMembership.objects.create(user=other_user, community=self.community)
        CommunityMembership.objects.create(
            user=inactive_user,
            community=self.community,
            is_active=False,
        )
        first_room = ChatRoom.objects.create(community=self.community, title="Community Lounge")
        second_room = ChatRoom.objects.create(community=self.community, title="Quiet Corner")
        private_room = ChatRoom.objects.create(
            community=self.community,
            title="Private support",
            is_private=True,
        )
        UserPresence.objects.create(user=self.user, room=first_room, is_online=True)
        UserPresence.objects.create(user=self.user, room=second_room, is_online=True)
        UserPresence.objects.create(user=self.user, room=private_room, is_online=True)
        UserPresence.objects.create(user=other_user, room=first_room, is_online=True)
        UserPresence.objects.create(user=inactive_user, room=first_room, is_online=True)

        list_response = self.client.get("/api/community/list/")
        detail_response = self.client.get(f"/api/community/{self.community.slug}/")

        self.assertEqual(list_response.status_code, 200)
        list_community = next(item for item in list_response.data if item["slug"] == self.community.slug)
        self.assertEqual(list_community["online_count"], 2)
        self.assertEqual(detail_response.data["online_count"], 2)

    def test_notification_endpoints_are_not_routed_as_community_details(self):
        Notification.objects.create(
            recipient=self.user,
            title="A community update",
            body="A new message is waiting.",
            link="/community/anxiety-support",
        )
        other_user = User.objects.create_user(
            email="notification-owner@example.test",
            password="test-password",
        )
        other_notification = Notification.objects.create(
            recipient=other_user,
            title="Private update",
            body="This belongs to someone else.",
        )

        list_response = self.client.get("/api/community/notifications/")
        mark_read_response = self.client.put("/api/community/notifications/read/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["title"], "A community update")
        self.assertEqual(mark_read_response.status_code, 200)
        self.assertTrue(Notification.objects.get(recipient=self.user).is_read)
        other_notification.refresh_from_db()
        self.assertFalse(other_notification.is_read)

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

    def test_profile_returns_display_name_without_requiring_community_membership(self):
        self.user.display_name = "Mindful Member"
        self.user.save(update_fields=["display_name"])

        response = self.client.get("/api/community/profile/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["display_name"], "Mindful Member")
        self.assertTrue(response.data["anonymous_identity"]["handle"])

    def test_chat_activity_returns_private_date_counts_without_message_content(self):
        room = ChatRoom.objects.create(
            community=self.community,
            title="Community Lounge",
            is_private=False,
        )
        private_room = ChatRoom.objects.create(
            community=self.community,
            title="Private support",
            is_private=True,
        )
        ChatMessage.objects.create(room=room, author=self.user, body="One helpful note.")
        ChatMessage.objects.create(room=room, author=self.user, body="Another kind message.")
        ChatMessage.objects.create(room=private_room, author=self.user, body="Private support note.")
        ChatMessage.objects.create(
            room=room,
            author=User.objects.create_user(
                email="another-chat-member@example.test",
                password="Another_test_password_123!",
            ),
            body="Someone else's note.",
        )

        response = self.client.get("/api/community/chat-activity/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["community_name"], self.community.name)
        self.assertEqual(response.data[0]["message_count"], 2)
        self.assertNotIn("body", response.data[0])

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

    def test_new_message_notifies_other_active_members_over_their_user_socket(self):
        CommunityMembership.objects.create(user=self.other_user, community=self.community)

        async def exercise_sockets():
            notification_socket = WebsocketCommunicator(
                application,
                f"/ws/notifications/?token={self.other_token}",
            )
            notification_connected, _ = await notification_socket.connect()
            self.assertTrue(notification_connected)

            chat_socket = WebsocketCommunicator(
                application,
                f"/ws/community/{self.room.pk}/?token={self.token}",
            )
            chat_connected, _ = await chat_socket.connect()
            self.assertTrue(chat_connected)
            await chat_socket.receive_json_from()
            await chat_socket.send_json_to({
                "type": "chat.message",
                "body": "A private-feeling message should not be copied into an alert.",
            })
            chat_event = await chat_socket.receive_json_from()
            notification_event = await notification_socket.receive_json_from()
            await chat_socket.disconnect()
            await notification_socket.disconnect()
            return chat_event, notification_event

        chat_event, notification_event = async_to_sync(exercise_sockets)()

        self.assertEqual(chat_event["type"], "chat.message.created")
        self.assertEqual(notification_event["type"], "notification.created")
        self.assertEqual(notification_event["notification"]["title"], "New message in Peer Chat")
        self.assertEqual(
            notification_event["notification"]["body"],
            "A community member shared a new message. Open the community to join the conversation.",
        )
        self.assertEqual(
            Notification.objects.filter(recipient=self.other_user).count(),
            1,
        )
        self.assertFalse(Notification.objects.filter(recipient=self.member).exists())
        self.assertNotIn("private-feeling message", notification_event["notification"]["body"])

    def test_private_room_message_does_not_create_community_notifications(self):
        CommunityMembership.objects.create(user=self.other_user, community=self.community)
        private_room = ChatRoom.objects.create(
            community=self.community,
            title="Private support",
            is_private=True,
        )
        ChatParticipant.objects.create(room=private_room, user=self.member)

        async def exercise_sockets():
            notification_socket = WebsocketCommunicator(
                application,
                f"/ws/notifications/?token={self.other_token}",
            )
            notification_connected, _ = await notification_socket.connect()
            self.assertTrue(notification_connected)

            chat_socket = WebsocketCommunicator(
                application,
                f"/ws/community/{private_room.pk}/?token={self.token}",
            )
            chat_connected, _ = await chat_socket.connect()
            self.assertTrue(chat_connected)
            await chat_socket.receive_json_from()
            await chat_socket.send_json_to({
                "type": "chat.message",
                "body": "A private support conversation.",
            })
            event = await chat_socket.receive_json_from()
            await chat_socket.disconnect()
            await notification_socket.disconnect()
            return event

        event = async_to_sync(exercise_sockets)()

        self.assertEqual(event["type"], "chat.message.created")
        self.assertFalse(Notification.objects.exists())

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
