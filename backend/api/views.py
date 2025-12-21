from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .auth import verify_firebase_token
from .models import AnonymousUserProfile, DiaryEntry
from .serializers import DiaryCreateSerializer

def get_user_from_request(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    decoded = verify_firebase_token(token)

    if not decoded:
        return None

    uid = decoded["uid"]
    profile, _ = AnonymousUserProfile.objects.get_or_create(
        firebase_uid=uid,
        defaults={"display_handle": f"User-{uid[:6]}"},
    )

    return profile

class DiaryView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"detail": "Invalid token"}, status=401)

        serializer = DiaryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        entry = DiaryEntry(
            user=user,
        )
        entry.save()

        return Response({"id": entry.id})

    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"detail": "Invalid token"}, status=401)

        return Response([])
