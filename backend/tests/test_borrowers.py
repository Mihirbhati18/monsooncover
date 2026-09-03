from app.models.audit import AuditEvent
from app.models.user import Role
from tests.conftest import auth_headers, make_user

BORROWER_PAYLOAD = {"name": "ABC Textiles", "sector": "Textile manufacturing", "city": "Surat", "state": "Gujarat"}


def test_lender_can_create_and_list_borrowers(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")
    headers = auth_headers(client, email="lender@test.local")

    create_response = client.post("/api/v1/borrowers", json=BORROWER_PAYLOAD, headers=headers)
    assert create_response.status_code == 201
    borrower = create_response.json()
    assert borrower["name"] == "ABC Textiles"

    list_response = client.get("/api/v1/borrowers", headers=headers)
    assert list_response.status_code == 200
    assert any(b["id"] == borrower["id"] for b in list_response.json())


def test_insurer_can_read_but_not_create_borrowers(client, db_session):
    make_user(db_session, role=Role.INSURER, email="insurer@test.local")
    headers = auth_headers(client, email="insurer@test.local")

    assert client.get("/api/v1/borrowers", headers=headers).status_code == 200
    assert client.post("/api/v1/borrowers", json=BORROWER_PAYLOAD, headers=headers).status_code == 403


def test_creating_a_borrower_writes_an_audit_event(client, db_session):
    admin = make_user(db_session, role=Role.ADMIN, email="admin@test.local")
    headers = auth_headers(client, email="admin@test.local")

    response = client.post("/api/v1/borrowers", json=BORROWER_PAYLOAD, headers=headers)
    borrower_id = response.json()["id"]

    event = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.entity_type == "Borrower", AuditEvent.entity_id == borrower_id)
        .one()
    )
    assert event.event_type == "BORROWER_CREATED"
    assert event.actor_id == admin.id
    assert event.classification == "SIMULATED"
    assert event.new_state == "REGISTERED"


def test_getting_an_unknown_borrower_returns_404(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")
    headers = auth_headers(client, email="lender@test.local")

    response = client.get("/api/v1/borrowers/does-not-exist", headers=headers)
    assert response.status_code == 404
