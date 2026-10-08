import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from farms.models import Farm
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection
from finance.models import Income

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farmer_user():
    return User.objects.create_user(phone_number='+254700111222', full_name='Farmer Joe', password='pass', role='FARMER')

@pytest.fixture
def aggregator_user():
    return User.objects.create_user(phone_number='+254700333444', full_name='Big Dairy', password='pass', role='AGGREGATOR')

@pytest.fixture
def farm(farmer_user):
    return Farm.objects.create(owner=farmer_user, name='Joe Dairy', county='Nairobi')

@pytest.fixture
def aggregator_profile(aggregator_user):
    return AggregatorProfile.objects.create(user=aggregator_user, organization_name='Brookside')

@pytest.mark.django_db
class TestAggregatorLedger:
    def test_milk_collection_creates_income(self, farm, aggregator_profile):
        connection = AggregatorFarmConnection.objects.create(
            aggregator=aggregator_profile,
            farm=farm,
            status='ACCEPTED'
        )
        
        collection = MilkCollection.objects.create(
            connection=connection,
            date='2024-01-01',
            litres_collected=100.0,
            price_per_litre=50.0,
            payment_status='PAID'
        )
        
        # Check if total price auto calculated
        assert collection.total_price == 5000.0
        
        # Check if income was auto-generated via signal
        income = Income.objects.filter(farm=farm, date='2024-01-01').first()
        assert income is not None
        assert income.amount_kes == 5000.0
        assert income.source == 'MilkSale'
