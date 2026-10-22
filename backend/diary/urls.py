from django.urls import path

from .views import (
    create_diary_entry,
    delete_diary_entry,
    favorite_diary_entry,
    get_diary_entry,
    list_diary_entries,
    update_diary_entry,
    verify_diary_access,
)

urlpatterns = [
    path("", create_diary_entry, name="diary-create"),
    path("list/", list_diary_entries, name="diary-list"),
    path("verify/", verify_diary_access, name="diary-verify"),
    path("<int:entry_id>/", get_diary_entry, name="diary-detail"),
    path("<int:entry_id>/update/", update_diary_entry, name="diary-update"),
    path("<int:entry_id>/delete/", delete_diary_entry, name="diary-delete"),
    path("<int:entry_id>/favorite/", favorite_diary_entry, name="diary-favorite"),
]