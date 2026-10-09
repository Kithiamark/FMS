import pytest
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status
from conftest import UserFactory, FarmFactory, AnimalFactory
from animals.models import Animal


@pytest.mark.django_db
class TestAIAssistantChat:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.farm = FarmFactory(owner=self.user, name="Green Pastures Dairy", county="Kiambu")
        self.user.farm = self.farm
        self.user.save()

        # Seed animals
        self.cow1 = AnimalFactory(farm=self.farm, name="Baraka", breed="Friesian", health_status=Animal.HealthStatus.HEALTHY)
        self.cow2 = AnimalFactory(farm=self.farm, name="Neema", breed="Ayrshire", health_status=Animal.HealthStatus.SICK)

    def test_unauthenticated_request_blocked(self):
        """Unauthenticated requests must be rejected with 401."""
        response = self.client.post("/api/v1/ai/chat/", {"message": "Hello"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chat_missing_message_returns_400(self):
        """Empty or missing message should return 400 Bad Request."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/v1/ai/chat/", {"message": "   "}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_fallback_chat_with_farm_context_mastitis(self):
        """When GEMINI_API_KEY is not set or in offline mode, mastitis queries return domain guidance and farm context."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/chat/",
            {"message": "What should I do if one of my cows has mastitis?"},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["mode"] == "offline_fallback"
        assert data["provider"] == "arvion-dairy-knowledge-base"
        assert "CMT" in data["response"] or "California Mastitis Test" in data["response"]
        assert "Green Pastures Dairy" in data["response"]
        assert data["farm_context"]["farm_name"] == "Green Pastures Dairy"
        assert data["farm_context"]["county"] == "Kiambu"
        assert data["farm_context"]["active_animals"] == 2
        assert data["farm_context"]["sick_animals"] == 1

    def test_fallback_chat_feed_question(self):
        """Feed inquiries return balanced ration recommendations."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/chat/",
            {"message": "How much silage and dairy meal concentrate should I feed daily?"},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "silage" in response.data["response"].lower() or "ration" in response.data["response"].lower()

    def test_fallback_chat_buyer_question(self):
        """Buyer queries reference the find-buyer platform feature."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/ai/chat/",
            {"message": "Where can I sell my morning milk and connect to buyers?"},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "/find-buyer" in response.data["response"]

    @patch("animals.ai_views.requests.post")
    def test_gemini_live_call_mocked(self, mock_post):
        """When GEMINI_API_KEY is set and Gemini API responds, return live mode and AI text."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Hello Baraka and Neema from Kiambu! Maintain a 16% protein concentrate ration."}
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        with patch("animals.ai_views.settings.GEMINI_API_KEY", "test-fake-gemini-key"):
            self.client.force_authenticate(user=self.user)
            response = self.client.post(
                "/api/v1/ai/chat/",
                {"message": "Give me feeding advice for my herd"},
                format="json"
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.data["mode"] == "live"
            assert response.data["provider"] == "gemini-3.8-flash"
            assert "Kiambu" in response.data["response"]
            assert response.data["farm_context"]["farm_name"] == "Green Pastures Dairy"

    @patch("animals.ai_views.requests.post")
    def test_gemini_failure_gracefully_falls_back(self, mock_post):
        """If Gemini API fails with network error, view falls back to offline engine without 500 error."""
        mock_post.side_effect = Exception("Google Generative AI service unreachable")

        with patch("animals.ai_views.settings.GEMINI_API_KEY", "test-fake-gemini-key"):
            self.client.force_authenticate(user=self.user)
            response = self.client.post(
                "/api/v1/ai/chat/",
                {"message": "How do I detect heat?"},
                format="json"
            )
            assert response.status_code == status.HTTP_200_OK
            assert response.data["mode"] == "offline_fallback"
            assert response.data["provider"] == "arvion-dairy-knowledge-base"
            assert "heat" in response.data["response"].lower()
