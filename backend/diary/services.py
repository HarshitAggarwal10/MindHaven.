import base64
import os
import re
from typing import Tuple

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def generate_salt() -> bytes:
    return os.urandom(16)


def derive_key(password: str, salt: bytes, iterations: int = 200_000) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
    )
    return kdf.derive(password.encode("utf-8"))


def generate_vault_key() -> bytes:
    return os.urandom(32)


def encrypt_payload(plaintext: str, key: bytes) -> Tuple[str, str]:
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return b64encode(ciphertext), b64encode(nonce)


def decrypt_payload(ciphertext_b64: str, nonce_b64: str, key: bytes) -> str:
    ciphertext = b64decode(ciphertext_b64)
    nonce = b64decode(nonce_b64)
    plaintext = AESGCM(key).decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def encrypt_vault_key(vault_key: bytes, password: str, salt: bytes) -> Tuple[str, str]:
    derived_key = derive_key(password, salt)
    return encrypt_payload(b64encode(vault_key), derived_key)


def decrypt_vault_key(encrypted_key_b64: str, nonce_b64: str, password: str, salt: bytes) -> bytes:
    derived_key = derive_key(password, salt)
    encoded_key = decrypt_payload(encrypted_key_b64, nonce_b64, derived_key)
    return b64decode(encoded_key)


def b64encode(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")


def b64decode(data: str) -> bytes:
    return base64.b64decode(data.encode("utf-8"))


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ")


def preview_from_text(text: str, max_length: int = 140) -> str:
    plain = strip_html(text).strip()
    if len(plain) <= max_length:
        return plain
    return plain[: max_length - 1] + "…"


def word_count(text: str) -> int:
    plain = strip_html(text).strip()
    return len(plain.split()) if plain else 0


def reading_time_minutes(text: str) -> int:
    count = word_count(text)
    return max(1, round(count / 200))
