import jwt
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
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

    def test_diary_list_keeps_entry_metrics(self):
        create_response = self.client.post(
            reverse("diary-create"),
            {"title": "A quiet day", "content": "One two three", "password": "strong-password"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 201)
        response = self.client.get(reverse("diary-list"), HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["preview"], "A quiet day")
        self.assertEqual(response.data[0]["word_count"], 3)
        self.assertEqual(response.data[0]["reading_time_minutes"], 1)

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

    def test_diary_access_verification_checks_password_once(self):
        original_check_password = AbstractBaseUser.check_password
        with patch.object(
            AbstractBaseUser,
            "check_password",
            autospec=True,
            side_effect=original_check_password,
        ) as password_check:
            response = self.client.post(
                reverse("diary-verify"),
                {"email": self.user.email, "password": "strong-password"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"verified": True})
        self.assertEqual(password_check.call_count, 1)

    def test_diary_access_verification_preserves_credential_only_authentication(self):
        response = self.client.post(
            reverse("diary-verify"),
            {"email": self.user.email, "password": "strong-password"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"verified": True})

    def test_diary_access_verification_rejects_a_wrong_password(self):
        response = self.client.post(
            reverse("diary-verify"),
            {"email": self.user.email, "password": "wrong-password"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 401)
