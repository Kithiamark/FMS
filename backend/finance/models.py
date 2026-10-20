from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from farms.models import Farm

class Expense(models.Model):
    class Category(models.TextChoices):
        FEED = 'Feed', 'Feed'
        VETERINARY = 'Veterinary', 'Veterinary'
        LABOR = 'Labor', 'Labor'
        EQUIPMENT = 'Equipment', 'Equipment'
        UTILITIES = 'Utilities', 'Utilities'
        OTHER = 'Other', 'Other'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=Category.choices)
    amount_kes = models.IntegerField()
    date = models.DateField()
    description = models.TextField(blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.amount_kes} KES"

class Income(models.Model):
    class Source(models.TextChoices):
        MILK_SALE = 'MilkSale', 'Milk Sale'
        ANIMAL_SALE = 'AnimalSale', 'Animal Sale'
        OTHER = 'Other', 'Other'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=50, choices=Source.choices)
    amount_kes = models.IntegerField()
    date = models.DateField()
    description = models.TextField(blank=True)
    buyer_phone = models.CharField(max_length=15, blank=True)
    mpesa_ref = models.CharField(max_length=50, blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.source}: {self.amount_kes} KES"

class Subscription(models.Model):
    class Plan(models.TextChoices):
        TRIAL = 'Trial', 'Free Trial'
        BASIC = 'Basic', 'Basic'
        PREMIUM = 'Premium', 'Premium'
        ENTERPRISE = 'Enterprise', 'Enterprise'
        BUYER_STARTER = 'BuyerStarter', 'Milk Buyer Starter'
        BUYER_COMMERCIAL = 'BuyerCommercial', 'Milk Buyer Commercial'

    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        EXPIRED = 'Expired', 'Expired'
        FROZEN = 'Frozen', 'Frozen'
        PENDING = 'Pending', 'Pending'
        CANCELLED = 'Cancelled', 'Cancelled'

    farm = models.OneToOneField(Farm, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=50, choices=Plan.choices, default=Plan.TRIAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    amount_kes = models.IntegerField(default=0)
    trial_ends_at = models.DateField(null=True, blank=True)
    last_payment_mode = models.CharField(max_length=20, default='test')
    features_snapshot = models.JSONField(default=dict, blank=True)
    mpesa_ref = models.CharField(max_length=50, blank=True, null=True)
    mpesa_checkout_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def is_sabbath_window(dt=None):
        """
        Returns True if dt (or current time in local timezone) falls between
        Friday 18:00 (sunset) and Saturday 18:00 (sunset).
        """
        if dt is None:
            dt = timezone.localtime()
        elif timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        else:
            dt = timezone.localtime(dt)
            
        weekday = dt.weekday() # Monday is 0, Friday is 4, Saturday is 5, Sunday is 6
        hour = dt.hour
        
        # Friday 18:00 to 23:59
        if weekday == 4 and hour >= 18:
            return True
        # Saturday 00:00 to 17:59
        if weekday == 5 and hour < 18:
            return True
        return False

    @property
    def effective_end_date(self):
        """
        Returns the subscription end date automatically extended past Saturdays.
        If the raw end_date falls on a Friday or Saturday (or during the Sabbath),
        it extends to Sunday so the farmer never loses access on the Sabbath.
        Additionally, adds 1 day for each Saturday spanned.
        """
        raw = self.end_date or self.trial_ends_at
        if not raw:
            return None
        
        # If raw falls on Friday or Saturday, extend past Saturday to Sunday
        if raw.weekday() == 4: # Friday
            return raw + timedelta(days=2) # Sunday
        elif raw.weekday() == 5: # Saturday
            return raw + timedelta(days=1) # Sunday
        return raw

    @property
    def is_in_grace_period(self):
        """
        Returns True if subscription has expired within the past 7 days.
        """
        if self.status == self.Status.FROZEN:
            return False
        today = timezone.localtime().date()
        target_date = self.effective_end_date
        if target_date and target_date < today <= (target_date + timedelta(days=7)):
            return True
        return False

    @property
    def is_data_logging_only(self):
        """
        Returns True if subscription is frozen, or expired past the 7-day grace period.
        In this mode, daily milk/cattle/finance data logging is preserved,
        while AI, vet bookings, and advanced analytics are restricted.
        """
        if self.status == self.Status.FROZEN:
            return True
        today = timezone.localtime().date()
        target_date = self.effective_end_date
        if self.status == self.Status.ACTIVE:
            if target_date and target_date < today:
                return today > (target_date + timedelta(days=7))
            return False
        if target_date:
            return today > (target_date + timedelta(days=7))
        return self.status != self.Status.ACTIVE

    def __str__(self):
        return f"{self.farm.name} - {self.plan} ({self.status})"

from encrypted_model_fields.fields import EncryptedCharField

class MpesaTransaction(models.Model):
    class TransactionType(models.TextChoices):
        SUBSCRIPTION = 'Subscription', 'Subscription'
        MILK_SALE = 'MilkSale', 'Milk Sale'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='mpesa_transactions')
    amount_kes = models.IntegerField()
    phone_number = models.CharField(max_length=15)
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.CharField(max_length=255, blank=True)
    mpesa_receipt = EncryptedCharField(max_length=100, blank=True, null=True)
    transaction_type = models.CharField(max_length=50, choices=TransactionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.mpesa_receipt or 'Pending'} - {self.amount_kes} KES"


class PaymentIntent(models.Model):
    class Status(models.TextChoices):
        TEST_APPROVED = 'TEST_APPROVED', 'Test Approved'
        PENDING_KEYS = 'PENDING_KEYS', 'Waiting for API Keys'
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='payment_intents')
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payment_intents')
    plan = models.CharField(max_length=50, choices=Subscription.Plan.choices)
    amount_kes = models.IntegerField()
    phone_number = models.CharField(max_length=15, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    provider = models.CharField(max_length=30, default='mpesa')
    test_mode = models.BooleanField(default=True)
    checkout_request_id = models.CharField(max_length=100, blank=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.farm.name} {self.plan} {self.status}"
