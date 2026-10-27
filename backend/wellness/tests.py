import hashlib
import hmac
import json
from datetime import timedelta
from decimal import Decimal
from io import StringIO
from tempfile import TemporaryDirectory
from unittest.mock import patch

from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management.base import CommandError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
    PaymentTransaction,
    PostRetreatReflection,
    WellnessBooking,
    WellnessCategory,
    WellnessExperience,
    WellnessProvider,
    WellnessResource,
)


User = get_user_model()


class WellnessApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="participant@example.test",
            password="test-password",
        )
        self.other_user = User.objects.create_user(
            email="other@example.test",
            password="test-password",
        )
        self.provider_user = User.objects.create_user(
            email="provider@example.test",
            password="test-password",
        )
        self.provider = WellnessProvider.objects.create(
            user=self.provider_user,
            display_name="Mindful Host",
            is_verified=True,
        )
        self.category = WellnessCategory.objects.create(
            name="Mindfulness",
            slug="mindfulness",
        )
        self.experience = self.make_experience()

    def make_experience(self, **overrides):
        defaults = {
            "title": "A mindful pause",
            "slug": f"mindful-pause-{WellnessExperience.objects.count()}",
            "description": "An optional guided practice.",
            "category": self.category,
            "provider": self.provider,
            "format": WellnessExperience.Format.VIRTUAL,
            "start_at": timezone.now() + timedelta(days=3),
            "end_at": timezone.now() + timedelta(days=3, minutes=60),
            "duration_minutes": 60,
            "price": Decimal("0.00"),
            "currency": "INR",
            "capacity": 5,
            "status": WellnessExperience.Status.PUBLISHED,
            "virtual_link": "https://meet.example.test/private-room",
        }
        defaults.update(overrides)
        return WellnessExperience.objects.create(**defaults)

    def auth_as(self, user=None):
        self.client.force_authenticate(user or self.user)

    def test_public_listing_search_and_category_filters(self):
        self.make_experience(
            title="Quiet breathwork",
            slug="quiet-breathwork",
            description="A quiet online breathing practice.",
        )
        self.make_experience(
            title="Hidden draft",
            slug="hidden-draft",
            status=WellnessExperience.Status.DRAFT,
        )

        response = self.client.get(
            reverse("wellness-experiences"),
            {"search": "breathwork", "category": self.category.slug},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Quiet breathwork")

    def test_experience_format_filter_uses_non_reserved_query_parameter(self):
        self.make_experience(
            title="In-person yoga",
            slug="in-person-yoga",
            format=WellnessExperience.Format.IN_PERSON,
            location="Pune",
        )

        response = self.client.get(
            reverse("wellness-experiences"),
            {"experience_format": "in_person"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["title"] for item in response.data["results"]],
            ["In-person yoga"],
        )

    def test_free_experience_can_only_be_booked_once_even_after_cancellation(self):
        self.auth_as()
        first_booking = self.client.post(
            reverse("wellness-bookings"),
            {"experience_id": self.experience.id, "participant_count": 1},
            format="json",
        )
        self.assertEqual(first_booking.status_code, 201)
        self.assertEqual(first_booking.data["booking"]["status"], "confirmed")

        booking = WellnessBooking.objects.get(id=first_booking.data["booking"]["id"])
        booking.status = WellnessBooking.Status.CANCELLED
        booking.save(update_fields=["status", "updated_at"])

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                WellnessBooking.objects.create(
                    experience=self.experience,
                    user=self.user,
                    amount=Decimal("0.00"),
                    currency="INR",
                )

        repeated_booking = self.client.post(
            reverse("wellness-bookings"),
            {"experience_id": self.experience.id, "participant_count": 1},
            format="json",
        )

        self.assertEqual(repeated_booking.status_code, 409)
        self.assertEqual(repeated_booking.data["code"], "free_experience_already_used")

    @override_settings(DEBUG=True)
    def test_demo_camps_are_seeded_idempotently_and_can_be_booked(self):
        call_command("seed_wellness_experiences", stdout=StringIO())
        demo_experiences = WellnessExperience.objects.filter(is_demo=True)

        self.assertEqual(demo_experiences.count(), 3)
        self.assertTrue(all(item.price == 0 for item in demo_experiences))
        self.assertTrue(all(item.status == WellnessExperience.Status.PUBLISHED for item in demo_experiences))

        listing = self.client.get(
            reverse("wellness-experiences"),
            {"search": "DEMO"},
        )
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.data["results"]), 3)
        self.assertTrue(all(item["is_demo"] for item in listing.data["results"]))

        self.auth_as()
        registration = self.client.post(
            reverse("wellness-bookings"),
            {
                "experience_id": demo_experiences.first().id,
                "participant_count": 1,
            },
            format="json",
        )
        self.assertEqual(registration.status_code, 201)
        self.assertEqual(registration.data["booking"]["status"], "confirmed")
        self.assertTrue(registration.data["booking"]["experience"]["is_demo"])

        call_command("seed_wellness_experiences", stdout=StringIO())
        self.assertEqual(WellnessExperience.objects.filter(is_demo=True).count(), 3)

    @override_settings(DEBUG=False)
    def test_demo_camps_cannot_be_seeded_when_debug_is_disabled(self):
        with self.assertRaises(CommandError):
            call_command("seed_wellness_experiences", stdout=StringIO())

        self.assertFalse(WellnessExperience.objects.filter(is_demo=True).exists())

    def test_booking_schedule_reads_do_not_use_booking_creation_throttle(self):
        self.auth_as()
        cache.clear()
        for _ in range(12):
            response = self.client.get(reverse("wellness-bookings"))
            self.assertEqual(response.status_code, 200)

    def test_only_a_confirmed_attendee_can_publish_one_review(self):
        self.experience.status = WellnessExperience.Status.COMPLETED
        self.experience.start_at = timezone.now() - timedelta(days=2)
        self.experience.end_at = timezone.now() - timedelta(days=2) + timedelta(hours=1)
        self.experience.save(update_fields=["status", "start_at", "end_at"])
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("0.00"),
            currency="INR",
            status=WellnessBooking.Status.CONFIRMED,
            payment_status=WellnessBooking.PaymentStatus.NOT_REQUIRED,
        )
        self.auth_as()
        url = reverse(
            "wellness-experience-reviews",
            args=[self.experience.slug],
        )
        payload = {
            "booking_id": str(booking.id),
            "rating": 5,
            "review": "A kind and restorative experience.",
        }

        response = self.client.post(url, payload, format="json")
        duplicate = self.client.post(url, payload, format="json")
        public_response = APIClient().get(url)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(len(public_response.data), 1)
        self.assertFalse(public_response.data[0]["is_mine"])
        self.assertNotIn("user", public_response.data[0])

    def test_participant_review_accepts_checked_image_upload(self):
        self.experience.status = WellnessExperience.Status.COMPLETED
        self.experience.start_at = timezone.now() - timedelta(days=2)
        self.experience.end_at = timezone.now() - timedelta(days=2) + timedelta(hours=1)
        self.experience.save(update_fields=["status", "start_at", "end_at"])
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("0.00"),
            currency="INR",
            status=WellnessBooking.Status.CONFIRMED,
            payment_status=WellnessBooking.PaymentStatus.NOT_REQUIRED,
        )
        self.auth_as()
        image = SimpleUploadedFile(
            "retreat.jpg",
            b"\xff\xd8\xff" + b"\x00" * 20,
            content_type="image/jpeg",
        )
        payload = {
            "booking_id": str(booking.id),
            "rating": "4",
            "review": "I enjoyed the gentle pace.",
            "media": image,
        }

        with TemporaryDirectory() as media_directory:
            with self.settings(MEDIA_ROOT=media_directory):
                response = self.client.post(
                    reverse("wellness-experience-reviews", args=[self.experience.slug]),
                    payload,
                    format="multipart",
                )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["media_kind"], "image")
        self.assertTrue(response.data["media"].endswith(".jpg"))

    def test_public_experience_does_not_expose_private_session_link(self):
        response = self.client.get(
            reverse("wellness-experience-detail", args=[self.experience.slug])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["virtual_link"], "")

    def test_completed_experience_remains_available_for_review_details(self):
        self.experience.status = WellnessExperience.Status.COMPLETED
        self.experience.start_at = timezone.now() - timedelta(days=2)
        self.experience.end_at = timezone.now() - timedelta(days=2) + timedelta(hours=1)
        self.experience.save(update_fields=["status", "start_at", "end_at"])

        response = self.client.get(
            reverse("wellness-experience-detail", args=[self.experience.slug])
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_available"])
        self.assertEqual(response.data["virtual_link"], "")

    def test_published_cold_exposure_experience_requires_safety_guidance(self):
        experience = self.make_experience(
            title="Cold plunge",
            slug="cold-plunge",
            status=WellnessExperience.Status.DRAFT,
        )
        experience.status = WellnessExperience.Status.PUBLISHED

        with self.assertRaises(ValidationError):
            experience.full_clean()

        experience.safety_information = "Participation is optional; stop if unwell."
        experience.full_clean()

    def test_free_booking_confirms_and_uses_server_price(self):
        self.auth_as()
        response = self.client.post(
            reverse("wellness-bookings"),
            {
                "experience_id": self.experience.id,
                "participant_count": 2,
                "amount": "99999.00",
                "payment_status": "paid",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["booking"]["status"], "confirmed")
        self.assertEqual(response.data["booking"]["payment_status"], "not_required")
        self.assertEqual(response.data["booking"]["amount"], "0.00")
        self.assertIsNone(response.data["checkout"])

    def test_duplicate_active_booking_is_rejected(self):
        self.auth_as()
        url = reverse("wellness-bookings")
        payload = {"experience_id": self.experience.id}

        first = self.client.post(url, payload, format="json")
        second = self.client.post(url, payload, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 409)
        self.assertEqual(WellnessBooking.objects.count(), 1)

    def test_capacity_is_checked_before_confirming(self):
        self.experience.capacity = 1
        self.experience.save(update_fields=["capacity"])
        self.auth_as()
        response = self.client.post(
            reverse("wellness-bookings"),
            {"experience_id": self.experience.id, "participant_count": 2},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(WellnessBooking.objects.count(), 0)

    @override_settings(RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_paid_booking_requires_payment_configuration(self):
        self.experience.price = Decimal("1250.00")
        self.experience.save(update_fields=["price"])
        self.auth_as()

        response = self.client.post(
            reverse("wellness-bookings"),
            {"experience_id": self.experience.id},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "payment_configuration_required")
        self.assertEqual(WellnessBooking.objects.count(), 0)

    @override_settings(
        RAZORPAY_KEY_ID="rzp_test_public",
        RAZORPAY_KEY_SECRET="rzp_test_secret",
    )
    @patch(
        "wellness.views.public_key_id",
        return_value="rzp_test_public",
    )
    @patch(
        "wellness.views.create_order",
        return_value={
            "id": "order_test_created",
            "amount": 125000,
            "currency": "INR",
        },
    )
    def test_paid_booking_creates_provider_order_using_server_price(
        self,
        create_order_mock,
        public_key_mock,
    ):
        self.experience.price = Decimal("1250.00")
        self.experience.save(update_fields=["price"])
        self.auth_as()

        response = self.client.post(
            reverse("wellness-bookings"),
            {
                "experience_id": self.experience.id,
                "participant_count": 1,
                "amount": "1.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["booking"]["amount"], "1250.00")
        self.assertEqual(response.data["checkout"]["amount"], 125000)
        self.assertEqual(response.data["checkout"]["key_id"], "rzp_test_public")
        self.assertEqual(
            PaymentTransaction.objects.get().amount,
            Decimal("1250.00"),
        )
        create_order_mock.assert_called_once()
        public_key_mock.assert_called_once()

    @override_settings(
        RAZORPAY_KEY_SECRET="rzp_test_secret",
        RAZORPAY_KEY_ID="rzp_test_public",
    )
    @patch(
        "wellness.views.fetch_payment",
        return_value={
            "id": "pay_verified_123",
            "order_id": "order_verified_123",
            "amount": 25000,
            "currency": "INR",
            "status": "captured",
        },
    )
    def test_checkout_callback_is_verified_with_provider_before_confirmation(
        self,
        fetch_payment_mock,
    ):
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("250.00"),
            currency="INR",
            status=WellnessBooking.Status.PENDING_PAYMENT,
            payment_status=WellnessBooking.PaymentStatus.PENDING,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        PaymentTransaction.objects.create(
            booking=booking,
            order_id="order_verified_123",
            amount=Decimal("250.00"),
            currency="INR",
        )
        self.auth_as()
        signature = hmac.new(
            b"rzp_test_secret",
            b"order_verified_123|pay_verified_123",
            hashlib.sha256,
        ).hexdigest()

        response = self.client.post(
            reverse("wellness-payment-verify", args=[booking.id]),
            {
                "razorpay_order_id": "order_verified_123",
                "razorpay_payment_id": "pay_verified_123",
                "razorpay_signature": signature,
            },
            format="json",
        )

        booking.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(booking.status, WellnessBooking.Status.CONFIRMED)
        self.assertEqual(booking.payment_status, WellnessBooking.PaymentStatus.PAID)
        fetch_payment_mock.assert_called_once_with("pay_verified_123")

    def test_booking_details_are_only_visible_to_the_booking_owner(self):
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("0.00"),
            currency="INR",
            status=WellnessBooking.Status.CONFIRMED,
            payment_status=WellnessBooking.PaymentStatus.NOT_REQUIRED,
        )
        self.auth_as(self.other_user)

        response = self.client.get(
            reverse("wellness-booking-detail", args=[booking.id])
        )

        self.assertEqual(response.status_code, 404)

    def test_virtual_access_is_returned_to_confirmed_booking_owner(self):
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("0.00"),
            currency="INR",
            status=WellnessBooking.Status.CONFIRMED,
            payment_status=WellnessBooking.PaymentStatus.NOT_REQUIRED,
        )
        self.auth_as()

        response = self.client.get(
            reverse("wellness-booking-detail", args=[booking.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["experience"]["virtual_link"],
            self.experience.virtual_link,
        )

    def test_resource_list_only_shows_published_free_resources(self):
        WellnessResource.objects.create(
            title="A grounding pause",
            slug="grounding-pause",
            description="A short grounding practice.",
            instructions="Notice a few things around you.",
            kind=WellnessResource.Kind.GROUNDING,
            duration_minutes=3,
            is_published=True,
            is_free=True,
        )
        WellnessResource.objects.create(
            title="Draft practice",
            slug="draft-practice",
            description="Not public yet.",
            instructions="Not public yet.",
            kind=WellnessResource.Kind.MEDITATION,
            duration_minutes=5,
            is_published=False,
            is_free=True,
        )
        response = self.client.get(reverse("wellness-resources"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [resource["slug"] for resource in response.data["results"]],
            ["grounding-pause"],
        )

    def test_resource_fixture_command_is_explicit_and_idempotent(self):
        call_command("seed_wellness_resources", publish=True, stdout=StringIO())
        call_command("seed_wellness_resources", publish=True, stdout=StringIO())

        resources = WellnessResource.objects.filter(is_published=True)
        self.assertEqual(resources.count(), 4)
        self.assertTrue(all(resource.is_free for resource in resources))

    @override_settings(FERNET_KEY=Fernet.generate_key().decode("ascii"))
    def test_completed_experience_reflection_is_encrypted_and_creates_mood_checkin(self):
        self.experience.status = WellnessExperience.Status.COMPLETED
        self.experience.save(update_fields=["status"])
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("0.00"),
            currency="INR",
            status=WellnessBooking.Status.CONFIRMED,
            payment_status=WellnessBooking.PaymentStatus.NOT_REQUIRED,
        )
        self.auth_as()

        response = self.client.post(
            reverse("wellness-reflections"),
            {
                "booking_id": str(booking.id),
                "mood": "good",
                "reflection_text": "The quiet moment helped me reset.",
            },
            format="json",
        )

        reflection = PostRetreatReflection.objects.get(booking=booking)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(reflection.mood_checkin.user, self.user)
        self.assertEqual(
            reflection.get_reflection_text(),
            "The quiet moment helped me reset.",
        )
        self.assertNotIn(
            b"The quiet moment helped me reset.",
            bytes(reflection.encrypted_text),
        )

    @override_settings(RAZORPAY_WEBHOOK_SECRET="wellness-test-secret")
    def test_signed_payment_webhook_confirms_booking_and_is_idempotent(self):
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("250.00"),
            currency="INR",
            status=WellnessBooking.Status.PENDING_PAYMENT,
            payment_status=WellnessBooking.PaymentStatus.PENDING,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        payment = PaymentTransaction.objects.create(
            booking=booking,
            order_id="order_test_123",
            amount=Decimal("250.00"),
            currency="INR",
        )
        body = json.dumps(
            {
                "event": "payment.captured",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": "pay_test_123",
                            "order_id": payment.order_id,
                            "amount": 25000,
                            "currency": "INR",
                        }
                    }
                },
            }
        )
        signature = hmac.new(
            b"wellness-test-secret",
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        first = self.client.generic(
            "POST",
            reverse("razorpay-webhook"),
            body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )
        second = self.client.generic(
            "POST",
            reverse("razorpay-webhook"),
            body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )

        booking.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(booking.status, WellnessBooking.Status.CONFIRMED)
        self.assertEqual(payment.status, PaymentTransaction.Status.CAPTURED)

    @override_settings(RAZORPAY_WEBHOOK_SECRET="wellness-test-secret")
    @patch("wellness.views.create_refund", return_value={"id": "rf_test_123", "status": "processed"})
    def test_late_captured_payment_is_not_confirmed_and_refund_is_requested(
        self,
        create_refund_mock,
    ):
        booking = WellnessBooking.objects.create(
            experience=self.experience,
            user=self.user,
            amount=Decimal("250.00"),
            currency="INR",
            status=WellnessBooking.Status.PENDING_PAYMENT,
            payment_status=WellnessBooking.PaymentStatus.PENDING,
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        payment = PaymentTransaction.objects.create(
            booking=booking,
            order_id="order_late_123",
            amount=Decimal("250.00"),
            currency="INR",
        )
        body = json.dumps(
            {
                "event": "payment.captured",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": "pay_late_123",
                            "order_id": payment.order_id,
                            "amount": 25000,
                            "currency": "INR",
                        }
                    }
                },
            }
        )
        signature = hmac.new(
            b"wellness-test-secret",
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        response = self.client.generic(
            "POST",
            reverse("razorpay-webhook"),
            body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )

        booking.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(booking.status, WellnessBooking.Status.EXPIRED)
        self.assertEqual(booking.payment_status, WellnessBooking.PaymentStatus.REFUNDED)
        self.assertEqual(payment.status, PaymentTransaction.Status.REFUNDED)
        create_refund_mock.assert_called_once_with(
            "pay_late_123",
            Decimal("250.00"),
            booking.booking_reference,
        )

    def test_invalid_webhook_signature_is_rejected(self):
        response = self.client.generic(
            "POST",
            reverse("razorpay-webhook"),
            json.dumps({"event": "payment.captured"}),
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE="invalid",
        )

        self.assertEqual(response.status_code, 400)
