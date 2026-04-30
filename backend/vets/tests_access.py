import pytest
from rest_framework.test import APIClient
from rest_framework import status
from animals.models import Animal
from vets.models import VetProfile, VetFarmConnection
from conftest import UserFactory, FarmFactory, AnimalFactory
from farms.models import Farm
from accounts.models import User

@pytest.mark.django_db
class TestVetAccessControl:
    def setup_method(self):
        self.client = APIClient()
        
        # Cleanup to ensure clean state if transaction rollback fails (rare but good practice)
        User.objects.all().delete()
        Farm.objects.all().delete()
        
        # Setup Vet
        self.vet_user = UserFactory(email='vet@example.com')
        self.vet_profile = VetProfile.objects.create(
            user=self.vet_user, 
            license_number='KVB123', 
            specialization='Dairy', 
            years_experience=5,
            county='Nairobi'
        )
        
        # Setup Farm 1 (Connected)
        self.farm1_owner = UserFactory(email='farmer1@example.com')
        # Create Farm explicitly to handle OneToOne with owner correctly if factory is failing
        # FarmFactory usually handles it, but maybe the sequence is off.
        self.farm1 = FarmFactory(owner=self.farm1_owner)
        self.animal1 = AnimalFactory(farm=self.farm1, name="Betsy")
        
        # Connect Vet to Farm 1
        VetFarmConnection.objects.create(
            vet=self.vet_profile, 
            farm=self.farm1, 
            status=VetFarmConnection.Status.ACTIVE,
            requested_by=self.farm1_owner
        )
        
        # Setup Farm 2 (NOT Connected)
        self.farm2_owner = UserFactory(email='farmer2@example.com')
        self.farm2 = FarmFactory(owner=self.farm2_owner)
        self.animal2 = AnimalFactory(farm=self.farm2, name="NotMine")

    def test_vet_can_access_connected_farm_animal(self):
        self.client.force_authenticate(user=self.vet_user)
        url = f'/api/v1/vet/data/{self.animal1.id}/details/' 
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['name'] == "Betsy"

    def test_vet_cannot_access_unconnected_farm_animal(self):
        """CRITICAL: Vet should get 403 for Farm 2"""
        self.client.force_authenticate(user=self.vet_user)
        url = f'/api/v1/vet/data/{self.animal2.id}/details/'
        response = self.client.get(url)
        assert response.status_code == 403
