import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from farms.models import Farm, WorkerTask
from core.models import AuditLog

User = get_user_model()

@pytest.mark.django_db
class TestFarmViewSet:
    def setup_method(self):
        self.client = APIClient()
        self.farmer = User.objects.create_user(
            phone_number='+254711111111',
            full_name='Alice Farmer',
            password='password123',
            role=User.Role.FARMER
        )
        self.farm = Farm.objects.create(
            owner=self.farmer,
            name="Alice's Farm",
            county="Kiambu",
            sub_county="Thika"
        )
        self.worker = User.objects.create_user(
            phone_number='+254722222222',
            full_name='Bob Worker',
            password='password123',
            role=User.Role.FARM_WORKER,
            assigned_farm=self.farm
        )
        self.superadmin = User.objects.create_superuser(
            phone_number='+254700000001',
            full_name='Admin User',
            password='adminpassword'
        )

    def test_post_farm_upsert_avoids_integrity_error(self):
        """Posting to /farms/ when user already has a farm updates the farm without 500 error."""
        self.client.force_authenticate(user=self.farmer)
        payload = {
            'name': 'Green Hills Valley',
            'county': 'Nakuru',
            'sub_county': 'Naivasha',
            'animals': 18,
            'size_acres': 12.5
        }
        response = self.client.post('/api/v1/farms/', payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Green Hills Valley'
        assert response.data['county'] == 'Nakuru'
        assert response.data['estimated_herd_size'] == 18
        assert float(response.data['size_acres']) == 12.5

        # Check in DB
        self.farm.refresh_from_db()
        assert self.farm.name == 'Green Hills Valley'
        assert self.farm.estimated_herd_size == 18
        assert Farm.objects.filter(owner=self.farmer).count() == 1

    def test_worker_can_view_assigned_farm(self):
        """Worker can view their assigned farm."""
        self.client.force_authenticate(user=self.worker)
        response = self.client.get('/api/v1/farms/')
        assert response.status_code == status.HTTP_200_OK
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(results) == 1
        assert results[0]['id'] == self.farm.id
        assert results[0]['name'] == "Alice's Farm"

        detail_response = self.client.get(f'/api/v1/farms/{self.farm.id}/')
        assert detail_response.status_code == status.HTTP_200_OK
        assert detail_response.data['id'] == self.farm.id

    def test_worker_cannot_modify_farm(self):
        """Worker cannot mutate the farm profile."""
        self.client.force_authenticate(user=self.worker)
        response = self.client.patch(f'/api/v1/farms/{self.farm.id}/', {'name': 'Mutated By Worker'})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        self.farm.refresh_from_db()
        assert self.farm.name == "Alice's Farm"

    def test_farmer_cannot_delete_farm(self):
        """Farmer cannot delete farm directly (prevents catastrophic cascade data loss)."""
        self.client.force_authenticate(user=self.farmer)
        response = self.client.delete(f'/api/v1/farms/{self.farm.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Farm.objects.filter(id=self.farm.id).exists()

    def test_superadmin_delete_requires_confirmation(self):
        """Superadmin cannot delete farm without explicit confirm parameter."""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.delete(f'/api/v1/farms/{self.farm.id}/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'confirm=true' in response.data['detail']
        assert Farm.objects.filter(id=self.farm.id).exists()

        # Delete with confirmation
        confirm_response = self.client.delete(f'/api/v1/farms/{self.farm.id}/?confirm=true')
        assert confirm_response.status_code == status.HTTP_204_NO_CONTENT
        assert not Farm.objects.filter(id=self.farm.id).exists()

        # Verify audit log was created
        audit_entry = AuditLog.objects.filter(action='DELETE', model_name='Farm', object_id=str(self.farm.id)).first()
        assert audit_entry is not None
        assert audit_entry.user == self.superadmin

    def test_validation_negative_numbers(self):
        """Validation errors on negative acres or animals."""
        self.client.force_authenticate(user=self.farmer)
        response = self.client.post('/api/v1/farms/', {'name': 'Valid Name', 'size_acres': -5})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'size_acres' in response.data

        response_animals = self.client.post('/api/v1/farms/', {'name': 'Valid Name', 'animals': -3})
        assert response_animals.status_code == status.HTTP_400_BAD_REQUEST

    def test_prevent_cross_farm_task_assignment(self):
        """Farmer cannot assign tasks to a worker from another farm."""
        farmer2 = User.objects.create_user(
            phone_number='+254733333333',
            full_name='Farmer Two',
            password='password123',
            role=User.Role.FARMER
        )
        farm2 = Farm.objects.create(owner=farmer2, name='Farm Two')
        worker2 = User.objects.create_user(
            phone_number='+254744444444',
            full_name='Worker Two',
            password='password123',
            role=User.Role.FARM_WORKER,
            assigned_farm=farm2
        )

        self.client.force_authenticate(user=self.farmer)
        payload = {
            'title': 'Milking cows',
            'assigned_to': worker2.id
        }
        response = self.client.post('/api/v1/tasks/', payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'assigned_to' in response.data

    def test_worker_cannot_create_task(self):
        """Farm worker cannot create or assign tasks."""
        self.client.force_authenticate(user=self.worker)
        payload = {
            'title': 'Unauthorized Task',
            'assigned_to': self.worker.id
        }
        response = self.client.post('/api/v1/tasks/', payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_worker_cannot_modify_other_workers_task(self):
        """Worker A cannot modify Worker B's task."""
        other_worker = User.objects.create_user(
            phone_number='+254755555555',
            full_name='Charlie Worker',
            password='password123',
            role=User.Role.FARM_WORKER,
            assigned_farm=self.farm
        )
        task = WorkerTask.objects.create(
            farm=self.farm,
            assigned_to=other_worker,
            title='Clean Pens',
            status=WorkerTask.Status.PENDING
        )

        self.client.force_authenticate(user=self.worker)
        response = self.client.patch(f'/api/v1/tasks/{task.id}/', {'status': 'COMPLETED'})
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_worker_can_update_own_task_status_only(self):
        """Worker can update the status of their own task, but cannot alter title or description."""
        task = WorkerTask.objects.create(
            farm=self.farm,
            assigned_to=self.worker,
            title='Morning Feeding',
            description='Feed calves',
            status=WorkerTask.Status.PENDING
        )

        self.client.force_authenticate(user=self.worker)
        # Attempting to change title is blocked
        forbidden_response = self.client.patch(f'/api/v1/tasks/{task.id}/', {'title': 'Changed Title'})
        assert forbidden_response.status_code == status.HTTP_403_FORBIDDEN

        # Updating status succeeds
        ok_response = self.client.patch(f'/api/v1/tasks/{task.id}/', {'status': 'COMPLETED'})
        assert ok_response.status_code == status.HTTP_200_OK
        task.refresh_from_db()
        assert task.status == 'COMPLETED'
        assert task.completed_at is not None

    def test_worker_cannot_delete_task(self):
        """Worker cannot delete tasks."""
        task = WorkerTask.objects.create(
            farm=self.farm,
            assigned_to=self.worker,
            title='Evening Milking',
            status=WorkerTask.Status.PENDING
        )
        self.client.force_authenticate(user=self.worker)
        response = self.client.delete(f'/api/v1/tasks/{task.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert WorkerTask.objects.filter(id=task.id).exists()


