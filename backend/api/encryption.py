import base64, os
from Cryptodome.Cipher import AES

KEY = base64.b64decode(os.environ["DIARY_ENC_KEY"])  # 32 bytes

def encrypt(text):
    iv = os.urandom(12)
    cipher = AES.new(KEY, AES.MODE_GCM, iv)
    encrypted, tag = cipher.encrypt_and_digest(text.encode())

    return (
        base64.b64encode(encrypted).decode(),
        base64.b64encode(iv).decode(),
        base64.b64encode(tag).decode(),
    )

def decrypt(data, iv, tag):
    cipher = AES.new(KEY, AES.MODE_GCM, base64.b64decode(iv))
    cipher.update(b"")
    return cipher.decrypt_and_verify(
        base64.b64decode(data),
        base64.b64decode(tag)
    ).decode()
