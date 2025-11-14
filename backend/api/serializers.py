from rest_framework import serializers

class DiaryCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
    mood = serializers.IntegerField(required=False)
