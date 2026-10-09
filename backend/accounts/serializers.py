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
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    phone_number = PhoneNumberField(region="KE")
    role = serializers.ChoiceField(
        choices=[User.Role.FARMER, User.Role.VETERINARIAN, User.Role.AGGREGATOR],
        default=User.Role.FARMER,
        required=False
    )

    # Vet specific fields
    license_number = serializers.CharField(required=False, allow_blank=True, max_length=50)
    specialization = serializers.CharField(required=False, allow_blank=True, max_length=50)
    years_experience = serializers.IntegerField(required=False, min_value=0, default=0)
    county = serializers.CharField(required=False, allow_blank=True, max_length=100)
    clinic_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    kvb_reg_no = serializers.CharField(required=False, allow_blank=True, max_length=50)

    # Aggregator specific fields
    organization_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    operating_counties = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list
    )
    operating_county = serializers.CharField(required=False, allow_blank=True, max_length=100)
    business_reg_no = serializers.CharField(required=False, allow_blank=True, max_length=60)
    kra_pin = serializers.CharField(required=False, allow_blank=True, max_length=30)
    payment_terms = serializers.CharField(required=False, allow_blank=True, max_length=50, default='Weekly')
    vehicle_capacity_litres = serializers.IntegerField(required=False, min_value=0, default=0)

    class Meta:
        model = User
        fields = (
            'phone_number', 'full_name', 'password', 'role',
            'license_number', 'specialization', 'years_experience', 'county', 'clinic_name', 'kvb_reg_no',
            'organization_name', 'operating_counties', 'operating_county', 'business_reg_no', 'kra_pin', 'payment_terms', 'vehicle_capacity_litres'
        )

    def validate(self, attrs):
        role = attrs.get('role', User.Role.FARMER)

        if role == User.Role.VETERINARIAN:
            license_no = attrs.get('license_number', '').strip()
            if not license_no:
                raise serializers.ValidationError({'license_number': 'License number is required for veterinarian registration.'})
            from vets.models import VetProfile
            if VetProfile.objects.filter(license_number__iexact=license_no).exists():
                raise serializers.ValidationError({'license_number': 'A veterinarian with this license number already exists.'})

            county = attrs.get('county', '').strip()
            if not county:
                raise serializers.ValidationError({'county': 'Operating county is required for veterinarian registration.'})

        elif role == User.Role.AGGREGATOR:
            org_name = attrs.get('organization_name', '').strip()
            if not org_name:
                raise serializers.ValidationError({'organization_name': 'Organization or business name is required for milk buyer registration.'})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.get('role', User.Role.FARMER)
        raw_password = validated_data.get('password')
        if not raw_password:
            import secrets
            raw_password = secrets.token_urlsafe(16)

        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            password=raw_password,
            role=role
        )

        if role == User.Role.FARMER:
            Farm.objects.create(owner=user, name=f"{user.full_name}'s Farm")
        elif role == User.Role.VETERINARIAN:
            from vets.models import VetProfile
            spec = validated_data.get('specialization', '').strip() or VetProfile.Specialization.GENERAL
            valid_specs = [c[0] for c in VetProfile.Specialization.choices]
            if spec not in valid_specs:
                spec = VetProfile.Specialization.GENERAL

            VetProfile.objects.create(
                user=user,
                license_number=validated_data['license_number'].strip(),
                specialization=spec,
                years_experience=validated_data.get('years_experience', 0),
                county=validated_data['county'].strip(),
                clinic_name=validated_data.get('clinic_name', '').strip(),
                kvb_reg_no=validated_data.get('kvb_reg_no', '').strip(),
                is_verified=False
            )
        elif role == User.Role.AGGREGATOR:
            from aggregators.models import AggregatorProfile
            operating_counties = validated_data.get('operating_counties', [])
            if not operating_counties and validated_data.get('operating_county'):
                operating_counties = [validated_data['operating_county'].strip()]
            AggregatorProfile.objects.create(
                user=user,
                organization_name=validated_data['organization_name'].strip(),
                operating_counties=operating_counties,
                business_reg_no=validated_data.get('business_reg_no', '').strip(),
                kra_pin=validated_data.get('kra_pin', '').strip(),
                payment_terms=validated_data.get('payment_terms', 'Weekly').strip() or 'Weekly',
                vehicle_capacity_litres=validated_data.get('vehicle_capacity_litres', 0),
                contact_person=user.full_name,
                is_verified=False
            )

        return user

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='phone_number.as_e164')
    farm = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    vet_profile = serializers.SerializerMethodField()
    aggregator_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'full_name', 'email', 'role', 'is_active', 'created_at',
            'farm', 'accessible_modules', 'national_id', 'alt_phone', 'emergency_contact_name',
            'emergency_contact_phone', 'worker_specialty', 'indemnity_agreed', 'indemnity_agreed_at',
            'is_verified', 'vet_profile', 'aggregator_profile'
        )
        read_only_fields = ('id', 'role', 'created_at', 'phone_number', 'is_active', 'accessible_modules', 'indemnity_agreed', 'indemnity_agreed_at')

    def get_is_verified(self, obj):
        if obj.role == User.Role.VETERINARIAN and hasattr(obj, 'vet_profile') and obj.vet_profile:
            return obj.vet_profile.is_verified
        if obj.role == User.Role.AGGREGATOR and hasattr(obj, 'aggregator_profile') and obj.aggregator_profile:
            return obj.aggregator_profile.is_verified
        return True

    def get_vet_profile(self, obj):
        if obj.role == User.Role.VETERINARIAN and hasattr(obj, 'vet_profile') and obj.vet_profile:
            vp = obj.vet_profile
            return {
                'id': vp.id,
                'license_number': vp.license_number,
                'specialization': vp.specialization,
                'county': vp.county,
                'clinic_name': vp.clinic_name,
                'is_verified': vp.is_verified,
            }
        return None

    def get_aggregator_profile(self, obj):
        if obj.role == User.Role.AGGREGATOR and hasattr(obj, 'aggregator_profile') and obj.aggregator_profile:
            ap = obj.aggregator_profile
            return {
                'id': ap.id,
                'organization_name': ap.organization_name,
                'operating_counties': ap.operating_counties,
                'is_verified': ap.is_verified,
            }
        return None

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
