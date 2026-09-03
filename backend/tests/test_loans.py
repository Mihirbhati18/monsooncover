from decimal import Decimal

from app.models.user import Role
from app.modules.borrowers.service import create_borrower
from app.schemas.borrower import BorrowerCreate
from tests.conftest import auth_headers, make_user

LOAN_PAYLOAD = {
    "loan_type": "Working-capital loan",
    "principal_amount": "1000000.00",
    "emi_amount": "62000.00",
    "outstanding_amount": "840000.00",
    "currency": "INR",
}


def _seed_borrower(db_session, actor_id: str) -> str:
    borrower = create_borrower(
        db_session,
        BorrowerCreate(name="ABC Textiles", sector="Textile manufacturing", city="Surat", state="Gujarat"),
        actor_id=actor_id,
    )
    db_session.commit()
    return borrower.id


def test_lender_can_create_a_loan_with_exact_decimal_amounts(client, db_session):
    lender = make_user(db_session, role=Role.LENDER, email="lender@test.local")
    borrower_id = _seed_borrower(db_session, lender.id)
    headers = auth_headers(client, email="lender@test.local")

    response = client.post(
        "/api/v1/loans", json={**LOAN_PAYLOAD, "borrower_id": borrower_id}, headers=headers
    )

    assert response.status_code == 201
    body = response.json()
    assert Decimal(body["outstanding_amount"]) == Decimal("840000.00")
    assert Decimal(body["principal_amount"]) == Decimal("1000000.00")


def test_creating_a_loan_for_an_unknown_borrower_returns_404(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")
    headers = auth_headers(client, email="lender@test.local")

    response = client.post(
        "/api/v1/loans", json={**LOAN_PAYLOAD, "borrower_id": "does-not-exist"}, headers=headers
    )

    assert response.status_code == 404


def test_loans_can_be_filtered_by_borrower(client, db_session):
    lender = make_user(db_session, role=Role.LENDER, email="lender@test.local")
    borrower_id = _seed_borrower(db_session, lender.id)
    headers = auth_headers(client, email="lender@test.local")
    client.post("/api/v1/loans", json={**LOAN_PAYLOAD, "borrower_id": borrower_id}, headers=headers)

    response = client.get(f"/api/v1/loans?borrower_id={borrower_id}", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["borrower_id"] == borrower_id


def test_a_negative_outstanding_amount_is_rejected(client, db_session):
    lender = make_user(db_session, role=Role.LENDER, email="lender@test.local")
    borrower_id = _seed_borrower(db_session, lender.id)
    headers = auth_headers(client, email="lender@test.local")

    payload = {**LOAN_PAYLOAD, "borrower_id": borrower_id, "outstanding_amount": "-1.00"}
    response = client.post("/api/v1/loans", json=payload, headers=headers)

    assert response.status_code == 422
