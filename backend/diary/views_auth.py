import secrets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DiaryUser

@api_view(["POST"])
def create_anonymous_diary_user(request):
    token = secrets.token_hex(32)

    user = DiaryUser.objects.create(
        anon_token=token
    )

    return Response({
        "anon_token": user.anon_token
    })
