from django.core.management.base import BaseCommand

from community.models import Community
from community.utils import COMMUNITIES


class Command(BaseCommand):
    help = "Seed default communities into the database"

    def handle(self, *args, **options):
        for community_data in COMMUNITIES:
            community, created = Community.objects.get_or_create(
                slug=community_data["slug"],
                defaults={
                    "name": community_data["name"],
                    "description": community_data["description"],
                    "is_public": True,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created community: {community.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Community already exists: {community.name}"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded communities"))
