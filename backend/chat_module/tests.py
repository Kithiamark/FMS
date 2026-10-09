import pytest
from rest_framework.test import APIClient
from rest_framework import status
from conftest import UserFactory, FarmFactory
from vets.models import VetProfile
from chat_module.models import Conversation, Message


@pytest.mark.django_db
class TestChatModuleDirectMessages:
    def setup_method(self):
        self.client = APIClient()

        # Farmer 1 and Farm 1
        self.farmer1 = UserFactory(role='FARMER', full_name="Farmer John")
        self.farm1 = FarmFactory(owner=self.farmer1, name="Sunrise Valley Farm")
        self.farmer1.farm = self.farm1
        self.farmer1.save()

        # Vet 1 and Profile 1
        self.vet_user1 = UserFactory(role='VETERINARIAN', full_name="Dr. Jane Doe")
        self.vet1 = VetProfile.objects.create(
            user=self.vet_user1,
            license_number="VET-8821",
            specialization=VetProfile.Specialization.DAIRY,
            years_experience=5,
            county="Kiambu",
            clinic_name="Valley Vet Care",
            is_verified=True
        )

        # Farmer 2 and Farm 2 (Unrelated party)
        self.farmer2 = UserFactory(role='FARMER', full_name="Farmer Bob")
        self.farm2 = FarmFactory(owner=self.farmer2, name="Highland Pastures")
        self.farmer2.farm = self.farm2
        self.farmer2.save()

        # Active conversation between Vet 1 and Farm 1
        self.conversation = Conversation.objects.create(vet=self.vet1, farm=self.farm1)

    def test_unauthenticated_requests_blocked(self):
        """Unauthenticated requests to messages endpoints must be rejected."""
        res_get = self.client.get(f'/api/v1/chat/conversations/{self.conversation.id}/messages/')
        assert res_get.status_code == status.HTTP_401_UNAUTHORIZED

        res_post = self.client.post(f'/api/v1/chat/conversations/{self.conversation.id}/messages/', {'content': 'Hello'})
        assert res_post.status_code == status.HTTP_401_UNAUTHORIZED

    def test_farmer_can_send_message_via_http_post(self):
        """Farmer 1 can send a message to Vet 1 via HTTP POST."""
        self.client.force_authenticate(user=self.farmer1)
        response = self.client.post(
            f'/api/v1/chat/conversations/{self.conversation.id}/messages/',
            {'content': 'Hello Dr. Jane, can you check cow #12 tomorrow?'}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['content'] == 'Hello Dr. Jane, can you check cow #12 tomorrow?'
        assert response.data['is_me'] is True
        assert Message.objects.filter(conversation=self.conversation).count() == 1

    def test_vet_can_send_message_via_http_post(self):
        """Vet 1 can respond to Farmer 1 via HTTP POST."""
        self.client.force_authenticate(user=self.vet_user1)
        response = self.client.post(
            f'/api/v1/chat/conversations/{self.conversation.id}/messages/',
            {'content': 'Sure John, I will be there at 10 AM.'}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['content'] == 'Sure John, I will be there at 10 AM.'
        assert response.data['is_me'] is True

    def test_empty_message_rejected(self):
        """Empty or whitespace-only messages must return 400 Bad Request."""
        self.client.force_authenticate(user=self.farmer1)
        response = self.client.post(
            f'/api/v1/chat/conversations/{self.conversation.id}/messages/',
            {'content': '   '}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_unauthorized_user_cannot_post_to_foreign_conversation(self):
        """Farmer 2 cannot send messages or access conversations of Farm 1."""
        self.client.force_authenticate(user=self.farmer2)
        response = self.client.post(
            f'/api/v1/chat/conversations/{self.conversation.id}/messages/',
            {'content': 'I am spying on you.'}
        )
        # Should be 404 (because get_queryset filters by user's farm) or 403
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_get_or_create_conversation_by_farmer(self):
        """Farmer can look up or initialize conversation with a Vet."""
        self.client.force_authenticate(user=self.farmer1)
        response = self.client.post(
            '/api/v1/chat/conversations/get-or-create/',
            {'vet_id': str(self.vet1.id)}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(self.conversation.id)
        assert 'Jane Doe' in response.data['partner_name']
