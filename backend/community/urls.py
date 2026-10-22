from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChatRoomMessagesView,
    CommunityCommentView,
    CommunityDetailView,
    CommunityChatRoomView,
    CommunityLandingView,
    CommunityListView,
    CommunityLeaveView,
    CommunityMembershipView,
    CommunityPostViewSet,
    JoinSupportSessionView,
    ModerationReportListView,
    NotificationListView,
    NotificationMarkReadView,
    PrivateSupportRequestView,
    ReportCreateView,
    SupportSessionEndView,
    UserProfileView,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"posts", CommunityPostViewSet, basename="community-posts")

urlpatterns = [
    path("list/", CommunityListView.as_view(), name="community-list"),
    path("membership/", CommunityMembershipView.as_view(), name="community-membership"),
    path("<slug:slug>/chat-room/", CommunityChatRoomView.as_view(), name="community-chat-room"),
    path("<slug:slug>/", CommunityDetailView.as_view(), name="community-detail"),
    path("<slug:slug>/leave/", CommunityLeaveView.as_view(), name="community-leave"),
    path("<slug:slug>/landing/", CommunityLandingView.as_view(), name="community-landing"),
    path("<slug:community_slug>/", include(router.urls)),
    path("<slug:community_slug>/posts/<int:post_id>/comments/", CommunityCommentView.as_view(), name="community-post-comments"),
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    path("notifications/read/", NotificationMarkReadView.as_view(), name="notifications-read"),
    path("<slug:community_slug>/report/", ReportCreateView.as_view(), name="report-content"),
    path("<slug:community_slug>/moderation/reports/", ModerationReportListView.as_view(), name="moderation-reports"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("<slug:community_slug>/support/", PrivateSupportRequestView.as_view(), name="support-request"),
    path("<slug:community_slug>/support/<int:pk>/join/", JoinSupportSessionView.as_view(), name="support-join"),
    path("<slug:community_slug>/support/<int:pk>/end/", SupportSessionEndView.as_view(), name="support-end"),
    path("chat/<int:room_id>/messages/", ChatRoomMessagesView.as_view(), name="chat-room-messages"),
]
