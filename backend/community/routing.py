from django.urls import re_path

from .consumers import CommunityChatConsumer, UserNotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/community/(?P<room_id>[^/]+)/$", CommunityChatConsumer.as_asgi()),
    re_path(r"ws/notifications/$", UserNotificationConsumer.as_asgi()),
]
