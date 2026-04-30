from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    class EventType(models.TextChoices):
        AUTH = 'AUTH', 'Authentication'
        DATA_ENTRY = 'DATA_ENTRY', 'Data Entry'
        SUBSCRIPTION = 'SUBSCRIPTION', 'Subscription'
        AI = 'AI', 'AI'
        COMMUNITY = 'COMMUNITY', 'Community'
        SECURITY = 'SECURITY', 'Security'
        API = 'API', 'API'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    farm = models.ForeignKey('farms.Farm', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    event_type = models.CharField(max_length=30, choices=EventType.choices, default=EventType.API)
    action = models.CharField(max_length=50) # CREATE, UPDATE, DELETE
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    path = models.CharField(max_length=255, blank=True)
    method = models.CharField(max_length=10, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.user}"
