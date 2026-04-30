from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField

class UserManager(BaseUserManager):
    def create_user(self, phone_number, full_name, password=None, **extra_fields):
        if not phone_number:
            raise ValueError(_('The Phone Number must be set'))
        if not full_name:
            raise ValueError(_('Full Name must be set'))
        
        user = self.model(phone_number=phone_number, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(phone_number, full_name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        FARMER = 'FARMER', _('Farmer')
        FARM_WORKER = 'FARM_WORKER', _('Farm Worker')
        VETERINARIAN = 'VETERINARIAN', _('Veterinarian')
        ADMIN = 'ADMIN', _('Admin')

    phone_number = PhoneNumberField(unique=True, region='KE')
    full_name = models.CharField(_('full name'), max_length=255)
    email = models.EmailField(_('email address'), blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.FARMER)
    assigned_farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workers',
        help_text='Enterprise worker accounts use this to log activity under a head farmer farm.',
    )
    phone_verified = models.BooleanField(default=False)
    otp_hash = models.CharField(max_length=128, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.phone_number})"
