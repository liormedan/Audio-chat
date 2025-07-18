# Authentication utilities for AudioChat
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials as firebase_credentials
from supabase import create_client, Client
import os
import json
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Security scheme used by FastAPI
security = HTTPBearer()

async def verify_google_token(token: str):
    """Verify Google ID token"""
    try:
        google_client_id = os.environ.get("GOOGLE_CLIENT_ID") or "484800218204-8snu9s0vvc9176aqug9759ulh1rio431.apps.googleusercontent.com"
        idinfo = google_id_token.verify_oauth2_token(token, google_requests.Request(), google_client_id)
        return {
            "uid": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
        }
    except Exception as e:
        logger.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def verify_firebase_token(token: str):
    """Verify Firebase ID token"""
    try:
        if not firebase_admin._apps:
            try:
                cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
                if cred_json:
                    cred = firebase_credentials.Certificate(json.loads(cred_json))
                else:
                    cred = firebase_credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred)
            except Exception:
                firebase_admin.initialize_app()
        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded.get("uid") or decoded.get("sub"),
            "email": decoded.get("email"),
            "name": decoded.get("name"),
        }
    except Exception as e:
        logger.error(f"Firebase token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def verify_supabase_token(token: str):
    """Verify Supabase JWT token"""
    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not configured")
        client: Client = create_client(supabase_url, supabase_key)
        user_resp = client.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise ValueError("Invalid token")
        user = user_resp.user
        return {"sub": user.id, "email": user.email}
    except Exception as e:
        logger.error(f"Supabase token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials

    verifiers = [
        (verify_google_token, "uid", "google"),
        (verify_firebase_token, "uid", "firebase"),
        (verify_supabase_token, "sub", "supabase"),
    ]

    for verifier, id_key, provider in verifiers:
        try:
            user = await verifier(token)
            if user:
                return {"id": user[id_key], "email": user.get("email"), "provider": provider}
        except HTTPException:
            continue

    # For development, allow a special test token
    if token == "dev_test_token":
        return {"id": "test_user_123", "email": "test@example.com", "provider": "development"}

    raise HTTPException(status_code=401, detail="Invalid authentication token")
