from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminStatsView, AdminUserViewSet, AdminVetViewSet, 
    SupportTicketViewSet, SystemLogViewSet
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'vets', AdminVetViewSet, basename='admin-vets')
router.register(r'tickets', SupportTicketViewSet, basename='admin-tickets')
router.register(r'logs', SystemLogViewSet, basename='admin-logs')

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('', include(router.urls)),
]
