from django.urls import path, include
# from .views_diary import diary_view
# from .views_diary_auth import diary_anon_create
from .views_auth import signup, login

urlpatterns = [
    # path("diary/", diary_view),
    # path("diary/anon/create/", diary_anon_create),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("diary/", include("diary.urls")),
]
