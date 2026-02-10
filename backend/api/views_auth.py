from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
import json

User = get_user_model()

@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "Email & password required"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "User already exists"}, status=400)

    user = User.objects.create_user(email=email, password=password)

    return JsonResponse({"message": "Signup successful"}, status=201)


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    user = authenticate(email=email, password=password)
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    return JsonResponse({"message": "Login successful"}, status=200)