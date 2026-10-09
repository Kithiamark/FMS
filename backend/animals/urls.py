from django.urls import path
from .views import AnimalViewSet
from .ai_views import AIProxyView, FarmHealthOverviewView, PersonalizedRecommendationsView, AIAssistantChatView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'animals', AnimalViewSet, basename='animal')

urlpatterns = router.urls + [
    path('ai/predict/<str:endpoint>/', AIProxyView.as_view(), name='ai_predict'),
    path('ai/farm-health/', FarmHealthOverviewView.as_view(), name='farm_health'),
    path('ai/recommendations/', PersonalizedRecommendationsView.as_view(), name='farm_recommendations'),
    path('ai/chat/', AIAssistantChatView.as_view(), name='ai_chat'),
]

