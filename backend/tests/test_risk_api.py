"""HTTP tests for the two advisory engines.

The assertion that matters most here is the last one: a HIGH exposure band
does not make an out-of-zone borrower eligible for a policy.
"""

from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.models.borrower import Borrower
from app.models.climate import ClimateDataset, ClimateObservation, QualityStatus
from app.models.policy import PolicyVersion
from app.models.user import Role
from tests.conftest import auth_headers, make_user

TRIGGER_RULE = {
    "peril": "EXTREME_RAINFALL",
    "parameter": "precipitation",
    "normalized_unit": "mm",
    "aggregation": "SUM",
    "strike_threshold": "160.0",
    "near_trigger_threshold": "128.0",
    "zone_id": "SURAT-DEMO-Z1",
    "risk_period_start_local": "2026-06-15",
    "risk_period_end_local": "2026-09-30",
    "policy_timezone": "Asia/Kolkata",
    "required_provider": "HistoricalCSVProvider",
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
    surat = Borrower(
        name="ABC Textiles",
        sector="Textile manufacturing",
        city="Surat",
        state="Gujarat",
        zone_id="SURAT-DEMO-Z1",
    )
    elsewhere = Borrower(
        name="Far Away Mills",
        sector="Apparel",
        city="Rajkot",
        state="Gujarat",
        zone_id="RAJKOT-DEMO-Z9",
    )
    version = PolicyVersion(
        product_code="MC-DEMO-POL-RAIN-01",
        version="1.0",
        display_name="Extreme rainfall protection reference",
        trigger_rule=TRIGGER_RULE,
        disclosure_version="v1",
        classification="SIMULATED",
    )
    db_session.add_all([dataset, surat, elsewhere, version])
    db_session.flush()

    # A very wet history for BOTH zones, so exposure cannot be the thing
    # that distinguishes them in the eligibility test below.
    for zone in ("SURAT-DEMO-Z1", "RAJKOT-DEMO-Z9"):
        db_session.add(
            ClimateObservation(
                dataset_id=dataset.id,
                provider="HistoricalCSVProvider",
                provider_record_id=f"rec-{zone}",
                source_classification="SIMULATED",
                source_uri_or_file="surat_rainfall_2026.csv",
                ingested_at_utc=datetime(2026, 9, 1, tzinfo=timezone.utc),
                observed_at_utc=datetime(2026, 8, 27, tzinfo=timezone.utc),
                source_timezone="Asia/Kolkata",
                policy_local_date="2026-08-27",
                latitude=Decimal("21.170200"),
                longitude=Decimal("72.831100"),
                zone_id=zone,
                parameter="precipitation",
                raw_value=Decimal("120.0"),
                raw_unit="mm",
                normalized_value=Decimal("120.0"),
                normalized_unit="mm",
                quality_status=QualityStatus.VERIFIED_REFERENCE_DATA,
                processing_version="v1",
                checksum_or_source_hash="abc",
            )
        )
    db_session.commit()
    return {"surat": surat, "elsewhere": elsewhere}


def lender(client, db_session):
    make_user(db_session, role=Role.LENDER, email="lender@test.local")
    return auth_headers(client, email="lender@test.local")


class TestRiskAssessmentEndpoint:
    def test_it_returns_an_exposure_band_with_its_methodology(self, client, db_session, seeded):
        headers = lender(client, db_session)

        response = client.post(f"/api/v1/risk/assessments/{seeded['surat'].id}", headers=headers)

        assert response.status_code == 201, response.text
        body = response.json()
        assert body["exposure_band"] == "HIGH"
        assert body["classification"] == "DERIVED"
        assert [step["step"] for step in body["methodology_steps"]] == [
            "observations_selected",
            "statistics_computed",
            "band_applied",
            "sector_context",
            "boundary",
        ]

    def test_the_assessment_states_it_is_not_a_credit_decision(self, client, db_session, seeded):
        headers = lender(client, db_session)
        body = client.post(f"/api/v1/risk/assessments/{seeded['surat'].id}", headers=headers).json()

        boundary = next(s for s in body["methodology_steps"] if s["step"] == "boundary")
        assert "does not approve or deny credit" in boundary["description"]

    def test_only_the_borrower_zone_is_considered(self, client, db_session, seeded):
        headers = lender(client, db_session)
        body = client.post(f"/api/v1/risk/assessments/{seeded['surat'].id}", headers=headers).json()

        assert body["observation_count"] == 1
        assert body["zone_id"] == "SURAT-DEMO-Z1"

    def test_assessing_a_zone_with_no_observations_is_refused(self, client, db_session, seeded):
        """§6.5: missing data must surface rather than pass silently. An
        empty history would otherwise be reported as LOW exposure, which is
        more misleading than an error."""
        headers = lender(client, db_session)
        empty_zone_borrower = Borrower(
            name="No Data Traders",
            sector="Apparel",
            city="Bhuj",
            state="Gujarat",
            zone_id="BHUJ-NO-DATA-Z0",
        )
        db_session.add(empty_zone_borrower)
        db_session.commit()

        response = client.post(f"/api/v1/risk/assessments/{empty_zone_borrower.id}", headers=headers)

        assert response.status_code == 422
        assert "No observations are held for zone BHUJ-NO-DATA-Z0" in response.json()["detail"]

    def test_a_borrower_role_cannot_run_an_assessment(self, client, db_session, seeded):
        make_user(db_session, role=Role.BORROWER, email="borrower@test.local")
        headers = auth_headers(client, email="borrower@test.local")

        response = client.post(f"/api/v1/risk/assessments/{seeded['surat'].id}", headers=headers)
        assert response.status_code == 403


class TestEligibilityEndpoint:
    def test_a_borrower_in_the_covered_zone_is_eligible(self, client, db_session, seeded):
        headers = lender(client, db_session)

        response = client.post(
            f"/api/v1/policies/eligibility/{seeded['surat'].id}", json={}, headers=headers
        )

        assert response.status_code == 201, response.text
        assert response.json()["is_eligible"] is True

    def test_high_exposure_does_not_make_an_out_of_zone_borrower_eligible(
        self, client, db_session, seeded
    ):
        """§7.2: a risk score alone never creates eligibility. Both zones
        have identical, extreme rainfall history — only the covered zone
        may be offered the policy."""
        headers = lender(client, db_session)

        risk = client.post(f"/api/v1/risk/assessments/{seeded['elsewhere'].id}", headers=headers).json()
        eligibility = client.post(
            f"/api/v1/policies/eligibility/{seeded['elsewhere'].id}", json={}, headers=headers
        ).json()

        assert risk["exposure_band"] == "HIGH"
        assert eligibility["is_eligible"] is False

        geography = next(r for r in eligibility["reasons"] if r["constraint"] == "geography")
        assert geography["satisfied"] is False

        excluded = next(r for r in eligibility["reasons"] if r["constraint"] == "risk_score_excluded")
        assert "never creates eligibility" in excluded["detail"]

    def test_re_running_eligibility_updates_rather_than_duplicating(self, client, db_session, seeded):
        headers = lender(client, db_session)
        first = client.post(f"/api/v1/policies/eligibility/{seeded['surat'].id}", json={}, headers=headers)
        second = client.post(f"/api/v1/policies/eligibility/{seeded['surat'].id}", json={}, headers=headers)

        assert first.json()["id"] == second.json()["id"]
        assert len(client.get("/api/v1/policies/eligibility", headers=headers).json()) == 1
