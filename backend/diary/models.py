import uuid
from django.db import models

class DiaryUser(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    anon_id = models.CharField(max_length=12, unique=True)
    pin_hash = models.TextField()
    anon_token = models.CharField(max_length=128, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "diary_users"
        managed = False   # VERY IMPORTANT

    def __str__(self):
        return f"DiaryUser-{self.anon_id}"


class DiaryEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    diary_user = models.ForeignKey(
        DiaryUser,
        on_delete=models.CASCADE,
        related_name="entries",
        db_column="diary_user_id",  # 🔥 matches DB
    )

    title = models.BinaryField()
    content_encrypted = models.BinaryField()
    iv = models.BinaryField()
    tag = models.BinaryField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "diary_entries"
