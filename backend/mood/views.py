import uuid
from datetime import datetime, time, timedelta

from django.conf import settings
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import MoodAnalysis, MoodCheckIn
from .serializers import (
    AnalyzeTextSerializer,
    MoodAnalysisSerializer,
    MoodCheckInSerializer,
)
from .services import (
    MoodProviderError,
    analyze_emotion_text,
    provider_availability_message,
    provider_is_available,
)


def _days_from_request(request, allowed=(7, 30, 90), default=30):
    raw_days = request.query_params.get("days", str(default))
    try:
        days = int(raw_days)
    except (TypeError, ValueError):
        return None
    return days if days in allowed else None


def _calendar_period_bounds(days):
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)
    end_date = today + timedelta(days=1)
    return (
        start_date,
        timezone.make_aware(datetime.combine(start_date, time.min)),
        timezone.make_aware(datetime.combine(end_date, time.min)),
    )


class MoodConfigView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        provider = getattr(settings, "MOOD_AI_PROVIDER", "local-transformers")
        if provider == "local-transformers":
            if getattr(settings, "MOOD_AI_LOCAL_FILES_ONLY", False):
                model_download_notice = (
                    "The model runs only from files already cached on the server."
                )
            else:
                model_download_notice = (
                    "The server may download public model files from Hugging Face; "
                    "only model files are downloaded, not your submitted text."
                )
            privacy_notice = (
                "Your text is analyzed by the model on the MindHaven Django server "
                "and is not sent to an AI inference provider. "
                f"{model_download_notice}"
            )
        elif provider == "hf-inference":
            privacy_notice = (
                "Text is sent to Hugging Face Inference Providers over TLS. "
                "Hugging Face states routed request and response bodies are not "
                "stored for training; debugging logs may be kept for up to 30 "
                "days, and a selected inference provider may have separate terms."
            )
        else:
            privacy_notice = ""
        return Response(
            {
                "provider": provider,
                "model_identifier": getattr(
                    settings, "MOOD_AI_MODEL_ID", ""
                ),
                "analysis_available": provider_is_available(),
                "availability_message": provider_availability_message(),
                "privacy_notice": privacy_notice,
            },
            content_type=request.accepted_renderer.media_type,
            headers={"Cache-Control": "no-store"},
        )


