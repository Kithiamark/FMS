import pytest
from unittest.mock import patch
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.response import Response
from animals.models import Animal
from farms.models import Farm
from core.models import AuditLog
from core.middleware import AuditLogMiddleware
from vets.models import VetProfile
from admin_panel.serializers import VetProfileAdminSerializer
from django.conf import settings
import datetime

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farmer(db):
    user = User.objects.create_user(
        phone_number='+254700077001',
        email='infra.farmer@fms.test',
        password='Password123!',
        role='FARMER',
        full_name='Infra Farmer'
    )
    Farm.objects.create(owner=user, name='Infra Test Farm')
    return user

@pytest.mark.django_db
class TestInfrastructure:

    def test_qr_code_filename_sanitization(self, farmer):
        # Ear tag with forward slashes and special characters
        ear_tag_with_slashes = 'KE/2026/001#B'
        animal = Animal.objects.create(
            farm=farmer.farm,
            name='Daisy',
            ear_tag=ear_tag_with_slashes,
            sex='Cow',
            date_of_birth=datetime.date(2021, 5, 10),
            weight_kg=480.0
        )
        assert animal.qr_code is not None
        # Verify the filename on disk does not have slashes
        assert '/' not in animal.qr_code.name.replace('qrcodes/', '')
        assert 'qr_KE_2026_001_B' in animal.qr_code.name
        assert animal.qr_code.name.endswith('.png')

    def test_audit_log_middleware_query_sanitization(self, farmer):
        rf = RequestFactory()
        request = rf.post('/api/v1/auth/login/?token=secret123&password=mysecret&safe_param=hello')
        request.user = farmer

        middleware = AuditLogMiddleware(get_response=lambda r: Response(status=200))
        response = Response(status=200)

        middleware.process_response(request, response)

        log = AuditLog.objects.filter(path__startswith='/api/v1/auth/login/').last()
        assert log is not None
        assert 'token=%2A%2A%2A' in log.metadata['query'] or 'token=***' in log.metadata['query']
        assert 'password=%2A%2A%2A' in log.metadata['query'] or 'password=***' in log.metadata['query']
        assert 'safe_param=hello' in log.metadata['query']

    def test_audit_log_middleware_exception_resilience(self, farmer):
        rf = RequestFactory()
        request = rf.post('/api/v1/farms/')
        request.user = farmer

        middleware = AuditLogMiddleware(get_response=lambda r: Response(status=200))
        response = Response(status=200)

        with patch('core.models.AuditLog.objects.create', side_effect=Exception("Database connection timeout")):
            # Middleware should gracefully catch the exception and return the response without crashing
            res = middleware.process_response(request, response)
            assert res.status_code == 200

    def test_vet_profile_admin_serializer_aliases(self, db):
        user = User.objects.create_user(
            phone_number='+254700077002',
            email='dr.serializer@fms.test',
            password='Password123!',
            role='VETERINARIAN',
            full_name='Dr. Alias Test'
        )
        vet = VetProfile.objects.create(
            user=user,
            license_number='KVB-ALIAS-123',
            specialization='Dairy',
            years_experience=8,
            county='Kiambu',
            is_verified=False
        )

        serializer = VetProfileAdminSerializer(vet)
        data = serializer.data

        assert data['user_name'] == 'Dr. Alias Test'
        assert data['name'] == 'Dr. Alias Test'
        assert data['license_number'] == 'KVB-ALIAS-123'
        assert data['license'] == 'KVB-ALIAS-123'

    def test_serve_media_setting_exists(self):
        assert hasattr(settings, 'SERVE_MEDIA')
        assert hasattr(settings, 'LOGGING')
        assert 'handlers' in settings.LOGGING
        assert 'file' in settings.LOGGING['handlers']
        assert 'error_file' in settings.LOGGING['handlers']
