from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework_simplejwt.tokens import RefreshToken
import logging
import json

User = get_user_model()
logger = logging.getLogger(__name__)


def find_user_by_email(email):
    user = User.objects.filter(email=email).only("id", "email", "password", "is_active").first()
    if user is None:
        user = User.objects.filter(email__iexact=email).only("id", "email", "password", "is_active").first()
    return user


def build_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def find_user_for_credentials(email, password):
    user = find_user_by_email(email)
    if user and user.is_active and user.check_password(password):
        return user
    return None


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"error": "Invalid request body"}, status=400)

    email = data.get("email")
    password = data.get("password")
    display_name = data.get("display_name", data.get("name", ""))

    if not isinstance(email, str) or not isinstance(password, str) or not email.strip() or not password:
        return JsonResponse({"error": "Email & password required"}, status=400)
    if not isinstance(display_name, str):
        return JsonResponse({"error": "Name must be text"}, status=400)

    email = email.strip().lower()
    existing_user = find_user_by_email(email)
    if existing_user:
        if existing_user.is_active and existing_user.check_password(password):
            return JsonResponse({"message": "Signup successful", **build_tokens_for_user(existing_user)}, status=200)
        return JsonResponse({"error": "User already exists. Please log in."}, status=409)

    try:
        with transaction.atomic():
            user = User.objects.create_user(email=email, password=password)
    except IntegrityError:
        existing_user = find_user_by_email(email)
        if existing_user and existing_user.is_active and existing_user.check_password(password):
            return JsonResponse({"message": "Signup successful", **build_tokens_for_user(existing_user)}, status=200)
        if existing_user:
            return JsonResponse({"error": "User already exists. Please log in."}, status=409)
        logger.exception("Account creation failed because of a database integrity error.")
        return JsonResponse({"error": "Could not create the account. Please try again."}, status=500)

    user.display_name = display_name.strip()[:150]
    user.save(update_fields=["display_name"])
    tokens = build_tokens_for_user(user)

    return JsonResponse({"message": "Signup successful", **tokens}, status=201)


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"error": "Invalid request body"}, status=400)

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str) or not email.strip() or not password:
        return JsonResponse({"error": "Email & password required"}, status=400)

    email = email.strip()
    user = find_user_for_credentials(email.lower(), password)
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    tokens = build_tokens_for_user(user)
    return JsonResponse({"message": "Login successful", **tokens}, status=200)
