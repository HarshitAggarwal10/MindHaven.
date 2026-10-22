import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class DiaryEntryApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com",
            password="strong-password",
        )
        self.token = jwt.encode({"id": self.user.pk}, getattr(settings, "JWT_SECRET", "dev-jwt-secret"), algorithm="HS256")

    def test_detail_endpoint_returns_decrypted_entry(self):
        create_response = self.client.post(
            reverse("diary-create"),
            {"title": "My first entry", "content": "Hello diary", "password": "strong-password"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 201)
        entry_id = create_response.json()["id"]

        detail_response = self.client.get(
            reverse("diary-detail", args=[entry_id]),
            {"password": "strong-password"},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["title"], "My first entry")
        self.assertEqual(detail_response.json()["content"], "Hello diary")

    def test_create_entry_allows_blank_title(self):
        create_response = self.client.post(
            reverse("diary-create"),
            {"title": "", "content": "Hello diary", "password": "strong-password"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["title"], "")

    def test_detail_endpoint_fails_with_invalid_password(self):
        create_response = self.client.post(
            reverse("diary-create"),
            {"title": "My first entry", "content": "Hello diary", "password": "strong-password"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(create_response.status_code, 201)
        entry_id = create_response.json()["id"]

        detail_response = self.client.get(
            reverse("diary-detail", args=[entry_id]),
            {"password": "wrong-password"},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(detail_response.status_code, 400)
        self.assertEqual(detail_response.json()["detail"], "Invalid password or corrupted diary entry.")
