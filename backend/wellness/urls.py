from django.urls import path

from .views import (
    BookingCancelView,
    BookingDetailView,
    BookingListCreateView,
    CategoryListView,
    ExperienceDetailView,
    ExperienceListView,
    ExperienceReviewListCreateView,
    OrganizerBookingListView,
    OrganizerExperienceDetailView,
    OrganizerExperienceListCreateView,
    ReflectionListCreateView,
    ResourceDetailView,
    ResourceListView,
    RetreatReviewDeleteView,
    VerifyPaymentView,
    razorpay_webhook,
)


urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="wellness-categories"),
    path("experiences/", ExperienceListView.as_view(), name="wellness-experiences"),
    path(
        "experiences/<slug:slug>/",
        ExperienceDetailView.as_view(),
        name="wellness-experience-detail",
    ),
    path(
        "experiences/<slug:slug>/reviews/",
        ExperienceReviewListCreateView.as_view(),
        name="wellness-experience-reviews",
    ),
    path(
        "reviews/<int:review_id>/",
        RetreatReviewDeleteView.as_view(),
        name="wellness-review-delete",
    ),
    path("resources/", ResourceListView.as_view(), name="wellness-resources"),
    path(
        "resources/<slug:slug>/",
        ResourceDetailView.as_view(),
        name="wellness-resource-detail",
    ),
    path("bookings/", BookingListCreateView.as_view(), name="wellness-bookings"),
    path(
        "bookings/<uuid:booking_id>/",
        BookingDetailView.as_view(),
        name="wellness-booking-detail",
    ),
    path(
        "bookings/<uuid:booking_id>/cancel/",
        BookingCancelView.as_view(),
        name="wellness-booking-cancel",
    ),
    path(
        "bookings/<uuid:booking_id>/verify-payment/",
        VerifyPaymentView.as_view(),
        name="wellness-payment-verify",
    ),
    path("reflections/", ReflectionListCreateView.as_view(), name="wellness-reflections"),
    path(
        "organizer/experiences/",
        OrganizerExperienceListCreateView.as_view(),
        name="organizer-experiences",
    ),
    path(
        "organizer/experiences/<slug:slug>/",
        OrganizerExperienceDetailView.as_view(),
        name="organizer-experience-detail",
    ),
    path(
        "organizer/bookings/",
        OrganizerBookingListView.as_view(),
        name="organizer-bookings",
    ),
    path("webhooks/razorpay/", razorpay_webhook, name="razorpay-webhook"),
]
