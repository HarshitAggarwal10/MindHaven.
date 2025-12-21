from django.urls import path
from .views import create_anonymous_diary_user, create_diary_entry

urlpatterns = [
    path("anon/create/", create_anonymous_diary_user),
    path("", create_diary_entry),
]
