import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from farms.models import Farm
from core.models import AuditLog
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection
from finance.models import Income

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def farmer_user():
    return User.objects.create_user(phone_number='+254700111222', full_name='Farmer Joe', role=User.Role.FARMER)

@pytest.fixture
def farmer_other():
    return User.objects.create_user(phone_number='+254700111333', full_name='Farmer Other', role=User.Role.FARMER)

@pytest.fixture
def aggregator_user():
    return User.objects.create_user(phone_number='+254700333444', full_name='Aggregator Alpha', role=User.Role.AGGREGATOR)

@pytest.fixture
def aggregator_user_2():
    return User.objects.create_user(phone_number='+254700333555', full_name='Aggregator Beta', role=User.Role.AGGREGATOR)

@pytest.fixture
def superadmin_user():
    return User.objects.create_superuser(phone_number='+254700999999', full_name='Admin Boss')

@pytest.fixture
def farm(farmer_user):
    return Farm.objects.create(owner=farmer_user, name='Joe Dairy', county='Nairobi')

@pytest.fixture
def other_farm(farmer_other):
    return Farm.objects.create(owner=farmer_other, name='Other Dairy', county='Nakuru')

@pytest.fixture
def aggregator_profile(aggregator_user):
    return AggregatorProfile.objects.create(
        user=aggregator_user, 
        organization_name='Brookside Alpha',
        is_verified=True
    )

