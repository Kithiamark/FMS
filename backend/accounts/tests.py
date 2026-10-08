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

    def test_farmer_cannot_update_profile_directly(self):
        self.client.post(self.register_url, self.valid_payload)
        login_response = self.client.post(self.login_url, {
            'phone_number': self.valid_payload['phone_number'],
            'password': self.valid_payload['password']
        })
        access_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Farmer tries to update their full name or escalate accessible_modules
        response = self.client.patch(self.me_url, {
            'full_name': 'Hacked Name',
            'accessible_modules': ['admin', 'finance']
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Super Admin' in response.data['detail']

    def test_superadmin_can_update_profile(self):
        superuser = User.objects.create_superuser(
            phone_number='+254799999999',
            full_name='Super Admin',
            password='adminpass123'
        )
        login_response = self.client.post(self.login_url, {
            'phone_number': '+254799999999',
            'password': 'adminpass123'
        })
        access_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.patch(self.me_url, {'full_name': 'Super Admin Updated'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['full_name'] == 'Super Admin Updated'

    def test_otp_admin_visibility_and_indemnity_verification(self):
        # 1. Register super admin to check OTP endpoint
        admin = User.objects.create_superuser(
            phone_number='+254788888888',
            full_name='Admin User',
            password='adminpass123'
        )
        # 2. Farmer requests OTP
        phone = '+254722111222'
        User.objects.create_user(phone_number=phone, full_name='Onboarding Farmer')
        req_res = self.client.post('/api/v1/auth/request-otp/', {'phone_number': phone})
        assert req_res.status_code == status.HTTP_200_OK

        # 3. Admin views recent OTPs
        login_res = self.client.post(self.login_url, {'phone_number': '+254788888888', 'password': 'adminpass123'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_res.data["access"]}')
        otps_res = self.client.get('/api/v1/admin/recent-otps/')
        assert otps_res.status_code == status.HTTP_200_OK
        matched_otp = next((item['otp_code'] for item in otps_res.data if item['phone_number'] == phone), None)
        assert matched_otp is not None

        # 4. User verifies OTP, sets password, and accepts indemnity
        self.client.credentials() # clear credentials
        verify_res = self.client.post('/api/v1/auth/verify-otp/', {
            'phone_number': phone,
            'otp': matched_otp,
            'password': 'newpassword123',
            'indemnity_agreed': True
        })
        assert verify_res.status_code == status.HTTP_200_OK
        assert verify_res.data['phone_verified'] is True
        assert verify_res.data['indemnity_agreed'] is True
        assert 'access' in verify_res.data

    def test_worker_creation_no_hardcoded_password_and_auto_generates_temp_password(self):
        # 1. Register farmer
        farmer = User.objects.create_user(phone_number='+254711999888', full_name='Farmer Jack', password='pass1234')
        from farms.models import Farm
        farm = Farm.objects.create(owner=farmer, name="Jack's Dairy")
        self.client.force_authenticate(user=farmer)

        # 2. Farmer creates worker without password
        worker_payload = {
            'phone_number': '+254722888999',
            'full_name': 'Worker Tom',
            'accessible_modules': ['dairy', 'animals']
        }
        res = self.client.post('/api/v1/farm-workers/', worker_payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        temp_pass = res.data.get('temporary_password')
        assert temp_pass is not None
        assert len(temp_pass) == 10
        assert temp_pass != 'ChangeMe123'

        # 3. Verify ChangeMe123 backdoor fails
        self.client.credentials()
        login_backdoor = self.client.post(self.login_url, {
            'phone_number': '+254722888999',
            'password': 'ChangeMe123'
        })
        assert login_backdoor.status_code == status.HTTP_401_UNAUTHORIZED

        # 4. Verify logging in with temporary password succeeds
        login_temp = self.client.post(self.login_url, {
            'phone_number': '+254722888999',
            'password': temp_pass
        })
        assert login_temp.status_code == status.HTTP_200_OK

    def test_worker_creation_custom_password_validation(self):
        farmer = User.objects.create_user(phone_number='+254711777888', full_name='Farmer Mary', password='pass1234')
        from farms.models import Farm
        Farm.objects.create(owner=farmer, name="Mary's Dairy")
        self.client.force_authenticate(user=farmer)

        # Reject short password (< 8 chars)
        res_short = self.client.post('/api/v1/farm-workers/', {
            'phone_number': '+254722777888',
            'full_name': 'Worker Short',
            'password': 'short'
        }, format='json')
        assert res_short.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in res_short.data

        # Accept secure custom password
        res_ok = self.client.post('/api/v1/farm-workers/', {
            'phone_number': '+254722777888',
            'full_name': 'Worker Secure',
            'password': 'SecureWorkerPass123'
        }, format='json')
        assert res_ok.status_code == status.HTTP_201_CREATED
        assert res_ok.data.get('temporary_password') is None

