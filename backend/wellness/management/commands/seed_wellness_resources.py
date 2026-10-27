from django.core.management.base import BaseCommand

from wellness.models import WellnessCategory, WellnessResource


CATEGORIES = (
    ("Breathwork", "breathwork", "wind"),
    ("Mindfulness", "mindfulness", "sparkles"),
    ("Grounding", "grounding", "leaf"),
    ("Gentle movement", "gentle-movement", "move"),
)

RESOURCES = (
    {
        "title": "A gentle breathing pause",
        "slug": "gentle-breathing-pause",
        "description": "A short invitation to notice your breathing without changing it.",
        "instructions": (
            "Settle into a position that feels comfortable, or keep your eyes open. "
            "Notice the next breath as it naturally arrives, then notice it leave. "
            "There is no need to make the breath deeper or slower. If paying attention "
            "to breathing feels uncomfortable, stop and notice the room around you."
        ),
        "kind": WellnessResource.Kind.BREATHING,
        "category_slug": "breathwork",
        "duration_minutes": 2,
        "safety_notes": "This is an optional wellness practice, not medical treatment. Return to normal breathing or stop at any time.",
    },
    {
        "title": "Orient to the room",
        "slug": "orient-to-the-room",
        "description": "A brief, eyes-open practice of noticing your surroundings.",
        "instructions": (
            "Look around at a pace that feels comfortable. Notice a few colors, shapes, "
            "or sources of light. Listen for sounds near you and farther away. Feel the "
            "support beneath you. There is no right answer and you can stop whenever you wish."
        ),
        "kind": WellnessResource.Kind.GROUNDING,
        "category_slug": "grounding",
        "duration_minutes": 3,
        "safety_notes": "If this practice does not feel comfortable, stop and choose another activity or contact someone you trust.",
    },
    {
        "title": "Mindful moment with the senses",
        "slug": "mindful-moment-with-the-senses",
        "description": "A simple prompt to notice one ordinary detail at a time.",
        "instructions": (
            "Choose one nearby object, or simply notice the space around you. Notice a "
            "detail you can see, a sound you can hear, and a physical sensation that feels "
            "neutral or comfortable. Let each observation be brief; you do not need to "
            "change anything."
        ),
        "kind": WellnessResource.Kind.MINDFULNESS,
        "category_slug": "mindfulness",
        "duration_minutes": 3,
        "safety_notes": "This optional practice is not a substitute for professional care.",
    },
    {
        "title": "A comfortable seated stretch",
        "slug": "comfortable-seated-stretch",
        "description": "An invitation to make a small, comfortable movement while seated.",
        "instructions": (
            "If movement is comfortable for you, gently roll your shoulders or reach your "
            "hands to a position that feels easy. Keep the range small and breathe normally. "
            "Skip any movement that causes pain, dizziness, or discomfort."
        ),
        "kind": WellnessResource.Kind.MOVEMENT,
        "category_slug": "gentle-movement",
        "duration_minutes": 4,
        "safety_notes": "Move only within a comfortable range. Stop if you feel pain, dizziness, or discomfort; adapt for your needs.",
    },
)


class Command(BaseCommand):
    help = "Create original MindHaven wellness categories and optional free resources."

    def add_arguments(self, parser):
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Publish the included original resources for local development.",
        )

    def handle(self, *args, **options):
        categories = {}
        for name, slug, icon_key in CATEGORIES:
            category, _ = WellnessCategory.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "icon_key": icon_key,
                    "description": f"MindHaven {name.lower()} practices.",
                    "is_active": True,
                },
            )
            categories[slug] = category

        for resource_data in RESOURCES:
            values = {
                field: value
                for field, value in resource_data.items()
                if field != "category_slug"
            }
            values.update(
                {
                    "category": categories[resource_data["category_slug"]],
                    "is_free": True,
                    "is_published": bool(options["publish"]),
                }
            )
            WellnessResource.objects.update_or_create(
                slug=values["slug"],
                defaults=values,
            )

        state = "published" if options["publish"] else "saved as drafts"
        self.stdout.write(
            self.style.SUCCESS(
                f"Created or updated {len(CATEGORIES)} categories and "
                f"{len(RESOURCES)} original wellness resources ({state})."
            )
        )
