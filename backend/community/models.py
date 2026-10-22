import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

from .utils import random_anonymous_handle, random_avatar_seed


class Community(models.Model):
    slug = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField()
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()


class AnonymousIdentity(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="anonymous_identity")
    handle = models.CharField(max_length=64, unique=True)
    avatar_seed = models.CharField(max_length=64, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.handle

    @classmethod
    def get_for_user(cls, user):
        identity = cls.objects.filter(user=user).first()
        if identity:
            if not identity.handle:
                handle = random_anonymous_handle()
                while cls.objects.filter(handle=handle).exists():
                    handle = random_anonymous_handle()
                identity.handle = handle
                if not identity.avatar_seed:
                    identity.avatar_seed = random_avatar_seed()
                identity.save(update_fields=["handle", "avatar_seed", "updated_at"])
            return identity

        handle = random_anonymous_handle()
        while cls.objects.filter(handle=handle).exists():
            handle = random_anonymous_handle()

        identity = cls.objects.create(user=user, handle=handle, avatar_seed=random_avatar_seed())
        return identity


class CommunityMembership(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)
    is_moderator = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_anonymously = models.BooleanField(default=True)

    class Meta:
        unique_together = ("community", "user")
        indexes = [models.Index(fields=["community", "user"])]


class CommunityPost(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_posts")
    title = models.CharField(max_length=220)
    body = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-created_at"]


class PostReaction(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="post_reactions")
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user", "emoji")
        indexes = [models.Index(fields=["post", "emoji"])]


class PostComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="post_comments")
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")
    body = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]


class ChatRoom(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="chat_rooms")
    title = models.CharField(max_length=160)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.community.name} - {self.title}"


class ChatParticipant(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_participations")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("room", "user")
        indexes = [models.Index(fields=["room", "user"])]


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_messages")
    body = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    reply_to = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="replies")
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]


class MessageReaction(models.Model):
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_reactions")
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user", "emoji")
        indexes = [models.Index(fields=["message", "emoji"])]


class MessageReadStatus(models.Model):
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="read_statuses")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_read_statuses")
    read_at = models.DateTimeField()

    class Meta:
        unique_together = ("message", "user")
        indexes = [models.Index(fields=["message", "user"])]


class TypingStatus(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="typing_statuses")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="typing_statuses")
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("room", "user")


class UserPresence(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presence_entries")
    room = models.ForeignKey(ChatRoom, null=True, blank=True, on_delete=models.CASCADE, related_name="presence_entries")
    last_seen_at = models.DateTimeField(default=timezone.now)
    is_online = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["user", "room"])]


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=180)
    body = models.TextField()
    link = models.CharField(max_length=260, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Report(models.Model):
    REPORT_REASONS = [
        ("spam", "Spam"),
        ("harassment", "Harassment"),
        ("bullying", "Bullying"),
        ("hate_speech", "Hate Speech"),
        ("misinformation", "Misinformation"),
        ("inappropriate", "Inappropriate Content"),
        ("self_harm", "Self Harm"),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="reports")
    reported_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reported_items")
    content_type = models.CharField(max_length=50)
    object_id = models.UUIDField(default=uuid.uuid4)
    reason = models.CharField(max_length=32, choices=REPORT_REASONS)
    details = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ModerationAction(models.Model):
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="moderation_actions")
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="moderation_actions")
    action_type = models.CharField(max_length=120)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class PrivateSupportSession(models.Model):
    room = models.OneToOneField(ChatRoom, on_delete=models.CASCADE, related_name="support_session")
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_requests")
    responder = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="support_responses")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="support_sessions")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)


class BlockedUser(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="blocked_users")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocked_entries")
    banned_until = models.DateTimeField(null=True, blank=True)
    is_permanent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("community", "user")


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    action = models.CharField(max_length=220)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
