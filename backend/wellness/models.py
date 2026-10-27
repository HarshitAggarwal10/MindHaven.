import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone


def is_cold_exposure_experience(title, description, category_slug=""):
    searchable = f"{title} {description} {category_slug}".casefold()
    return any(
        term in searchable
        for term in ("ice bath", "cold exposure", "cold plunge", "cold-water immersion")
    )


class WellnessCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True)
    description = models.CharField(max_length=240, blank=True)
    icon_key = models.CharField(max_length=40, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "wellness categories"

    def __str__(self):
        return self.name


class WellnessProvider(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wellness_provider",
    )
    display_name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    public_contact = models.EmailField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_name"]

    def __str__(self):
        return self.display_name


class WellnessExperience(models.Model):
    class Format(models.TextChoices):
        IN_PERSON = "in_person", "In person"
        VIRTUAL = "virtual", "Virtual"
        HYBRID = "hybrid", "Hybrid"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    category = models.ForeignKey(
        WellnessCategory,
        on_delete=models.PROTECT,
        related_name="experiences",
    )
    provider = models.ForeignKey(
        WellnessProvider,
        on_delete=models.PROTECT,
        related_name="experiences",
    )
    format = models.CharField(max_length=12, choices=Format.choices)
    location = models.CharField(max_length=180, blank=True)
    venue_details = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    timezone_name = models.CharField(max_length=64, default="Asia/Kolkata")
    duration_minutes = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="INR")
    capacity = models.PositiveIntegerField()
    registration_opens_at = models.DateTimeField(null=True, blank=True)
    registration_closes_at = models.DateTimeField(null=True, blank=True)
    cover_image = models.URLField(blank=True)
    included = models.JSONField(default=list, blank=True)
    what_to_bring = models.JSONField(default=list, blank=True)
    accessibility_information = models.TextField(blank=True)
    cancellation_policy = models.TextField(blank=True)
    refund_before_hours = models.PositiveIntegerField(default=24)
    safety_information = models.TextField(blank=True)
    virtual_link = models.URLField(blank=True)
    virtual_access_instructions = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=False)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_at"]
        indexes = [
            models.Index(fields=["status", "start_at"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["format", "status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(price__gte=0),
                name="wellness_experience_nonnegative_price",
            ),
            models.CheckConstraint(
                check=Q(capacity__gt=0),
                name="wellness_experience_positive_capacity",
            ),
        ]

    def clean(self):
        errors = {}
        if self.start_at and self.end_at and self.end_at <= self.start_at:
            errors["end_at"] = "End time must be after the start time."
        if self.registration_opens_at and self.registration_closes_at:
            if self.registration_closes_at <= self.registration_opens_at:
                errors["registration_closes_at"] = (
                    "Registration closing time must be after opening time."
                )
        if self.format in (self.Format.IN_PERSON, self.Format.HYBRID) and not self.location:
            errors["location"] = "In-person and hybrid experiences need a location."
        if self.status == self.Status.PUBLISHED and not self.provider.is_verified:
            errors["status"] = "Only verified providers can publish experiences."
        if self.status == self.Status.PUBLISHED and self.start_at <= timezone.now():
            errors["start_at"] = "A published experience must start in the future."
        if self.currency != "INR":
            errors["currency"] = "Only INR is currently configured."
        if (
            self.status == self.Status.PUBLISHED
            and is_cold_exposure_experience(
                self.title,
                self.description,
                self.category.slug,
            )
            and not self.safety_information.strip()
        ):
            errors["safety_information"] = (
                "Published cold-exposure experiences must include safety guidance."
            )
        if self.price and self.price < 1:
            errors["price"] = "Paid experiences must cost at least INR 1.00."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return self.title


class WellnessBooking(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pending payment"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        FAILED = "failed", "Failed"
        EXPIRED = "expired", "Expired"

    class PaymentStatus(models.TextChoices):
        NOT_REQUIRED = "not_required", "Not required"
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUND_PENDING = "refund_pending", "Refund pending"
        REFUND_FAILED = "refund_failed", "Refund failed"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    experience = models.ForeignKey(
        WellnessExperience,
        on_delete=models.PROTECT,
        related_name="bookings",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wellness_bookings",
    )
    booking_reference = models.CharField(max_length=14, unique=True, editable=False)
    idempotency_key = models.UUIDField(default=uuid.uuid4, unique=True)
    participant_count = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_PAYMENT,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    expires_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=Q(participant_count__gt=0),
                name="wellness_booking_positive_participants",
            ),
            models.CheckConstraint(
                check=Q(amount__gte=0),
                name="wellness_booking_nonnegative_amount",
            ),
            models.UniqueConstraint(
                fields=["user", "experience"],
                condition=Q(status__in=["pending_payment", "confirmed"]),
                name="wellness_active_user_experience_booking",
            ),
            models.UniqueConstraint(
                fields=["user", "experience"],
                condition=Q(amount=0),
                name="wellness_free_experience_one_use",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status", "-created_at"]),
            models.Index(fields=["experience", "status"]),
        ]

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = f"MH-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def reservation_is_active(self):
        return (
            self.status == self.Status.PENDING_PAYMENT
            and self.expires_at is not None
            and self.expires_at > timezone.now()
        )

    def __str__(self):
        return self.booking_reference


class PaymentTransaction(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "Created"
        CAPTURED = "captured", "Captured"
        FAILED = "failed", "Failed"
        REFUND_PENDING = "refund_pending", "Refund pending"
        REFUND_FAILED = "refund_failed", "Refund failed"
        REFUNDED = "refunded", "Refunded"

    booking = models.ForeignKey(
        WellnessBooking,
        on_delete=models.PROTECT,
        related_name="payment_transactions",
    )
    provider = models.CharField(max_length=20, default="razorpay")
    order_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    payment_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    refund_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.provider}: {self.booking.booking_reference}"


class WellnessResource(models.Model):
    class Kind(models.TextChoices):
        MEDITATION = "meditation", "Guided meditation"
        BREATHING = "breathing", "Breathing exercise"
        MINDFULNESS = "mindfulness", "Mindfulness"
        MOVEMENT = "movement", "Gentle movement"
        GROUNDING = "grounding", "Grounding"
        RELAXATION = "relaxation", "Relaxation and sound"
        REFLECTION = "reflection", "Reflection prompt"
        SLEEP = "sleep", "Sleep routine"
        EDUCATION = "education", "Stress management"

    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True)
    description = models.CharField(max_length=300)
    instructions = models.TextField()
    kind = models.CharField(max_length=20, choices=Kind.choices)
    category = models.ForeignKey(
        WellnessCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="resources",
    )
    duration_minutes = models.PositiveSmallIntegerField()
    difficulty = models.CharField(max_length=40, blank=True)
    is_free = models.BooleanField(default=True)
    media_url = models.URLField(blank=True)
    safety_notes = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class PostRetreatReflection(models.Model):
    booking = models.OneToOneField(
        WellnessBooking,
        on_delete=models.CASCADE,
        related_name="reflection",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wellness_reflections",
    )
    mood = models.CharField(max_length=16)
    encrypted_text = models.BinaryField(null=True, blank=True)
    mood_checkin = models.ForeignKey(
        "mood.MoodCheckIn",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wellness_reflections",
    )
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def set_reflection_text(self, text):
        if text:
            from api.models import get_fernet

            self.encrypted_text = get_fernet().encrypt(text.encode("utf-8"))

    def get_reflection_text(self):
        if not self.encrypted_text:
            return ""
        from api.models import get_fernet

        return get_fernet().decrypt(bytes(self.encrypted_text)).decode("utf-8")

    def __str__(self):
        return f"Reflection: {self.booking.booking_reference}"


def retreat_review_media_path(instance, filename):
    extension = filename.rsplit(".", 1)[-1].lower()
    return f"wellness/reviews/{uuid.uuid4().hex}.{extension}"


class RetreatReview(models.Model):
    class MediaKind(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    booking = models.OneToOneField(
        WellnessBooking,
        on_delete=models.CASCADE,
        related_name="retreat_review",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="retreat_reviews",
    )
    experience = models.ForeignKey(
        WellnessExperience,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField()
    review = models.TextField(max_length=2000)
    media = models.FileField(upload_to=retreat_review_media_path, blank=True)
    media_kind = models.CharField(
        max_length=8,
        choices=MediaKind.choices,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=Q(rating__gte=1, rating__lte=5),
                name="wellness_review_rating_1_to_5",
            ),
        ]

    def __str__(self):
        return f"{self.rating}/5: {self.experience.title}"

    def delete(self, *args, **kwargs):
        if self.media:
            self.media.delete(save=False)
        return super().delete(*args, **kwargs)
