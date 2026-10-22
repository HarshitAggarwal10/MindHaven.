from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AnonymousIdentity


@receiver(post_save, sender=get_user_model())
def create_anonymous_identity(sender, instance, created, **kwargs):
    if created:
        AnonymousIdentity.get_for_user(instance)
