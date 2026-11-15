import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import AuditLog
from admin_panel.models import SupportTicket, TicketMessage, SystemLog, Announcement
from vets.models import VetProfile
from farms.models import Farm
from finance.models import Subscription

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(
        phone_number='+254700099001',
        email='superadmin@fms.test',
        password='Password123!',
        role='ADMIN',
        full_name='Platform Super Admin'
    )

@pytest.fixture
def staff_admin(db):
    return User.objects.create_user(
        phone_number='+254700099002',
        email='staff@fms.test',
        password='Password123!',
        role='ADMIN',
        is_staff=True,
        is_superuser=False,
        full_name='Staff Admin'
    )

@pytest.fixture
def farmer(db):
    user = User.objects.create_user(
        phone_number='+254700099003',
        email='farmer@fms.test',
        password='Password123!',
        role='FARMER',
        full_name='Test Farmer'
    )
    Farm.objects.create(owner=user, name='Green Pastures')
    return user

@pytest.fixture
def vet_user(db):
    user = User.objects.create_user(
        phone_number='+254700099004',
        email='dr.vet@fms.test',
        password='Password123!',
        role='VETERINARIAN',
        full_name='Dr. Test Vet'
    )
    VetProfile.objects.create(
        user=user,
        license_number='KVB-998877',
        specialization='Dairy',
        years_experience=6,
        county='Nakuru',
        is_verified=False
    )
    return user

