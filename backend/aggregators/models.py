from django.db import models
from django.conf import settings

class AggregatorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aggregator_profile')
    organization_name = models.CharField(max_length=255, blank=True, help_text="e.g. Brookside, or leave blank if independent")
    operating_counties = models.JSONField(default=list, blank=True, help_text="List of counties they operate in")
    vehicle_capacity_litres = models.IntegerField(default=0, help_text="Used for route planning")
    business_reg_no = models.CharField(max_length=60, blank=True, default='')
    kra_pin = models.CharField(max_length=30, blank=True, default='')
    contact_person = models.CharField(max_length=100, blank=True, default='')
    office_address = models.CharField(max_length=200, blank=True, default='')
    payment_terms = models.CharField(max_length=50, blank=True, default='Weekly')
    indemnity_agreed = models.BooleanField(default=False)
    indemnity_agreed_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.organization_name or f"Independent: {self.user.full_name}"

class AggregatorFarmConnection(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    aggregator = models.ForeignKey(AggregatorProfile, on_delete=models.CASCADE, related_name='farm_connections')
    farm = models.ForeignKey('farms.Farm', on_delete=models.CASCADE, related_name='aggregator_connections')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('aggregator', 'farm')

    def __str__(self):
        return f"{self.aggregator} <-> {self.farm.name} ({self.status})"

class MilkCollection(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PAID = 'PAID', 'Paid'

    class QualityGrade(models.TextChoices):
        GRADE_A = 'GRADE_A', 'Grade A (Premium)'
        GRADE_B = 'GRADE_B', 'Grade B (Standard)'
        REJECTED = 'REJECTED', 'Rejected'

    connection = models.ForeignKey(AggregatorFarmConnection, on_delete=models.CASCADE, related_name='collections')
    date = models.DateField()
    litres_collected = models.DecimalField(max_digits=8, decimal_places=2)
    price_per_litre = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    payment_status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    
    # Milk Platform Quality Testing
    lactometer_reading = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True, help_text="Specific gravity, e.g. 1.028")
    temperature_celsius = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="Intake temperature in °C, e.g. 4.5")
    alcohol_test_passed = models.BooleanField(default=True, help_text="Alcohol / clot-on-boiling rapid test")
    quality_grade = models.CharField(max_length=20, choices=QualityGrade.choices, default=QualityGrade.GRADE_A)
    rejection_reason = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from decimal import Decimal
        if self.quality_grade == self.QualityGrade.REJECTED:
            self.total_price = Decimal('0.00')
        else:
            self.total_price = self.litres_collected * self.price_per_litre
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.litres_collected}L from {self.connection.farm.name} on {self.date} ({self.quality_grade})"


class AggregatorMessage(models.Model):
    connection = models.ForeignKey(AggregatorFarmConnection, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aggregator_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.full_name} on {self.connection} at {self.created_at}"

