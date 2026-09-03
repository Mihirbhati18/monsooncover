import jwt
import pytest

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_hash_password_never_returns_plaintext():
    hashed = hash_password("correct-horse-battery-staple")
    assert hashed != "correct-horse-battery-staple"
    assert hashed.startswith("$2b$")


def test_verify_password_round_trip():
    hashed = hash_password("correct-horse-battery-staple")
    assert verify_password("correct-horse-battery-staple", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_round_trip():
    token = create_access_token(subject="user@example.com", role="lender")
    payload = decode_access_token(token)
    assert payload["sub"] == "user@example.com"
    assert payload["role"] == "lender"


def test_expired_token_is_rejected(monkeypatch):
    import app.core.security as security_module

    monkeypatch.setattr(security_module.settings, "access_token_expire_minutes", -1)
    token = create_access_token(subject="user@example.com", role="lender")

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)