@pytest.mark.django_db
class TestAdminPanelSecurity:

    def test_admin_stats_permission_lockout(self, api_client, farmer, staff_admin, superuser):
        # Unauthenticated request
        res = api_client.get('/api/v1/admin/stats/')
        assert res.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

        # Farmer request
        api_client.force_authenticate(user=farmer)
        res = api_client.get('/api/v1/admin/stats/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        res = api_client.get('/api/v1/admin/recent-otps/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # Staff admin request
        api_client.force_authenticate(user=staff_admin)
        res = api_client.get('/api/v1/admin/stats/')
        assert res.status_code == status.HTTP_200_OK
        assert 'total_farmers' in res.data

        # Superadmin request
        api_client.force_authenticate(user=superuser)
        res = api_client.get('/api/v1/admin/stats/')
        assert res.status_code == status.HTTP_200_OK

    def test_impersonation_superadmin_requirement_and_safeguards(self, api_client, farmer, staff_admin, superuser):
        # 1. Non-superadmin staff receives 403
        api_client.force_authenticate(user=staff_admin)
        res = api_client.post(f'/api/v1/admin/users/{farmer.id}/impersonate/')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only platform super administrators' in res.data.get('error', '')

        # 2. Superadmin cannot impersonate themselves
        api_client.force_authenticate(user=superuser)
        res = api_client.post(f'/api/v1/admin/users/{superuser.id}/impersonate/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot impersonate your own' in res.data.get('error', '')

        # 3. Superadmin cannot impersonate another staff or admin
        res = api_client.post(f'/api/v1/admin/users/{staff_admin.id}/impersonate/')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert 'administrative or staff accounts is forbidden' in res.data.get('error', '')

        # 4. Superadmin successfully impersonates regular user
        res = api_client.post(f'/api/v1/admin/users/{farmer.id}/impersonate/')
        assert res.status_code == status.HTTP_200_OK
        assert 'access' in res.data
        assert 'refresh' in res.data

        # Verify AuditLog created
        audit_log = AuditLog.objects.filter(action='USER_IMPERSONATED').last()
        assert audit_log is not None
        assert audit_log.user == superuser
        assert audit_log.object_id == str(farmer.id)
        assert audit_log.metadata['target_email'] == farmer.email

    def test_vet_verification_audit_logging(self, api_client, staff_admin, vet_user):
        vet_profile = vet_user.vet_profile
        api_client.force_authenticate(user=staff_admin)

        # 1. Approve vet
        res = api_client.patch(f'/api/v1/admin/vets/{vet_profile.id}/verify/', {'action': 'approve'})
        assert res.status_code == status.HTTP_200_OK
        vet_profile.refresh_from_db()
        assert vet_profile.is_verified is True

        audit_approve = AuditLog.objects.filter(action='VET_VERIFIED').last()
        assert audit_approve is not None
        assert audit_approve.user == staff_admin
        assert audit_approve.metadata['vet_email'] == vet_user.email
        assert audit_approve.metadata['license_number'] == 'KVB-998877'

        # 2. Reject vet
        res = api_client.patch(
            f'/api/v1/admin/vets/{vet_profile.id}/verify/',
            {'action': 'reject', 'reason': 'Invalid KVB registration'}
        )
        assert res.status_code == status.HTTP_200_OK
        vet_profile.refresh_from_db()
        assert vet_profile.is_verified is False

        audit_reject = AuditLog.objects.filter(action='VET_REJECTED').last()
        assert audit_reject is not None
        assert audit_reject.user == staff_admin
        assert audit_reject.metadata['action'] == 'reject'
        assert audit_reject.metadata['reason'] == 'Invalid KVB registration'

    def test_user_deletion_safeguards(self, api_client, staff_admin, superuser):
        target_to_delete = User.objects.create_user(
            phone_number='+254700099099',
            email='delete.me@fms.test',
            password='Password123!',
            role='FARMER',
            full_name='Delete Me'
        )

        # 1. Non-superadmin staff receives 403
        api_client.force_authenticate(user=staff_admin)
        res = api_client.delete(f'/api/v1/admin/users/{target_to_delete.id}/')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert User.objects.filter(id=target_to_delete.id).exists()

        # 2. Superadmin cannot delete themselves
        api_client.force_authenticate(user=superuser)
        res = api_client.delete(f'/api/v1/admin/users/{superuser.id}/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot delete their own active account' in res.data.get('error', '')
        assert User.objects.filter(id=superuser.id).exists()

        # 3. Superadmin successfully deletes target user
        res = api_client.delete(f'/api/v1/admin/users/{target_to_delete.id}/')
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=target_to_delete.id).exists()

        audit = AuditLog.objects.filter(action='DELETE', model_name='User').last()
        assert audit is not None
        assert audit.user == superuser
        assert audit.metadata['deleted_email'] == 'delete.me@fms.test'

    def test_support_ticket_messages_validation(self, api_client, farmer):
        other_farmer = User.objects.create_user(
            phone_number='+254700099088',
            email='other.farmer@fms.test',
            password='Password123!',
            role='FARMER',
            full_name='Other Farmer'
        )
        Farm.objects.create(owner=other_farmer, name='Other Farm')

        ticket = SupportTicket.objects.create(
            farm=farmer.farm,
            raised_by=farmer,
            category='ACCOUNT',
            subject='Update Account Info',
            description='Please change my official name.'
        )

        # 1. Empty message is rejected
        api_client.force_authenticate(user=farmer)
        res = api_client.post(f'/api/v1/admin/tickets/{ticket.id}/messages/', {'content': '   '})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Message content cannot be empty.' in str(res.data)

        # 2. Another tenant cannot post to ticket
        api_client.force_authenticate(user=other_farmer)
        res = api_client.post(f'/api/v1/admin/tickets/{ticket.id}/messages/', {'content': 'Intruder message'})
        assert res.status_code == status.HTTP_404_NOT_FOUND

        # 3. Owner can post valid message
        api_client.force_authenticate(user=farmer)
        res = api_client.post(f'/api/v1/admin/tickets/{ticket.id}/messages/', {'content': 'Here are my new details.'})
        assert res.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert TicketMessage.objects.filter(ticket=ticket, sender=farmer).exists()

        # 4. Superadmin can retrieve message thread via GET
        api_client.force_authenticate(user=farmer)
        res = api_client.get(f'/api/v1/admin/tickets/{ticket.id}/messages/')
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data) >= 1
        assert res.data[0]['content'] == 'Here are my new details.'

    def test_admin_user_filtering_and_toggle_active(self, api_client, superuser, farmer):
        api_client.force_authenticate(user=superuser)

        # 1. Filter by role
        res = api_client.get('/api/v1/admin/users/?role=FARMER')
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results') if isinstance(res.data, dict) else res.data
        assert any(u['id'] == farmer.id for u in results)

        # 2. Search by phone
        res = api_client.get(f'/api/v1/admin/users/?search={farmer.phone_number}')
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results') if isinstance(res.data, dict) else res.data
        assert any(u['id'] == farmer.id for u in results)

        # 3. Toggle active
        assert farmer.is_active is True
        res = api_client.patch(f'/api/v1/admin/users/{farmer.id}/toggle-active/')
        assert res.status_code == status.HTTP_200_OK
        farmer.refresh_from_db()
        assert farmer.is_active is False

        # Reactivate
        res = api_client.patch(f'/api/v1/admin/users/{farmer.id}/toggle-active/')
        assert res.status_code == status.HTTP_200_OK
        farmer.refresh_from_db()
        assert farmer.is_active is True

    def test_admin_subscriptions_list_and_override(self, api_client, superuser, farmer):
        api_client.force_authenticate(user=superuser)
        sub = Subscription.objects.create(
            farm=farmer.farm,
            plan=Subscription.Plan.TRIAL,
            status=Subscription.Status.ACTIVE
        )

        # 1. List subscriptions
        res = api_client.get('/api/v1/admin/subscriptions/')
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results') if isinstance(res.data, dict) else res.data
        assert any(s['id'] == sub.id for s in results)

        # 2. Override plan and extend duration
        res = api_client.patch(f'/api/v1/admin/subscriptions/{sub.id}/override/', {
            'plan': 'Premium',
            'status': 'Active',
            'extend_days': 30
        })
        assert res.status_code == status.HTTP_200_OK
        sub.refresh_from_db()
        assert sub.plan == 'Premium'
        assert sub.end_date is not None

    def test_admin_announcements_crud(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)

        # 1. Create announcement
        res = api_client.post('/api/v1/admin/announcements/', {
            'title': 'Emergency FMD Advisory',
            'body': 'Foot and Mouth disease vaccinations are required across Nakuru county.',
            'target_audience': 'FARMERS',
            'is_published': True
        })
        assert res.status_code == status.HTTP_201_CREATED
        announcement_id = res.data['id']
        assert res.data['title'] == 'Emergency FMD Advisory'
        assert res.data['created_by_name'] == superuser.full_name

        # 2. List announcements
        res = api_client.get('/api/v1/admin/announcements/')
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results') if isinstance(res.data, dict) else res.data
        assert any(a['id'] == announcement_id for a in results)

        # 3. Delete announcement
        res = api_client.delete(f'/api/v1/admin/announcements/{announcement_id}/')
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not Announcement.objects.filter(id=announcement_id).exists()