class MoodCheckInListCreateView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "mood_checkin"

    def get(self, request):
        days = _days_from_request(request)
        if days is None:
            return Response(
                {"detail": "Choose a history period of 7, 30, or 90 days."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, start_at, end_at = _calendar_period_bounds(days)
        checkins = MoodCheckIn.objects.filter(
            user=request.user,
            created_at__gte=start_at,
            created_at__lt=end_at,
        )[:100]
        return Response(MoodCheckInSerializer(checkins, many=True).data)

    def post(self, request):
        serializer = MoodCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        checkin = serializer.save(user=request.user)
        return Response(
            MoodCheckInSerializer(checkin).data,
            status=status.HTTP_201_CREATED,
        )


class MoodCheckInDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, checkin_id):
        return get_object_or_404(
            MoodCheckIn,
            id=checkin_id,
            user=request.user,
        )

    def patch(self, request, checkin_id):
        checkin = self.get_object(request, checkin_id)
        serializer = MoodCheckInSerializer(
            checkin,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, checkin_id):
        self.get_object(request, checkin_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MoodAnalyzeView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "mood_analysis"

    def post(self, request):
        serializer = AnalyzeTextSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        key = serializer.validated_data.get("idempotency_key")

        if key:
            existing = MoodAnalysis.objects.filter(
                user=request.user,
                idempotency_key=key,
            ).first()
            if existing:
                return Response(MoodAnalysisSerializer(existing).data)

        try:
            result = analyze_emotion_text(serializer.validated_data["text"])
        except MoodProviderError as error:
            return Response(
                {"detail": str(error), "code": error.code},
                status=error.status_code,
            )

        analysis, created = MoodAnalysis.objects.get_or_create(
            user=request.user,
            idempotency_key=key or uuid.uuid4(),
            defaults={
                "primary_emotion": result.primary_emotion,
                "confidence": result.confidence,
                "emotion_scores": result.emotion_scores,
                "summary": result.summary,
                "themes": result.themes,
                "suggestions": result.suggestions,
                "status": result.status,
                "model_identifier": result.model_identifier,
                "model_version": result.model_version,
            },
        )
        return Response(
            MoodAnalysisSerializer(analysis).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MoodAnalysisDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, analysis_id):
        return get_object_or_404(
            MoodAnalysis,
            id=analysis_id,
            user=request.user,
        )

    def get(self, request, analysis_id):
        analysis = self.get_object(request, analysis_id)
        return Response(MoodAnalysisSerializer(analysis).data)

    def delete(self, request, analysis_id):
        self.get_object(request, analysis_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MoodHistoryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        days = _days_from_request(request)
        if days is None:
            return Response(
                {"detail": "Choose a history period of 7, 30, or 90 days."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            limit = int(request.query_params.get("limit", "50"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "The history limit must be between 1 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not 1 <= limit <= 100:
            return Response(
                {"detail": "The history limit must be between 1 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _, start_at, end_at = _calendar_period_bounds(days)
        checkins = MoodCheckIn.objects.filter(
            user=request.user,
            created_at__gte=start_at,
            created_at__lt=end_at,
        ).order_by("-created_at").values("id", "mood", "created_at")[:limit]
        analyses = MoodAnalysis.objects.filter(
            user=request.user,
            created_at__gte=start_at,
            created_at__lt=end_at,
        ).order_by("-created_at").values(
            "id",
            "primary_emotion",
            "confidence",
            "summary",
            "status",
            "model_identifier",
            "created_at",
        )[:limit]
        events = [
            {"type": "self_reported", **item}
            for item in checkins
        ] + [
            {"type": "ai_prediction", **item}
            for item in analyses
        ]
        events.sort(key=lambda item: item["created_at"], reverse=True)
        return Response(events[:limit])


class MoodStatsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        days = _days_from_request(request, allowed=(7, 30), default=7)
        if days is None:
            return Response(
                {"detail": "Choose a statistics period of 7 or 30 days."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        start_date, current_start, current_end = _calendar_period_bounds(days)
        previous_start = start_date - timedelta(days=days)
        previous_start_at = timezone.make_aware(
            datetime.combine(previous_start, time.min)
        )
        checkins = MoodCheckIn.objects.filter(
            user=request.user,
            created_at__gte=previous_start_at,
            created_at__lt=current_end,
        )
        analyses = MoodAnalysis.objects.filter(
            user=request.user,
            created_at__gte=previous_start_at,
            created_at__lt=current_end,
        )

        current_checkins = checkins.filter(
            created_at__gte=current_start,
            created_at__lt=current_end,
        )
        current_analyses = analyses.filter(
            created_at__gte=current_start,
            created_at__lt=current_end,
        )
        current_manual_count = current_checkins.count()
        current_analysis_count = current_analyses.count()
        previous_manual_count = checkins.filter(
            created_at__lt=current_start
        ).count()
        previous_analysis_count = analyses.filter(
            created_at__lt=current_start
        ).count()

        days_list = [
            start_date + timedelta(days=offset)
            for offset in range(days)
        ]
        manual_by_day = {
            row["day"]: row["count"]
            for row in current_checkins.annotate(
                day=TruncDate("created_at")
            ).values("day").annotate(count=Count("id"))
        }
        analysis_by_day = {
            row["day"]: row["count"]
            for row in current_analyses.annotate(
                day=TruncDate("created_at")
            ).values("day").annotate(count=Count("id"))
        }
        emotion_counts = {
            row["primary_emotion"]: row["count"]
            for row in current_analyses.values("primary_emotion").annotate(
                count=Count("id")
            )
        }
        mood_count_rows = {
            row["mood"]: row["count"]
            for row in current_checkins.values("mood").annotate(count=Count("id"))
        }

        daily = [
            {
                "date": day.isoformat(),
                "self_reported_count": manual_by_day.get(day, 0),
                "ai_analysis_count": analysis_by_day.get(day, 0),
            }
            for day in days_list
        ]
        previous_total = previous_manual_count + previous_analysis_count
        current_total = current_manual_count + current_analysis_count
        return Response(
            {
                "days": days,
                "daily": daily,
                "self_reported_moods": {
                    mood: mood_count_rows.get(mood, 0)
                    for mood, _ in MoodCheckIn._meta.get_field("mood").choices
                },
                "ai_emotion_counts": emotion_counts,
                "check_in_count": current_manual_count,
                "analysis_count": current_analysis_count,
                "previous_period": {
                    "available": previous_total > 0 and current_total > 0,
                    "check_in_count": previous_manual_count,
                    "analysis_count": previous_analysis_count,
                },
                "insufficient_data": current_total == 0,
            }
        )
