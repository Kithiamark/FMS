from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AggregatorProfileViewSet, AggregatorFarmConnectionViewSet, MilkCollectionViewSet

router = DefaultRouter()
router.register(r'profiles', AggregatorProfileViewSet)
router.register(r'connections', AggregatorFarmConnectionViewSet)
router.register(r'collections', MilkCollectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
