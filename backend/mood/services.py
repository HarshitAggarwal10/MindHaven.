import json
import importlib.util
import logging
import math
import os
import socket
from dataclasses import dataclass
from threading import RLock
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

from .models import EMOTION_LABELS, MoodAnalysis

logger = logging.getLogger(__name__)
_LOCAL_MODEL_CACHE = {}
_LOCAL_MODEL_LOCK = RLock()


class MoodProviderError(Exception):
    def __init__(self, message, status_code=503, code="provider_unavailable"):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


@dataclass(frozen=True)
class EmotionResult:
    primary_emotion: str
    confidence: float
    emotion_scores: dict[str, float]
    summary: str
    themes: list[str]
    suggestions: list[str]
    status: str
    model_identifier: str
    model_version: str


SUGGESTIONS = {
    "anger": [
        "If it feels helpful, pause for a moment and take a few comfortable breaths.",
        "You could write down what matters most to you in this moment.",
    ],
    "disgust": [
        "A brief change of scenery or a grounding exercise may feel supportive.",
    ],
    "fear": [
        "If you wish, name five things you can see and notice your feet on the ground.",
        "Consider reaching out to someone you trust if company would feel helpful.",
    ],
    "joy": [
        "You might take a moment to notice what feels meaningful or supportive today.",
    ],
    "neutral": [
        "If you like, pause and check in with what you need right now.",
    ],
    "sadness": [
        "You do not have to force a brighter mood. If it feels manageable, choose one kind, low-effort step: sip water, sit by a window, or stretch gently.",
        "If company would help, consider sending someone you trust a short message such as: “I am having a hard moment. Could you check in with me?”",
        "You could write one sentence about what you need right now, without judging or trying to solve everything.",
    ],
    "surprise": [
        "Take a moment to notice what surprised you and what, if anything, you would like to do next.",
    ],
}


def provider_is_available():
    provider = getattr(settings, "MOOD_AI_PROVIDER", "")
    if not getattr(settings, "MOOD_AI_MODEL_ID", ""):
        return False
    if provider == "local-transformers":
        return all(
            importlib.util.find_spec(module_name) is not None
            for module_name in ("torch", "transformers", "huggingface_hub")
        )
    if provider == "hf-inference":
        return bool(getattr(settings, "HUGGINGFACE_API_TOKEN", ""))
    return False


def provider_availability_message():
    provider = getattr(settings, "MOOD_AI_PROVIDER", "")
    if not getattr(settings, "MOOD_AI_MODEL_ID", ""):
        return "Set MOOD_AI_MODEL_ID in the Django server environment."
    if provider == "local-transformers":
        if not provider_is_available():
            return (
                "Install the optional CPU inference packages from "
                "backend/requirements-mood-local.txt, then restart Django."
            )
        return ""
    if provider == "hf-inference":
        if not getattr(settings, "HUGGINGFACE_API_TOKEN", ""):
            return (
                "Set HUGGINGFACE_API_TOKEN in backend/.env, then restart Django. "
                "Never put this token in frontend configuration."
            )
        return ""
    return (
        "The configured inference provider is unsupported. Set "
        "MOOD_AI_PROVIDER to local-transformers or hf-inference."
    )


def parse_emotion_scores(payload):
    if isinstance(payload, list) and len(payload) == 1 and isinstance(payload[0], list):
        payload = payload[0]
    if not isinstance(payload, list):
        raise MoodProviderError(
            "The inference provider returned an invalid response.",
            status_code=502,
            code="invalid_provider_response",
        )

    scores = {}
    for item in payload:
        if not isinstance(item, dict):
            raise MoodProviderError(
                "The inference provider returned an invalid response.",
                status_code=502,
                code="invalid_provider_response",
            )
        label = item.get("label")
        score = item.get("score")
        if (
            not isinstance(label, str)
            or isinstance(score, bool)
            or not isinstance(score, (float, int))
        ):
            raise MoodProviderError(
                "The inference provider returned an invalid response.",
                status_code=502,
                code="invalid_provider_response",
            )
        normalized_label = label.strip().lower()
        if normalized_label not in EMOTION_LABELS or normalized_label in scores:
            raise MoodProviderError(
                "The inference provider returned unsupported emotion labels.",
                status_code=502,
                code="invalid_provider_response",
            )
        normalized_score = float(score)
        if not math.isfinite(normalized_score) or not 0 <= normalized_score <= 1:
            raise MoodProviderError(
                "The inference provider returned invalid emotion scores.",
                status_code=502,
                code="invalid_provider_response",
            )
        scores[normalized_label] = normalized_score

    if set(scores) != set(EMOTION_LABELS):
        raise MoodProviderError(
            "The inference provider did not return all supported emotion scores.",
            status_code=502,
            code="invalid_provider_response",
        )
    return scores


