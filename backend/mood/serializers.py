from rest_framework import serializers

from .models import MANUAL_MOODS, MoodAnalysis, MoodCheckIn


class MoodCheckInSerializer(serializers.ModelSerializer):
    mood = serializers.ChoiceField(choices=MANUAL_MOODS)

    class Meta:
        model = MoodCheckIn
        fields = ("id", "mood", "created_at")
        read_only_fields = ("id", "created_at")


class MoodAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodAnalysis
        fields = (
            "id",
            "primary_emotion",
            "confidence",
            "emotion_scores",
            "summary",
            "themes",
            "suggestions",
            "status",
            "model_identifier",
            "model_version",
            "created_at",
        )
        read_only_fields = fields


class AnalyzeTextSerializer(serializers.Serializer):
    text = serializers.CharField(
        min_length=20,
        max_length=3000,
        trim_whitespace=False,
        write_only=True,
    )
    consent = serializers.BooleanField()
    idempotency_key = serializers.UUIDField(required=False)

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Enter some text to analyze.")
        return value

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError(
                "Explicit consent is required before sending text for analysis."
            )
        return value
