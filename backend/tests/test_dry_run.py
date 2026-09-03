"""Dry Run — MONSOONCOVER_SPEC.md §6.7.

"Dry Run evaluates a proposed, inactive configuration against historical
data... Dry Run never creates claims, payouts, lender postings, or
borrower notifications."

The demo value of this endpoint is that it answers the obvious judge's
question — "does it just always say TRIGGER_CANDIDATE?" — by producing
all three outcomes from the same engine and the same dataset, while
provably changing nothing.
"""

from datetime import datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.models.audit import AuditEvent
from app.models.climate import ClimateDataset, ClimateObservation, QualityStatus
from app.models.trigger import CalculationTrace, TriggerEvaluation
from app.models.user import Role
from tests.conftest import auth_headers, make_user

# Mirrors the real Surat fixture: a quiet season with a 120/64 mm spike.
DAILY_RAINFALL = {
    "2026-07-03": "31.4",
    "2026-07-19": "27.5",
    "2026-08-21": "38.9",
    "2026-08-27": "120.0",
    "2026-08-28": "64.0",
    "2026-09-04": "11.2",
}


@pytest.fixture()
def seeded(db_session):
    dataset = ClimateDataset(
        dataset_code="DS-MC-RAIN-2026-01",
        source_organization="MonsoonCover project (synthetic demo fixture)",
        source_uri_or_document="generated-in-repository",
        original_filename="surat_rainfall_2026.csv",
        accessed_at_utc=datetime(2026, 9, 3, tzinfo=timezone.utc),
        geographic_coverage="SURAT-DEMO-Z1",
        temporal_coverage="2026",
        parameter_definitions="precipitation mm",
        original_sha256="29d97cfba58731aeb433741680e85b4683ead8205db4044e1cd23c81fc5c0693",
        transformation_version="historical-csv-v1",
        source_classification="SIMULATED",
    )
    db_session.add(dataset)
    db_session.flush()

    for local_date, value in DAILY_RAINFALL.items():
        db_session.add(
            ClimateObservation(
                dataset_id=dataset.id,
                provider="HistoricalCSVProvider",
                provider_record_id=f"SURAT-{local_date}",
                source_classification="SIMULATED",
                source_uri_or_file="surat_rainfall_2026.csv",
                ingested_at_utc=datetime(2026, 9, 1, tzinfo=timezone.utc),
                observed_at_utc=datetime.fromisoformat(f"{local_date}T00:00:00+00:00"),
                source_timezone="Asia/Kolkata",
                policy_local_date=local_date,
                latitude=Decimal("21.170200"),
                longitude=Decimal("72.831100"),
                zone_id="SURAT-DEMO-Z1",
                parameter="precipitation",
                raw_value=Decimal(value),
                raw_unit="mm",
                normalized_value=Decimal(value),
                normalized_unit="mm",
                quality_status=QualityStatus.VERIFIED_REFERENCE_DATA,
                processing_version="v1",
                checksum_or_source_hash="abc",
            )
        )
    db_session.commit()


