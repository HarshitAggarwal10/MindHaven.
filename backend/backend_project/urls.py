from django.contrib import admin
from django.urls import path, include
from api.views import DiaryView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/diary/', DiaryView.as_view(), name='diary'),
]
