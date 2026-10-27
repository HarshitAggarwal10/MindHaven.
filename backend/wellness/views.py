import hashlib
import hmac
import json
from datetime import timedelta
from decimal import Decimal
import uuid

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from mood.models import MoodCheckIn

from .models import (
    PaymentTransaction,
    PostRetreatReflection,
    WellnessBooking,
    WellnessCategory,
    WellnessExperience,
    WellnessProvider,
    WellnessResource,
    RetreatReview,
)
from .permissions import IsWellnessProviderOrStaff
from .razorpay import (
    RazorpayConfigurationError,
    RazorpayRequestError,
    create_order,
    create_refund,
    fetch_payment,
    public_key_id,
)
from .serializers import (
    CreateBookingSerializer,
    OrganizerExperienceSerializer,
    PostRetreatReflectionSerializer,
    RetreatReviewSerializer,
    WellnessBookingSerializer,
    WellnessCategorySerializer,
    WellnessExperienceSerializer,
    WellnessResourceSerializer,
)


class WellnessPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 48


def _experience_queryset(request=None):
    now = timezone.now()
    queryset = WellnessExperience.objects.filter(
        status=WellnessExperience.Status.PUBLISHED,
        provider__is_verified=True,
        category__is_active=True,
    ).select_related("category", "provider")
    queryset = queryset.annotate(
        reserved_capacity=Coalesce(
            Sum(
                "bookings__participant_count",
                filter=(
                    Q(bookings__status=WellnessBooking.Status.CONFIRMED)
                    | Q(
                        bookings__status=WellnessBooking.Status.PENDING_PAYMENT,
                        bookings__expires_at__gt=now,
                    )
                ),
            ),
            Value(0),
        )
    )
    return queryset


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WellnessCategorySerializer

    def get_queryset(self):
        return WellnessCategory.objects.filter(is_active=True)


class ExperienceListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WellnessExperienceSerializer
    pagination_class = WellnessPagination

    def get_queryset(self):
        queryset = _experience_queryset(self.request).filter(
            start_at__gt=timezone.now()
        )
        params = self.request.query_params
        search = params.get("search", "").strip()
        category = params.get("category", "").strip()
        format_value = params.get("experience_format", "").strip()
        location = params.get("location", "").strip()
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        free = params.get("free")
        available = params.get("available")
        sort = params.get("sort", "upcoming")

        if len(search) > 120:
            raise serializers.ValidationError(
                {"search": "Search text must be 120 characters or fewer."}
            )
        if format_value and format_value not in WellnessExperience.Format.values:
            raise serializers.ValidationError({"format": "Choose a valid format."})
        if free not in (None, "", "true", "false"):
            raise serializers.ValidationError({"free": "Choose true or false."})
        if available not in (None, "", "true", "false"):
            raise serializers.ValidationError({"available": "Choose true or false."})
        if sort not in ("upcoming", "price_low", "featured"):
            raise serializers.ValidationError({"sort": "Choose a valid sort order."})

        try:
            if start_date:
                start_date = serializers.DateField().run_validation(start_date)
            if end_date:
                end_date = serializers.DateField().run_validation(end_date)
            if min_price:
                min_price = serializers.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    min_value=Decimal("0.00"),
                ).run_validation(min_price)
            if max_price:
                max_price = serializers.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    min_value=Decimal("0.00"),
                ).run_validation(max_price)
        except serializers.ValidationError as error:
            raise serializers.ValidationError(
                {"filters": error.detail}
            ) from error
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must not be earlier than start date."}
            )
        if min_price is not None and max_price is not None and max_price < min_price:
            raise serializers.ValidationError(
                {"max_price": "Maximum price must not be lower than minimum price."}
            )

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(provider__display_name__icontains=search)
                | Q(location__icontains=search)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if format_value in WellnessExperience.Format.values:
            queryset = queryset.filter(format=format_value)
        if location:
            queryset = queryset.filter(location__icontains=location)
        if start_date:
            queryset = queryset.filter(start_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_at__date__lte=end_date)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if free == "true":
            queryset = queryset.filter(price=Decimal("0.00"))
        elif free == "false":
            queryset = queryset.filter(price__gt=Decimal("0.00"))
        if available == "true":
            queryset = queryset.filter(reserved_capacity__lt=F("capacity"))
        elif available == "false":
            queryset = queryset.filter(reserved_capacity__gte=F("capacity"))
        if sort == "price_low":
            return queryset.order_by("price", "start_at")
        if sort == "featured":
            return queryset.order_by("-is_featured", "start_at")
        return queryset.order_by("start_at")


class ExperienceDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WellnessExperienceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return WellnessExperience.objects.filter(
            status__in=[
                WellnessExperience.Status.PUBLISHED,
                WellnessExperience.Status.COMPLETED,
            ],
            provider__is_verified=True,
            category__is_active=True,
        ).select_related("category", "provider")


class ResourceListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WellnessResourceSerializer
    pagination_class = WellnessPagination

    def get_queryset(self):
        queryset = WellnessResource.objects.filter(
            is_published=True,
            is_free=True,
        ).select_related("category")
        search = self.request.query_params.get("search", "").strip()
        kind = self.request.query_params.get("kind", "").strip()
        category = self.request.query_params.get("category", "").strip()
        max_duration = self.request.query_params.get("max_duration")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(instructions__icontains=search)
            )
        if kind in WellnessResource.Kind.values:
            if kind not in WellnessResource.Kind.values:
                raise serializers.ValidationError({"kind": "Choose a valid resource type."})
            queryset = queryset.filter(kind=kind)
        if category:
            queryset = queryset.filter(category__slug=category)
        if max_duration:
            try:
                max_duration = serializers.IntegerField(
                    min_value=1,
                    max_value=180,
                ).run_validation(max_duration)
            except serializers.ValidationError as error:
                raise serializers.ValidationError(
                    {"max_duration": error.detail}
                ) from error
            queryset = queryset.filter(duration_minutes__lte=max_duration)
        return queryset


class ResourceDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WellnessResourceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return WellnessResource.objects.filter(
            is_published=True,
            is_free=True,
        ).select_related("category")