def lender(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")
    return auth_headers(client, email="lender@test.local")


def dry_run(client, headers, **overrides):
    response = client.post("/api/v1/triggers/dry-run", json=overrides, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


class TestAllThreeOutcomesFromOneEngine:
    """The same engine and the same dataset, three different answers."""

    def test_the_event_window_reaches_trigger_candidate(self, client, db_session, seeded):
        body = dry_run(client, lender(client, db_session))

        assert body["outcome"] == "TRIGGER_CANDIDATE"
        assert Decimal(body["observed_value"]) == Decimal("184.0")
        assert body["eligible_observation_count"] == 2

    def test_a_single_heavy_day_falls_short_of_the_configured_bands(self, client, db_session, seeded):
        """120 mm on its own is below the 128 mm near-trigger band, so the
        heaviest day in the season alone is still NO_TRIGGER."""
        body = dry_run(
            client,
            lender(client, db_session),
            event_window_start_local="2026-08-27",
            event_window_end_local="2026-08-27",
        )

        assert body["outcome"] == "NO_TRIGGER"
        assert Decimal(body["observed_value"]) == Decimal("120.0")

    def test_the_same_day_becomes_a_near_trigger_under_a_lower_band(self, client, db_session, seeded):
        """Identical observations, a different proposed near-trigger
        threshold, a different outcome — which is the point of a dry run."""
        body = dry_run(
            client,
            lender(client, db_session),
            event_window_start_local="2026-08-27",
            event_window_end_local="2026-08-27",
            near_trigger_threshold="100.0",
        )

        assert body["outcome"] == "NEAR_TRIGGER"
        assert Decimal(body["observed_value"]) == Decimal("120.0")

    def test_a_quiet_window_gives_no_trigger(self, client, db_session, seeded):
        body = dry_run(
            client,
            lender(client, db_session),
            event_window_start_local="2026-07-01",
            event_window_end_local="2026-07-31",
        )

        assert body["outcome"] == "NO_TRIGGER"
        assert Decimal(body["observed_value"]) == Decimal("58.9")

    def test_raising_the_strike_turns_a_candidate_into_a_near_trigger(self, client, db_session, seeded):
        headers = lender(client, db_session)
        before = dry_run(client, headers)
        after = dry_run(client, headers, strike_threshold="200.0", near_trigger_threshold="150.0")

        assert before["outcome"] == "TRIGGER_CANDIDATE"
        assert after["outcome"] == "NEAR_TRIGGER"
        # Same observed value; only the proposed threshold moved.
        assert before["observed_value"] == after["observed_value"]


class TestDryRunCreatesNothing:
    """§6.7: Dry Run never creates claims, payouts, postings or
    notifications. This implementation goes further and writes nothing at
    all, so a reviewer can re-run it freely."""

    def test_dry_run_persists_nothing(self, client, db_session, seeded):
        headers = lender(client, db_session)

        def counts():
            return {
                "evaluations": db_session.scalar(select(func.count()).select_from(TriggerEvaluation)),
                "traces": db_session.scalar(select(func.count()).select_from(CalculationTrace)),
                "audit": db_session.scalar(select(func.count()).select_from(AuditEvent)),
                "observations": db_session.scalar(select(func.count()).select_from(ClimateObservation)),
            }

        before = counts()
        for _ in range(3):
            dry_run(client, headers)
        db_session.expire_all()

        assert counts() == before

    def test_the_response_declares_that_nothing_was_persisted(self, client, db_session, seeded):
        body = dry_run(client, lender(client, db_session))

        assert body["persisted"] is False

    def test_the_trace_never_claims_an_accepted_snapshot(self, client, db_session, seeded):
        body = dry_run(client, lender(client, db_session))
        loaded = next(step for step in body["trace_steps"] if step["step"] == "rule_loaded")

        assert "no accepted snapshot" in loaded["description"]


class TestGuards:
    def test_an_unknown_zone_is_refused(self, client, db_session, seeded):
        response = client.post(
            "/api/v1/triggers/dry-run",
            json={"zone_id": "NOWHERE-Z9"},
            headers=lender(client, db_session),
        )

        assert response.status_code == 422
        assert "No observations are held" in response.json()["detail"]

    def test_a_near_threshold_above_the_strike_is_refused(self, client, db_session, seeded):
        response = client.post(
            "/api/v1/triggers/dry-run",
            json={"strike_threshold": "100.0", "near_trigger_threshold": "900.0"},
            headers=lender(client, db_session),
        )

        assert response.status_code == 422
        assert "near_trigger_threshold" in response.json()["detail"]

    def test_a_borrower_cannot_run_a_dry_run(self, client, db_session, seeded):
        make_user(db_session, role=Role.BORROWER, email="borrower@test.local")
        headers = auth_headers(client, email="borrower@test.local")

        assert client.post("/api/v1/triggers/dry-run", json={}, headers=headers).status_code == 403
