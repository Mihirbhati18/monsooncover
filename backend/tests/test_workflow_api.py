"""HTTP-level tests for the workflow chain.

The most important assertion in this file is that a lender cannot approve
a trigger candidate through the API. That role boundary (§3) is what the
whole product rests on.
"""

from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.models.borrower import Borrower
from app.models.climate import ClimateDataset
from app.models.loan import Loan
from app.models.policy import BorrowerPolicySnapshot, PolicyState, PolicyVersion
from app.models.user import Role
from app.modules.settlement.deps import get_insurer_adapter, get_lender_adapter
from tests.conftest import auth_headers, make_user

SNAPSHOT_REFERENCE = "MC-PS-2026-0142-v1"
CORRELATION_ID = "EVENT-MC-2026-00427"

TRIGGER_RULE = {
    "peril": "EXTREME_RAINFALL",
    "parameter": "precipitation",
    "normalized_unit": "mm",
    "aggregation": "SUM",
    "strike_threshold": "160.0",
    "near_trigger_threshold": "128.0",
    "zone_id": "SURAT-DEMO-Z1",
    "risk_period_start_local": "2026-08-27",
    "risk_period_end_local": "2026-08-28",
    "policy_timezone": "Asia/Kolkata",
    "required_provider": "HistoricalCSVProvider",
}


@pytest.fixture(autouse=True)
def _reset_sandbox_adapters():
    """The sandbox adapters are process-level singletons, so their state
    must be cleared between tests."""
    insurer, lender = get_insurer_adapter(), get_lender_adapter()
    insurer.__init__()
    lender.__init__()
    yield


@pytest.fixture()
def seeded(db_session):
    borrower = Borrower(name="ABC Textiles", sector="Textile manufacturing", city="Surat", state="Gujarat")
    db_session.add(borrower)
    db_session.flush()

    loan = Loan(
        borrower_id=borrower.id,
        loan_type="Working-capital loan",
        principal_amount=Decimal("1000000.00"),
        emi_amount=Decimal("62000.00"),
        outstanding_amount=Decimal("840000.00"),
        currency="INR",
    )
    dataset = ClimateDataset(
        dataset_code="DS-MC-RAIN-2026-01",
        source_organization="MonsoonCover project (synthetic demo fixture)",
        source_uri_or_document="generated-in-repository",
        original_filename="surat_rainfall_2026.csv",
        accessed_at_utc=datetime(2026, 9, 3, tzinfo=timezone.utc),
        geographic_coverage="SURAT-DEMO-Z1",
        temporal_coverage="2026-06-15..2026-09-25",
        parameter_definitions="precipitation mm",
        original_sha256="29d97cfba58731aeb433741680e85b4683ead8205db4044e1cd23c81fc5c0693",
        transformation_version="historical-csv-v1",
        source_classification="SIMULATED",
    )
    version = PolicyVersion(
        product_code="MC-DEMO-POL-RAIN-01",
        version="1.0",
        display_name="Extreme rainfall protection reference",
        trigger_rule=TRIGGER_RULE,
        disclosure_version="v1",
        classification="SIMULATED",
    )
    db_session.add_all([loan, dataset, version])
    db_session.flush()

    db_session.add(
        BorrowerPolicySnapshot(
            snapshot_reference=SNAPSHOT_REFERENCE,
            borrower_id=borrower.id,
            loan_id=loan.id,
            policy_version_id=version.id,
            trigger_rule_snapshot=TRIGGER_RULE,
            disclosure_version="v1",
            consent_recorded_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
            accepted_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
            snapshot_checksum="demo-snapshot-checksum",
            state=PolicyState.ACTIVE,
        )
    )
    db_session.commit()
    return {"loan": loan}


