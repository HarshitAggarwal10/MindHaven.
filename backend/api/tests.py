import json

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from community.models import AnonymousIdentity


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AuthenticationEndpointTests(TestCase):
    signup_url = "/api/auth/signup/"
    login_url = "/api/auth/login/"
    password = "a-strong-test-password"

    def post_json(self, url, payload):
        return self.client.post(url, data=json.dumps(payload), content_type="application/json")

    def test_signup_retry_with_same_credentials_returns_tokens(self):
        payload = {"email": "person@example.com", "password": self.password}

        first_response = self.post_json(self.signup_url, payload)
        retry_response = self.post_json(self.signup_url, payload)

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(retry_response.status_code, 200)
        self.assertTrue(first_response.json()["access"])
        self.assertTrue(retry_response.json()["access"])
        self.assertEqual(get_user_model().objects.filter(email="person@example.com").count(), 1)

    def test_signup_retry_with_wrong_password_does_not_authenticate(self):
        payload = {"email": "person@example.com", "password": self.password}
        self.post_json(self.signup_url, payload)

        response = self.post_json(
            self.signup_url,
            {"email": "person@example.com", "password": "different-password"},
        )

        self.assertEqual(response.status_code, 409)
        self.assertNotIn("access", response.json())

    def test_signup_creates_multiple_new_users_with_unique_community_handles(self):
        first_response = self.post_json(
            self.signup_url,
            {"email": "first@example.com", "password": self.password},
        )
        second_response = self.post_json(
            self.signup_url,
            {"email": "second@example.com", "password": self.password},
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 201)
        identities = list(AnonymousIdentity.objects.order_by("user_id"))
        self.assertEqual(len(identities), 2)
        self.assertTrue(all(identity.handle for identity in identities))
        self.assertEqual(len({identity.handle for identity in identities}), 2)

    def test_signup_saves_the_name_used_for_community_identity(self):
        response = self.post_json(
            self.signup_url,
            {
                "email": "named-member@example.com",
                "password": self.password,
                "display_name": "Mindful Member",
            },
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(email="named-member@example.com")
        self.assertEqual(user.display_name, "Mindful Member")

    def test_existing_blank_community_handle_is_repaired(self):
        user = get_user_model().objects.create_user(
            email="blank-handle@example.com",
            password=self.password,
        )
        identity = AnonymousIdentity.objects.get(user=user)
        identity.handle = ""
        identity.save(update_fields=["handle"])

        repaired_identity = AnonymousIdentity.get_for_user(user)

        self.assertTrue(repaired_identity.handle)

    def test_login_accepts_email_with_different_case(self):
        self.post_json(self.signup_url, {"email": "person@example.com", "password": self.password})

        response = self.post_json(
            self.login_url,
            {"email": "PERSON@EXAMPLE.COM", "password": self.password},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["access"])