class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WellnessBookingSerializer
    pagination_class = WellnessPagination
    throttle_classes = [ScopedRateThrottle]

    @property
    def throttle_scope(self):
        return (
            "wellness_booking_read"
            if self.request.method == "GET"
            else "wellness_booking"
        )

    def get_queryset(self):
        queryset = WellnessBooking.objects.filter(
            user=self.request.user
        ).select_related("experience__category", "experience__provider")
        if self.request.query_params.get("upcoming") == "true":
            queryset = queryset.filter(
                experience__start_at__gt=timezone.now(),
                status__in=[
                    WellnessBooking.Status.CONFIRMED,
                    WellnessBooking.Status.PENDING_PAYMENT,
                ],
            )
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        experience = serializer.validated_data["experience"]
        participant_count = serializer.validated_data["participant_count"]
        idempotency_key = serializer.validated_data.get("idempotency_key")
        if idempotency_key:
            existing = WellnessBooking.objects.filter(
                user=request.user,
                idempotency_key=idempotency_key,
            ).first()
            if existing:
                return Response(
                    self._response_for_booking(existing),
                    status=status.HTTP_200_OK,
                )

        now = timezone.now()
        try:
            with transaction.atomic():
                experience = WellnessExperience.objects.select_for_update().get(
                    pk=experience.pk,
                    status=WellnessExperience.Status.PUBLISHED,
                    provider__is_verified=True,
                )
                WellnessBooking.objects.filter(
                    experience=experience,
                    status=WellnessBooking.Status.PENDING_PAYMENT,
                    expires_at__lte=now,
                ).update(status=WellnessBooking.Status.EXPIRED)
                if experience.price == 0 and WellnessBooking.objects.filter(
                    user=request.user,
                    experience=experience,
                    amount=0,
                ).exists():
                    return Response(
                        {
                            "code": "free_experience_already_used",
                            "detail": "This free experience can only be booked once per account.",
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                already_booked = WellnessBooking.objects.filter(
                    user=request.user,
                    experience=experience,
                    status__in=[
                        WellnessBooking.Status.PENDING_PAYMENT,
                        WellnessBooking.Status.CONFIRMED,
                    ],
                ).exists()
                if already_booked:
                    return Response(
                        {"detail": "You already have an active booking for this experience."},
                        status=status.HTTP_409_CONFLICT,
                    )
                reserved = WellnessBooking.objects.filter(
                    experience=experience,
                ).filter(
                    Q(status=WellnessBooking.Status.CONFIRMED)
                    | Q(
                        status=WellnessBooking.Status.PENDING_PAYMENT,
                        expires_at__gt=now,
                    )
                ).aggregate(total=Sum("participant_count"))["total"] or 0
                if experience.status != WellnessExperience.Status.PUBLISHED:
                    raise serializers.ValidationError(
                        {"experience_id": "This experience is not open for booking."}
                    )
                if experience.start_at <= now:
                    raise serializers.ValidationError(
                        {"experience_id": "This experience has already started."}
                    )
                if (
                    experience.registration_opens_at
                    and experience.registration_opens_at > now
                ):
                    raise serializers.ValidationError(
                        {"experience_id": "Registration has not opened yet."}
                    )
                if (
                    experience.registration_closes_at
                    and experience.registration_closes_at <= now
                ):
                    raise serializers.ValidationError(
                        {"experience_id": "Registration is closed."}
                    )
                if reserved + participant_count > experience.capacity:
                    raise serializers.ValidationError(
                        {"participant_count": "There are not enough places remaining."}
                    )
                if experience.currency != "INR":
                    raise serializers.ValidationError(
                        {"experience_id": "This payment currency is not configured."}
                    )
                amount = experience.price * participant_count
                if amount > 0 and amount < 1:
                    raise serializers.ValidationError(
                        {"experience_id": "Paid experiences must cost at least INR 1.00."}
                    )
                if amount > 0 and not (
                    getattr(settings, "RAZORPAY_KEY_ID", "")
                    and getattr(settings, "RAZORPAY_KEY_SECRET", "")
                ):
                    return Response(
                        {
                            "code": "payment_configuration_required",
                            "detail": (
                                "Paid booking is not available yet. Razorpay server "
                                "credentials must be configured."
                            ),
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
                booking = WellnessBooking.objects.create(
                    experience=experience,
                    user=request.user,
                    participant_count=participant_count,
                    status=(
                        WellnessBooking.Status.CONFIRMED
                        if amount == 0
                        else WellnessBooking.Status.PENDING_PAYMENT
                    ),
                    payment_status=(
                        WellnessBooking.PaymentStatus.NOT_REQUIRED
                        if amount == 0
                        else WellnessBooking.PaymentStatus.PENDING
                    ),
                    amount=amount,
                    currency=experience.currency,
                    expires_at=now + timedelta(minutes=15) if amount > 0 else None,
                    idempotency_key=idempotency_key or uuid.uuid4(),
                )
                payment = None
                if amount > 0:
                    payment = PaymentTransaction.objects.create(
                        booking=booking,
                        amount=amount,
                        currency=experience.currency,
                    )
        except WellnessExperience.DoesNotExist as error:
            raise NotFound("This experience is no longer available.") from error
        except IntegrityError:
            if experience.price == 0 and WellnessBooking.objects.filter(
                user=request.user,
                experience=experience,
                amount=0,
            ).exists():
                return Response(
                    {
                        "code": "free_experience_already_used",
                        "detail": "This free experience can only be booked once per account.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            return Response(
                {"detail": "A booking for this experience already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        if payment:
            try:
                order = create_order(booking)
                payment.order_id = order["id"]
                payment.save(update_fields=["order_id", "updated_at"])
                checkout = {
                    "key_id": public_key_id(),
                    "order_id": order["id"],
                    "amount": order["amount"],
                    "currency": order["currency"],
                    "booking_reference": booking.booking_reference,
                }
            except (RazorpayConfigurationError, RazorpayRequestError, KeyError) as error:
                booking.status = WellnessBooking.Status.FAILED
                booking.payment_status = WellnessBooking.PaymentStatus.FAILED
                booking.save(update_fields=["status", "payment_status", "updated_at"])
                return Response(
                    {"detail": str(error)},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
        else:
            checkout = None

        return Response(
            {
                "booking": self._booking_response(booking),
                "checkout": checkout,
            },
            status=status.HTTP_201_CREATED,
        )

    def _booking_response(self, booking):
        return WellnessBookingSerializer(
            booking,
            context={"request": self.request},
        ).data

    def _response_for_booking(self, booking):
        response = {"booking": self._booking_response(booking), "checkout": None}
        payment = booking.payment_transactions.filter(
            status=PaymentTransaction.Status.CREATED,
            order_id__isnull=False,
        ).first()
        if payment and booking.status == WellnessBooking.Status.PENDING_PAYMENT:
            try:
                response["checkout"] = {
                    "key_id": public_key_id(),
                    "order_id": payment.order_id,
                    "amount": int(payment.amount * 100),
                    "currency": payment.currency,
                    "booking_reference": booking.booking_reference,
                }
            except RazorpayConfigurationError:
                response["checkout"] = None
        return response


class BookingDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WellnessBookingSerializer
    lookup_url_kwarg = "booking_id"

    def get_queryset(self):
        return WellnessBooking.objects.filter(user=self.request.user).select_related(
            "experience__category",
            "experience__provider",
        )


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "wellness_cancellation"

    def post(self, request, booking_id):
        with transaction.atomic():
            booking = get_object_or_404(
                WellnessBooking.objects.select_for_update().select_related(
                    "experience",
                    "user",
                ),
                id=booking_id,
                user=request.user,
            )
            if booking.status not in [
                WellnessBooking.Status.CONFIRMED,
                WellnessBooking.Status.PENDING_PAYMENT,
            ]:
                return Response(
                    {"detail": "This booking can no longer be cancelled."},
                    status=status.HTTP_409_CONFLICT,
                )
            paid_transaction = booking.payment_transactions.filter(
                status=PaymentTransaction.Status.CAPTURED
            ).first()
            if paid_transaction:
                refund_deadline = booking.experience.start_at - timedelta(
                    hours=booking.experience.refund_before_hours
                )
                if timezone.now() > refund_deadline:
                    return Response(
                        {
                            "detail": (
                                "The refund window for this booking has closed. "
                                "Contact the provider using their published contact details."
                            )
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                try:
                    refund = create_refund(
                        paid_transaction.payment_id,
                        paid_transaction.amount,
                        booking.booking_reference,
                    )
                except (RazorpayConfigurationError, RazorpayRequestError) as error:
                    return Response(
                        {"detail": str(error)},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
                paid_transaction.refund_id = refund.get("id", "")
                refund_statuses = {
                    "processed": (
                        PaymentTransaction.Status.REFUNDED,
                        WellnessBooking.PaymentStatus.REFUNDED,
                    ),
                    "failed": (
                        PaymentTransaction.Status.REFUND_FAILED,
                        WellnessBooking.PaymentStatus.REFUND_FAILED,
                    ),
                }
                transaction_status, booking_payment_status = refund_statuses.get(
                    refund.get("status"),
                    (
                        PaymentTransaction.Status.REFUND_PENDING,
                        WellnessBooking.PaymentStatus.REFUND_PENDING,
                    ),
                )
                paid_transaction.status = transaction_status
                paid_transaction.save(
                    update_fields=["refund_id", "status", "updated_at"]
                )
                booking.payment_status = booking_payment_status
            else:
                booking.payment_status = (
                    WellnessBooking.PaymentStatus.FAILED
                    if booking.status == WellnessBooking.Status.PENDING_PAYMENT
                    else booking.payment_status
                )
            booking.status = WellnessBooking.Status.CANCELLED
            booking.cancelled_at = timezone.now()
            booking.cancellation_reason = str(request.data.get("reason", ""))[:300]
            booking.save(
                update_fields=[
                    "status",
                    "payment_status",
                    "cancelled_at",
                    "cancellation_reason",
                    "updated_at",
                ]
            )
        return Response(
            WellnessBookingSerializer(
                booking,
                context={"request": request},
            ).data
        )


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "wellness_payment_verification"

    def post(self, request, booking_id):
        booking = get_object_or_404(
            WellnessBooking.objects.filter(user=request.user),
            id=booking_id,
            status=WellnessBooking.Status.PENDING_PAYMENT,
        )
        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")
        payment = booking.payment_transactions.filter(order_id=order_id).first()
        if not payment or not payment_id or not signature:
            return Response(
                {"detail": "Payment details are incomplete or do not match this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
        expected = hmac.new(
            secret.encode("utf-8"),
            f"{order_id}|{payment_id}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not secret or not hmac.compare_digest(expected, signature):
            return Response(
                {"detail": "Payment signature could not be verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            provider_payment = fetch_payment(payment_id)
        except (RazorpayConfigurationError, RazorpayRequestError) as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if (
            provider_payment.get("order_id") != order_id
            or provider_payment.get("status") != "captured"
            or provider_payment.get("amount") != int(payment.amount * 100)
            or provider_payment.get("currency") != payment.currency
        ):
            return Response(
                {"detail": "The payment provider has not confirmed this payment."},
                status=status.HTTP_409_CONFLICT,
            )
        _mark_payment_captured(payment, payment_id)
        booking.refresh_from_db()
        if booking.status != WellnessBooking.Status.CONFIRMED:
            return Response(
                {
                    "detail": (
                        "Payment arrived after this reservation expired. "
                        "A refund has been requested; check your bookings for its status."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            WellnessBookingSerializer(
                booking,
                context={"request": request},
            ).data
        )


def _mark_payment_captured(payment, payment_id):
    with transaction.atomic():
        payment = PaymentTransaction.objects.select_for_update().get(pk=payment.pk)
        if payment.status in (
            PaymentTransaction.Status.CAPTURED,
            PaymentTransaction.Status.REFUNDED,
            PaymentTransaction.Status.REFUND_FAILED,
        ) or (
            payment.status == PaymentTransaction.Status.REFUND_PENDING
            and payment.refund_id
        ):
            return
        booking = WellnessBooking.objects.select_for_update().get(pk=payment.booking_id)
        if (
            booking.status == WellnessBooking.Status.PENDING_PAYMENT
            and booking.expires_at
            and booking.expires_at > timezone.now()
        ):
            payment.payment_id = payment_id
            payment.status = PaymentTransaction.Status.CAPTURED
            payment.save(update_fields=["payment_id", "status", "updated_at"])
            booking.status = WellnessBooking.Status.CONFIRMED
            booking.payment_status = WellnessBooking.PaymentStatus.PAID
            booking.expires_at = None
            booking.save(
                update_fields=[
                    "status",
                    "payment_status",
                    "expires_at",
                    "updated_at",
                ]
            )
            return
        if booking.status == WellnessBooking.Status.PENDING_PAYMENT:
            booking.status = WellnessBooking.Status.EXPIRED
        booking.payment_status = WellnessBooking.PaymentStatus.REFUND_PENDING
        payment.payment_id = payment_id
        payment.status = PaymentTransaction.Status.REFUND_PENDING
        payment.save(update_fields=["payment_id", "status", "updated_at"])
        booking.save(
            update_fields=[
                "status",
                "payment_status",
                "updated_at",
            ]
        )
    try:
        refund = create_refund(
            payment.payment_id,
            payment.amount,
            payment.booking.booking_reference,
        )
    except (RazorpayConfigurationError, RazorpayRequestError):
        raise
    refund_statuses = {
        "processed": (
            PaymentTransaction.Status.REFUNDED,
            WellnessBooking.PaymentStatus.REFUNDED,
        ),
        "failed": (
            PaymentTransaction.Status.REFUND_FAILED,
            WellnessBooking.PaymentStatus.REFUND_FAILED,
        ),
    }
    transaction_status, booking_payment_status = refund_statuses.get(
        refund.get("status"),
        (
            PaymentTransaction.Status.REFUND_PENDING,
            WellnessBooking.PaymentStatus.REFUND_PENDING,
        ),
    )
    PaymentTransaction.objects.filter(pk=payment.pk).update(
        refund_id=refund.get("id", ""),
        status=transaction_status,
        updated_at=timezone.now(),
    )
    WellnessBooking.objects.filter(pk=payment.booking_id).update(
        payment_status=booking_payment_status,
        updated_at=timezone.now(),
    )


class ReflectionListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PostRetreatReflectionSerializer

    def get_queryset(self):
        return PostRetreatReflection.objects.filter(
            user=self.request.user
        ).select_related("booking__experience")

    def create(self, request, *args, **kwargs):
        booking_id = request.data.get("booking_id")
        booking = get_object_or_404(
            WellnessBooking.objects.select_related("experience"),
            id=booking_id,
            user=request.user,
            status=WellnessBooking.Status.CONFIRMED,
            experience__status=WellnessExperience.Status.COMPLETED,
        )
        if PostRetreatReflection.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "A reflection has already been saved for this experience."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reflection_text = serializer.validated_data.pop("reflection_text", "")
        reflection = PostRetreatReflection(
            booking=booking,
            user=request.user,
            **serializer.validated_data,
        )
        try:
            reflection.set_reflection_text(reflection_text)
        except (AttributeError, TypeError, ValueError) as error:
            raise APIException(
                "Private reflections require the diary encryption key to be configured."
            ) from error
        mood_checkin = MoodCheckIn.objects.create(
            user=request.user,
            mood=reflection.mood,
        )
        reflection.mood_checkin = mood_checkin
        reflection.save()
        return Response(
            self.get_serializer(reflection).data,
            status=status.HTTP_201_CREATED,
        )


class ExperienceReviewListCreateView(APIView):
    throttle_classes = [ScopedRateThrottle]

    @property
    def throttle_scope(self):
        return "wellness_review" if self.request.method == "POST" else None

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_experience(self, slug):
        return get_object_or_404(
            WellnessExperience.objects.select_related("provider", "category"),
            slug=slug,
            provider__is_verified=True,
        )

    def get(self, request, slug):
        experience = self.get_experience(slug)
        reviews = RetreatReview.objects.filter(
            experience=experience,
        ).select_related("user")
        serializer = RetreatReviewSerializer(
            reviews,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request, slug):
        experience = self.get_experience(slug)
        booking_id = request.data.get("booking_id")
        booking = get_object_or_404(
            WellnessBooking.objects.select_related("experience"),
            id=booking_id,
            user=request.user,
            experience=experience,
            status=WellnessBooking.Status.CONFIRMED,
        )
        if (
            experience.status != WellnessExperience.Status.COMPLETED
            and experience.end_at > timezone.now()
        ):
            return Response(
                {"detail": "Reviews are available after the experience has ended."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if RetreatReview.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "You have already reviewed this retreat."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = RetreatReviewSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save(
            user=request.user,
            experience=experience,
            booking=booking,
        )
        return Response(
            RetreatReviewSerializer(
                review,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class RetreatReviewDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, review_id):
        review = get_object_or_404(
            RetreatReview,
            id=review_id,
            user=request.user,
        )
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganizerExperienceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsWellnessProviderOrStaff]
    serializer_class = OrganizerExperienceSerializer

    def get_queryset(self):
        queryset = WellnessExperience.objects.select_related("provider", "category")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(provider__user=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            provider_id = self.request.data.get("provider")
            provider = get_object_or_404(WellnessProvider, id=provider_id)
        else:
            provider = self.request.user.wellness_provider
        serializer.save(provider=provider, status=WellnessExperience.Status.DRAFT)


class OrganizerExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsWellnessProviderOrStaff]
    serializer_class = OrganizerExperienceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        queryset = WellnessExperience.objects.select_related("provider", "category")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(provider__user=self.request.user)


class OrganizerBookingListView(generics.ListAPIView):
    permission_classes = [IsWellnessProviderOrStaff]
    serializer_class = WellnessBookingSerializer
    pagination_class = WellnessPagination

    def get_queryset(self):
        queryset = WellnessBooking.objects.select_related(
            "experience__category",
            "experience__provider",
        )
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(experience__provider__user=self.request.user)


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not webhook_secret or not signature:
        return HttpResponse(status=400)
    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        request.body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return HttpResponse(status=400)
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponse(status=400)
    event = payload.get("event")
    payment_entity = (
        payload.get("payload", {})
        .get("payment", {})
        .get("entity", {})
    )
    order_id = payment_entity.get("order_id")
    payment_id = payment_entity.get("id")
    if event == "payment.captured" and order_id and payment_id:
        payment = PaymentTransaction.objects.filter(order_id=order_id).first()
        if (
            payment
            and payment.order_id == order_id
            and payment.currency == payment_entity.get("currency")
            and payment.amount * 100 == Decimal(
                str(payment_entity.get("amount", 0))
            )
        ):
            _mark_payment_captured(payment, payment_id)
        else:
            return HttpResponse(status=400)
    elif event in ("refund.processed", "refund.failed"):
        refund_entity = (
            payload.get("payload", {})
            .get("refund", {})
            .get("entity", {})
        )
        payment = PaymentTransaction.objects.filter(
            payment_id=refund_entity.get("payment_id")
        ).first()
        if payment and (
            not payment.refund_id
            or payment.refund_id == refund_entity.get("id")
        ):
            processed = event == "refund.processed"
            payment.status = (
                PaymentTransaction.Status.REFUNDED
                if processed
                else PaymentTransaction.Status.REFUND_FAILED
            )
            payment.refund_id = refund_entity.get("id", payment.refund_id)
            payment.save(update_fields=["status", "refund_id", "updated_at"])
            WellnessBooking.objects.filter(pk=payment.booking_id).update(
                payment_status=(
                    WellnessBooking.PaymentStatus.REFUNDED
                    if processed
                    else WellnessBooking.PaymentStatus.REFUND_FAILED
                ),
                updated_at=timezone.now(),
            )
    elif event == "payment.failed" and order_id:
        with transaction.atomic():
            payment = PaymentTransaction.objects.select_for_update().filter(
                order_id=order_id,
            ).first()
            if payment and payment.status == PaymentTransaction.Status.CREATED:
                payment.status = PaymentTransaction.Status.FAILED
                payment.save(update_fields=["status", "updated_at"])
                WellnessBooking.objects.filter(
                    pk=payment.booking_id,
                    status=WellnessBooking.Status.PENDING_PAYMENT,
                ).update(
                    status=WellnessBooking.Status.FAILED,
                    payment_status=WellnessBooking.PaymentStatus.FAILED,
                )
    return HttpResponse(status=200)
