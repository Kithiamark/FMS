import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import User
from farms.models import Farm
from animals.models import Animal
from dairy.models import MilkRecord

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farm_setup(db):
    farmer = User.objects.create_user(
        phone_number='+254711000111',
        password='Password123!',
        role='FARMER',
        full_name='Head Farmer'
    )
    farm = Farm.objects.create(name='Acacia Dairy Farm', owner=farmer)
    
    worker = User.objects.create_user(
        phone_number='+254711000222',
        password='Password123!',
        role='FARM_WORKER',
        full_name='John Worker',
        assigned_farm=farm
    )
    
    cow = Animal.objects.create(
        farm=farm,
        name='Bella',
        ear_tag='AC-001',
        sex='Cow',
        breed='Friesian',
        date_of_birth=timezone.now().date() - timedelta(days=500),
        weight_kg=450.0
    )
    
    return {'farmer': farmer, 'worker': worker, 'farm': farm, 'cow': cow}

@pytest.mark.django_db
def test_farmer_can_create_and_update_records_for_any_date(api_client, farm_setup):
    farmer = farm_setup['farmer']
    cow = farm_setup['cow']
    api_client.force_authenticate(user=farmer)
    
    past_date = (timezone.now() - timedelta(days=5)).date().isoformat()
    payload = [{
        'animal': str(cow.id),
        'date': past_date,
        'morning_yield': 15.5,
        'evening_yield': 12.0,
        'home_use_litres': 2.0,
        'sold_litres': 20.0,
        'calf_litres': 5.5,
        'notes': 'Recorded retroactively by owner'
    }]
    
    res = api_client.post('/api/v1/milk/bulk/', {'records': payload}, format='json')
    assert res.status_code == 200
    assert len(res.data) == 1
    record = MilkRecord.objects.get(animal=cow, date=past_date)
    assert float(record.total_yield) == 27.5
    
    update_payload = [{
        'animal': str(cow.id),
        'date': past_date,
        'morning_yield': 16.0,
        'evening_yield': 12.0,
        'home_use_litres': 2.0,
        'sold_litres': 20.0,
        'calf_litres': 6.0,
        'notes': 'Updated by owner'
    }]
    res2 = api_client.post('/api/v1/milk/bulk/', {'records': update_payload}, format='json')
    assert res2.status_code == 200
    record.refresh_from_db()
    assert float(record.morning_yield) == 16.0

@pytest.mark.django_db
def test_worker_can_log_records_for_today(api_client, farm_setup):
    worker = farm_setup['worker']
    cow = farm_setup['cow']
    api_client.force_authenticate(user=worker)
    
    today = timezone.now().date().isoformat()
    payload = [{
        'animal': str(cow.id),
        'date': today,
        'morning_yield': 14.0,
        'evening_yield': 10.0,
        'home_use_litres': 2.0,
        'sold_litres': 18.0,
        'calf_litres': 4.0,
        'notes': 'Morning shift logging'
    }]
    
    res = api_client.post('/api/v1/milk/bulk/', {'records': payload}, format='json')
    assert res.status_code == 200
    assert MilkRecord.objects.filter(animal=cow, date=today).exists()

@pytest.mark.django_db
def test_worker_cannot_backdate_records(api_client, farm_setup):
    worker = farm_setup['worker']
    cow = farm_setup['cow']
    api_client.force_authenticate(user=worker)
    
    past_date = (timezone.now() - timedelta(days=2)).date().isoformat()
    payload = [{
        'animal': str(cow.id),
        'date': past_date,
        'morning_yield': 12.0,
        'evening_yield': 8.0,
    }]
    
    res = api_client.post('/api/v1/milk/bulk/', {'records': payload}, format='json')
    assert res.status_code == 400
    assert 'cannot backdate' in str(res.data['errors'])

@pytest.mark.django_db
def test_worker_cannot_overwrite_existing_records(api_client, farm_setup):
    worker = farm_setup['worker']
    cow = farm_setup['cow']
    today = timezone.now().date()
    
    MilkRecord.objects.create(
        animal=cow,
        date=today,
        morning_yield=12.0,
        evening_yield=10.0,
        recorded_by=farm_setup['farmer']
    )
    
    api_client.force_authenticate(user=worker)
    payload = [{
        'animal': str(cow.id),
        'date': today.isoformat(),
        'morning_yield': 15.0,
        'evening_yield': 12.0,
    }]
    
    res = api_client.post('/api/v1/milk/bulk/', {'records': payload}, format='json')
    assert res.status_code == 400
    assert 'already exist and cannot be edited by workers' in str(res.data['errors'])

@pytest.mark.django_db
def test_worker_cannot_update_or_delete_via_detail_endpoint(api_client, farm_setup):
    worker = farm_setup['worker']
    cow = farm_setup['cow']
    today = timezone.now().date()
    
    record = MilkRecord.objects.create(
        animal=cow,
        date=today,
        morning_yield=12.0,
        evening_yield=10.0,
        recorded_by=farm_setup['farmer']
    )
    
    api_client.force_authenticate(user=worker)
    
    res_put = api_client.patch(f'/api/v1/milk/{record.id}/', {'notes': 'Tampered note'}, format='json')
    assert res_put.status_code == 403
    
    res_del = api_client.delete(f'/api/v1/milk/{record.id}/')
    assert res_del.status_code == 403

