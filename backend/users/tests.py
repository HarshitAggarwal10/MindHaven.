from django.test import TestCase
from rest_framework.test import APIClient


class UserAccountApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.credentials = {
            "email": "mindful.member@example.test",
            "password": "A_secure_passphrase_123!",
        }

    def test_signup_creates_named_account_and_returns_booking_compatible_token(self):
        response = self.client.post(
            "/api/users/signup/",
            {**self.credentials, "display_name": "Mindful Member"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["access"])

        profile = self.client.get(
            "/api/community/profile/",
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}",
        )

        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["display_name"], "Mindful Member")

    def test_login_returns_token_accepted_by_authenticated_apis(self):
        signup = self.client.post(
            "/api/users/signup/",
            {**self.credentials, "display_name": "Mindful Member"},
            format="json",
        )
        self.assertEqual(signup.status_code, 201)

        response = self.client.post(
            "/api/users/login/",
            self.credentials,
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["access"])
