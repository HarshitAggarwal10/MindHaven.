from django.urls import path

from .views import (
    MoodAnalysisDetailView,
    MoodAnalyzeView,
    MoodCheckInDetailView,
    MoodCheckInListCreateView,
    MoodConfigView,
    MoodHistoryView,
    MoodStatsView,
)


urlpatterns = [
    path("config/", MoodConfigView.as_view(), name="mood-config"),
    path("check-ins/", MoodCheckInListCreateView.as_view(), name="mood-checkins"),
    path(
        "check-ins/<uuid:checkin_id>/",
        MoodCheckInDetailView.as_view(),
        name="mood-checkin-detail",
    ),
    path("analyze/", MoodAnalyzeView.as_view(), name="mood-analyze"),
    path(
        "analyses/<uuid:analysis_id>/",
        MoodAnalysisDetailView.as_view(),
        name="mood-analysis-detail",
    ),
    path("history/", MoodHistoryView.as_view(), name="mood-history"),
    path("stats/", MoodStatsView.as_view(), name="mood-stats"),
]
