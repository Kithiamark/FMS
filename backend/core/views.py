from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import AuditLog
from rest_framework.throttling import ScopedRateThrottle
import bleach

class BaseViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with Audit Logging and Input Sanitization
    """
    throttle_classes = [ScopedRateThrottle]
    
    def perform_create(self, serializer):
        # Sanitize text fields
        self._sanitize_data(serializer.validated_data)
        instance = serializer.save()
        self._log_audit('CREATE', instance)

    def perform_update(self, serializer):
        self._sanitize_data(serializer.validated_data)
        # Capture old state if needed (requires fetching before save)
        instance = serializer.save()
        self._log_audit('UPDATE', instance)

    def perform_destroy(self, instance):
        self._log_audit('DELETE', instance)
        instance.delete()

    def _sanitize_data(self, data):
        for key, value in data.items():
            if isinstance(value, str):
                data[key] = bleach.clean(value)

    def _log_audit(self, action, instance):
        ip = self.request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            user=self.request.user,
            action=action,
            model_name=instance._meta.model_name,
            object_id=str(instance.pk),
            ip_address=ip
        )
