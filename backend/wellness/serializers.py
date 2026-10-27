from django.utils import timezone
from django.db.models import Q, Sum
from rest_framework import serializers

from .models import (
    PostRetreatReflection,
    WellnessBooking,
    WellnessCategory,
    WellnessExperience,
    WellnessProvider,
    WellnessResource,
    RetreatReview,
    is_cold_exposure_experience,
)


class WellnessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessCategory
        fields = ("id", "name", "slug", "description", "icon_key")


class WellnessProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessProvider
        fields = ("display_name", "description", "is_verified")


class WellnessExperienceSerializer(serializers.ModelSerializer):
    category = WellnessCategorySerializer(read_only=True)
    provider = WellnessProviderSerializer(read_only=True)
    remaining_capacity = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    virtual_link = serializers.SerializerMethodField()
    virtual_access_instructions = serializers.SerializerMethodField()

    class Meta:
        model = WellnessExperience
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "category",
            "provider",
            "format",
            "location",
            "venue_details",
            "start_at",
            "end_at",
            "timezone_name",
            "duration_minutes",
            "price",
            "currency",
            "capacity",
            "remaining_capacity",
            "is_available",
            "registration_opens_at",
            "registration_closes_at",
            "cover_image",
            "included",
            "what_to_bring",
            "accessibility_information",
            "cancellation_policy",
            "refund_before_hours",
            "safety_information",
            "virtual_link",
            "virtual_access_instructions",
            "is_featured",
            "is_demo",
            "status",
        )
        read_only_fields = fields

    def get_remaining_capacity(self, obj):
        if hasattr(obj, "reserved_capacity"):
            reserved = obj.reserved_capacity or 0
        else:
            from django.db.models import Sum, Q

            now = timezone.now()
            reserved = obj.bookings.filter(
                Q(status=WellnessBooking.Status.CONFIRMED)
                | Q(
                    status=WellnessBooking.Status.PENDING_PAYMENT,
                    expires_at__gt=now,
                )
            ).aggregate(total=Sum("participant_count"))["total"] or 0
        return max(0, obj.capacity - reserved)

    def get_is_available(self, obj):
        now = timezone.now()
        return bool(
            obj.status == WellnessExperience.Status.PUBLISHED
            and obj.start_at > now
            and self.get_remaining_capacity(obj) > 0
            and (
                obj.registration_opens_at is None
                or obj.registration_opens_at <= now
            )
            and (
                obj.registration_closes_at is None
                or obj.registration_closes_at > now
            )
        )

    def _has_access(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.bookings.filter(
            user=request.user,
            status=WellnessBooking.Status.CONFIRMED,
            payment_status__in=[
                WellnessBooking.PaymentStatus.NOT_REQUIRED,
                WellnessBooking.PaymentStatus.PAID,
            ],
        ).exists()

    def get_virtual_link(self, obj):
        return obj.virtual_link if self._has_access(obj) else ""

    def get_virtual_access_instructions(self, obj):
        return obj.virtual_access_instructions if self._has_access(obj) else ""


class WellnessResourceSerializer(serializers.ModelSerializer):
    category = WellnessCategorySerializer(read_only=True)

    class Meta:
        model = WellnessResource
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "instructions",
            "kind",
            "category",
            "duration_minutes",
            "difficulty",
            "is_free",
            "media_url",
            "safety_notes",
        )


class WellnessBookingSerializer(serializers.ModelSerializer):
    experience = WellnessExperienceSerializer(read_only=True)

    class Meta:
        model = WellnessBooking
        fields = (
            "id",
            "experience",
            "booking_reference",
            "participant_count",
            "status",
            "payment_status",
            "amount",
            "currency",
            "expires_at",
            "created_at",
            "cancelled_at",
            "cancellation_reason",
        )


class CreateBookingSerializer(serializers.Serializer):
    experience_id = serializers.PrimaryKeyRelatedField(
        queryset=WellnessExperience.objects.filter(
            status=WellnessExperience.Status.PUBLISHED,
            provider__is_verified=True,
            category__is_active=True,
        ),
        source="experience",
    )
    participant_count = serializers.IntegerField(min_value=1, max_value=8, default=1)
    idempotency_key = serializers.UUIDField(required=False)


class OrganizerExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessExperience
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "category",
            "format",
            "location",
            "venue_details",
            "start_at",
            "end_at",
            "timezone_name",
            "duration_minutes",
            "price",
            "currency",
            "capacity",
            "registration_opens_at",
            "registration_closes_at",
            "cover_image",
            "included",
            "what_to_bring",
            "accessibility_information",
            "cancellation_policy",
            "refund_before_hours",
            "safety_information",
            "virtual_link",
            "virtual_access_instructions",
            "is_featured",
            "status",
        )
        extra_kwargs = {
            "status": {"required": False},
            "currency": {"required": False},
        }

    def validate_currency(self, value):
        if value.upper() != "INR":
            raise serializers.ValidationError("Only INR is currently configured.")
        return value.upper()

    def validate_price(self, value):
        if value > 0 and value < 1:
            raise serializers.ValidationError(
                "Paid experiences must cost at least INR 1.00."
            )
        return value

    def validate(self, attrs):
        values = {
            field: attrs.get(field, getattr(self.instance, field, None))
            for field in (
                "start_at",
                "end_at",
                "registration_opens_at",
                "registration_closes_at",
                "format",
                "location",
            )
        }
        errors = {}
        if values["start_at"] and values["end_at"] <= values["start_at"]:
            errors["end_at"] = "End time must be after the start time."
        if (
            values["registration_opens_at"]
            and values["registration_closes_at"]
            and values["registration_closes_at"] <= values["registration_opens_at"]
        ):
            errors["registration_closes_at"] = (
                "Registration closing time must be after opening time."
            )
        if (
            values["format"]
            in (WellnessExperience.Format.IN_PERSON, WellnessExperience.Format.HYBRID)
            and not values["location"]
        ):
            errors["location"] = "An in-person experience needs a location."
        status_value = attrs.get("status", getattr(self.instance, "status", None))
        provider = getattr(self.instance, "provider", None)
        if (
            status_value == WellnessExperience.Status.PUBLISHED
            and provider
            and not provider.is_verified
            and not self.context["request"].user.is_staff
        ):
            errors["status"] = "Provider verification is required before publishing."
        experience_title = attrs.get("title", getattr(self.instance, "title", ""))
        experience_description = attrs.get(
            "description",
            getattr(self.instance, "description", ""),
        )
        experience_category = attrs.get(
            "category",
            getattr(self.instance, "category", None),
        )
        safety_information = attrs.get(
            "safety_information",
            getattr(self.instance, "safety_information", ""),
        )
        category_slug = experience_category.slug if experience_category else ""
        if (
            status_value == WellnessExperience.Status.PUBLISHED
            and is_cold_exposure_experience(
                experience_title,
                experience_description,
                category_slug,
            )
            and not safety_information.strip()
        ):
            errors["safety_information"] = (
                "Published cold-exposure experiences must include safety guidance."
            )
        if self.instance and "capacity" in attrs:
            active_capacity = self.instance.bookings.filter(
                Q(status=WellnessBooking.Status.CONFIRMED)
                | Q(
                    status=WellnessBooking.Status.PENDING_PAYMENT,
                    expires_at__gt=timezone.now(),
                )
            ).aggregate(total=Sum("participant_count"))["total"] or 0
            if attrs["capacity"] < active_capacity:
                errors["capacity"] = (
                    "Capacity cannot be lower than existing confirmed and pending registrations."
                )
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def validate_status(self, value):
        request = self.context["request"]
        if (
            value == WellnessExperience.Status.PUBLISHED
            and not request.user.is_staff
        ):
            provider = request.user.wellness_provider
            if not provider.is_verified:
                raise serializers.ValidationError(
                    "Provider verification is required before publishing."
                )
        return value


class PostRetreatReflectionSerializer(serializers.ModelSerializer):
    reflection_text = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=4000,
    )
    private_reflection = serializers.SerializerMethodField()

    class Meta:
        model = PostRetreatReflection
        fields = (
            "id",
            "booking",
            "mood",
            "reflection_text",
            "private_reflection",
            "follow_up_date",
            "created_at",
        )
        read_only_fields = ("id", "booking", "private_reflection", "created_at")

    def get_private_reflection(self, obj):
        return obj.get_reflection_text()

    def validate_mood(self, value):
        from mood.models import MANUAL_MOODS

        if value not in dict(MANUAL_MOODS):
            raise serializers.ValidationError("Choose a supported mood.")
        return value


class RetreatReviewSerializer(serializers.ModelSerializer):
    media = serializers.FileField(required=False, allow_empty_file=False)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = RetreatReview
        fields = (
            "id",
            "rating",
            "review",
            "media",
            "media_kind",
            "created_at",
            "is_mine",
        )
        read_only_fields = ("id", "media_kind", "created_at", "is_mine")

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Choose a rating from 1 to 5.")
        return value

    def validate_review(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Please write at least 10 characters about your experience."
            )
        return value.strip()

    def validate_media(self, value):
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        content_type = getattr(value, "content_type", "")
        header = value.read(16)
        value.seek(0)
        image_types = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
        }
        video_types = {
            "mp4": "video/mp4",
            "webm": "video/webm",
        }
        valid_images = {
            "jpg": header.startswith(b"\xff\xd8\xff"),
            "jpeg": header.startswith(b"\xff\xd8\xff"),
            "png": header.startswith(b"\x89PNG\r\n\x1a\n"),
            "webp": header.startswith(b"RIFF") and header[8:12] == b"WEBP",
        }
        valid_videos = {
            "mp4": header[4:8] == b"ftyp",
            "webm": header.startswith(b"\x1a\x45\xdf\xa3"),
        }
        if (
            extension in image_types
            and content_type == image_types[extension]
            and valid_images[extension]
        ):
            if value.size > 12 * 1024 * 1024:
                raise serializers.ValidationError("Images must be 12 MB or smaller.")
            self._validated_media_kind = RetreatReview.MediaKind.IMAGE
            return value
        if (
            extension in video_types
            and content_type == video_types[extension]
            and valid_videos[extension]
        ):
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError("Videos must be 50 MB or smaller.")
            self._validated_media_kind = RetreatReview.MediaKind.VIDEO
            return value
        raise serializers.ValidationError(
            "Upload a JPG, PNG, or WebP image, or an MP4 or WebM video."
        )

    def create(self, validated_data):
        media = validated_data.get("media")
        if media:
            validated_data["media_kind"] = self._validated_media_kind
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.media:
            request = self.context.get("request")
            url = instance.media.url
            representation["media"] = request.build_absolute_uri(url) if request else url
        else:
            representation["media"] = ""
        return representation
