import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db
class TestAuth:
    def setup_method(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'
        self.me_url = '/api/v1/auth/me/'
        self.valid_payload = {
            'phone_number': '+254712345678',
            'full_name': 'Test Farmer',
            'password': 'password123'
        }

    def test_user_manager_create_user(self):
        user = User.objects.create_user(phone_number='+254700000000', full_name='Manager Test', password='pass')
        assert user.phone_number == '+254700000000'
        assert user.full_name == 'Manager Test'
        assert user.role == 'FARMER'
        assert user.check_password('pass')

    def test_register_user(self):
        response = self.client.post(self.register_url, self.valid_payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.count() == 1
        assert User.objects.get().farm is not None # Check farm auto-creation

    def test_login_user(self):
        self.client.post(self.register_url, self.valid_payload)
        response = self.client.post(self.login_url, {
            'phone_number': self.valid_payload['phone_number'],
            'password': self.valid_payload['password']
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        # Check cookies
        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies

    def test_get_user_profile(self):
        self.client.post(self.register_url, self.valid_payload)
        login_response = self.client.post(self.login_url, {
            'phone_number': self.valid_payload['phone_number'],
            'password': self.valid_payload['password']
        })
        access_token = login_response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.me_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['phone_number'] == self.valid_payload['phone_number']

    def test_otp_request(self):
        response = self.client.post('/api/v1/auth/request-otp/', {'phone_number': '+254712345678'})
        assert response.status_code == status.HTTP_200_OK