def _safe_provider_error_hint(error):
    try:
        body = error.read(8192).decode("utf-8", errors="replace").lower()
    except OSError:
        return None

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        payload = None

    if isinstance(payload, dict):
        detail = payload.get("error") or payload.get("message") or ""
        if not isinstance(detail, str):
            detail = ""
    else:
        detail = body

    if any(word in detail for word in ("credit", "billing", "payment", "quota")):
        return (
            "provider_billing_required",
            "Hugging Face reports that inference credits or billing are required. "
            "Check the account's Inference Providers billing settings.",
        )
    if any(
        word in detail
        for word in ("token", "permission", "unauthorized", "credential", "forbidden")
    ):
        return (
            "provider_configuration_error",
            "Hugging Face rejected the token. Create a server-side token with "
            "Inference Providers permission, update backend/.env, and restart Django.",
        )
    if any(word in detail for word in ("not supported", "no provider", "unavailable model")):
        return (
            "model_unavailable",
            "This model is not enabled for your Hugging Face Inference Providers account. "
            "Check model availability or choose a supported model.",
        )
    if "loading" in detail or "warming" in detail:
        return (
            "provider_model_loading",
            "The model is starting up. Please wait briefly and try again.",
        )
    if any(word in detail for word in ("too long", "maximum length", "token limit")):
        return (
            "provider_input_too_long",
            "The model could not process this much text. Try a shorter passage.",
        )
    return None


def _build_result(scores):
    ranked_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    primary_emotion, confidence = ranked_scores[0]
    second_score = ranked_scores[1][1]
    unclear = confidence < 0.4 or confidence - second_score < 0.05

    if unclear:
        summary = (
            "The classifier's scores are close or low, so the emotional signals in "
            "this text are unclear. You can choose a mood yourself; the model may "
            "not reflect how you feel."
        )
        themes = []
        suggestions = []
        status = MoodAnalysis.Status.UNCLEAR
    else:
        summary = (
            f"The classifier assigned its strongest text signal to {primary_emotion}. "
            "This is an estimate from the text you chose to share, not a diagnosis or "
            "certainty about how you feel."
        )
        themes = [
            label
            for label, score in ranked_scores[1:]
            if score >= 0.2
        ][:2]
        suggestions = SUGGESTIONS[primary_emotion]
        status = MoodAnalysis.Status.SUCCESS

    return EmotionResult(
        primary_emotion=primary_emotion,
        confidence=confidence,
        emotion_scores=scores,
        summary=summary,
        themes=themes,
        suggestions=suggestions,
        status=status,
        model_identifier=settings.MOOD_AI_MODEL_ID,
        model_version=getattr(settings, "MOOD_AI_MODEL_VERSION", ""),
    )


