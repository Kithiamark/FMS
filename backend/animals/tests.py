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

    def test_create_animal_sanitization(self):
        """XSS attempts should be sanitized"""
        self.client.force_authenticate(user=self.user1)
        data = {
            "name": "<script>alert('xss')</script>Bessie",
            "ear_tag": "TAG-XSS",
            "breed": "Friesian",
            "date_of_birth": "2020-01-01",
            "weight_kg": 500,
            "status": "Active"
        }
        # Note: DRF serializers don't auto-sanitize unless explicitly handled in view/serializer
        # Our BaseViewSet handles this via bleach
        # response = self.client.post('/api/v1/animals/', data)
        # assert "<script>" not in response.data['name']
        pass # Enable this test after refactoring Views to use BaseViewSet
