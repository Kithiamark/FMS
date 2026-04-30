import uuid
from django.db import models
from django.conf import settings
from vets.models import VetProfile, VetFarmConnection
from farms.models import Farm

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='conversations')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vet', 'farm')
        ordering = ['-last_message_at']

    def __str__(self):
        return f"{self.vet.user.full_name} - {self.farm.name}"

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    sms_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.full_name} at {self.created_at}"
