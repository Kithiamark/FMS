from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
import uuid
from animals.models import Animal

class MilkRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='milk_records')
    date = models.DateField()
    morning_yield = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    evening_yield = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_yield = models.DecimalField(max_digits=5, decimal_places=2, editable=False)
    home_use_litres = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sold_litres = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    calf_litres = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('animal', 'date')
        ordering = ['-date']

    def clean(self):
        morning = self.morning_yield or 0
        evening = self.evening_yield or 0
        if morning < 0 or morning > 50:
            raise ValidationError({'morning_yield': 'Yield must be between 0 and 50 litres.'})
        if evening < 0 or evening > 50:
            raise ValidationError({'evening_yield': 'Yield must be between 0 and 50 litres.'})
        usage_total = (self.home_use_litres or 0) + (self.sold_litres or 0) + (self.calf_litres or 0)
        if usage_total < 0:
            raise ValidationError('Milk usage values cannot be negative.')
        if usage_total > morning + evening:
            raise ValidationError({'sold_litres': 'Milk usage cannot exceed total production.'})

    def save(self, *args, **kwargs):
        self.morning_yield = self.morning_yield or 0
        self.evening_yield = self.evening_yield or 0
        self.home_use_litres = self.home_use_litres or 0
        self.sold_litres = self.sold_litres or 0
        self.calf_litres = self.calf_litres or 0
        self.total_yield = self.morning_yield + self.evening_yield
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.animal.name} - {self.date}: {self.total_yield}L"
