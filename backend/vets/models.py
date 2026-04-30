from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField # Using JSONField for SQLite compatibility if needed, but requirements said ArrayField or JSON
# Since we are using SQLite for dev (based on settings), ArrayField is PostgreSQL only. I'll use JSONField.
from farms.models import Farm

class VetProfile(models.Model):
    class Specialization(models.TextChoices):
        DAIRY = 'Dairy', 'Dairy'
        GENERAL = 'General', 'General'
        SURGERY = 'Surgery', 'Surgery'
        NUTRITION = 'Nutrition', 'Nutrition'
        ALL = 'All', 'All'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vet_profile')
    license_number = models.CharField(max_length=50, unique=True)
    specialization = models.CharField(max_length=50, choices=Specialization.choices)
    years_experience = models.PositiveIntegerField()
    county = models.CharField(max_length=100)
    sub_counties_covered = models.JSONField(default=list) # List of sub-counties
    consultation_fee_kes = models.IntegerField(null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    profile_photo = models.ImageField(upload_to='vet_photos/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.full_name} ({self.specialization})"

class VetFarmConnection(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACTIVE = 'ACTIVE', 'Active'
        DECLINED = 'DECLINED', 'Declined'
        REMOVED = 'REMOVED', 'Removed'

    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='connections')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='vet_connections')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_message = models.TextField(blank=True, null=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vet', 'farm')

    def __str__(self):
        return f"{self.vet.user.full_name} - {self.farm.name} ({self.status})"

class VetAvailability(models.Model):
    class DayOfWeek(models.TextChoices):
        MON = 'Mon', 'Monday'
        TUE = 'Tue', 'Tuesday'
        WED = 'Wed', 'Wednesday'
        THU = 'Thu', 'Thursday'
        FRI = 'Fri', 'Friday'
        SAT = 'Sat', 'Saturday'
        SUN = 'Sun', 'Sunday'

    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.CharField(max_length=3, choices=DayOfWeek.choices)
    available_from = models.TimeField()
    available_to = models.TimeField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.vet} - {self.day_of_week}"

class VetReview(models.Model):
    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='reviews')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='given_vet_reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vet', 'farm')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate average rating
        reviews = VetReview.objects.filter(vet=self.vet)
        total = reviews.count()
        avg = sum([r.rating for r in reviews]) / total if total > 0 else 0
        self.vet.average_rating = avg
        self.vet.total_reviews = total
        self.vet.save()

    def __str__(self):
        return f"{self.rating}* for {self.vet} by {self.farm.name}"

class VetVisit(models.Model):
    class VisitType(models.TextChoices):
        ROUTINE = 'Routine', 'Routine'
        EMERGENCY = 'Emergency', 'Emergency'
        VACCINATION = 'Vaccination', 'Vaccination'
        CONSULTATION = 'Consultation', 'Consultation'

    class Status(models.TextChoices):
        SCHEDULED = 'Scheduled', 'Scheduled'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='visits')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='vet_visits')
    scheduled_date = models.DateTimeField()
    visit_type = models.CharField(max_length=20, choices=VisitType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True)
    cost_kes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.visit_type} on {self.scheduled_date} ({self.status})"
