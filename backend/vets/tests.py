from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import AuditLog
from farms.models import Farm
from vets.models import VetProfile, VetFarmConnection

User = get_user_model()


class VetProfileSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.vet_user_1 = User.objects.create_user(
            phone_number='+254711000001',
            full_name='Dr. Alice Vet',
            role=User.Role.VETERINARIAN
        )
        self.vet_user_2 = User.objects.create_user(
            phone_number='+254711000002',
            full_name='Dr. Bob Vet',
            role=User.Role.VETERINARIAN
        )
        self.vet_user_no_profile = User.objects.create_user(
            phone_number='+254711000003',
            full_name='Dr. Charlie No Profile',
            role=User.Role.VETERINARIAN
        )
        self.farmer_user = User.objects.create_user(
            phone_number='+254711000004',
            full_name='Farmer Dan',
            role=User.Role.FARMER
        )
        self.farmer_no_farm = User.objects.create_user(
            phone_number='+254711000005',
            full_name='Farmer Eve No Farm',
            role=User.Role.FARMER
        )
        self.admin_user = User.objects.create_superuser(
            phone_number='+254711000009',
            full_name='System SuperAdmin'
        )

        # Farm for farmer_user
        self.farm = Farm.objects.create(
            name='Dan Dairy Farm',
            owner=self.farmer_user,
            county='Nakuru'
        )

        # Profiles
        self.vet_profile_1 = VetProfile.objects.create(
            user=self.vet_user_1,
            license_number='KVB-001',
            specialization=VetProfile.Specialization.DAIRY,
            years_experience=5,
            county='Nakuru',
            is_verified=False,
            average_rating=0.0,
            total_reviews=0
        )
        self.vet_profile_2 = VetProfile.objects.create(
            user=self.vet_user_2,
            license_number='KVB-002',
            specialization=VetProfile.Specialization.GENERAL,
            years_experience=10,
            county='Kiambu',
            is_verified=True,
            average_rating=4.8,
            total_reviews=12
        )

    def test_prevent_profile_idor(self):
        """Vet A cannot modify or delete Vet B's profile."""
        self.client.force_authenticate(user=self.vet_user_1)

        # Vet 1 attempts to patch Vet 2's profile (verified, so in queryset)
        res = self.client.patch(
            f'/api/v1/vets/{self.vet_profile_2.id}/',
            {'bio': 'Hijacked bio'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.vet_profile_2.refresh_from_db()
        self.assertNotEqual(self.vet_profile_2.bio, 'Hijacked bio')

        # Vet 1 attempts to delete Vet 2's profile
        res_del = self.client.delete(f'/api/v1/vets/{self.vet_profile_2.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(VetProfile.objects.filter(id=self.vet_profile_2.id).exists())

    def test_prevent_self_verification(self):
        """Vets cannot elevate their own verification status or tamper with ratings."""
        self.client.force_authenticate(user=self.vet_user_1)

        res = self.client.patch(
            f'/api/v1/vets/{self.vet_profile_1.id}/',
            {
                'is_verified': True,
                'average_rating': 5.0,
                'total_reviews': 999
            },
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.vet_profile_1.refresh_from_db()
        self.assertFalse(self.vet_profile_1.is_verified)
        self.assertEqual(float(self.vet_profile_1.average_rating), 0.0)
        self.assertEqual(self.vet_profile_1.total_reviews, 0)

    def test_unverified_vet_can_access_and_edit_own_profile(self):
        """Unverified vet can retrieve and update their own profile without 404 or block."""
        self.client.force_authenticate(user=self.vet_user_1)

        # Direct detail endpoint
        res = self.client.get(f'/api/v1/vets/{self.vet_profile_1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res_patch = self.client.patch(
            f'/api/v1/vets/{self.vet_profile_1.id}/',
            {'clinic_name': 'Alice Dairy Clinic', 'bio': 'Experienced vet'},
            format='json'
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.vet_profile_1.refresh_from_db()
        self.assertEqual(self.vet_profile_1.clinic_name, 'Alice Dairy Clinic')
        self.assertEqual(self.vet_profile_1.bio, 'Experienced vet')

        # my-profile endpoint
        res_my = self.client.get('/api/v1/vets/my-profile/')
        self.assertEqual(res_my.status_code, status.HTTP_200_OK)
        self.assertEqual(res_my.data['clinic_name'], 'Alice Dairy Clinic')

    def test_unverified_vet_omitted_from_public_directory(self):
        """Unverified vets do not appear in public search directory for farmers."""
        self.client.force_authenticate(user=self.farmer_user)

        res = self.client.get('/api/v1/vets/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get('results', [])
        ids = [v['id'] for v in results]
        self.assertIn(self.vet_profile_2.id, ids)
        self.assertNotIn(self.vet_profile_1.id, ids)

    def test_graceful_handling_missing_vet_profile(self):
        """User with no VetProfile gets 400 Bad Request with friendly message instead of 500 error."""
        self.client.force_authenticate(user=self.vet_user_no_profile)

        # my-profile endpoint
        res_my = self.client.get('/api/v1/vets/my-profile/')
        self.assertEqual(res_my.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res_my.data)

        # vet data dashboard
        res_dash = self.client.get('/api/v1/vet/data/dashboard/')
        self.assertEqual(res_dash.status_code, status.HTTP_400_BAD_REQUEST)

        # vet data farms
        res_farms = self.client.get('/api/v1/vet/data/farms/')
        self.assertEqual(res_farms.status_code, status.HTTP_400_BAD_REQUEST)

        # vet data records
        res_records = self.client.get('/api/v1/vet/data/records/')
        self.assertEqual(res_records.status_code, status.HTTP_400_BAD_REQUEST)

    def test_farmer_connect_validation(self):
        """Farmer without farm cannot connect, farmer with farm can connect cleanly."""
        # Farmer without farm
        self.client.force_authenticate(user=self.farmer_no_farm)
        res_err = self.client.post(f'/api/v1/vets/{self.vet_profile_2.id}/connect/')
        self.assertEqual(res_err.status_code, status.HTTP_400_BAD_REQUEST)

        # Farmer with farm
        self.client.force_authenticate(user=self.farmer_user)
        res = self.client.post(f'/api/v1/vets/{self.vet_profile_2.id}/connect/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(VetFarmConnection.objects.filter(
            vet=self.vet_profile_2,
            farm=self.farm,
            status=VetFarmConnection.Status.PENDING
        ).exists())

    def test_vet_manage_connections(self):
        """Vet can accept or decline connection requests."""
        conn = VetFarmConnection.objects.create(
            vet=self.vet_profile_2,
            farm=self.farm,
            requested_by=self.farmer_user,
            status=VetFarmConnection.Status.PENDING
        )

        # Vet 2 accepts
        self.client.force_authenticate(user=self.vet_user_2)
        res_accept = self.client.post(
            '/api/v1/vet/data/connections/',
            {'id': conn.id, 'action': 'accept'},
            format='json'
        )
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        conn.refresh_from_db()
        self.assertEqual(conn.status, VetFarmConnection.Status.ACTIVE)

        # Vet 2 declines
        res_decline = self.client.post(
            '/api/v1/vet/data/connections/',
            {'id': conn.id, 'action': 'reject'},
            format='json'
        )
        self.assertEqual(res_decline.status_code, status.HTTP_200_OK)
        conn.refresh_from_db()
        self.assertEqual(conn.status, VetFarmConnection.Status.DECLINED)

    def test_superadmin_verification_and_protection(self):
        """Superadmin can verify profiles and delete with audit log; normal vet cannot delete."""
        # Vet 1 attempts to delete own profile -> 403 denied
        self.client.force_authenticate(user=self.vet_user_1)
        res_del = self.client.delete(f'/api/v1/vets/{self.vet_profile_1.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)

        # Superadmin verifies profile
        self.client.force_authenticate(user=self.admin_user)
        res_verify = self.client.patch(
            f'/api/v1/vets/{self.vet_profile_1.id}/',
            {'is_verified': True},
            format='json'
        )
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.vet_profile_1.refresh_from_db()
        self.assertTrue(self.vet_profile_1.is_verified)

        # Superadmin deletes profile
        res_admin_del = self.client.delete(f'/api/v1/vets/{self.vet_profile_1.id}/')
        self.assertEqual(res_admin_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VetProfile.objects.filter(id=self.vet_profile_1.id).exists())
        self.assertTrue(AuditLog.objects.filter(
            action='DELETE',
            model_name='VetProfile',
            object_id=str(self.vet_profile_1.id)
        ).exists())

