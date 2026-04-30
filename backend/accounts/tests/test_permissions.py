import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from animals.models import Animal
from farms.models import Farm
from vets.models import VetProfile, VetFarmConnection
from datetime import date, timedelta
from finance.models import Subscription
from django.utils import timezone

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farmer_a(db):
    user = User.objects.create_user(phone_number='+254700000001', email='farmerA@example.com', password='password123', role='FARMER', full_name='Farmer A')
    Farm.objects.create(owner=user, name="Farm A")
    return user

@pytest.fixture
def farmer_b(db):
    user = User.objects.create_user(phone_number='+254700000002', email='farmerB@example.com', password='password123', role='FARMER', full_name='Farmer B')
    Farm.objects.create(owner=user, name="Farm B")
    return user

@pytest.fixture
def vet_x(db):
    user = User.objects.create_user(phone_number='+254700000003', email='vetX@example.com', password='password123', role='VETERINARIAN', full_name='Vet X')
    VetProfile.objects.create(
        user=user, 
        is_verified=True,
        license_number='VET123',
        specialization='General',
        years_experience=5,
        county='Nairobi'
    )
    return user

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(phone_number='+254700000004', email='admin@example.com', password='password123', role='ADMIN', full_name='Admin', is_staff=True)
    return user

@pytest.fixture
def animal_a(db, farmer_a):
    return Animal.objects.create(
        farm=farmer_a.farm, 
        name="Cow A", 
        ear_tag="A001",
        sex='Cow',
        date_of_birth=date(2020, 1, 1),
        weight_kg=450.50
    )

@pytest.fixture
def animal_b(db, farmer_b):
    return Animal.objects.create(
        farm=farmer_b.farm, 
        name="Cow B", 
        ear_tag="B001",
        sex='Cow',
        date_of_birth=date(2020, 1, 1),
        weight_kg=400.00
    )

@pytest.mark.django_db
def test_farmer_a_cannot_see_farmer_b_animals(api_client, farmer_a, animal_b):
    api_client.force_authenticate(user=farmer_a)
    response = api_client.get('/api/v1/animals/')
    assert response.status_code == status.HTTP_200_OK
    
    if isinstance(response.data, list):
        assert len(response.data) == 0
    else:
        assert len(response.data['results']) == 0 # Should not see Cow B

@pytest.mark.django_db
def test_farmer_a_cannot_post_health_record_for_animal_b(api_client, farmer_a, animal_b):
    api_client.force_authenticate(user=farmer_a)
    response = api_client.post(f'/api/v1/animals/{animal_b.id}/health/', {'diagnosis': 'Flu'})
    # Expect 404 because get_object filters by farm, or 403 if found but permission denied
    # ViewSet get_queryset filters by farm, so it returns 404
    assert response.status_code == status.HTTP_404_NOT_FOUND 

@pytest.mark.django_db
def test_vet_x_cannot_access_unconnected_farm_animals(api_client, vet_x, animal_a):
    api_client.force_authenticate(user=vet_x)
    # Using Vet Data Endpoint
    response = api_client.get(f'/api/v1/vet/data/farms/{animal_a.farm.id}/animals/')
    # Expect empty list or 403
    assert response.status_code == status.HTTP_403_FORBIDDEN or response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_vet_x_can_access_connected_farm_animals(api_client, vet_x, animal_a):
    # Create active connection
    VetFarmConnection.objects.create(
        vet=vet_x.vet_profile, 
        farm=animal_a.farm, 
        status='ACTIVE',
        requested_by=vet_x
    )
    
    api_client.force_authenticate(user=vet_x)
    response = api_client.get(f'/api/v1/vet/data/farms/{animal_a.farm.id}/animals/')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) >= 1

@pytest.mark.django_db
def test_admin_can_get_any_farm_data(api_client, admin_user, animal_a):
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(f'/api/v1/animals/{animal_a.id}/')
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_non_admin_cannot_access_admin_endpoints(api_client, farmer_a):
    api_client.force_authenticate(user=farmer_a)
    response = api_client.get('/api/v1/admin/stats/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_expired_subscription_farmer_still_sees_read_only_data(api_client, farmer_a):
    # Create expired subscription
    Subscription.objects.create(
        farm=farmer_a.farm,
        plan=Subscription.Plan.BASIC,
        status=Subscription.Status.EXPIRED,
        start_date=timezone.now().date() - timedelta(days=40),
        end_date=timezone.now().date() - timedelta(days=10)
    )
    
    api_client.force_authenticate(user=farmer_a)
    response = api_client.get('/api/v1/animals/')
    assert response.status_code == status.HTTP_200_OK
