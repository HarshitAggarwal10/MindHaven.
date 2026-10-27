from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .models import (
    ChatMessage,
    ChatParticipant,
    ChatRoom,
    CommunityMembership,
    MessageReaction,
    Notification,
    TypingStatus,
    UserPresence,
)


class CommunityChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"community_chat_{self.room_id}"
        self.user = self.scope["user"]
        self.accepted = False

        if not self.user or not self.user.is_authenticated:
            return await self.close()

        room = await self.get_room()
        if not room:
            return await self.close()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        self.accepted = True
        await self.join_participant()
        await self.update_presence(True)
        await self.broadcast_presence()

    async def disconnect(self, code):
        if getattr(self, "accepted", False):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            await self.update_presence(False)
            await self.broadcast_presence()

    async def receive_json(self, content):
        event = content.get("type")
        if event == "chat.message":
            await self.handle_chat_message(content)
        elif event == "chat.reaction":
            await self.handle_reaction(content)
        elif event == "chat.typing":
            await self.handle_typing(content)
        elif event == "chat.message.edit":
            await self.handle_edit_message(content)
        elif event == "chat.message.delete":
            await self.handle_delete_message(content)

    async def handle_chat_message(self, content):
        body = content.get("body", "")
        reply_to_id = content.get("reply_to")
        image_url = content.get("image_url", "")

        if not isinstance(body, str) or len(body) > 4000 or not isinstance(image_url, str):
            return
        body = body.strip()
        if not body and not image_url:
            return

        message = await self.create_message(body, image_url, reply_to_id)
        author_handle = await self.get_display_name()
        payload = {
            "type": "chat.message.created",
            "message": {
                "id": message.id,
                "room": message.room_id,
                "author_handle": author_handle,
                "body": message.body,
                "image_url": message.image_url,
                "reply_to": message.reply_to_id,
                "created_at": message.created_at.isoformat(),
                "updated_at": message.updated_at.isoformat(),
                "reactions": [],
            },
        }
        await self.channel_layer.group_send(self.room_group_name, payload)
        notifications = await self.create_message_notifications(message)
        for notification in notifications:
            await self.channel_layer.group_send(
                f"user_notifications_{notification['recipient_id']}",
                {
                    "type": "notification.created",
                    "notification": notification["data"],
                },
            )

    async def handle_reaction(self, content):
        message_id = content.get("message_id")
        emoji = content.get("emoji")
        if not message_id or not isinstance(emoji, str) or not emoji or len(emoji) > 10:
            return

        reaction_created = await self.toggle_message_reaction(message_id, emoji)
        if reaction_created is None:
            return
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.reaction.updated",
                "message_id": message_id,
                "emoji": emoji,
                "user_handle": await self.get_display_name(),
                "removed": not reaction_created,
            },
        )

    async def handle_edit_message(self, content):
        message_id = content.get("message_id")
        body = content.get("body", "").strip()
        if not message_id or not body:
            return

        message = await self.edit_message(message_id, body)
        if not message:
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message.edited",
                "message": {
                    "id": message.id,
                    "body": message.body,
                    "updated_at": message.updated_at.isoformat(),
                },
            },
        )

    async def handle_delete_message(self, content):
        message_id = content.get("message_id")
        if not message_id:
            return

        deleted = await self.delete_message(message_id)
        if deleted:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message.deleted",
                    "message_id": message_id,
                },
            )

    async def handle_typing(self, content):
        is_typing = content.get("is_typing", False)
        if not isinstance(is_typing, bool):
            return
        await self.update_typing(is_typing)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.typing.updated",
                "user_handle": await self.get_display_name(),
                "is_typing": is_typing,
            },
        )

    async def chat_message_created(self, event):
        await self.send_json(event)

    async def chat_reaction_updated(self, event):
        await self.send_json(event)

    async def chat_message_edited(self, event):
        await self.send_json(event)

    async def chat_message_deleted(self, event):
        await self.send_json(event)

    async def chat_typing_updated(self, event):
        await self.send_json(event)

    async def presence_update(self, event):
        await self.send_json({
            "type": "presence.update",
            "online_count": event["online_count"],
        })

    @database_sync_to_async
    def get_room(self):
        try:
            room = ChatRoom.objects.select_related("community").get(pk=self.room_id)
        except ChatRoom.DoesNotExist:
            return None
        if room.is_private:
            return room if ChatParticipant.objects.filter(
                room=room,
                user=self.user,
                is_active=True,
            ).exists() else None
        return room if CommunityMembership.objects.filter(
            user=self.user,
            community=room.community,
            is_active=True,
        ).exists() else None

    @database_sync_to_async
    def get_display_name(self):
        membership = CommunityMembership.objects.filter(
            user=self.user,
            community_id=ChatRoom.objects.only("community_id").get(pk=self.room_id).community_id,
            is_active=True,
        ).first()
        if membership and not membership.display_anonymously:
            return self.user.display_name.strip() or "Community member"
        identity = getattr(self.user, "anonymous_identity", None)
        return identity.handle if identity else "Community member"

    @database_sync_to_async
    def join_participant(self):
        room = ChatRoom.objects.get(pk=self.room_id)
        return ChatParticipant.objects.get_or_create(room=room, user=self.user)

    @database_sync_to_async
    def update_presence(self, is_online):
        room = ChatRoom.objects.get(pk=self.room_id)
        presence, _ = UserPresence.objects.get_or_create(room=room, user=self.user)
        presence.is_online = is_online
        presence.last_seen_at = timezone.now()
        presence.save()
        return presence

    @database_sync_to_async
    def get_online_count(self):
        room = ChatRoom.objects.get(pk=self.room_id)
        return UserPresence.objects.filter(
            room__community=room.community,
            room__is_private=False,
            is_online=True,
            user__community_memberships__community=room.community,
            user__community_memberships__is_active=True,
        ).values("user_id").distinct().count()

    async def broadcast_presence(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "presence.update",
                "online_count": await self.get_online_count(),
            },
        )

    @database_sync_to_async
    def create_message(self, body, image_url, reply_to_id):
        room = ChatRoom.objects.get(pk=self.room_id)
        reply_to = None
        if reply_to_id:
            reply_to = ChatMessage.objects.filter(pk=reply_to_id, room=room).first()
        return ChatMessage.objects.create(
            room=room,
            author=self.user,
            body=body,
            image_url=image_url,
            reply_to=reply_to,
        )

    @database_sync_to_async
    def create_message_notifications(self, message):
        room = message.room
        if room.is_private:
            return []

        recipients = CommunityMembership.objects.filter(
            community=room.community,
            is_active=True,
        ).exclude(user=message.author).values_list("user_id", flat=True)
        notifications = []
        for recipient_id in recipients:
            notification = Notification.objects.create(
                recipient_id=recipient_id,
                title=f"New message in {room.community.name}",
                body="A community member shared a new message. Open the community to join the conversation.",
                link=f"/community/{room.community.slug}",
            )
            notifications.append({
                "recipient_id": recipient_id,
                "data": {
                    "id": notification.pk,
                    "title": notification.title,
                    "body": notification.body,
                    "link": notification.link,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                },
            })
        return notifications

    @database_sync_to_async
    def toggle_message_reaction(self, message_id, emoji):
        message = ChatMessage.objects.filter(pk=message_id, room_id=self.room_id).first()
        if not message:
            return None
        reaction, created = MessageReaction.objects.get_or_create(message=message, user=self.user, emoji=emoji)
        if not created:
            reaction.delete()
            return False
        return True

    @database_sync_to_async
    def edit_message(self, message_id, body):
        message = ChatMessage.objects.filter(pk=message_id, author=self.user, room_id=self.room_id, is_deleted=False).first()
        if not message:
            return None
        message.body = body
        message.save(update_fields=["body", "updated_at"])
        return message

    @database_sync_to_async
    def delete_message(self, message_id):
        message = ChatMessage.objects.filter(pk=message_id, author=self.user, room_id=self.room_id, is_deleted=False).first()
        if not message:
            return False
        message.is_deleted = True
        message.save(update_fields=["is_deleted"])
        return True


class UserNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user or not self.user.is_authenticated:
            return await self.close(code=4401)

        self.notification_group_name = f"user_notifications_{self.user.pk}"
        await self.channel_layer.group_add(self.notification_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "notification_group_name"):
            await self.channel_layer.group_discard(self.notification_group_name, self.channel_name)

    async def notification_created(self, event):
        await self.send_json({
            "type": "notification.created",
            "notification": event["notification"],
        })
