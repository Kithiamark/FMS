from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
import re
from farms.models import Farm

class Animal(models.Model):
    class Breed(models.TextChoices):
        FRIESIAN = 'Friesian', _('Friesian')
        AYRSHIRE = 'Ayrshire', _('Ayrshire')
        JERSEY = 'Jersey', _('Jersey')
        GUERNSEY = 'Guernsey', _('Guernsey')
        MIXED = 'Mixed', _('Mixed')
        OTHER = 'Other', _('Other')

    class Sex(models.TextChoices):
        BULL = 'Bull', _('Bull')
        HEIFER = 'Heifer', _('Heifer')
        COW = 'Cow', _('Cow')

    class HealthStatus(models.TextChoices):
        HEALTHY = 'Healthy', _('Healthy')
        SICK = 'Sick', _('Sick')
        PREGNANT = 'Pregnant', _('Pregnant')
        DRY = 'Dry', _('Dry')
        DECEASED = 'Deceased', _('Deceased')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='animals')
    ear_tag = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    breed = models.CharField(max_length=20, choices=Breed.choices, default=Breed.MIXED)
    sex = models.CharField(max_length=10, choices=Sex.choices)
    date_of_birth = models.DateField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    health_status = models.CharField(max_length=20, choices=HealthStatus.choices, default=HealthStatus.HEALTHY)
    is_active = models.BooleanField(default=True)
    qr_code = models.ImageField(upload_to='qrcodes/', blank=True)
    photo = models.ImageField(upload_to='animal_photos/', blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('farm', 'ear_tag')

    def save(self, *args, **kwargs):
        if not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(f'https://fms.app/animals/{self.id}')
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            safe_tag = re.sub(r'[^a-zA-Z0-9_-]', '_', str(self.ear_tag or self.id or 'animal'))
            file_name = f'qr_{safe_tag}.png'
            self.qr_code.save(file_name, File(buffer), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.ear_tag})"

class HealthRecord(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='health_records')
    date = models.DateField()
    diagnosis = models.CharField(max_length=255)
    treatment = models.TextField()
    vet = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'VETERINARIAN'})
    cost_kes = models.IntegerField()
    next_checkup_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_health_records')
    created_at = models.DateTimeField(auto_now_add=True)

class VaccinationRecord(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='vaccinations')
    vaccine_name = models.CharField(max_length=100)
    date_given = models.DateField()
    next_due_date = models.DateField(null=True, blank=True)
    given_by = models.CharField(max_length=100)
    batch_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
