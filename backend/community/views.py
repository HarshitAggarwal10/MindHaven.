from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ChatMessage,
    ChatParticipant,
    ChatRoom,
    Community,
    CommunityMembership,
    CommunityPost,
    MessageReaction,
    MessageReadStatus,
    Notification,
    PrivateSupportSession,
    PostComment,
    PostReaction,
    Report,
)
from .permissions import IsAuthenticatedAndMember, IsCommunityModerator
from .serializers import (
    ChatMessageSerializer,
    ChatRoomSerializer,
    CommunityMembershipSerializer,
    CommunityPostSerializer,
    CommunitySerializer,
    CommentCreateSerializer,
    MessageReactionSerializer,
    NotificationSerializer,
    PostCommentSerializer,
    PostCreateSerializer,
    PostReactionSerializer,
    PrivateSupportRequestSerializer,
    ReportSerializer,
    UserProfileSerializer,
)
from .utils import COMMUNITIES

User = get_user_model()


class CommunityListView(generics.ListAPIView):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        queryset = Community.objects.annotate(
            active_member_count=Count("memberships", filter=Q(memberships__is_active=True), distinct=True),
            post_count=Count("posts", filter=Q(posts__is_deleted=False), distinct=True),
        )
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(description__icontains=query))
        return queryset


class CommunityMembershipView(generics.ListCreateAPIView):
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommunityMembership.objects.filter(user=self.request.user, is_active=True).select_related("community")

    def create(self, request, *args, **kwargs):
        community_id = request.data.get("community_id")
        display_anonymously = request.data.get("display_anonymously", True)
        if not isinstance(display_anonymously, bool):
            return Response(
                {"detail": "Choose an anonymous or named identity."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        community = Community.objects.filter(pk=community_id).first()
        if not community:
            return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)
        with transaction.atomic():
            membership, created = CommunityMembership.objects.get_or_create(
                user=request.user,
                community=community,
                defaults={"display_anonymously": display_anonymously},
            )
            membership.is_active = True
            membership.display_anonymously = display_anonymously
            membership.save(update_fields=["is_active", "display_anonymously"])
            ChatRoom.objects.get_or_create(
                community=community,
                title="Community Lounge",
                is_private=False,
            )
        serializer = self.get_serializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CommunityChatRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        membership = CommunityMembership.objects.filter(
            user=request.user,
            community__slug=slug,
            is_active=True,
        ).select_related("community").first()
        if membership is None:
            return Response(
                {"detail": "Join this community to enter its chat."},
                status=status.HTTP_403_FORBIDDEN,
            )

        room, _ = ChatRoom.objects.get_or_create(
            community=membership.community,
            title="Community Lounge",
            is_private=False,
        )
        identity = getattr(request.user, "anonymous_identity", None)
        display_name = (
            identity.handle
            if membership.display_anonymously and identity
            else request.user.display_name.strip() or "Community member"
        )
        return Response({
            "room_id": room.pk,
            "community": membership.community.name,
            "display_anonymously": membership.display_anonymously,
            "display_name": display_name,
        })


class CommunityDetailView(generics.RetrieveAPIView):
    queryset = Community.objects.annotate(
        active_member_count=Count("memberships", filter=Q(memberships__is_active=True), distinct=True),
        post_count=Count("posts", filter=Q(posts__is_deleted=False), distinct=True),
    )
    serializer_class = CommunitySerializer
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticated]


class CommunityLeaveView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, slug, *args, **kwargs):
        community = Community.objects.filter(slug=slug).first()
        if not community:
            return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(user=request.user, community=community, is_active=True).first()
        if not membership:
            return Response({"detail": "Not a member."}, status=status.HTTP_404_NOT_FOUND)
        membership.is_active = False
        membership.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.filter(is_deleted=False).select_related(
        "author",
        "author__anonymous_identity",
        "community",
    )
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        community_slug = self.kwargs.get("community_slug")
        queryset = super().get_queryset().filter(community__slug=community_slug)
        queryset = queryset.annotate(
            reaction_count=Count("reactions", distinct=True),
            comment_count=Count("comments", filter=Q(comments__is_deleted=False), distinct=True),
        )
        sort = self.request.query_params.get("sort", "newest")
        if sort == "trending":
            queryset = queryset.order_by("-reaction_count", "-created_at")
        elif sort == "helpful":
            queryset = queryset.order_by("-comment_count", "-created_at")
        else:
            queryset = queryset.order_by("-is_pinned", "-created_at")
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        return CommunityPostSerializer

    def perform_create(self, serializer):
        community = Community.objects.get(slug=self.kwargs["community_slug"])
        serializer.save(author=self.request.user, community=community)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, community_slug=None, pk=None):
        post = self.get_object()
        serializer = PostReactionSerializer(data={"post": post.id, "emoji": request.data.get("emoji")})
        serializer.is_valid(raise_exception=True)
        reaction, created = PostReaction.objects.get_or_create(post=post, user=request.user, emoji=serializer.validated_data["emoji"])
        if not created:
            reaction.delete()
            return Response({"removed": True})
        return Response({"added": True})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, community_slug=None, pk=None):
        post = self.get_object()
        serializer = CommentCreateSerializer(data={**request.data, "post": post.id})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(author=request.user)
        return Response(PostCommentSerializer(comment).data)


