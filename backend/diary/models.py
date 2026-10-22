from django.conf import settings
from django.db import models


class DiaryEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="diary_entries",
    )
    title = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    encrypted_content = models.TextField(blank=True, default="")
    encrypted_key = models.TextField(blank=True, default="")
    key_nonce = models.TextField(blank=True, default="")
    content_nonce = models.TextField(blank=True, default="")
    salt = models.TextField(blank=True, default="")
    favorite = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "diary_entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"DiaryEntry-{self.id}"