@pytest.fixture
def aggregator_profile_2(aggregator_user_2):
    return AggregatorProfile.objects.create(
        user=aggregator_user_2, 
        organization_name='KCC Beta',
        is_verified=False
    )

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

    def test_prevent_aggregator_profile_idor(self, api_client, aggregator_profile, aggregator_profile_2, farmer_user):
        """Users cannot modify other aggregators' profiles."""
        # Farmer attempts to modify verified aggregator
        api_client.force_authenticate(user=farmer_user)
        res_farmer = api_client.patch(
            f'/api/v1/aggregators/profiles/{aggregator_profile.id}/',
            {'organization_name': 'Hacked Dairy'},
            format='json'
        )
        assert res_farmer.status_code == status.HTTP_403_FORBIDDEN
        aggregator_profile.refresh_from_db()
        assert aggregator_profile.organization_name == 'Brookside Alpha'

        # Aggregator 2 attempts to modify Aggregator 1
        api_client.force_authenticate(user=aggregator_profile_2.user)
        res_agg2 = api_client.patch(
            f'/api/v1/aggregators/profiles/{aggregator_profile.id}/',
            {'organization_name': 'Hijacked Alpha'},
            format='json'
        )
        assert res_agg2.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
        aggregator_profile.refresh_from_db()
        assert aggregator_profile.organization_name == 'Brookside Alpha'

        # Owner can modify their own profile
        api_client.force_authenticate(user=aggregator_profile.user)
        res_owner = api_client.patch(
            f'/api/v1/aggregators/profiles/{aggregator_profile.id}/',
            {'office_address': 'Nairobi Industrial Area'},
            format='json'
        )
        assert res_owner.status_code == status.HTTP_200_OK
        aggregator_profile.refresh_from_db()
        assert aggregator_profile.office_address == 'Nairobi Industrial Area'

    def test_prevent_self_verification(self, api_client, aggregator_profile_2, superadmin_user):
        """Aggregator cannot self-verify; platform superadmin can verify."""
        api_client.force_authenticate(user=aggregator_profile_2.user)
        res = api_client.patch(
            f'/api/v1/aggregators/profiles/{aggregator_profile_2.id}/',
            {'is_verified': True},
            format='json'
        )
        assert res.status_code == status.HTTP_200_OK
        aggregator_profile_2.refresh_from_db()
        assert aggregator_profile_2.is_verified is False

        # Superadmin verifies
        api_client.force_authenticate(user=superadmin_user)
        res_admin = api_client.patch(
            f'/api/v1/aggregators/profiles/{aggregator_profile_2.id}/',
            {'is_verified': True},
            format='json'
        )
        assert res_admin.status_code == status.HTTP_200_OK
        aggregator_profile_2.refresh_from_db()
        assert aggregator_profile_2.is_verified is True

    def test_cascade_deletion_protection(self, api_client, aggregator_profile, superadmin_user):
        """Only superadmin can delete an aggregator profile, and AuditLog is recorded."""
        api_client.force_authenticate(user=aggregator_profile.user)
        res_owner = api_client.delete(f'/api/v1/aggregators/profiles/{aggregator_profile.id}/')
        assert res_owner.status_code == status.HTTP_403_FORBIDDEN
        assert AggregatorProfile.objects.filter(id=aggregator_profile.id).exists()

        api_client.force_authenticate(user=superadmin_user)
        res_admin = api_client.delete(f'/api/v1/aggregators/profiles/{aggregator_profile.id}/')
        assert res_admin.status_code == status.HTTP_204_NO_CONTENT
        assert not AggregatorProfile.objects.filter(id=aggregator_profile.id).exists()
        assert AuditLog.objects.filter(
            action='DELETE',
            model_name='AggregatorProfile',
            object_id=str(aggregator_profile.id)
        ).exists()

    def test_connection_permission_and_duplicate_prevention(self, api_client, farm, aggregator_profile, aggregator_profile_2, farmer_user, farmer_other):
        """Enforces connection ownership and prevents duplicate connection crashes."""
        api_client.force_authenticate(user=aggregator_profile_2.user)
        # Aggregator 2 tries to create connection for Aggregator 1
        res_unauth = api_client.post(
            '/api/v1/aggregators/connections/',
            {'aggregator': aggregator_profile.id, 'farm': farm.id},
            format='json'
        )
        assert res_unauth.status_code == status.HTTP_400_BAD_REQUEST

        # Aggregator 1 creates connection to farm
        api_client.force_authenticate(user=aggregator_profile.user)
        res_valid = api_client.post(
            '/api/v1/aggregators/connections/',
            {'aggregator': aggregator_profile.id, 'farm': farm.id},
            format='json'
        )
        assert res_valid.status_code == status.HTTP_201_CREATED
        conn_id = res_valid.data['id']

        # Duplicate connection returns 400 Bad Request, not 500 IntegrityError
        res_dup = api_client.post(
            '/api/v1/aggregators/connections/',
            {'aggregator': aggregator_profile.id, 'farm': farm.id},
            format='json'
        )
        assert res_dup.status_code == status.HTTP_400_BAD_REQUEST

        # Other farmer cannot accept connection (isolated by queryset / permission)
        api_client.force_authenticate(user=farmer_other)
        res_acc_fail = api_client.post(f'/api/v1/aggregators/connections/{conn_id}/accept/')
        assert res_acc_fail.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

        # Farm owner accepts connection
        api_client.force_authenticate(user=farmer_user)
        res_acc = api_client.post(f'/api/v1/aggregators/connections/{conn_id}/accept/')
        assert res_acc.status_code == status.HTTP_200_OK
        conn = AggregatorFarmConnection.objects.get(id=conn_id)
        assert conn.status == AggregatorFarmConnection.Status.ACCEPTED

    def test_milk_collection_validation_and_access(self, api_client, farm, aggregator_profile, aggregator_profile_2):
        """Enforces positive collection amounts and accepted connection status."""
        conn = AggregatorFarmConnection.objects.create(
            aggregator=aggregator_profile,
            farm=farm,
            status=AggregatorFarmConnection.Status.PENDING
        )

        api_client.force_authenticate(user=aggregator_profile.user)
        # Cannot log on pending connection
        res_pending = api_client.post(
            '/api/v1/aggregators/collections/',
            {
                'connection': conn.id,
                'date': '2024-05-01',
                'litres_collected': 50.0,
                'price_per_litre': 45.0,
                'payment_status': 'PAID'
            },
            format='json'
        )
        assert res_pending.status_code == status.HTTP_400_BAD_REQUEST

        # Accept connection
        conn.status = AggregatorFarmConnection.Status.ACCEPTED
        conn.save()

        # Cannot log non-positive litres or price
        res_neg = api_client.post(
            '/api/v1/aggregators/collections/',
            {
                'connection': conn.id,
                'date': '2024-05-01',
                'litres_collected': -10.0,
                'price_per_litre': 45.0
            },
            format='json'
        )
        assert res_neg.status_code == status.HTTP_400_BAD_REQUEST

        # Another aggregator cannot log for this connection
        api_client.force_authenticate(user=aggregator_profile_2.user)
        res_other = api_client.post(
            '/api/v1/aggregators/collections/',
            {
                'connection': conn.id,
                'date': '2024-05-01',
                'litres_collected': 50.0,
                'price_per_litre': 45.0,
                'payment_status': 'PAID'
            },
            format='json'
        )
        assert res_other.status_code == status.HTTP_403_FORBIDDEN

        # Authorized aggregator logs collection successfully
        api_client.force_authenticate(user=aggregator_profile.user)
        res_ok = api_client.post(
            '/api/v1/aggregators/collections/',
            {
                'connection': conn.id,
                'date': '2024-05-01',
                'litres_collected': 80.0,
                'price_per_litre': 45.0,
                'payment_status': 'PAID'
            },
            format='json'
        )
        assert res_ok.status_code == status.HTTP_201_CREATED
        assert float(res_ok.data['total_price']) == 3600.0

    def test_missing_aggregator_profile_handling(self, api_client, farmer_user):
        """User without aggregator profile gets 400 Bad Request on my-profile, not 500 crash."""
        api_client.force_authenticate(user=farmer_user)
        res = api_client.get('/api/v1/aggregators/profiles/my-profile/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in res.data

