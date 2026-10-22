import uuid
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet


def get_fernet():
    return Fernet(settings.FERNET_KEY.encode())


class AnonymousDiaryUser(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AnonymousUserProfile(models.Model):
    firebase_uid = models.CharField(max_length=255, unique=True)
    display_handle = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_handle


class DiaryEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )
    anon_user = models.ForeignKey(
        AnonymousDiaryUser,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=200, blank=True)
    encrypted_content = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    def set_content(self, text):
        f = get_fernet()
        self.encrypted_content = f.encrypt(text.encode())

    def get_content(self):
        f = get_fernet()
        return f.decrypt(self.encrypted_content).decode()