def _replay(client, headers):
    response = client.post(
        "/api/v1/triggers/replay",
        json={"snapshot_reference": SNAPSHOT_REFERENCE, "correlation_id": CORRELATION_ID},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


class TestReplayEndpoint:
    def test_replay_computes_the_candidate_and_returns_its_trace(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        headers = auth_headers(client, email="lender@test.local")

        body = _replay(client, headers)

        assert body["outcome"] == "TRIGGER_CANDIDATE"
        assert Decimal(body["observed_value"]) == Decimal("184.0")
        assert body["observation_count"] == 2
        assert [step["step"] for step in body["trace_steps"]] == [
            "rule_loaded",
            "observations_screened",
            "aggregated",
            "compared",
            "outcome",
        ]

    def test_replaying_twice_returns_the_same_evaluation(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        headers = auth_headers(client, email="lender@test.local")

        assert _replay(client, headers)["id"] == _replay(client, headers)["id"]

    def test_a_borrower_cannot_run_a_replay(self, client, db_session, seeded):
        make_user(db_session, role=Role.BORROWER, email="borrower@test.local")
        headers = auth_headers(client, email="borrower@test.local")

        response = client.post(
            "/api/v1/triggers/replay",
            json={"snapshot_reference": SNAPSHOT_REFERENCE, "correlation_id": CORRELATION_ID},
            headers=headers,
        )
        assert response.status_code == 403


class TestRoleBoundary:
    """§3: the insurer decides. Not the lender, and not MonsoonCover."""

    def test_a_lender_cannot_record_an_insurer_decision(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        headers = auth_headers(client, email="lender@test.local")
        evaluation = _replay(client, headers)

        request = client.post(
            f"/api/v1/settlement/insurer-requests/{evaluation['id']}", headers=headers
        ).json()

        response = client.post(
            f"/api/v1/settlement/insurer-requests/{request['id']}/decision",
            json={
                "outcome": "APPROVED",
                "reason": "Lender attempting to self-approve this candidate.",
                "approved_amount": "40000.00",
                "currency": "INR",
            },
            headers=headers,
        )

        assert response.status_code == 403

    def test_the_insurer_can_record_a_decision(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        make_user(db_session, role=Role.INSURER, email="insurer@test.local")
        lender_headers = auth_headers(client, email="lender@test.local")
        insurer_headers = auth_headers(client, email="insurer@test.local")

        evaluation = _replay(client, lender_headers)
        request = client.post(
            f"/api/v1/settlement/insurer-requests/{evaluation['id']}", headers=lender_headers
        ).json()

        response = client.post(
            f"/api/v1/settlement/insurer-requests/{request['id']}/decision",
            json={
                "outcome": "APPROVED",
                "reason": "Evidence packet reviewed against the accepted snapshot rule.",
                "approved_amount": "40000.00",
                "currency": "INR",
            },
            headers=insurer_headers,
        )

        assert response.status_code == 201, response.text
        assert response.json()["outcome"] == "APPROVED"
        assert response.json()["decided_by"] == "insurer@test.local"

    def test_a_decision_reason_is_required(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        make_user(db_session, role=Role.INSURER, email="insurer@test.local")
        lender_headers = auth_headers(client, email="lender@test.local")
        insurer_headers = auth_headers(client, email="insurer@test.local")

        evaluation = _replay(client, lender_headers)
        request = client.post(
            f"/api/v1/settlement/insurer-requests/{evaluation['id']}", headers=lender_headers
        ).json()

        response = client.post(
            f"/api/v1/settlement/insurer-requests/{request['id']}/decision",
            json={"outcome": "APPROVED", "reason": "too short", "approved_amount": "40000.00"},
            headers=insurer_headers,
        )
        assert response.status_code == 422


class TestFullChainOverHttp:
    def test_the_whole_chain_runs_and_reconciles(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        make_user(db_session, role=Role.INSURER, email="insurer@test.local")
        lender = auth_headers(client, email="lender@test.local")
        insurer = auth_headers(client, email="insurer@test.local")

        evaluation = _replay(client, lender)
        request = client.post(f"/api/v1/settlement/insurer-requests/{evaluation['id']}", headers=lender).json()

        decision = client.post(
            f"/api/v1/settlement/insurer-requests/{request['id']}/decision",
            json={
                "outcome": "APPROVED",
                "reason": "Evidence packet reviewed against the accepted snapshot rule.",
                "approved_amount": "40000.00",
                "currency": "INR",
            },
            headers=insurer,
        ).json()

        payout = client.post(f"/api/v1/settlement/payouts/{decision['id']}", headers=lender).json()
        posting = client.post(f"/api/v1/settlement/postings/{payout['id']}", headers=lender).json()
        record = client.post(f"/api/v1/settlement/reconciliations/{payout['id']}", headers=lender).json()

        # Posting moves the payout to PAID, so re-read it rather than
        # trusting the response captured before the posting happened.
        refreshed = client.get(f"/api/v1/settlement/payouts/{payout['id']}", headers=lender).json()

        assert payout["state"] == "INITIATED"
        assert refreshed["state"] == "PAID"
        assert posting["state"] == "POSTED"
        assert record["state"] == "RECONCILED"
        assert Decimal(record["insurer_amount"]) == Decimal(record["lender_amount"]) == Decimal("40000.00")

    def test_a_payout_before_approval_is_a_409_not_a_500(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        make_user(db_session, role=Role.INSURER, email="insurer@test.local")
        lender = auth_headers(client, email="lender@test.local")
        insurer = auth_headers(client, email="insurer@test.local")

        evaluation = _replay(client, lender)
        request = client.post(f"/api/v1/settlement/insurer-requests/{evaluation['id']}", headers=lender).json()
        decision = client.post(
            f"/api/v1/settlement/insurer-requests/{request['id']}/decision",
            json={"outcome": "REJECTED", "reason": "Evidence insufficient for this sandbox review."},
            headers=insurer,
        ).json()

        response = client.post(f"/api/v1/settlement/payouts/{decision['id']}", headers=lender)

        assert response.status_code == 409
        assert "requires insurer approval" in response.json()["detail"]


class TestAuditEndpoint:
    def test_the_audit_trail_is_readable_by_correlation_id(self, client, db_session, seeded):
        make_user(db_session, role=Role.LENDER, email="lender@test.local")
        headers = auth_headers(client, email="lender@test.local")
        _replay(client, headers)

        response = client.get(f"/api/v1/audit?correlation_id={CORRELATION_ID}", headers=headers)

        assert response.status_code == 200
        events = response.json()
        assert any(event["event_type"] == "TRIGGER_EVALUATED" for event in events)
        assert all(event["correlation_id"] == CORRELATION_ID for event in events)

    def test_the_audit_api_exposes_no_mutating_verbs(self, client, db_session):
        """§15.2: audit records must not be edited or deleted through
        ordinary API operations."""
        make_user(db_session, role=Role.ADMIN, email="admin@test.local")
        headers = auth_headers(client, email="admin@test.local")

        for method in (client.post, client.put, client.patch, client.delete):
            response = method("/api/v1/audit", headers=headers)
            assert response.status_code == 405
