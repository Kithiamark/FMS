import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from farms.models import Farm
from finance.models import Subscription
from finance.serializers import PLAN_CATALOG

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farmer_user(db):
    user = User.objects.create_user(
        phone_number='+254711000111',
        full_name='Test Farmer',
        role=User.Role.FARMER,
        password='testpassword123'
    )
    Farm.objects.create(owner=user, name="Farmer Test Farm")
    return user

@pytest.fixture
def buyer_user(db):
    user = User.objects.create_user(
        phone_number='+254722000222',
        full_name='Test Aggregator',
        role=User.Role.AGGREGATOR,
        password='testpassword123'
    )
    return user

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        phone_number='+254700000000',
        full_name='Platform Admin',
        password='adminpassword123'
    )

@pytest.mark.django_db
def test_farmer_cannot_see_or_checkout_buyer_plans(api_client, farmer_user):
    api_client.force_authenticate(user=farmer_user)
    
    # 1. Listing plans
    res = api_client.get('/api/v1/subscription/')
    assert res.status_code == 200
    plans = res.data.get('plans', {})
    
    assert Subscription.Plan.TRIAL in plans
    assert Subscription.Plan.BASIC in plans
    assert Subscription.Plan.PREMIUM in plans
    assert Subscription.Plan.ENTERPRISE in plans
    assert Subscription.Plan.BUYER_STARTER not in plans
    assert Subscription.Plan.BUYER_COMMERCIAL not in plans

    # 2. Checkout rejection
    checkout_res = api_client.post('/api/v1/subscription/checkout/', {
        'plan': Subscription.Plan.BUYER_STARTER,
        'phone_number': '+254711000111'
    })
    assert checkout_res.status_code == 400
    assert 'buyer' in checkout_res.data.get('error', '').lower()

@pytest.mark.django_db
def test_aggregator_only_sees_buyer_plans(api_client, buyer_user):
    api_client.force_authenticate(user=buyer_user)
    
    res = api_client.get('/api/v1/subscription/')
    assert res.status_code == 200
    plans = res.data.get('plans', {})
    
    assert Subscription.Plan.BUYER_STARTER in plans
    assert Subscription.Plan.BUYER_COMMERCIAL in plans
    assert Subscription.Plan.BASIC not in plans
    assert Subscription.Plan.PREMIUM not in plans
    assert Subscription.Plan.ENTERPRISE not in plans

@pytest.mark.django_db
def test_admin_sees_all_plans(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    
    res = api_client.get('/api/v1/subscription/')
    assert res.status_code == 200
    plans = res.data.get('plans', {})
    
    assert Subscription.Plan.BASIC in plans
    assert Subscription.Plan.BUYER_STARTER in plans
    assert Subscription.Plan.BUYER_COMMERCIAL in plans
