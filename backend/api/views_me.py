from rest_framework.decorators import api_view
from rest_framework.response import Response
import jwt, os

JWT_SECRET = os.environ["JWT_SECRET"]

@api_view(["GET"])
def me_view(request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return Response({"user": payload})
    except:
        return Response({"user": None})
