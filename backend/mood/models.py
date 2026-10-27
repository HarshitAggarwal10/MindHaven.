import uuid

from django.conf import settings
from django.db import models


EMOTION_LABELS = (
    "anger",
    "disgust",
    "fear",
    "joy",
    "neutral",
    "sadness",
    "surprise",
)

MANUAL_MOODS = (
    ("very_low", "Low"),
    ("low", "A little low"),
    ("steady", "Steady"),
    ("good", "Good"),
    ("very_good", "Very good"),
)


class MoodCheckIn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mood_checkins",
    )
    mood = models.CharField(max_length=16, choices=MANUAL_MOODS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="mood_checkin_user_date"),
        ]


class MoodAnalysis(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success", "Analysis available"
        UNCLEAR = "unclear", "Signals unclear"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mood_analyses",
    )
    idempotency_key = models.UUIDField(default=uuid.uuid4)
    primary_emotion = models.CharField(
        max_length=16,
        choices=[(label, label.title()) for label in EMOTION_LABELS],
    )
    confidence = models.FloatField()
    emotion_scores = models.JSONField()
    summary = models.CharField(max_length=500)
    themes = models.JSONField(default=list)
    suggestions = models.JSONField(default=list)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.SUCCESS,
    )
    model_identifier = models.CharField(max_length=200)
    model_version = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"],
                name="mood_analysis_user_idempotency",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="mood_analysis_user_date"),
        ]
