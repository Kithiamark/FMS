import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from farms.models import Farm
from vets.models import VetProfile
from aggregators.models import AggregatorProfile

User = get_user_model()

@pytest.mark.django_db
class TestMultiProfileRegistration:
    def setup_method(self):
        self.client = APIClient()

    def test_farmer_registration_creates_farm(self):
        payload = {
            'phone_number': '+254711222333',
            'full_name': 'Grace Wanjiku',
            'role': 'FARMER'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        assert res.status_code == 201
        
        user = User.objects.get(phone_number='+254711222333')
        assert user.role == User.Role.FARMER
        assert user.full_name == 'Grace Wanjiku'
        assert Farm.objects.filter(owner=user).exists()
        farm = Farm.objects.get(owner=user)
        assert "Grace Wanjiku's Farm" in farm.name

    def test_veterinarian_registration_creates_vet_profile(self):
        payload = {
            'phone_number': '+254722333444',
            'full_name': 'Dr. Kamau Njoroge',
            'role': 'VETERINARIAN',
            'license_number': 'KVB/2026/789',
            'county': 'Kiambu',
            'specialization': 'Dairy',
            'years_experience': 5,
            'clinic_name': 'Highland Vet Care'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        assert res.status_code == 201

        user = User.objects.get(phone_number='+254722333444')
        assert user.role == User.Role.VETERINARIAN
        assert not Farm.objects.filter(owner=user).exists()
        assert hasattr(user, 'vet_profile')
        vet = user.vet_profile
        assert vet.license_number == 'KVB/2026/789'
        assert vet.county == 'Kiambu'
        assert vet.specialization == 'Dairy'
        assert vet.years_experience == 5
        assert vet.is_verified is False

    def test_veterinarian_registration_validation(self):
        # Missing license number
        res = self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254722333445',
            'full_name': 'Dr. No License',
            'role': 'VETERINARIAN',
            'county': 'Kiambu'
        }, format='json')
        assert res.status_code == 400
        assert 'license_number' in res.data

        # Missing county
        res = self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254722333446',
            'full_name': 'Dr. No County',
            'role': 'VETERINARIAN',
            'license_number': 'KVB/999'
        }, format='json')
        assert res.status_code == 400
        assert 'county' in res.data

    def test_aggregator_registration_creates_aggregator_profile(self):
        payload = {
            'phone_number': '+254733444555',
            'full_name': 'Samuel Ochieng',
            'role': 'AGGREGATOR',
            'organization_name': 'Rift Valley Fresh Dairies',
            'operating_counties': ['Nakuru', 'Baringo'],
            'payment_terms': 'Weekly',
            'vehicle_capacity_litres': 4000
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        assert res.status_code == 201

        user = User.objects.get(phone_number='+254733444555')
        assert user.role == User.Role.AGGREGATOR
        assert not Farm.objects.filter(owner=user).exists()
        assert hasattr(user, 'aggregator_profile')
        agg = user.aggregator_profile
        assert agg.organization_name == 'Rift Valley Fresh Dairies'
        assert 'Nakuru' in agg.operating_counties
        assert agg.vehicle_capacity_litres == 4000
        assert agg.is_verified is False

    def test_aggregator_registration_requires_organization_name(self):
        res = self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254733444556',
            'full_name': 'No Org Name',
            'role': 'AGGREGATOR'
        }, format='json')
        assert res.status_code == 400
        assert 'organization_name' in res.data

    def test_cannot_register_as_admin_or_farm_worker(self):
        res1 = self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254744555666',
            'full_name': 'Fake Admin',
            'role': 'ADMIN'
        }, format='json')
        assert res1.status_code == 400

        res2 = self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254744555667',
            'full_name': 'Fake Worker',
            'role': 'FARM_WORKER'
        }, format='json')
        assert res2.status_code == 400

    def test_otp_verification_mirrors_indemnity_to_profile(self):
        # Register vet
        self.client.post('/api/v1/auth/register/', {
            'phone_number': '+254755666777',
            'full_name': 'Dr. Otieno',
            'role': 'VETERINARIAN',
            'license_number': 'KVB/2026/101',
            'county': 'Kisumu'
        }, format='json')
        user = User.objects.get(phone_number='+254755666777')
        
        # Set OTP
        user.otp_hash = make_password('123456')
        user.otp_expires_at = timezone.now() + timedelta(minutes=10)
        user.save()

        verify_res = self.client.post('/api/v1/auth/verify-otp/', {
            'phone_number': '+254755666777',
            'otp': '123456',
            'password': 'StrongPassword123!',
            'indemnity_agreed': True
        }, format='json')
        assert verify_res.status_code == 200

        user.refresh_from_db()
        assert user.phone_verified is True
        assert user.indemnity_agreed is True
        assert user.check_password('StrongPassword123!')

        vet_profile = user.vet_profile
        vet_profile.refresh_from_db()
        assert vet_profile.indemnity_agreed is True
        assert vet_profile.indemnity_agreed_at is not None
