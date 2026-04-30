from rest_framework.routers import DefaultRouter
from .views import MilkRecordViewSet

router = DefaultRouter()
router.register(r'milk', MilkRecordViewSet, basename='milk')

urlpatterns = router.urls
