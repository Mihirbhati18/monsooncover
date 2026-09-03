"""Test fixtures.

MONSOONCOVER_SPEC.md §11.2 freezes PostgreSQL as the application database.
These tests run against SQLite instead — a dependency-free substitute so the
suite can run without a live Postgres server (see backend/README.md for the
tradeoff). Every model uses portable SQLAlchemy types for exactly this
reason; nothing here relies on Postgres-only behavior.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.user import Role
from app.modules.auth.service import create_user


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def make_user(db_session: Session, *, role: Role, email: str | None = None):
    email = email or f"{role.value}@test.local"
    user = create_user(db_session, email=email, password="test-password-123", display_name=role.value.title(), role=role)
    db_session.commit()
    return user


def auth_headers(client: TestClient, *, email: str, password: str = "test-password-123") -> dict:
    response = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
