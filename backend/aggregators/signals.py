from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MilkCollection
from finance.models import Income

@receiver(post_save, sender=MilkCollection)
def create_income_on_collection_paid(sender, instance, created, **kwargs):
    if instance.payment_status == MilkCollection.Status.PAID:
        # Check if an income record already exists to avoid duplicates.
        # We use a unique description or we can just rely on not editing paid collections.
        # For simplicity, we just create it if it doesn't exist for this collection date/farm.
        
        income_desc = f"Milk collection by {instance.connection.aggregator}"
        
        # Check if we already created it. 
        # A more robust way would be adding a collection_id to Income, but this works for MVP.
        exists = Income.objects.filter(
            farm=instance.connection.farm,
            date=instance.date,
            description=income_desc,
            amount_kes=instance.total_price
        ).exists()

        if not exists:
            Income.objects.create(
                farm=instance.connection.farm,
                source=Income.Source.MILK_SALE,
                amount_kes=instance.total_price,
                date=instance.date,
                description=income_desc,
                buyer_phone=instance.connection.aggregator.user.phone_number.as_e164,
                recorded_by=instance.connection.aggregator.user
            )
