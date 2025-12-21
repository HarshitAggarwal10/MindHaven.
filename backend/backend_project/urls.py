from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),  # ⭐ NEW user auth routes
    path("api/", include("api.urls")),  
    path("api/auth/", include("accounts.urls")),  # ⭐ NEW auth routes
    path("api/diary/", include("diary.urls")),
]
