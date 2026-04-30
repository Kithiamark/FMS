from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CommunityPostViewSet, DairyCommunityViewSet

router = DefaultRouter()
router.register(r'community/groups', DairyCommunityViewSet, basename='community-group')
router.register(r'community/posts', CommunityPostViewSet, basename='community-post')

urlpatterns = [
    path('', include(router.urls)),
]
