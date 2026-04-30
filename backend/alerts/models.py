from django.db import models
from django.conf import settings
from farms.models import Farm
from animals.models import Animal

class Alert(models.Model):
    class AlertType(models.TextChoices):
        VACCINATION_DUE = 'VACCINATION_DUE', 'Vaccination Due'
        BREEDING_DUE = 'BREEDING_DUE', 'Breeding Due'
        HEALTH_CHECKUP = 'HEALTH_CHECKUP', 'Health Checkup'
        LOW_YIELD_WARNING = 'LOW_YIELD_WARNING', 'Low Yield Warning'
        AI_DISEASE_RISK = 'AI_DISEASE_RISK', 'AI Disease Risk'
        SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING', 'Subscription Expiring'
        CUSTOM = 'CUSTOM', 'Custom'

    class Channel(models.TextChoices):
        SMS = 'SMS', 'SMS'
        EMAIL = 'EMAIL', 'Email'
        PUSH = 'PUSH', 'Push Notification'
        ALL = 'ALL', 'All Channels'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='alerts')
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    alert_type = models.CharField(max_length=50, choices=AlertType.choices)
    message = models.TextField()
    scheduled_at = models.DateTimeField(null=True, blank=True)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.SMS)
    
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    read = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.alert_type} - {self.farm.name}"

class SmsLog(models.Model):
    phone_number = models.CharField(max_length=15)
    message = models.TextField()
    status = models.CharField(max_length=50) # Sent, Failed, Queued
    cost_kes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone_number} - {self.status}"
