from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsWellnessProviderOrStaff(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or hasattr(user, "wellness_provider")
            )
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.provider.user_id == request.user.id
