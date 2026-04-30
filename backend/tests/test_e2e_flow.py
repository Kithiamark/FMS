
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from vets.models import VetProfile, VetFarmConnection
from farms.models import Farm
from animals.models import Animal
from django.urls import reverse

User = get_user_model()

@pytest.mark.django_db
class TestEndToEndFlow:
    def test_full_user_journey(self):
        client = APIClient()

        # ==========================================
        # 1. Setup Data (Register Users)
        # ==========================================
        
        # Register Farmer
        farmer_data = {
            'phone_number': '+254700000001',
            'full_name': 'E2E Farmer',
            'password': 'password123',
            'role': 'FARMER',
            'email': 'farmer@e2e.com'
        }
        # Note: Depending on implementation, register endpoint might differ. 
        # Assuming standard /api/v1/auth/register/
        # If not, we create user manually for test speed if register logic is complex (OTP etc),
        # but for E2E we prefer API. Let's try API first, if it fails due to OTP, we mock or create user directly.
        # Checking RegisterView implementation would be good, but let's assume it works or create user directly to be safe on logic.
        # Given "RequestOTPView", registration might require verification.
        # To avoid OTP complexity in test, I will create users via model but verify login via API.
        
        farmer = User.objects.create_user(**farmer_data)
        
        # Register Vet
        vet_data = {
            'phone_number': '+254700000002',
            'full_name': 'E2E Vet',
            'password': 'password123',
            'role': 'VETERINARIAN',
            'email': 'vet@e2e.com'
        }
        vet = User.objects.create_user(**vet_data)
        
        # Create Vet Profile (usually auto-created or manual)
        # Let's create it manually to ensure it exists for the test
        vet_profile = VetProfile.objects.create(
            user=vet,
            license_number='VET-E2E-001',
            specialization='General',
            years_experience=5,
            county='Nairobi',
            is_verified=True # Important for directory visibility
        )

        # ==========================================
        # 2. Farmer Flow: Login & Setup Farm
        # ==========================================
        
        # Login Farmer
        response = client.post('/api/v1/auth/login/', {
            'phone_number': farmer_data['phone_number'],
            'password': farmer_data['password']
        })
        assert response.status_code == status.HTTP_200_OK
        farmer_token = response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {farmer_token}')

        # Create Farm
        farm_data = {
            'name': 'E2E Farm',
            'location': 'Kiambu',
            'county': 'Kiambu'
        }
        
        response = client.post('/api/v1/farms/', farm_data)
        assert response.status_code == status.HTTP_201_CREATED
        farm_id = response.data['id']
        # Fetch farm object for later assertions if needed, though we have ID.
        farm = Farm.objects.get(id=farm_id)
        
        # Create Animal
        animal_data = {
            'name': 'Bessie',
            'ear_tag': 'E2E-001',
            'breed': 'Friesian',
            'sex': 'Cow',
            'date_of_birth': '2020-01-01',
            'weight_kg': 500,
            'is_active': True
        }
        response = client.post('/api/v1/animals/', animal_data)
        assert response.status_code == status.HTTP_201_CREATED, f"Animal creation failed: {response.data}"
        animal_id = response.data['id']
        
        # Search for Vet (Farmer initiates connection)
        # GET /api/v1/vets/ (VetViewSet)
        response = client.get('/api/v1/vets/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        target_vet_id = response.data[0]['id'] # VetProfile ID
        
        # Connect to Vet
        response = client.post(f'/api/v1/vets/{target_vet_id}/connect/')
        assert response.status_code == status.HTTP_201_CREATED

        # ==========================================
        # 3. Vet Flow: Login & Accept Connection
        # ==========================================
        
        client.credentials() # Clear auth
        
        # Login Vet
        response = client.post('/api/v1/auth/login/', {
            'phone_number': vet_data['phone_number'],
            'password': vet_data['password']
        })
        assert response.status_code == status.HTTP_200_OK
        vet_token = response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {vet_token}')
        
        # Check Pending Connections
        response = client.get('/api/v1/connections/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        connection_id = response.data[0]['id']
        
        # Accept Connection
        response = client.post(f'/api/v1/connections/{connection_id}/accept/')
        assert response.status_code == status.HTTP_200_OK
        
        # ==========================================
        # 4. Vet Actions: View Data & Add Health Record
        # ==========================================
        
        # View Farmer's Animals
        response = client.get(f'/api/v1/vet/data/farms/{farm.id}/animals/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert str(response.data[0]['id']) == str(animal_id)
        
        # Add Health Record
        health_data = {
            'diagnosis': 'Mastitis',
            'treatment': 'Antibiotics',
            'cost_kes': 1500,
            'notes': 'Monitor closely'
        }
        response = client.post(f'/api/v1/vet/data/{animal_id}/health/', health_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # ==========================================
        # 5. Farmer Verification
        # ==========================================
        
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {farmer_token}')
        
        # View Health Records for Animal
        response = client.get(f'/api/v1/animals/{animal_id}/health/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]['diagnosis'] == 'Mastitis'
        
        print("\n>>> End-to-End Flow Test Passed Successfully! <<<")

