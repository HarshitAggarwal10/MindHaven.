from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),  # ⭐ NEW user auth routes
    path("api/", include("api.urls")),  
    path("api/auth/", include("accounts.urls")),  # ⭐ NEW auth routes
<<<<<<< HEAD
=======
    path("api/diary/", include("diary.urls")),
>>>>>>> 30c3065ea6832ff6649924cec74bd1d78f58eff5
]
