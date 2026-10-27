import io
import json
from contextlib import nullcontext
from datetime import timedelta
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import EMOTION_LABELS, MoodAnalysis, MoodCheckIn
from .services import (
    MoodProviderError,
    _analyze_local_emotion_text,
    _safe_provider_error_hint,
    analyze_emotion_text,
    parse_emotion_scores,
)


def emotion_scores(primary="joy", primary_score=0.82):
    remainder = [label for label in EMOTION_LABELS if label != primary]
    scores = {label: 0.02 for label in remainder}
    scores[primary] = primary_score
    scores[remainder[0]] = 1 - primary_score - 0.1
    return scores


def provider_payload(scores=None):
    scores = scores or emotion_scores()
    return [{"label": label.upper(), "score": score} for label, score in scores.items()]


class MoodApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="mood-user@example.com",
            password="test-password",
        )
        self.other_user = get_user_model().objects.create_user(
            email="other-user@example.com",
            password="test-password",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_manual_mood_is_saved_without_ai_text(self):
        response = self.client.post(
            reverse("mood-checkins"),
            {"mood": "steady"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["mood"], "steady")
        self.assertEqual(MoodCheckIn.objects.filter(user=self.user).count(), 1)
        self.assertEqual(MoodAnalysis.objects.count(), 0)

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
        HUGGINGFACE_API_TOKEN="",
    )
    def test_public_config_explains_missing_token_without_exposing_secrets(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(reverse("mood-config"))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["analysis_available"])
        self.assertIn("backend/.env", response.data["availability_message"])
        self.assertNotIn("test-token", str(response.data))
        self.assertNotIn("HUGGINGFACE_API_TOKEN", str(response.data["privacy_notice"]))

    @override_settings(
        MOOD_AI_PROVIDER="local-transformers",
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
    )
    @patch("mood.services.importlib.util.find_spec", return_value=None)
    def test_local_config_explains_missing_optional_packages(self, _):
        response = self.client.get(reverse("mood-config"))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["analysis_available"])
        self.assertIn("requirements-mood-local.txt", response.data["availability_message"])
        self.assertIn("not sent to an AI inference provider", response.data["privacy_notice"])

    def test_manual_mood_rejects_unknown_values(self):
        response = self.client.post(
            reverse("mood-checkins"),
            {"mood": "diagnosis"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MoodCheckIn.objects.count(), 0)

    def test_analysis_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            reverse("mood-analyze"),
            {"text": "I have had a difficult day and need time to reflect.", "consent": True},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_analysis_requires_consent_and_valid_text(self):
        without_consent = self.client.post(
            reverse("mood-analyze"),
            {"text": "I have had a difficult day and need time to reflect.", "consent": False},
            format="json",
        )
        short_text = self.client.post(
            reverse("mood-analyze"),
            {"text": "Short.", "consent": True},
            format="json",
        )
        long_text = self.client.post(
            reverse("mood-analyze"),
            {"text": "x" * 3001, "consent": True},
            format="json",
        )
        blank_text = self.client.post(
            reverse("mood-analyze"),
            {"text": " " * 25, "consent": True},
            format="json",
        )

        self.assertEqual(without_consent.status_code, 400)
        self.assertEqual(short_text.status_code, 400)
        self.assertEqual(long_text.status_code, 400)
        self.assertEqual(blank_text.status_code, 400)
        self.assertEqual(MoodAnalysis.objects.count(), 0)

    @patch("mood.views.analyze_emotion_text")
    def test_analysis_persists_model_result_without_source_text(self, analyze):
        analyze.return_value = analyze_emotion_text_result()
        source_text = "I feel hopeful after talking with someone I trust."

        response = self.client.post(
            reverse("mood-analyze"),
            {"text": source_text, "consent": True},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["primary_emotion"], "joy")
        self.assertEqual(response.data["status"], MoodAnalysis.Status.SUCCESS)
        self.assertEqual(MoodAnalysis.objects.filter(user=self.user).count(), 1)
        analysis = MoodAnalysis.objects.get()
        self.assertNotIn("text", [field.name for field in analysis._meta.fields])
        self.assertNotIn(source_text, str(response.data))
        self.assertEqual(analyze.call_args.args[0], source_text)

    @patch("mood.views.analyze_emotion_text")
    def test_analysis_idempotency_returns_existing_record(self, analyze):
        analyze.return_value = analyze_emotion_text_result()
        key = str(uuid4())
        body = {
            "text": "I feel hopeful after talking with someone I trust.",
            "consent": True,
            "idempotency_key": key,
        }

        first = self.client.post(reverse("mood-analyze"), body, format="json")
        second = self.client.post(reverse("mood-analyze"), body, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(analyze.call_count, 1)
        self.assertEqual(MoodAnalysis.objects.filter(user=self.user).count(), 1)

    @patch(
        "mood.views.analyze_emotion_text",
        side_effect=MoodProviderError("The AI provider is unavailable."),
    )
    def test_provider_failure_is_reported_without_saving_or_logging_text(self, _):
        source_text = "This text must not appear in a response or a stored record."
        with self.assertNoLogs("mood", level="DEBUG"):
            response = self.client.post(
                reverse("mood-analyze"),
                {"text": source_text, "consent": True},
                format="json",
            )

        self.assertEqual(response.status_code, 503)
        self.assertNotIn(source_text, str(response.data))
        self.assertEqual(MoodAnalysis.objects.count(), 0)

    def test_other_users_cannot_read_or_delete_an_analysis(self):
        analysis = create_analysis(self.other_user)

        detail = self.client.get(
            reverse("mood-analysis-detail", args=[analysis.id])
        )
        delete = self.client.delete(
            reverse("mood-analysis-detail", args=[analysis.id])
        )

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(delete.status_code, 404)
        self.assertTrue(MoodAnalysis.objects.filter(id=analysis.id).exists())

    def test_history_and_stats_are_scoped_and_date_filtered(self):
        MoodCheckIn.objects.create(user=self.user, mood="good")
        old_checkin = MoodCheckIn.objects.create(user=self.user, mood="low")
        MoodCheckIn.objects.filter(pk=old_checkin.pk).update(
            created_at=timezone.now() - timedelta(days=10)
        )
        create_analysis(self.user, created_at=timezone.now())
        create_analysis(self.other_user, created_at=timezone.now())

        history = self.client.get(reverse("mood-history"), {"days": 7})
        stats = self.client.get(reverse("mood-stats"), {"days": 7})

        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.data), 2)
        self.assertEqual(
            {item["type"] for item in history.data},
            {"self_reported", "ai_prediction"},
        )
        self.assertEqual(stats.status_code, 200)
        self.assertEqual(stats.data["check_in_count"], 1)
        self.assertEqual(stats.data["analysis_count"], 1)
        self.assertEqual(stats.data["self_reported_moods"]["good"], 1)
        self.assertEqual(stats.data["ai_emotion_counts"]["joy"], 1)
        self.assertEqual(sum(day["self_reported_count"] for day in stats.data["daily"]), 1)
        self.assertEqual(sum(stats.data["ai_emotion_counts"].values()), 1)
        self.assertNotIn("other-user@example.com", str(history.data))

    def test_deleting_analysis_updates_statistics(self):
        analysis = create_analysis(self.user)

        response = self.client.delete(
            reverse("mood-analysis-detail", args=[analysis.id])
        )
        stats = self.client.get(reverse("mood-stats"), {"days": 7})

        self.assertEqual(response.status_code, 204)
        self.assertEqual(stats.data["analysis_count"], 0)
        self.assertTrue(stats.data["insufficient_data"])

    def test_manual_checkin_can_be_corrected_or_deleted_by_owner(self):
        checkin = MoodCheckIn.objects.create(user=self.user, mood="low")

        update = self.client.patch(
            reverse("mood-checkin-detail", args=[checkin.id]),
            {"mood": "good"},
            format="json",
        )
        delete = self.client.delete(
            reverse("mood-checkin-detail", args=[checkin.id])
        )

        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.data["mood"], "good")
        self.assertEqual(delete.status_code, 204)
        self.assertFalse(MoodCheckIn.objects.filter(id=checkin.id).exists())


