from celery import shared_task
from django.utils import timezone
from .models import Message
from alerts.utils import send_sms # Assuming we have a utility for SMS

@shared_task
def check_message_read_fallback(message_id):
    try:
        message = Message.objects.get(id=message_id)
        if not message.is_read and not message.sms_sent:
            # Determine recipient
            # If sender is vet, recipient is farmer
            # If sender is farmer, recipient is vet
            recipient = None
            if hasattr(message.sender, 'vet_profile'):
                # Sender is vet, recipient is farm owner
                recipient = message.conversation.farm.owner
            else:
                # Sender is farmer, recipient is vet
                recipient = message.conversation.vet.user
            
            if recipient and recipient.phone_number:
                sender_name = message.sender.full_name
                preview = message.content[:80] + "..." if len(message.content) > 80 else message.content
                msg_body = f"New message from {sender_name} on FMS: '{preview}' Reply via the app."
                
                send_sms(str(recipient.phone_number), msg_body)
                
                message.sms_sent = True
                message.save()
                
    except Message.DoesNotExist:
        pass
