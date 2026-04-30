from django.db.models.signals import post_save
from django.dispatch import receiver
from vets.models import VetFarmConnection
from .models import Conversation

@receiver(post_save, sender=VetFarmConnection)
def create_conversation_on_active_connection(sender, instance, created, **kwargs):
    if instance.status == VetFarmConnection.Status.ACTIVE:
        Conversation.objects.get_or_create(
            vet=instance.vet,
            farm=instance.farm
        )
