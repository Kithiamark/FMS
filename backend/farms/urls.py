from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, WorkerTaskViewSet

router = DefaultRouter()
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r"tasks", WorkerTaskViewSet, basename="task")

urlpatterns = [
    path('', include(router.urls)),
]
