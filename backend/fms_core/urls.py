from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # All product APIs live under /api/v1. Keep app-specific urls isolated so frontend
    # hooks can map cleanly to Django apps when debugging request failures.
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('farms.urls')),
    path('api/v1/', include('animals.urls')),
    path('api/v1/', include('dairy.urls')),
    path('api/v1/', include('finance.urls')),
    path('api/v1/', include('alerts.urls')),
    path('api/v1/', include('community.urls')),
    path('api/v1/', include('vets.urls')),
    path('api/v1/chat/', include('chat_module.urls')),
    path('api/v1/admin/', include('admin_panel.urls')), # Admin API
    path('api/v1/aggregators/', include('aggregators.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
