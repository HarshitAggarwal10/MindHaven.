from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from wellness.models import (
    WellnessCategory,
    WellnessExperience,
    WellnessProvider,
)


DEMO_HOST_EMAIL = "mindhaven-demo-host@example.invalid"

DEMO_EXPERIENCES = (
    {
        "slug": "demo-gentle-yoga-pune",
        "title": "DEMO · Gentle Yoga & Grounding Camp",
        "category": ("Gentle movement", "gentle-movement", "move"),
        "description": (
            "DEMO LISTING — for testing registration only; no real camp takes place. "
            "A sample, beginner-friendly morning with optional seated or standing "
            "movement, a grounding practice, and a quiet closing reflection. There is "
            "no requirement to share personal information or join any activity."
        ),
        "format": WellnessExperience.Format.IN_PERSON,
        "location": "Pune, Maharashtra (sample location)",
        "venue_details": (
            "Demo venue: MindHaven Sample Studio, 12 Example Lane, Pune, Maharashtra. "
            "This is fictional venue information; do not travel to this address."
        ),
        "days_ahead": 7,
        "start_hour": 9,
        "duration_minutes": 180,
        "capacity": 12,
        "cover_image": "/images/wellness/yoga.jpg",
        "included": [
            "Sample 45-minute gentle movement session",
            "Optional 20-minute guided grounding practice",
            "Water and a quiet rest break",
            "Optional reflection prompt during the sample session",
        ],
        "what_to_bring": [
            "Comfortable clothing",
            "A yoga mat if you have one (not required)",
            "Water bottle",
        ],
        "accessibility_information": (
            "This fictional sample venue has no verified accessibility features. "
            "The sample activities can be imagined seated or standing; participation "
            "is optional. No real venue or event is available."
        ),
        "cancellation_policy": (
            "Demo registration only. You can cancel the sample booking from My bookings. "
            "There is no real event, organizer, or payment to refund."
        ),
        "safety_information": (
            "This sample listing is for software testing, not a real wellness service. "
            "No instructor or venue is present. The example activity is gentle and "
            "optional; stop if anything feels uncomfortable. It is not medical care."
        ),
    },
    {
        "slug": "demo-mindful-mornings-online",
        "title": "DEMO · Mindful Mornings Session",
        "category": ("Mindfulness", "mindfulness", "sparkles"),
        "description": (
            "DEMO LISTING — for testing registration only; no live session takes place. "
            "A sample 60-minute online gathering with a welcome, a quiet sensory "
            "noticing exercise, an optional journaling prompt, and time to close. "
            "You may keep your camera off and pass on any activity."
        ),
        "format": WellnessExperience.Format.VIRTUAL,
        "location": "",
        "venue_details": "Online sample. No meeting room or access link is provided.",
        "virtual_access_instructions": (
            "Demo listing only. There is no live session or meeting link."
        ),
        "days_ahead": 14,
        "start_hour": 10,
        "duration_minutes": 60,
        "capacity": 25,
        "cover_image": "/images/wellness/meditation.jpg",
        "included": [
            "Optional 5-minute settling-in prompt",
            "Sample sensory mindfulness activity",
            "Optional private journaling prompt",
            "Camera and microphone are not required",
        ],
        "what_to_bring": [
            "A comfortable place to sit",
            "Paper and pen if you would like to write",
        ],
        "accessibility_information": (
            "No live online event is hosted. The sample session is described for "
            "testing only; no captions, interpreter, or meeting link are available."
        ),
        "cancellation_policy": (
            "Demo registration only. You can cancel the sample booking from My bookings. "
            "There is no real event, organizer, or payment to refund."
        ),
        "safety_information": (
            "This sample listing is for software testing, not a real wellness service. "
            "No facilitator or live session is provided. Activities are optional and "
            "are not a substitute for professional care."
        ),
    },
    {
        "slug": "demo-nature-reset-nashik",
        "title": "DEMO · Nature Walk & Slow-Down Camp",
        "category": ("Mindfulness", "mindfulness", "sparkles"),
        "description": (
            "DEMO LISTING — for testing registration only; no real camp takes place. "
            "A sample half-day itinerary featuring an easy nature walk, optional "
            "noticing pauses, a picnic break, and a short take-home reflection. "
            "The pace is intentionally flexible, with no pressure to keep up."
        ),
        "format": WellnessExperience.Format.IN_PERSON,
        "location": "Nashik, Maharashtra (sample location)",
        "venue_details": (
            "Demo meeting point: Example Garden Entrance, 5 Sample Road, Nashik. "
            "This is fictional venue information; do not travel to this address."
        ),
        "days_ahead": 21,
        "start_hour": 8,
        "duration_minutes": 240,
        "capacity": 10,
        "cover_image": "/images/wellness/nature.jpg",
        "included": [
            "Sample easy-paced walking itinerary",
            "Optional nature-noticing prompts",
            "A scheduled rest and water break",
        ],
        "what_to_bring": [
            "Comfortable walking shoes",
            "Water and sun protection",
            "Any mobility aid you normally use",
        ],
        "accessibility_information": (
            "No real route or venue is available to assess. This fictional sample "
            "includes rest breaks and optional participation; please do not travel "
            "to the sample address."
        ),
        "cancellation_policy": (
            "Demo registration only. You can cancel the sample booking from My bookings. "
            "There is no real event, organizer, or payment to refund."
        ),
        "safety_information": (
            "This sample listing is for software testing, not a real wellness service. "
            "No guide, route, or venue is provided. In real outdoor activities, follow "
            "local conditions and stop if you feel unwell."
        ),
    },
)


