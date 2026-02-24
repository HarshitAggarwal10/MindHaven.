import base64
import secrets
import string

from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import DiaryUser, DiaryEntry


# ================= GENERATORS =================

def generate_anon_id():
    return "".join(
        secrets.choice(string.ascii_lowercase + string.digits)
        for _ in range(12)
    )


def generate_pin():
    return "".join(
        secrets.choice(string.digits)
        for _ in range(6)
    )


# ================= CREATE DIARY USER =================

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

    return Response(
        {
            "anon_id": anon_id,
            "pin": pin,
            "anon_token": anon_token,
        },
        status=status.HTTP_201_CREATED,
    )


# ================= CREATE DIARY ENTRY =================

@api_view(["POST"])
def create_diary_entry(request):
    anon_token = request.headers.get("X-ANON-TOKEN")

    if not anon_token:
        return Response({"error": "Missing anon token"}, status=401)

    try:
        user = DiaryUser.objects.get(anon_token=anon_token)
    except DiaryUser.DoesNotExist:
        return Response({"error": "Invalid anon token"}, status=401)

    title = request.data.get("title")
    content = request.data.get("content_encrypted")

    if not title or not content:
        return Response({"error": "Missing required fields"}, status=400)

    try:
        DiaryEntry.objects.create(
            diary_user=user,
            title=base64.b64decode(title),
            content_encrypted=base64.b64decode(content),
            iv=b"",   # optional dummy
            tag=b"",  # optional dummy
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": "Diary saved successfully"}, status=201)

    