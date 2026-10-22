from django.contrib import admin
from .models import (
    AnonymousIdentity,
    AuditLog,
    BlockedUser,
    ChatMessage,
    ChatParticipant,
    ChatRoom,
    Community,
    CommunityMembership,
    CommunityPost,
    MessageReadStatus,
    MessageReaction,
    ModerationAction,
    Notification,
    PostComment,
    PostReaction,
    PrivateSupportSession,
    Report,
    TypingStatus,
    UserPresence,
)

models = [
    Community,
    CommunityMembership,
    AnonymousIdentity,
    CommunityPost,
    PostReaction,
    PostComment,
    ChatRoom,
    ChatParticipant,
    ChatMessage,
    MessageReaction,
    MessageReadStatus,
    TypingStatus,
    UserPresence,
    Notification,
    Report,
    ModerationAction,
    PrivateSupportSession,
    BlockedUser,
    AuditLog,
]

for model in models:
    admin.site.register(model)