class Command(BaseCommand):
    help = "Create clearly labeled, free demo camps for local booking-flow testing."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "Demo experiences can only be seeded when DEBUG=True. "
                "They are fictional listings and must not be published in production."
            )

        user_model = get_user_model()
        host_user, created = user_model.objects.get_or_create(
            email=DEMO_HOST_EMAIL,
            defaults={"display_name": "MindHaven Demo Host", "is_active": False},
        )
        if created:
            host_user.set_unusable_password()
            host_user.save(update_fields=["password"])
        provider, _ = WellnessProvider.objects.update_or_create(
            user=host_user,
            defaults={
                "display_name": "MindHaven Demo Host · Test listings only",
                "description": (
                    "A fictional host used only to test the MindHaven booking flow. "
                    "These listings are not real events."
                ),
                "is_verified": True,
            },
        )

        now = timezone.now()
        local_start = timezone.localtime(now).replace(
            hour=9,
            minute=0,
            second=0,
            microsecond=0,
        )
        seeded = 0
        for data in DEMO_EXPERIENCES:
            category_name, category_slug, icon_key = data["category"]
            category, _ = WellnessCategory.objects.update_or_create(
                slug=category_slug,
                defaults={
                    "name": category_name,
                    "icon_key": icon_key,
                    "description": f"{category_name} sample experiences.",
                    "is_active": True,
                },
            )
            start_at = (local_start + timedelta(days=data["days_ahead"])).replace(
                hour=data["start_hour"],
            )
            values = {
                key: value
                for key, value in data.items()
                if key not in {"slug", "category", "days_ahead", "start_hour"}
            }
            values.update(
                {
                    "category": category,
                    "provider": provider,
                    "start_at": start_at,
                    "end_at": start_at + timedelta(minutes=data["duration_minutes"]),
                    "registration_opens_at": now - timedelta(days=1),
                    "registration_closes_at": start_at - timedelta(hours=1),
                    "price": Decimal("0.00"),
                    "currency": "INR",
                    "timezone_name": timezone.get_current_timezone_name(),
                    "is_featured": True,
                    "is_demo": True,
                    "status": WellnessExperience.Status.PUBLISHED,
                }
            )
            WellnessExperience.objects.update_or_create(
                slug=data["slug"],
                defaults=values,
            )
            seeded += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created or updated {seeded} free demo experiences. "
                "They are labeled as fictional tests and may be booked only in this "
                "DEBUG environment."
            )
        )
