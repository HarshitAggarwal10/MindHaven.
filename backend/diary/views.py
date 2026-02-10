import base64
import os
import secrets
import string
from django.conf import settings
from django.contrib.auth.hashers import make_password
from grpc import Status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DiaryUser, DiaryEntry
from rest_framework import status
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def generate_anon_id():
    return "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(12))

def generate_pin():
    return "".join(secrets.choice(string.digits) for _ in range(6))

@api_view(["POST"])
def create_anonymous_diary_user(request):
    anon_id = generate_anon_id()
    pin = generate_pin()
    anon_token = secrets.token_hex(32)

    DiaryUser.objects.create(
        anon_id=anon_id,
        pin_hash=make_password(pin),
        anon_token=anon_token
    )

    return Response({
        "anon_id": anon_id,
        "pin": pin,
        "anon_token": anon_token
    })



@api_view(["POST"])
def create_diary_entry(request):
    anon_token = request.headers.get("X-ANON-TOKEN")

    if not anon_token:
        return Response(
            {"error": "Missing anon token"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = DiaryUser.objects.get(anon_token=anon_token)
    except DiaryUser.DoesNotExist:
        return Response(
            {"error": "Invalid anon token"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    title = request.data.get("title")
    content = request.data.get("content_encrypted")
    iv = request.data.get("iv")
    tag = request.data.get("tag")

    if not all([title, content, iv, tag]):
        return Response(
            {"error": "Missing required fields"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    DiaryEntry.objects.create(
        diary_user=user,
        title=title,
        content_encrypted=content,
        iv=iv,
        tag=tag,
    )

    return Response(
        {"message": "Diary saved successfully"},
        status=status.HTTP_201_CREATED,
    )