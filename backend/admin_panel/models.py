from django.db import models
from django.conf import settings
from farms.models import Farm

class SupportTicket(models.Model):
    class Category(models.TextChoices):
        BILLING = 'BILLING', 'Billing'
        TECHNICAL = 'TECHNICAL', 'Technical'
        ACCOUNT = 'ACCOUNT', 'Account'
        VET_ISSUE = 'VET_ISSUE', 'Vet Issue'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='support_tickets', null=True, blank=True)
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets_raised')
    category = models.CharField(max_length=20, choices=Category.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets', limit_choices_to={'is_staff': True})
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subject} ({self.status})"

class TicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg on {self.ticket.id} by {self.sender}"

class Announcement(models.Model):
    class Audience(models.TextChoices):
        ALL = 'ALL', 'All Users'
        FARMERS = 'FARMERS', 'Farmers Only'
        VETS = 'VETS', 'Vets Only'
        ENTERPRISE = 'ENTERPRISE', 'Enterprise Users'

    title = models.CharField(max_length=200)
    body = models.TextField() # RichTextField normally, simplified for now
    target_audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.ALL)
    is_published = models.BooleanField(default=False)
    publish_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class SystemLog(models.Model):
    class Level(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        CRITICAL = 'CRITICAL', 'Critical'
    
    class Service(models.TextChoices):
        API = 'API', 'API'
        CELERY = 'CELERY', 'Celery'
        AI = 'AI', 'AI'
        MPESA = 'MPESA', 'M-Pesa Callback'
        SMS = 'SMS', 'SMS Service'

    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=20, choices=Level.choices)
    service = models.CharField(max_length=20, choices=Service.choices)
    message = models.TextField()
    traceback = models.TextField(null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.timestamp} - {self.service} - {self.level}"
