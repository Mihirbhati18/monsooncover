from app.models.user import Role
from tests.conftest import auth_headers, make_user


def test_login_succeeds_with_correct_credentials(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")

    response = client.post(
        "/api/v1/auth/login", data={"username": "lender@test.local", "password": "test-password-123"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_fails_with_wrong_password(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")

    response = client.post(
        "/api/v1/auth/login", data={"username": "lender@test.local", "password": "wrong-password"}
    )

    assert response.status_code == 401


def test_login_fails_for_unknown_user(client):
    response = client.post(
        "/api/v1/auth/login", data={"username": "nobody@test.local", "password": "whatever"}
    )

    assert response.status_code == 401


def test_me_requires_a_valid_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_the_authenticated_user(client, db_session):
    make_user(db_session, role=Role.ADMIN, email="admin@test.local")
    headers = auth_headers(client, email="admin@test.local")

    response = client.get("/api/v1/auth/me", headers=headers)

    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.local"
    assert response.json()["role"] == "admin"


def test_borrower_role_cannot_read_the_lender_portfolio(client, db_session):
    make_user(db_session, role=Role.BORROWER, email="borrower@test.local")
    headers = auth_headers(client, email="borrower@test.local")

    response = client.get("/api/v1/borrowers", headers=headers)

    assert response.status_code == 403
