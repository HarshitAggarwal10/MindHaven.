import os

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import DiaryEntry
from .serializers import (
    DiaryEntryCreateSerializer,
    DiaryEntryUpdateSerializer,
    VerifyDiaryAccessSerializer,
)
from .services import (
    b64decode,
    b64encode,
    decrypt_payload,
    decrypt_vault_key,
    encrypt_payload,
    encrypt_vault_key,
    generate_salt,
    generate_vault_key,
    preview_from_text,
    reading_time_minutes,
    word_count,
)

JWT_SECRET = getattr(settings, "JWT_SECRET", None) or os.getenv("JWT_SECRET")


def decode_jwt_token(token):
    secrets = [settings.SECRET_KEY]
    if JWT_SECRET and JWT_SECRET not in secrets:
        secrets.append(JWT_SECRET)
    secrets.append("dev-jwt-secret")

    for secret in secrets:
        try:
            return jwt.decode(token, secret, algorithms=["HS256"])
        except jwt.PyJWTError:
            continue
    return None


def get_authenticated_user(request, *, check_credentials=True):
    user_model = get_user_model()

    email = request.headers.get("X-Diary-Email") or request.data.get("email") if hasattr(request, "data") else None
    password = request.headers.get("X-Diary-Password") or request.data.get("password") if hasattr(request, "data") else None

    if email and password:
        user = user_model.objects.filter(email=email).first()
        if user and (not check_credentials or user.check_password(password)):
            return user

    auth_header = ""
    token = None

    if hasattr(request, "headers"):
        auth_header = request.headers.get("Authorization", "")
    if not auth_header and hasattr(request, "META"):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        cookie_header = ""
        if hasattr(request, "headers"):
            cookie_header = request.headers.get("Cookie", "")
        if not cookie_header and hasattr(request, "META"):
            cookie_header = request.META.get("HTTP_COOKIE", "")
        for part in cookie_header.split(";"):
            if part.strip().startswith("mh_session="):
                token = part.split("=", 1)[1]
                break

    if not token:
        return None

    payload = decode_jwt_token(token)
    if not payload:
        return None

    user_id = payload.get("user_id") or payload.get("id")
    if not user_id:
        return None

    try:
        return user_model.objects.get(pk=user_id)
    except user_model.DoesNotExist:
        return None


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def create_diary_entry(request):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = DiaryEntryCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    password = request.data.get("password")
    if not password:
        return Response({"detail": "Password is required to protect this entry"}, status=status.HTTP_400_BAD_REQUEST)

    salt = generate_salt()
    vault_key = generate_vault_key()
    encrypted_key_b64, key_nonce_b64 = encrypt_vault_key(vault_key, password, salt)

    content_plain = serializer.validated_data["content"]
    title_plain = serializer.validated_data["title"]
    encrypted_content_b64, content_nonce_b64 = encrypt_payload(content_plain, vault_key)

    entry = DiaryEntry.objects.create(
        user=user,
        title=title_plain,
        content=content_plain,
        encrypted_content=encrypted_content_b64,
        encrypted_key=encrypted_key_b64,
        key_nonce=key_nonce_b64,
        content_nonce=content_nonce_b64,
        salt=b64encode(salt),
    )

    return Response({
        "id": entry.id,
        "title": entry.title,
        "preview": preview_from_text(entry.title or entry.content),
        "favorite": entry.favorite,
        "created_at": entry.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def list_diary_entries(request):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    query = request.GET.get("q", "").strip()
    entries = DiaryEntry.objects.filter(user=user, deleted=False).only(
        "id",
        "title",
        "content",
        "favorite",
        "created_at",
        "updated_at",
    )
    if query:
        entries = entries.filter(title__icontains=query)
    entries = entries.order_by("-created_at")

    data = []
    for entry in entries:
        entry_word_count = word_count(entry.content)
        data.append({
            "id": entry.id,
            "title": entry.title,
            "preview": preview_from_text(entry.title or entry.content),
            "favorite": entry.favorite,
            "created_at": entry.created_at.isoformat(),
            "updated_at": entry.updated_at.isoformat(),
            "word_count": entry_word_count,
            "reading_time_minutes": max(1, round(entry_word_count / 200)),
        })
    return Response(data)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_diary_access(request):
    user = get_authenticated_user(request, check_credentials=False)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    serializer = VerifyDiaryAccessSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if (
        user.email != serializer.validated_data["email"]
        or not user.check_password(serializer.validated_data["password"])
    ):
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({"verified": True})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def get_diary_entry(request, entry_id):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    entry = DiaryEntry.objects.filter(user=user, deleted=False, id=entry_id).first()
    if not entry:
        return Response({"detail": "Entry not found"}, status=status.HTTP_404_NOT_FOUND)

    password = request.headers.get("X-Diary-Password") or request.GET.get("password")
    if not password:
        return Response({"detail": "Password required to decrypt entry"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        vault_key = decrypt_vault_key(entry.encrypted_key, entry.key_nonce, password, b64decode(entry.salt))
        content_plain = decrypt_payload(entry.encrypted_content, entry.content_nonce, vault_key)
    except Exception:
        return Response(
            {"detail": "Invalid password or corrupted diary entry."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "id": entry.id,
        "title": entry.title,
        "content": content_plain,
        "favorite": entry.favorite,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
        "word_count": word_count(entry.content),
        "reading_time_minutes": reading_time_minutes(entry.content),
    })


@api_view(["PUT", "PATCH"])
@authentication_classes([])
@permission_classes([AllowAny])
def update_diary_entry(request, entry_id):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    entry = DiaryEntry.objects.filter(user=user, deleted=False, id=entry_id).first()
    if not entry:
        return Response({"detail": "Entry not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = DiaryEntryUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    if "title" in serializer.validated_data:
        entry.title = serializer.validated_data["title"]

    if "content" in serializer.validated_data:
        password = request.data.get("password")
        if not password:
            return Response(
                {"detail": "Password is required to update diary content."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            vault_key = decrypt_vault_key(entry.encrypted_key, entry.key_nonce, password, b64decode(entry.salt))
        except Exception:
            return Response(
                {"detail": "Invalid password provided for updating diary entry."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        new_content = serializer.validated_data["content"]
        encrypted_content_b64, content_nonce_b64 = encrypt_payload(new_content, vault_key)
        entry.content = new_content
        entry.encrypted_content = encrypted_content_b64
        entry.content_nonce = content_nonce_b64

    if "favorite" in serializer.validated_data:
        entry.favorite = serializer.validated_data["favorite"]

    entry.save()
    return Response({"message": "Entry updated"})


@api_view(["DELETE"])
@authentication_classes([])
@permission_classes([AllowAny])
def delete_diary_entry(request, entry_id):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    entry = DiaryEntry.objects.filter(user=user, deleted=False, id=entry_id).first()
    if not entry:
        return Response({"detail": "Entry not found"}, status=status.HTTP_404_NOT_FOUND)

    entry.deleted = True
    entry.save(update_fields=["deleted", "updated_at"])
    return Response({"message": "Entry deleted"})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def favorite_diary_entry(request, entry_id):
    user = get_authenticated_user(request)
    if not user:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    entry = DiaryEntry.objects.filter(user=user, deleted=False, id=entry_id).first()
    if not entry:
        return Response({"detail": "Entry not found"}, status=status.HTTP_404_NOT_FOUND)

    entry.favorite = not entry.favorite
    entry.save(update_fields=["favorite", "updated_at"])
    return Response({"favorite": entry.favorite})