import random
import string

from django.utils.text import slugify

ADJECTIVES = [
    "Calm",
    "Silent",
    "Hopeful",
    "Gentle",
    "Soft",
    "Bright",
    "Serene",
    "Kind",
    "Brave",
    "Quiet",
    "Still",
    "Warm",
]

ANIMALS = [
    "Fox",
    "Owl",
    "Wolf",
    "Swan",
    "Deer",
    "Heron",
    "Stag",
    "Doe",
    "Finch",
    "Lark",
    "Dove",
    "Otter",
]

COMMUNITIES = [
    {
        "slug": "anxiety-support",
        "name": "Anxiety Support",
        "description": "A safe place to share coping strategies, calming techniques, and supportive stories with other members navigating anxiety.",
    },
    {
        "slug": "panic-attack-support",
        "name": "Panic & Grounding",
        "description": "A gentle, non-judgmental space to share grounding ideas and encouragement around panic and intense anxiety.",
    },
    {
        "slug": "depression-support",
        "name": "Depression Support",
        "description": "Connect with others who understand low moods, resilience building, and subtle ways to feel better each day.",
    },
    {
        "slug": "stress-management",
        "name": "Stress Management",
        "description": "Share tools for managing pressure, setting healthy boundaries, and staying grounded when life feels overwhelming.",
    },
    {
        "slug": "burnout-recovery",
        "name": "Burnout Recovery",
        "description": "A community for recovering energy, restoring balance, and rebuilding hope after burnout.",
    },
    {
        "slug": "grief-support",
        "name": "Grief & Loss",
        "description": "Find compassionate peer support while navigating grief, loss, and the many ways healing can look.",
    },
    {
        "slug": "sleep-support",
        "name": "Sleep & Rest",
        "description": "Share calming routines and support for rest, sleep challenges, and building gentler evenings.",
    },
    {
        "slug": "eating-disorder-recovery",
        "name": "Eating Disorder Recovery",
        "description": "A moderated peer-support space for recovery encouragement, body respect, and compassionate check-ins.",
    },
    {
        "slug": "adhd",
        "name": "ADHD",
        "description": "Find connection, productivity tips, and acceptance in a community for neurodivergent minds.",
    },
    {
        "slug": "ocd",
        "name": "OCD",
        "description": "Exchange practical strategies and encouragement with peers who manage intrusive thoughts and routines.",
    },
    {
        "slug": "ptsd",
        "name": "PTSD",
        "description": "A calming environment for survivors and allies to support each other through trauma recovery.",
    },
    {
        "slug": "bipolar-disorder",
        "name": "Bipolar Disorder",
        "description": "Discussion space for mood stabilization, self-awareness, and the ups and downs of bipolar mental health.",
    },
    {
        "slug": "loneliness",
        "name": "Loneliness",
        "description": "A welcoming corner for those craving connection and compassionate encouragement.",
    },
    {
        "slug": "self-esteem",
        "name": "Self-Esteem",
        "description": "Share small victories, confidence-building practices, and empowerment stories.",
    },
    {
        "slug": "students",
        "name": "Students",
        "description": "Support for academic pressures, identity development, and campus life challenges.",
    },
    {
        "slug": "professionals",
        "name": "Professionals",
        "description": "Navigate workplace stress, boundaries, and finding meaning while staying mentally healthy.",
    },
    {
        "slug": "parents",
        "name": "Parents",
        "description": "A supportive community for caregivers managing family stress, self-care, and compassion.",
    },
    {
        "slug": "teen-support",
        "name": "Teen Support",
        "description": "A safe, anonymous space for younger members to share what matters most to them.",
    },
    {
        "slug": "general-wellness",
        "name": "General Wellness",
        "description": "A balanced community for mindfulness, healthy habits, and everyday mental well-being.",
    },
    {
        "slug": "meditation",
        "name": "Meditation",
        "description": "Practice calm presence, breathing exercises, and guided reflection with peers.",
    },
]


def random_anonymous_handle():
    adjective = random.choice(ADJECTIVES)
    animal = random.choice(ANIMALS)
    number = random.randint(100, 999)
    return f"{adjective}{animal}{number}"


def random_avatar_seed():
    return "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(16))


def build_community_slug(name: str) -> str:
    return slugify(name)
