from collections import Counter

from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import serializers

from .models import (
    AnonymousIdentity,
    ChatMessage,
    ChatParticipant,
    ChatRoom,
    Community,
    CommunityMembership,
    CommunityPost,
    MessageReaction,
    MessageReadStatus,
    ModerationAction,
    Notification,
    PostComment,
    PostReaction,
    PrivateSupportSession,
    Report,
)

User = get_user_model()


class AnonymousIdentitySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousIdentity
        fields = ["handle", "avatar_seed"]


class CommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    post_count = serializers.IntegerField(read_only=True)
    is_public = serializers.BooleanField(read_only=True)

    class Meta:
        model = Community
        fields = ["id", "slug", "name", "description", "member_count", "post_count", "is_public"]

    def get_member_count(self, obj):
        annotated_count = getattr(obj, "active_member_count", None)
        if annotated_count is not None:
            return annotated_count
        return obj.memberships.filter(is_active=True).count()


class CommunityMembershipSerializer(serializers.ModelSerializer):
    community = CommunitySerializer(read_only=True)

    class Meta:
        model = CommunityMembership
        fields = ["id", "community", "joined_at", "is_moderator", "display_anonymously"]


class CommunityPostSerializer(serializers.ModelSerializer):
    author_handle = serializers.SerializerMethodField()
    reaction_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "community",
            "title",
            "body",
            "image_url",
            "is_pinned",
            "is_locked",
            "created_at",
            "updated_at",
            "author_handle",
            "reaction_count",
            "comment_count",
        ]
        read_only_fields = ["author_handle", "reaction_count", "comment_count"]

    def get_author_handle(self, obj):
        return obj.author.anonymous_identity.handle


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ["title", "body", "image_url"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("A post title is required.")
        return value


class PostCommentSerializer(serializers.ModelSerializer):
    author_handle = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ["id", "post", "parent", "body", "author_handle", "replies", "created_at", "updated_at"]
        read_only_fields = ["author_handle", "replies"]

    def get_author_handle(self, obj):
        return obj.author.anonymous_identity.handle

    def get_replies(self, obj):
        replies = getattr(obj, "active_replies", None)
        if replies is None:
            replies = obj.replies.filter(is_deleted=False).select_related("author__anonymous_identity")
        return PostCommentSerializer(replies, many=True).data


class CommentCreateSerializer(serializers.ModelSerializer):
    post = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PostComment
        fields = ["post", "parent", "body"]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment cannot be empty.")
        return value


class PostReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostReaction
        fields = ["post", "emoji"]

    def validate_emoji(self, value):
        if not value.strip():
            raise serializers.ValidationError("Emoji is required.")
        return value


class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ["id", "community", "title", "is_private"]
        read_only_fields = ["community", "is_private"]


class ChatMessageSerializer(serializers.ModelSerializer):
    author_handle = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "room",
            "author_handle",
            "body",
            "image_url",
            "reply_to",
            "reactions",
            "created_at",
            "updated_at",
        ]

    def get_author_handle(self, obj):
        memberships = getattr(obj.author, "room_memberships", None)
        membership = next(
            (item for item in memberships or [] if item.community_id == obj.room.community_id),
            None,
        )
        if membership is None:
            membership = CommunityMembership.objects.filter(
                user=obj.author,
                community_id=obj.room.community_id,
                is_active=True,
            ).first()

        if membership and not membership.display_anonymously:
            return obj.author.display_name.strip() or "Community member"
        try:
            return obj.author.anonymous_identity.handle
        except AnonymousIdentity.DoesNotExist:
            return "Community member"

    def get_reactions(self, obj):
        reactions = getattr(obj, "chat_reactions", None)
        if reactions is None:
            return obj.reactions.values("emoji").annotate(count=Count("id"))
        return [{"emoji": emoji, "count": count} for emoji, count in Counter(
            reaction.emoji for reaction in reactions
        ).items()]


class MessageReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReaction
        fields = ["message", "emoji"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "link", "is_read", "created_at"]


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["community", "content_type", "object_id", "reason", "details"]


class ModerationActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModerationAction
        fields = ["report", "action_type", "reason"]


class PrivateSupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateSupportSession
        fields = ["community"]


class UserProfileSerializer(serializers.ModelSerializer):
    anonymous_identity = AnonymousIdentitySerializer()
    memberships = CommunityMembershipSerializer(many=True)

    class Meta:
        model = User
        fields = ["id", "anonymous_identity", "memberships"]
