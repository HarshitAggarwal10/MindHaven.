from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DiaryEntry, AnonymousDiaryUser


@api_view(["POST"])
def diary_view(request):
    anon_token = request.headers.get("X-ANON-TOKEN")
    user = request.user if request.user.is_authenticated else None

    entry = DiaryEntry(
        user=user,
        anon_user=AnonymousDiaryUser.objects.filter(token=anon_token).first(),
        title=request.data.get("title", "")
    )
    entry.set_content(request.data.get("content", ""))
    entry.save()

    return Response({"success": True})