class CommunityCommentView(generics.ListCreateAPIView):
    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs["post_id"]
        replies = PostComment.objects.filter(is_deleted=False).select_related("author__anonymous_identity")
        return (
            PostComment.objects.filter(
                post_id=post_id,
                post__community__slug=self.kwargs["community_slug"],
                is_deleted=False,
                parent=None,
            )
            .select_related("author__anonymous_identity")
            .prefetch_related(Prefetch("replies", queryset=replies, to_attr="active_replies"))
        )

    def get_serializer_class(self):
        return CommentCreateSerializer if self.request.method == "POST" else PostCommentSerializer

    def create(self, request, *args, **kwargs):
        post = CommunityPost.objects.filter(
            pk=self.kwargs["post_id"],
            community__slug=self.kwargs["community_slug"],
            is_deleted=False,
        ).first()
        if post is None:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parent = serializer.validated_data.get("parent")
        if parent and parent.post_id != post.pk:
            return Response({"detail": "Replies must belong to the selected post."}, status=status.HTTP_400_BAD_REQUEST)

        comment = serializer.save(author=request.user, post=post)
        return Response(PostCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"marked": True})


class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        community = Community.objects.get(slug=self.kwargs["community_slug"])
        serializer.save(reporter=self.request.user, community=community)


class ModerationReportListView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommunityModerator]

    def get_queryset(self):
        community = Community.objects.get(slug=self.kwargs["community_slug"])
        return Report.objects.filter(community=community, is_resolved=False)


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        memberships = CommunityMembership.objects.filter(user=user, is_active=True).select_related("community")
        user.memberships = memberships
        return user


class PrivateSupportRequestView(generics.CreateAPIView):
    serializer_class = PrivateSupportRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        community = Community.objects.get(slug=self.kwargs["community_slug"])
        session = serializer.save(requester=self.request.user, community=community)
        room = ChatRoom.objects.create(community=community, title=f"Support request #{session.pk}", is_private=True)
        session.room = room
        session.save()
        ChatParticipant.objects.bulk_create([
            ChatParticipant(room=room, user=self.request.user),
        ])


class JoinSupportSessionView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, community_slug=None, pk=None):
        session = PrivateSupportSession.objects.filter(pk=pk, community__slug=community_slug, is_active=True, responder__isnull=True).first()
        if not session:
            return Response({"detail": "No active support requests."}, status=status.HTTP_404_NOT_FOUND)
        session.responder = request.user
        session.save()
        ChatParticipant.objects.get_or_create(room=session.room, user=request.user)
        Notification.objects.create(
            recipient=session.requester,
            title="Support connected",
            body="A volunteer has joined your private support session.",
            link=f"/community/{community_slug}/support/{session.room.id}",
        )
        return Response({"connected": True})


class SupportSessionEndView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, community_slug=None, pk=None):
        session = PrivateSupportSession.objects.filter(pk=pk, community__slug=community_slug, is_active=True).first()
        if not session:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
        session.is_active = False
        session.ended_at = timezone.now()
        session.room.is_private = False
        session.room.save()
        session.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatRoomMessagesView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        room = ChatRoom.objects.filter(pk=room_id).first()
        if not room:
            return ChatMessage.objects.none()
        if room.is_private:
            can_access = ChatParticipant.objects.filter(
                room=room,
                user=self.request.user,
                is_active=True,
            ).exists()
        else:
            can_access = CommunityMembership.objects.filter(
                community=room.community,
                user=self.request.user,
                is_active=True,
            ).exists()
        if not can_access:
            return ChatMessage.objects.none()
        member_users = CommunityMembership.objects.filter(community=room.community, is_active=True)
        return ChatMessage.objects.filter(room_id=room_id, is_deleted=False).select_related(
            "author",
            "author__anonymous_identity",
            "room",
            "reply_to",
        ).prefetch_related(
            Prefetch("author__community_memberships", queryset=member_users, to_attr="room_memberships"),
            Prefetch("reactions", to_attr="chat_reactions"),
        ).order_by("-created_at")[:100]


class CommunityLandingView(generics.RetrieveAPIView):
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"
    queryset = Community.objects.annotate(
        active_member_count=Count("memberships", filter=Q(memberships__is_active=True), distinct=True),
        post_count=Count("posts", filter=Q(posts__is_deleted=False), distinct=True),
    )

    def get(self, request, *args, **kwargs):
        community = self.get_object()
        recent_posts = community.posts.filter(is_deleted=False).select_related("author__anonymous_identity")[:5]
        pinned_posts = community.posts.filter(is_deleted=False, is_pinned=True).select_related("author__anonymous_identity")[:3]
        trending_posts = community.posts.filter(is_deleted=False).select_related(
            "author__anonymous_identity"
        ).annotate(reaction_count=Count("reactions", distinct=True)).order_by("-reaction_count")[:5]
        moderators = community.memberships.filter(
            is_active=True,
            is_moderator=True,
        ).select_related("user__anonymous_identity")
        return Response({
            "community": CommunitySerializer(community).data,
            "recent_posts": CommunityPostSerializer(recent_posts, many=True).data,
            "pinned_posts": CommunityPostSerializer(pinned_posts, many=True).data,
            "trending_posts": CommunityPostSerializer(trending_posts, many=True).data,
            "moderators": [m.user.anonymous_identity.handle for m in moderators],
            "online_count": ChatParticipant.objects.filter(room__community=community, is_active=True).values("user").distinct().count(),
        })
