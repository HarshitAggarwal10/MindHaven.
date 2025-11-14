from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet


def get_fernet():
    """Lazily initialize Fernet with the key from settings."""
    key = getattr(settings, "FERNET_KEY", None)
    if not key:
        raise ValueError("FERNET_KEY not set in Django settings.")
    return Fernet(key.encode())


class AnonymousUserProfile(models.Model):
    firebase_uid = models.CharField(max_length=128, unique=True)
    display_handle = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_handle


class DiaryEntry(models.Model):
    user = models.ForeignKey(AnonymousUserProfile, on_delete=models.CASCADE)
    _text = models.BinaryField()  # encrypted data
    mood = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_text(self, plaintext: str):
        fernet = get_fernet()
        self._text = fernet.encrypt(plaintext.encode())

    def get_text(self) -> str:
        fernet = get_fernet()
        return fernet.decrypt(bytes(self._text)).decode()
