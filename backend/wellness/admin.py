from django.contrib import admin

from .models import (
    PaymentTransaction,
    PostRetreatReflection,
    RetreatReview,
    WellnessBooking,
    WellnessCategory,
    WellnessExperience,
    WellnessProvider,
    WellnessResource,
)


@admin.register(WellnessCategory)
class WellnessCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(WellnessProvider)
class WellnessProviderAdmin(admin.ModelAdmin):
    list_display = ("display_name", "user", "is_verified", "created_at")
    list_filter = ("is_verified",)
    search_fields = ("display_name", "user__email")


@admin.register(WellnessExperience)
class WellnessExperienceAdmin(admin.ModelAdmin):
    list_display = ("title", "provider", "start_at", "status", "is_featured")
    list_filter = ("status", "format", "category", "is_featured")
    search_fields = ("title", "description", "provider__display_name")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(WellnessBooking)
class WellnessBookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_reference",
        "experience",
        "user",
        "status",
        "payment_status",
        "created_at",
    )
    list_filter = ("status", "payment_status")
    search_fields = ("booking_reference", "user__email", "experience__title")
    readonly_fields = ("booking_reference", "amount", "currency", "idempotency_key")


admin.site.register(WellnessResource)
admin.site.register(PaymentTransaction)
admin.site.register(PostRetreatReflection)


@admin.register(RetreatReview)
class RetreatReviewAdmin(admin.ModelAdmin):
    list_display = ("experience", "rating", "user", "media_kind", "created_at")
    list_filter = ("rating", "media_kind", "created_at")
    search_fields = ("experience__title", "review", "user__email")
    readonly_fields = ("booking", "user", "experience", "created_at")
