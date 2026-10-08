from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from phonenumber_field.serializerfields import PhoneNumberField
from farms.models import Farm
from finance.models import Subscription
from finance.serializers import PLAN_CATALOG
from core.utils import get_user_farm

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone_number = PhoneNumberField(region="KE")

    class Meta:
        model = User
        fields = ('phone_number', 'full_name', 'password', 'role')
        extra_kwargs = {'role': {'read_only': True}} # Default to FARMER

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            role=User.Role.FARMER # Default role
        )
        Farm.objects.create(owner=user, name=f"{user.full_name}'s Farm")
        return user

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='phone_number.as_e164')
    farm = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'full_name', 'email', 'role', 'is_active', 'created_at', 'farm', 'accessible_modules', 'national_id', 'alt_phone', 'emergency_contact_name', 'emergency_contact_phone', 'worker_specialty', 'indemnity_agreed', 'indemnity_agreed_at')
        read_only_fields = ('id', 'role', 'created_at', 'phone_number', 'is_active', 'accessible_modules', 'indemnity_agreed', 'indemnity_agreed_at')

    def get_farm(self, obj):
        farm = get_user_farm(obj)
        if not farm:
            return None
        subscription = getattr(farm, 'subscription', None)
        return {
            'id': farm.id,
            'name': farm.name,
            'location': farm.location,
            'county': farm.county,
            'subscription': {
                'plan': subscription.plan if subscription else Subscription.Plan.TRIAL,
                'status': subscription.status if subscription else Subscription.Status.PENDING,
                'end_date': subscription.end_date if subscription else None,
                'features': subscription.features_snapshot.get('features', []) if subscription else PLAN_CATALOG[Subscription.Plan.TRIAL]['features'],
            },
        }

class OTPSerializer(serializers.Serializer):
    phone_number = PhoneNumberField(region="KE")

class OTPVerifySerializer(serializers.Serializer):
    phone_number = PhoneNumberField(region="KE")
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(required=False, allow_blank=True, min_length=6)
    indemnity_agreed = serializers.BooleanField(required=False, default=False)


class WorkerAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    phone_number = PhoneNumberField(region="KE")
    temporary_password = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'phone_number', 'full_name', 'email', 'password', 'temporary_password', 'is_active', 'accessible_modules', 'national_id', 'emergency_contact_name', 'emergency_contact_phone', 'worker_specialty', 'indemnity_agreed', 'created_at')
        read_only_fields = ('id', 'created_at', 'temporary_password')

    def get_temporary_password(self, obj):
        return getattr(obj, '_temporary_password', None)