def _load_local_classifier():
    model_id = getattr(settings, "MOOD_AI_MODEL_ID", "")
    cache_dir = getattr(settings, "MOOD_AI_LOCAL_CACHE_DIR", "") or None
    local_files_only = getattr(settings, "MOOD_AI_LOCAL_FILES_ONLY", False)
    cache_key = (model_id, cache_dir, local_files_only)
    with _LOCAL_MODEL_LOCK:
        if cache_key in _LOCAL_MODEL_CACHE:
            return _LOCAL_MODEL_CACHE[cache_key]

        os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
        try:
            import torch
            from huggingface_hub.errors import HfHubHTTPError
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            import requests
        except ImportError:
            raise MoodProviderError(
                "Local CPU inference packages are missing. Install "
                "backend/requirements-mood-local.txt and restart Django.",
                code="local_inference_dependencies_missing",
            ) from None

        try:
            thread_count = int(getattr(settings, "MOOD_AI_LOCAL_NUM_THREADS", 2))
        except (TypeError, ValueError):
            raise MoodProviderError(
                "MOOD_AI_LOCAL_NUM_THREADS must be a whole number from 1 to 8.",
                code="local_inference_configuration_error",
            ) from None
        if not 1 <= thread_count <= 8:
            raise MoodProviderError(
                "MOOD_AI_LOCAL_NUM_THREADS must be between 1 and 8.",
                code="local_inference_configuration_error",
            )
        torch.set_num_threads(thread_count)

        load_options = {
            "cache_dir": cache_dir,
            "local_files_only": local_files_only,
            "token": False,
            "trust_remote_code": False,
        }
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_id, **load_options)
            model = AutoModelForSequenceClassification.from_pretrained(
                model_id,
                **load_options,
            )
            model.to("cpu")
            model.eval()
        except (
            HfHubHTTPError,
            requests.exceptions.RequestException,
            OSError,
            RuntimeError,
            ValueError,
        ):
            logger.warning(
                "Local emotion model could not be loaded",
                extra={"model_identifier": model_id},
            )
            raise MoodProviderError(
                "The local emotion model could not be downloaded or loaded. Check "
                "the backend's network connection, available memory, and model cache, "
                "then retry.",
                code="local_model_load_failed",
            ) from None

        classifier = (tokenizer, model, torch)
        _LOCAL_MODEL_CACHE[cache_key] = classifier
        return classifier


def _analyze_local_emotion_text(text):
    tokenizer, model, torch = _load_local_classifier()
    try:
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )
        with torch.inference_mode():
            logits = model(**inputs).logits
            probabilities = torch.softmax(logits, dim=-1)[0].tolist()
    except (OSError, RuntimeError, ValueError):
        raise MoodProviderError(
            "The local emotion model could not analyze this text. Please try a shorter passage.",
            status_code=502,
            code="local_inference_failed",
        ) from None

    id_to_label = getattr(model.config, "id2label", {})
    labels = [
        id_to_label.get(index, id_to_label.get(str(index), ""))
        for index in range(len(probabilities))
    ]
    scores = parse_emotion_scores(
        [
            {"label": label, "score": score}
            for label, score in zip(labels, probabilities)
        ]
    )
    result = _build_result(scores)
    model_version = getattr(model.config, "_commit_hash", "")
    return EmotionResult(
        primary_emotion=result.primary_emotion,
        confidence=result.confidence,
        emotion_scores=result.emotion_scores,
        summary=result.summary,
        themes=result.themes,
        suggestions=result.suggestions,
        status=result.status,
        model_identifier=result.model_identifier,
        model_version=model_version or result.model_version,
    )


