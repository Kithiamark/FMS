from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    CustomTokenRefreshView, 
    UserProfileView,
    RequestOTPView,
    VerifyOTPView,
    WorkerAccountViewSet
)

router = DefaultRouter()
router.register(r'farm-workers', WorkerAccountViewSet, basename='farm-worker')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='request_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('', include(router.urls)),
]
