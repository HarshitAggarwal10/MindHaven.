import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from django.conf import settings
import json
import os

# initialize firebase admin once
if not firebase_admin._apps:
    cred_path = settings.FIREBASE_CREDENTIALS_JSON
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token: str):
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded  # contains uid, etc
    except Exception as e:
        return None
