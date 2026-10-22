from django.urls import re_path

from .consumers import CommunityChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/community/(?P<room_id>[^/]+)/$", CommunityChatConsumer.as_asgi()),
]
