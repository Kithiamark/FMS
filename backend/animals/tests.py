import pytest
from rest_framework.test import APIClient
from rest_framework import status
from animals.models import Animal
from conftest import UserFactory, FarmFactory, AnimalFactory

@pytest.mark.django_db
class TestAnimalSecurity:
    def setup_method(self):
        self.client = APIClient()
        self.user1 = UserFactory()
        self.farm1 = FarmFactory(owner=self.user1)
        self.user1.farm = self.farm1
        self.user1.save()
        
        self.user2 = UserFactory()
        self.farm2 = FarmFactory(owner=self.user2)
        self.user2.farm = self.farm2
        self.user2.save()

    def test_cross_farm_access_prevention(self):
        """CRITICAL: User 1 should NOT see User 2's animals"""
        AnimalFactory(farm=self.farm1, name="Cow1")
        AnimalFactory(farm=self.farm2, name="Cow2")
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/animals/')
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['name'] == "Cow1"

    def test_unauthorized_access(self):
        """Unauthenticated users should get 401"""
        response = self.client.get('/api/v1/animals/')
        assert response.status_code == 401

    def test_duplicate_ear_tag_returns_400(self):
        """Intra-farm duplicate ear tag returns 400 Bad Request instead of 500 IntegrityError."""
        self.client.force_authenticate(user=self.user1)
        data = {
            "name": "Bessie 1",
            "ear_tag": "TAG-100",
            "breed": "Friesian",
            "sex": "Cow",
            "date_of_birth": "2021-01-01",
            "weight_kg": 450.0,
            "health_status": "Healthy"
        }
        res1 = self.client.post('/api/v1/animals/', data, format='json')
        assert res1.status_code == status.HTTP_201_CREATED

        # Duplicate post on same farm
        res2 = self.client.post('/api/v1/animals/', data, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ear_tag' in res2.data

    def test_validation_negative_weight_and_future_dob(self):
        """Validates biological and temporal bounds on animals."""
        self.client.force_authenticate(user=self.user1)

        # Negative weight
        res_neg = self.client.post('/api/v1/animals/', {
            "name": "Invalid Cow",
            "ear_tag": "TAG-NEG",
            "breed": "Friesian",
            "sex": "Cow",
            "date_of_birth": "2021-01-01",
            "weight_kg": -20.0
        }, format='json')
        assert res_neg.status_code == status.HTTP_400_BAD_REQUEST

        # Future birth date
        res_future = self.client.post('/api/v1/animals/', {
            "name": "Future Cow",
            "ear_tag": "TAG-FUT",
            "breed": "Friesian",
            "sex": "Cow",
            "date_of_birth": "2099-01-01",
            "weight_kg": 400.0
        }, format='json')
        assert res_future.status_code == status.HTTP_400_BAD_REQUEST

    def test_worker_cannot_delete_animal(self):
        """Farm worker cannot delete or archive animal records."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        worker = User.objects.create_user(
            phone_number='+254799000111',
            full_name='Worker Sam',
            role=User.Role.FARM_WORKER,
            assigned_farm=self.farm1
        )
        animal = AnimalFactory(farm=self.farm1, name="CowProtected")

        self.client.force_authenticate(user=worker)
        res = self.client.delete(f'/api/v1/animals/{animal.id}/')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        animal.refresh_from_db()
        assert animal.is_active is True

    def test_owner_can_soft_delete_animal_with_audit_log(self):
        """Owner can archive animal; health_status preserved and AuditLog written."""
        from core.models import AuditLog
        animal = AnimalFactory(farm=self.farm1, name="CowArchive", health_status=Animal.HealthStatus.HEALTHY)

        self.client.force_authenticate(user=self.user1)
        res = self.client.delete(f'/api/v1/animals/{animal.id}/')
        assert res.status_code == status.HTTP_204_NO_CONTENT

        animal.refresh_from_db()
        assert animal.is_active is False
        # Ensure health status was NOT forcibly mutated to DECEASED
        assert animal.health_status == Animal.HealthStatus.HEALTHY

        # AuditLog verified
        assert AuditLog.objects.filter(
            action='DELETE',
            model_name='Animal',
            object_id=str(animal.id)
        ).exists()

    def test_connected_vet_can_access_animal_records(self):
        """Connected veterinarian can view and record health logs for animal."""
        from django.contrib.auth import get_user_model
        from vets.models import VetProfile, VetFarmConnection
        User = get_user_model()
        vet_user = User.objects.create_user(
            phone_number='+254799000222',
            full_name='Dr. Vet Connected',
            role=User.Role.VETERINARIAN
        )
        vet_profile = VetProfile.objects.create(
            user=vet_user,
            license_number='KVB-ANIMAL-01',
            specialization='Dairy',
            years_experience=4,
            county='Nairobi',
            is_verified=True
        )
        VetFarmConnection.objects.create(
            vet=vet_profile,
            farm=self.farm1,
            status=VetFarmConnection.Status.ACTIVE,
            requested_by=vet_user
        )
        animal = AnimalFactory(farm=self.farm1, name="VetPatient")

        self.client.force_authenticate(user=vet_user)
        # Direct animal detail
        res_get = self.client.get(f'/api/v1/animals/{animal.id}/')
        assert res_get.status_code == status.HTTP_200_OK

        # Record health log
        res_health = self.client.post(
            f'/api/v1/animals/{animal.id}/health/',
            {
                'date': '2024-01-01',
                'diagnosis': 'Mastitis early check',
                'treatment': 'Intramammary antibiotics',
                'cost_kes': 1200
            },
            format='json'
        )
        assert res_health.status_code == status.HTTP_201_CREATED

    def test_health_and_vaccination_validation(self):
        """Enforces non-negative costs and logical vaccination dates."""
        animal = AnimalFactory(farm=self.farm1, name="HealthyCow")
        self.client.force_authenticate(user=self.user1)

        # Negative health cost
        res_cost = self.client.post(
            f'/api/v1/animals/{animal.id}/health/',
            {
                'date': '2024-01-01',
                'diagnosis': 'Checkup',
                'treatment': 'Vitamins',
                'cost_kes': -500
            },
            format='json'
        )
        assert res_cost.status_code == status.HTTP_400_BAD_REQUEST

        # Next due date before date given
        res_vax = self.client.post(
            f'/api/v1/animals/{animal.id}/vaccinations/',
            {
                'vaccine_name': 'Anthrax Vaccine',
                'date_given': '2024-06-01',
                'next_due_date': '2024-01-01',
                'given_by': 'Dr. Alice'
            },
            format='json'
        )
        assert res_vax.status_code == status.HTTP_400_BAD_REQUEST
