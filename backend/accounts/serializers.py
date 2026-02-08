from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "email", "password", "full_name", "username"]
        extra_kwargs = {
            "username": {"required": False},
            "email": {"required": True},
        }

    def validate(self, attrs):
        email = attrs.get("email")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists.")
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        email = validated_data.get("email")
        username = email.split("@")[0]

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data["password"]
        )

        if full_name:
            parts = full_name.split(" ", 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name"]
