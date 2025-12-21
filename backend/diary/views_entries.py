from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DiaryUser, DiaryEntry

@api_view(["POST"])
def create_entry(request):
    anon_token = request.headers.get("X-ANON-TOKEN")

    if not anon_token:
        return Response({"error": "Missing anon token"}, status=401)

    try:
        user = DiaryUser.objects.get(anon_token=anon_token)
    except DiaryUser.DoesNotExist:
        return Response({"error": "Invalid anon token"}, status=401)

    DiaryEntry.objects.create(
        user=user,
        encrypted_title=request.data["title"].encode(),
        encrypted_content=request.data["content"].encode()
    )

    return Response({"success": True})