class MoodProviderServiceTests(TestCase):
    @override_settings(
        MOOD_AI_PROVIDER="local-transformers",
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
    )
    @patch("mood.services._analyze_local_emotion_text")
    def test_local_provider_dispatches_to_local_classifier(self, analyze):
        analyze.return_value = analyze_emotion_text_result()
        text = "I feel hopeful after talking with someone I trust."

        result = analyze_emotion_text(text)

        self.assertEqual(result.primary_emotion, "joy")
        analyze.assert_called_once_with(text)

    @override_settings(
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
    )
    @patch("mood.services._load_local_classifier")
    def test_local_classifier_returns_all_seven_emotion_scores(self, load_classifier):
        scores = emotion_scores()
        test_case = self

        class FakeProbabilities:
            def __getitem__(self, _index):
                test_case.assertEqual(_index, 0)
                return self

            def tolist(self):
                return [scores[label] for label in EMOTION_LABELS]

        class FakeTorch:
            @staticmethod
            def inference_mode():
                return nullcontext()

            @staticmethod
            def softmax(logits, dim):
                test_case.assertIsNotNone(logits)
                test_case.assertEqual(dim, -1)
                return FakeProbabilities()

        tokenizer = MagicMock(return_value={"input_ids": object()})
        model = MagicMock()
        model.return_value.logits = object()
        model.config.id2label = dict(enumerate(EMOTION_LABELS))
        model.config._commit_hash = "test-model-revision"
        load_classifier.return_value = (tokenizer, model, FakeTorch)
        text = "I feel hopeful after talking with someone I trust."

        result = _analyze_local_emotion_text(text)

        self.assertEqual(result.primary_emotion, "joy")
        self.assertEqual(set(result.emotion_scores), set(EMOTION_LABELS))
        self.assertEqual(result.model_version, "test-model-revision")
        tokenizer.assert_called_once_with(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )
        model.assert_called_once_with(input_ids=tokenizer.return_value["input_ids"])

    @override_settings(
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
    )
    @patch("mood.services._load_local_classifier")
    def test_local_classifier_rejects_unrecognized_model_labels(self, load_classifier):
        probabilities = MagicMock()
        probabilities.__getitem__.return_value.tolist.return_value = [1 / 7] * 7
        test_case = self

        class FakeTorch:
            @staticmethod
            def inference_mode():
                return nullcontext()

            @staticmethod
            def softmax(logits, dim):
                test_case.assertIsNotNone(logits)
                test_case.assertEqual(dim, -1)
                return probabilities

        tokenizer = MagicMock(return_value={})
        model = MagicMock()
        model.return_value.logits = object()
        model.config.id2label = {index: f"LABEL_{index}" for index in range(7)}
        load_classifier.return_value = (tokenizer, model, FakeTorch)

        with self.assertRaises(MoodProviderError) as raised:
            _analyze_local_emotion_text("A short thoughtful test sentence.")

        self.assertEqual(raised.exception.code, "invalid_provider_response")

    def test_parses_all_model_labels_case_insensitively(self):
        scores = parse_emotion_scores(provider_payload())

        self.assertEqual(set(scores), set(EMOTION_LABELS))
        self.assertAlmostEqual(scores["joy"], 0.82)

    def test_rejects_incomplete_unknown_nonfinite_and_out_of_range_scores(self):
        invalid_responses = [
            [{"label": "joy", "score": 0.5}],
            [{"label": "clinical_diagnosis", "score": 0.5}],
            [{"label": "joy", "score": float("nan")}],
            [{"label": "joy", "score": 1.5}],
            "not a classifier response",
        ]
        for response in invalid_responses:
            with self.subTest(response=response):
                with self.assertRaises(MoodProviderError):
                    parse_emotion_scores(response)

    def test_close_classifier_scores_are_saved_as_unclear_not_as_a_suggestion(self):
        from .services import _build_result

        scores = {label: 1 / len(EMOTION_LABELS) for label in EMOTION_LABELS}
        result = _build_result(scores)

        self.assertEqual(result.status, MoodAnalysis.Status.UNCLEAR)
        self.assertEqual(result.themes, [])
        self.assertEqual(result.suggestions, [])
        self.assertIn("unclear", result.summary)

    def test_sadness_and_joy_use_nonclinical_support_suggestions(self):
        from .services import SUGGESTIONS

        self.assertTrue(any("force a brighter mood" in idea for idea in SUGGESTIONS["sadness"]))
        self.assertTrue(any("meaningful" in idea for idea in SUGGESTIONS["joy"]))

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
        HUGGINGFACE_API_TOKEN="test-token",
        MOOD_AI_TIMEOUT_SECONDS=3,
    )
    @patch("mood.services.urlopen")
    def test_hosted_request_uses_server_token_model_and_submitted_text(self, urlopen):
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps(
            provider_payload()
        ).encode("utf-8")
        urlopen.return_value = response

        result = analyze_emotion_text("I am having a reflective and hopeful day.")

        request = urlopen.call_args.args[0]
        self.assertIn(
            "router.huggingface.co/hf-inference/models/"
            "j-hartmann/emotion-english-distilroberta-base",
            request.full_url,
        )
        self.assertEqual(
            json.loads(request.data),
            {
                "inputs": "I am having a reflective and hopeful day.",
                "parameters": {"top_k": len(EMOTION_LABELS)},
            },
        )
        self.assertEqual(request.get_header("Authorization"), "Bearer test-token")
        self.assertEqual(result.primary_emotion, "joy")

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="model",
        HUGGINGFACE_API_TOKEN="test-token",
    )
    @patch("mood.services.urlopen", side_effect=TimeoutError)
    def test_provider_timeout_has_clear_safe_error(self, _):
        with self.assertRaises(MoodProviderError) as raised:
            analyze_emotion_text("I am having a reflective and hopeful day.")

        self.assertEqual(raised.exception.status_code, 504)
        self.assertEqual(raised.exception.code, "provider_timeout")

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="model",
        HUGGINGFACE_API_TOKEN="test-token",
        MOOD_AI_TIMEOUT_SECONDS=0,
    )
    def test_invalid_timeout_configuration_returns_a_safe_error(self):
        with self.assertRaises(MoodProviderError) as raised:
            analyze_emotion_text("I am having a reflective and hopeful day.")

        self.assertEqual(raised.exception.code, "provider_configuration_error")

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="model",
        HUGGINGFACE_API_TOKEN="test-token",
    )
    @patch("mood.services.urlopen")
    def test_provider_rate_limit_is_not_reported_as_an_analysis(self, urlopen):
        urlopen.side_effect = HTTPError(
            "https://router.huggingface.co/",
            429,
            "rate limited",
            {},
            None,
        )

        with self.assertRaises(MoodProviderError) as raised:
            analyze_emotion_text("I am having a reflective and hopeful day.")

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(raised.exception.code, "provider_rate_limited")

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="j-hartmann/emotion-english-distilroberta-base",
        HUGGINGFACE_API_TOKEN="test-token",
    )
    @patch("mood.services.urlopen")
    def test_bad_provider_request_exposes_safe_diagnostics_not_raw_body(self, urlopen):
        sensitive_provider_detail = "raw provider detail containing submitted text"
        urlopen.side_effect = HTTPError(
            "https://router.huggingface.co/",
            400,
            "bad request",
            {},
            io.BytesIO(json.dumps({"error": sensitive_provider_detail}).encode()),
        )

        with self.assertLogs("mood.services", level="WARNING") as captured:
            with self.assertRaises(MoodProviderError) as raised:
                analyze_emotion_text("I am having a reflective and hopeful day.")

        self.assertEqual(raised.exception.status_code, 502)
        self.assertEqual(raised.exception.code, "provider_request_rejected")
        self.assertIn("HTTP 400", str(raised.exception))
        self.assertIn("Inference Providers permission", str(raised.exception))
        self.assertNotIn(sensitive_provider_detail, str(captured.output))

    def test_provider_error_body_is_mapped_to_safe_actionable_categories(self):
        cases = [
            (
                400,
                {"error": "Insufficient credits for inference"},
                "provider_billing_required",
                "credits or billing",
            ),
            (
                400,
                {"error": "Model is not supported by any enabled provider"},
                "model_unavailable",
                "not enabled",
            ),
            (
                400,
                {"error": "Token lacks provider permission"},
                "provider_configuration_error",
                "Inference Providers permission",
            ),
            (
                422,
                {"error": "Input is too long"},
                "provider_input_too_long",
                "shorter passage",
            ),
        ]
        for http_status, body, expected_code, expected_message in cases:
            with self.subTest(http_status=http_status, body=body):
                error = HTTPError(
                    "https://router.huggingface.co/",
                    http_status,
                    "provider error",
                    {},
                    io.BytesIO(json.dumps(body).encode()),
                )
                code, message = _safe_provider_error_hint(error)
                self.assertEqual(code, expected_code)
                self.assertIn(expected_message, message)
                self.assertNotIn(body["error"], message)

    @override_settings(
        MOOD_AI_PROVIDER="hf-inference",
        MOOD_AI_MODEL_ID="model",
        HUGGINGFACE_API_TOKEN="",
    )
    def test_missing_provider_token_is_an_explicit_configuration_error(self):
        with self.assertRaises(MoodProviderError) as raised:
            analyze_emotion_text("I am having a reflective and hopeful day.")

        self.assertEqual(raised.exception.code, "provider_not_configured")


def analyze_emotion_text_result():
    from .services import _build_result

    return _build_result(emotion_scores())


def create_analysis(user, created_at=None):
    result = analyze_emotion_text_result()
    analysis = MoodAnalysis.objects.create(
        user=user,
        primary_emotion=result.primary_emotion,
        confidence=result.confidence,
        emotion_scores=result.emotion_scores,
        summary=result.summary,
        themes=result.themes,
        suggestions=result.suggestions,
        status=result.status,
        model_identifier=result.model_identifier or "test-model",
    )
    if created_at:
        MoodAnalysis.objects.filter(pk=analysis.pk).update(created_at=created_at)
        analysis.refresh_from_db()
    return analysis
