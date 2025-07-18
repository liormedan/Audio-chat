"""Unit tests for token verification helpers."""

import asyncio
import os
import unittest
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from main import (
    verify_google_token,
    verify_firebase_token,
    verify_supabase_token,
)


class TestTokenVerification(unittest.TestCase):
    """Tests for OAuth token verification."""

    def test_verify_google_token_success(self):
        with patch("main.google_id_token.verify_oauth2_token") as mock_verify:
            mock_verify.return_value = {"sub": "123", "email": "test@example.com"}
            user = asyncio.run(verify_google_token("good"))
            self.assertEqual(user["uid"], "123")
            self.assertEqual(user["email"], "test@example.com")

    def test_verify_google_token_failure(self):
        with patch(
            "main.google_id_token.verify_oauth2_token", side_effect=Exception("bad")
        ):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(verify_google_token("bad"))
            self.assertEqual(ctx.exception.status_code, 401)

    def test_verify_firebase_token_success(self):
        with patch("main.firebase_auth.verify_id_token") as mock_verify:
            mock_verify.return_value = {"uid": "abc", "email": "f@example.com"}
            user = asyncio.run(verify_firebase_token("good"))
            self.assertEqual(user["uid"], "abc")
            self.assertEqual(user["email"], "f@example.com")

    def test_verify_firebase_token_failure(self):
        with patch("main.firebase_auth.verify_id_token", side_effect=Exception("bad")):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(verify_firebase_token("bad"))
            self.assertEqual(ctx.exception.status_code, 401)

    def test_verify_supabase_token_success(self):
        with patch("main.create_client") as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            mock_user = MagicMock(id="user1", email="s@example.com")
            mock_client.auth.get_user.return_value = MagicMock(user=mock_user)
            env = {"SUPABASE_URL": "url", "SUPABASE_SERVICE_ROLE_KEY": "key"}
            with patch.dict(os.environ, env, clear=False):
                user = asyncio.run(verify_supabase_token("good"))
            self.assertEqual(user["sub"], "user1")
            self.assertEqual(user["email"], "s@example.com")

    def test_verify_supabase_token_failure(self):
        with patch("main.create_client") as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            mock_client.auth.get_user.return_value = MagicMock(user=None)
            env = {"SUPABASE_URL": "url", "SUPABASE_SERVICE_ROLE_KEY": "key"}
            with patch.dict(os.environ, env, clear=False):
                with self.assertRaises(HTTPException) as ctx:
                    asyncio.run(verify_supabase_token("bad"))
            self.assertEqual(ctx.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()

