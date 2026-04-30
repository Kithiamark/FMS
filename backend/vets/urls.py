from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VetProfileViewSet as VetViewSet, VetConnectionViewSet as ConnectionViewSet
# from .views import VisitViewSet
from .views_data import VetDataViewSet

router = DefaultRouter()
router.register(r'vets', VetViewSet, basename='vet')
router.register(r'connections', ConnectionViewSet, basename='connection')
# router.register(r'visits', VisitViewSet, basename='visit')

vet_data_router = DefaultRouter()
vet_data_router.register(r'data', VetDataViewSet, basename='vet-data')

urlpatterns = [
    path('', include(router.urls)),
    path('vet/', include(vet_data_router.urls)), 
    # This maps to /api/v1/vets/vet/data/... which is a bit nested.
    # The requirement is /api/v1/vet/farms/ etc.
    # Let's clean this up in the main urls or here using path() directly for the VetDataViewSet actions
]
