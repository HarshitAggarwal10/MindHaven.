from rest_framework import permissions


class IsAuthenticatedAndMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "community"):
            return obj.community.memberships.filter(user=request.user, is_active=True).exists()
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False


class IsCommunityModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        community = getattr(view, "community", None)
        if community is None and hasattr(view, "get_object"):
            return True
        return community.memberships.filter(user=request.user, is_active=True, is_moderator=True).exists()

    def has_object_permission(self, request, view, obj):
        community = getattr(obj, "community", None)
        if community:
            return community.memberships.filter(user=request.user, is_active=True, is_moderator=True).exists()
        return False