def analyze_emotion_text(text):
    provider = getattr(settings, "MOOD_AI_PROVIDER", "")
    model_id = getattr(settings, "MOOD_AI_MODEL_ID", "")
    if provider == "local-transformers":
        if not model_id:
            raise MoodProviderError(
                "Set MOOD_AI_MODEL_ID in the Django server environment.",
                code="local_inference_configuration_error",
            )
        return _analyze_local_emotion_text(text)
    token = getattr(settings, "HUGGINGFACE_API_TOKEN", "")
    if provider != "hf-inference":
        raise MoodProviderError(
            "The configured mood-analysis provider is not supported yet.",
            code="unsupported_provider",
        )
    if not model_id or not token:
        raise MoodProviderError(
            "AI mood analysis is not configured. Manual mood check-ins are still available.",
            code="provider_not_configured",
        )

    endpoint = f"https://router.huggingface.co/hf-inference/models/{model_id}"
    body = json.dumps(
        {"inputs": text, "parameters": {"top_k": len(EMOTION_LABELS)}}
    ).encode("utf-8")
    request = Request(
        endpoint,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        timeout = float(getattr(settings, "MOOD_AI_TIMEOUT_SECONDS", 15))
    except (TypeError, ValueError):
        raise MoodProviderError(
            "Mood-analysis timeout configuration must be a number between 1 and 60 seconds.",
            code="provider_configuration_error",
        ) from None
    if not math.isfinite(timeout) or not 1 <= timeout <= 60:
        raise MoodProviderError(
            "Mood-analysis timeout configuration must be between 1 and 60 seconds.",
            code="provider_configuration_error",
        )

    try:
        with urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read(65536).decode("utf-8"))
    except HTTPError as error:
        provider_error_code = "provider_request_failed"
        message = (
            "The inference provider rejected the request. Check the Hugging Face "
            "token's Inference Providers permission, account credits, and model "
            "availability."
        )
        if error.code == 429:
            provider_error_code = "provider_rate_limited"
            raise MoodProviderError(
                "The AI provider is rate-limiting requests. Please try again later.",
                status_code=503,
                code=provider_error_code,
            ) from None
        if error.code in (401, 403):
            provider_error_code = "provider_configuration_error"
            raise MoodProviderError(
                "The Hugging Face token was rejected. Create a new server-side token "
                "with Inference Providers permission, update backend/.env, and restart Django.",
                code=provider_error_code,
            ) from None
        if error.code in (404, 410):
            provider_error_code = "model_unavailable"
            raise MoodProviderError(
                "The configured model is unavailable through the selected inference provider.",
                code=provider_error_code,
            ) from None
        if error.code == 402:
            provider_error_code = "provider_billing_required"
            raise MoodProviderError(
                "Hugging Face reports that inference credits or billing are required. "
                "Check the account's Inference Providers billing settings.",
                status_code=503,
                code=provider_error_code,
            ) from None
        if error.code in (400, 422):
            provider_error_code = "provider_request_rejected"
            message = (
                f"Hugging Face rejected the inference request (HTTP {error.code}). "
                "Check that the token has Inference Providers permission, the account "
                "has available credits, and that this model is "
                "available through your Inference Providers account."
            )
            safe_hint = _safe_provider_error_hint(error)
            if safe_hint:
                provider_error_code, message = safe_hint
                if provider_error_code in (
                    "provider_billing_required",
                    "model_unavailable",
                    "provider_model_loading",
                ):
                    error_status = 503
                else:
                    error_status = 502
            else:
                error_status = 502
        else:
            error_status = 502
        if error.code >= 500:
            provider_error_code = "provider_unavailable"
            if error.code == 503:
                provider_error_code = "provider_model_loading"
            raise MoodProviderError(
                "The AI provider is temporarily unavailable or the model is loading. "
                "Please wait briefly and try again.",
                code=provider_error_code,
            ) from None
        logger.warning(
            "Hugging Face inference request rejected",
            extra={
                "provider_http_status": error.code,
                "provider_error_code": provider_error_code,
                "model_identifier": model_id,
            },
        )
        raise MoodProviderError(
            message,
            status_code=error_status,
            code=provider_error_code,
        ) from None
    except (TimeoutError, socket.timeout):
        raise MoodProviderError(
            "The AI provider took too long to respond. Please try again.",
            status_code=504,
            code="provider_timeout",
        ) from None
    except URLError as error:
        if isinstance(error.reason, (TimeoutError, socket.timeout)):
            raise MoodProviderError(
                "The AI provider took too long to respond. Please try again.",
                status_code=504,
                code="provider_timeout",
            ) from None
        raise MoodProviderError(
            "The AI provider could not be reached. Please try again later.",
            code="provider_unavailable",
        ) from None
    except OSError:
        raise MoodProviderError(
            "The AI provider could not be reached. Please try again later.",
            code="provider_unavailable",
        ) from None
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise MoodProviderError(
            "The inference provider returned an invalid response.",
            status_code=502,
            code="invalid_provider_response",
        ) from None

    return _build_result(parse_emotion_scores(payload))
