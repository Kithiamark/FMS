from django.db import models
from django.conf import settings
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

    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        EXPIRED = 'Expired', 'Expired'
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
