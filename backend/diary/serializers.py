from rest_framework import serializers


class DiaryEntryCreateSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        title = attrs.get("title", "") or ""
        content = attrs.get("content", "") or ""
        if not title.strip() and not content.strip():
            raise serializers.ValidationError("Either a title or content is required for a diary entry.")
        return attrs


class DiaryEntryUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)
    favorite = serializers.BooleanField(required=False)


class VerifyDiaryAccessSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, trim_whitespace=False)
