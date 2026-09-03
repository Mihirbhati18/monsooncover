"""Test fixtures.

MONSOONCOVER_SPEC.md §11.2 freezes PostgreSQL as the application database.

By default this suite runs against in-memory SQLite so it needs no running
server. To run the identical suite against the real frozen stack, point
TEST_DATABASE_URL at a PostgreSQL database:

    TEST_DATABASE_URL=postgresql+psycopg://monsooncover:monsooncover@localhost:5432/monsooncover_test pytest

Both paths must pass. The Postgres path is what exercises native ENUM
types, NUMERIC precision and real constraint behaviour, none of which
SQLite reproduces faithfully.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.user import Role
from app.modules.auth.service import create_user

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")


@pytest.fixture()
def db_session():
    if TEST_DATABASE_URL:
        engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    else:
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    # Drop first: a Postgres run interrupted mid-test leaves tables behind.
    Base.metadata.drop_all(bind=engine)
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
