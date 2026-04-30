from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from animals.models import VaccinationRecord, Animal
from dairy.models import MilkRecord
from finance.models import Subscription
from farms.models import Farm
from .models import Alert
from .utils import send_sms
from django.db.models import Avg, Sum

@shared_task
def check_vaccination_alerts():
    today = timezone.now().date()
    due_date = today + timedelta(days=7)
    
    records = VaccinationRecord.objects.filter(next_due_date=due_date)
    
    for record in records:
        farm = record.animal.farm
        msg = f"Alert: Vaccination for {record.animal.name} ({record.animal.ear_tag}) is due on {due_date}. Please schedule a vet visit."
        
        # Create Alert
        Alert.objects.create(
            farm=farm,
            animal=record.animal,
            alert_type=Alert.AlertType.VACCINATION_DUE,
            message=msg,
            channel=Alert.Channel.SMS
        )
        
        # Send SMS
        if farm.owner.phone_number:
            send_sms(str(farm.owner.phone_number), msg)

@shared_task
def check_milk_yield_drop():
    animals = Animal.objects.filter(is_active=True)
    today = timezone.now().date()
    
    for animal in animals:
        # Get last 3 days avg
        recent_records = MilkRecord.objects.filter(animal=animal, date__gte=today-timedelta(days=3))
        if not recent_records.exists(): continue
        recent_avg = recent_records.aggregate(Avg('total_yield'))['total_yield__avg'] or 0
        
        # Get previous 7 days avg (days 4-10 ago)
        prev_start = today - timedelta(days=10)
        prev_end = today - timedelta(days=3)
        prev_records = MilkRecord.objects.filter(animal=animal, date__range=[prev_start, prev_end])
        if not prev_records.exists(): continue
        prev_avg = prev_records.aggregate(Avg('total_yield'))['total_yield__avg'] or 0
        
        if prev_avg > 0 and recent_avg < (prev_avg * 0.75): # 25% drop
            msg = f"Warning: {animal.name} milk yield dropped by >25%. Recent avg: {recent_avg:.1f}L, Previous: {prev_avg:.1f}L. Check for illness."
            
            Alert.objects.create(
                farm=animal.farm,
                animal=animal,
                alert_type=Alert.AlertType.LOW_YIELD_WARNING,
                message=msg,
                channel=Alert.Channel.SMS
            )
            
            if animal.farm.owner.phone_number:
                send_sms(str(animal.farm.owner.phone_number), msg)

@shared_task
def check_subscription_expiry():
    today = timezone.now().date()
    expiry_date = today + timedelta(days=3)
    
    subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE, end_date=expiry_date)
    
    for sub in subs:
        msg = f"Reminder: Your FMS subscription expires on {sub.end_date}. Please renew to avoid service interruption."
        
        Alert.objects.create(
            farm=sub.farm,
            alert_type=Alert.AlertType.SUBSCRIPTION_EXPIRING,
            message=msg,
            channel=Alert.Channel.SMS
        )
        
        if sub.farm.owner.phone_number:
            send_sms(str(sub.farm.owner.phone_number), msg)

@shared_task
def send_weekly_farm_summary():
    today = timezone.now().date()
    start_date = today - timedelta(days=7)

    for farm in Farm.objects.select_related('owner').all():
        milk_records = MilkRecord.objects.filter(
            animal__farm=farm,
            date__gte=start_date,
            date__lt=today,
        )
        milk_total = milk_records.aggregate(total=Sum('total_yield'))['total'] or 0
        active_animals = Animal.objects.filter(farm=farm, is_active=True).count()
        open_alerts = Alert.objects.filter(farm=farm, read=False, is_active=True).count()

        msg = (
            f"Weekly FMS summary for {farm.name}: "
            f"{milk_total:.1f}L milk recorded, {active_animals} active animals, "
            f"{open_alerts} open alerts."
        )

        already_created = Alert.objects.filter(
            farm=farm,
            alert_type=Alert.AlertType.CUSTOM,
            created_at__date=today,
            message__startswith=f"Weekly FMS summary for {farm.name}:",
        ).exists()
        if already_created:
            continue

        Alert.objects.create(
            farm=farm,
            alert_type=Alert.AlertType.CUSTOM,
            message=msg,
            channel=Alert.Channel.SMS,
            scheduled_at=timezone.now(),
        )

        if farm.owner.phone_number:
            send_sms(str(farm.owner.phone_number), msg)
