from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),  # ⭐ NEW user auth routes
    path("api/", include("api.urls")),
    path("api/auth/", include("accounts.urls")),  # ⭐ NEW auth routes
    path("api/diary/", include("diary.urls")),
    path("api/community/", include("community.urls")),
    path("api/mood/", include("mood.urls")),
    path("api/wellness/", include("wellness.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
