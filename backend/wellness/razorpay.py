import base64
import json
import re
import urllib.error
import urllib.request

from django.conf import settings


class RazorpayConfigurationError(Exception):
    pass


class RazorpayRequestError(Exception):
    pass


def _credentials():
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise RazorpayConfigurationError(
            "Paid bookings are unavailable until Razorpay credentials are configured."
        )
    auth = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("ascii")
    return key_id, {"Authorization": f"Basic {auth}"}


def _request(path, method="GET", payload=None):
    _, headers = _credentials()
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.razorpay.com/v1/{path.lstrip('/')}",
        data=body,
        headers={
            **headers,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RazorpayRequestError(
            "Razorpay could not complete the request. Please try again."
        ) from error
    except urllib.error.HTTPError as error:
        raise RazorpayRequestError(
            "Razorpay rejected the payment request. Please try again."
        ) from error


def public_key_id():
    key_id, _ = _credentials()
    return key_id


def create_order(booking):
    amount_paise = int(booking.amount * 100)
    return _request(
        "orders",
        method="POST",
        payload={
            "amount": amount_paise,
            "currency": booking.currency,
            "receipt": booking.booking_reference,
            "notes": {
                "booking_reference": booking.booking_reference,
            },
        },
    )


def fetch_payment(payment_id):
    if not re.fullmatch(r"pay_[A-Za-z0-9]+", payment_id or ""):
        raise RazorpayRequestError("The payment identifier is invalid.")
    return _request(f"payments/{payment_id}")


def create_refund(payment_id, amount, receipt):
    return _request(
        f"payments/{payment_id}/refund",
        method="POST",
        payload={
            "amount": int(amount * 100),
            "receipt": receipt,
        },
    )
