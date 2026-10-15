from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from alerts.models import Alert
from alerts.utils import send_sms
from .models import VetFarmConnection, VetVisit

@receiver(post_save, sender=VetFarmConnection)
def notify_farm_connection_status(sender, instance, **kwargs):
    """
    On VetFarmConnection status → ACTIVE or DECLINED: send SMS to farmer
    """
    if instance.status in [VetFarmConnection.Status.ACTIVE, VetFarmConnection.Status.DECLINED]:
        farmer_phone = instance.farm.owner.phone_number
        vet_name = instance.vet.user.full_name
        
        if instance.status == VetFarmConnection.Status.ACTIVE:
            msg = f"Good news! Dr. {vet_name} has accepted your connection request. You can now schedule visits."
        else:
            msg = f"Connection request to Dr. {vet_name} was declined."

        if farmer_phone:
            send_sms(str(farmer_phone), msg)

        # Create an internal Alert for the farmer
        Alert.objects.create(
            farm=instance.farm,
            alert_type=Alert.AlertType.CUSTOM,
            message=msg,
            channel=Alert.Channel.SMS
        )

@receiver(post_save, sender=VetVisit)
def schedule_visit_alert(sender, instance, created, **kwargs):
    """
    On VetVisit created: create an Alert for the farm 24hrs before visit date
    """
    if created and instance.status == VetVisit.Status.SCHEDULED:
        sched_date = instance.scheduled_date
        if isinstance(sched_date, str):
            from django.utils.dateparse import parse_datetime
            sched_date = parse_datetime(sched_date)
        if not sched_date:
            return
            
        alert_time = sched_date - timedelta(hours=24)
        
        # Ensure we don't schedule in the past
        if alert_time > timezone.now():
            time_str = sched_date.strftime('%H:%M') if hasattr(sched_date, 'strftime') else ''
            msg = f"Reminder: Dr. {instance.vet.user.full_name} has a scheduled {instance.visit_type} visit tomorrow at {time_str}."
            
            Alert.objects.create(
                farm=instance.farm,
                alert_type=Alert.AlertType.CUSTOM, # Or create a specific VET_VISIT type if needed
                message=msg,
                scheduled_at=alert_time,
                channel=Alert.Channel.SMS
            )
