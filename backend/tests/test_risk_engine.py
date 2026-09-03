from datetime import datetime, timezone
from decimal import Decimal

from app.models.climate import ClimateObservation, QualityStatus
from app.models.risk import ExposureBand
from app.modules.risk_engine.engine import METHODOLOGY_VERSION, assess


def observation(value: str, *, zone_id: str = "SURAT-DEMO-Z1", date: str = "2026-08-27"):
    return ClimateObservation(
        id=f"obs-{zone_id}-{date}-{value}",
        dataset_id="dataset-1",
        provider="HistoricalCSVProvider",
        provider_record_id=f"rec-{zone_id}-{date}-{value}",
        source_classification="SIMULATED",
        source_uri_or_file="surat_rainfall_2026.csv",
        ingested_at_utc=datetime(2026, 9, 1, tzinfo=timezone.utc),
        observed_at_utc=datetime.fromisoformat(f"{date}T00:00:00+00:00"),
        source_timezone="Asia/Kolkata",
        policy_local_date=date,
        latitude=Decimal("21.170200"),
        longitude=Decimal("72.831100"),
        zone_id=zone_id,
        parameter="precipitation",
        raw_value=Decimal(value),
        raw_unit="mm",
        normalized_value=Decimal(value),
        normalized_unit="mm",
        quality_status=QualityStatus.VERIFIED_REFERENCE_DATA,
        processing_version="v1",
        checksum_or_source_hash="abc123",
    )


def run(observations, sector="Textile manufacturing"):
    return assess(
        zone_id="SURAT-DEMO-Z1",
        peril="EXTREME_RAINFALL",
        sector=sector,
        observations=observations,
    )


class TestExposureBands:
    def test_a_very_heavy_day_gives_high_exposure(self):
        result = run([observation("120.0"), observation("4.0", date="2026-07-01")])

        assert result.exposure_band is ExposureBand.HIGH
        assert result.max_daily_value == Decimal("120.0")

    def test_three_heavy_days_give_high_exposure_without_an_extreme_day(self):
        result = run(
            [
                observation("55.0", date="2026-07-01"),
                observation("60.0", date="2026-07-02"),
                observation("51.0", date="2026-07-03"),
            ]
        )

        assert result.exposure_band is ExposureBand.HIGH
        assert result.heavy_day_count == 3
        assert result.max_daily_value < Decimal("100")

    def test_one_moderate_day_gives_moderate_exposure(self):
        result = run([observation("60.0"), observation("4.0", date="2026-07-01")])

        assert result.exposure_band is ExposureBand.MODERATE

    def test_light_rainfall_gives_low_exposure(self):
        result = run([observation("12.0"), observation("4.0", date="2026-07-01")])

        assert result.exposure_band is ExposureBand.LOW

    def test_no_observations_gives_low_exposure_with_zero_statistics(self):
        result = run([])

        assert result.exposure_band is ExposureBand.LOW
        assert result.max_daily_value == Decimal("0")
        assert result.observation_count == 0


class TestZoneScoping:
    def test_observations_from_another_zone_are_excluded(self):
        result = run(
            [observation("12.0"), observation("500.0", zone_id="BHARUCH-DEMO-Z2", date="2026-07-05")]
        )

        assert result.exposure_band is ExposureBand.LOW
        assert result.observation_count == 1
        assert result.max_daily_value == Decimal("12.0")


class TestExplainability:
    def test_the_methodology_is_returned_with_the_band(self):
        result = run([observation("120.0")])

        assert [step["step"] for step in result.methodology_steps] == [
            "observations_selected",
            "statistics_computed",
            "band_applied",
            "sector_context",
            "boundary",
        ]
        assert METHODOLOGY_VERSION in next(
            step["description"] for step in result.methodology_steps if step["step"] == "band_applied"
        )

    def test_the_result_states_its_own_boundary(self):
        result = run([observation("120.0")])
        boundary = next(step for step in result.methodology_steps if step["step"] == "boundary")

        assert "does not approve or deny credit" in boundary["description"]
        assert "make any policy applicable" in boundary["description"]

    def test_sector_context_is_reported_without_changing_the_band(self):
        sensitive = run([observation("60.0")], sector="Textile manufacturing")
        tolerant = run([observation("60.0")], sector="Light engineering")

        assert sensitive.exposure_band is tolerant.exposure_band

        sensitive_note = next(s for s in sensitive.methodology_steps if s["step"] == "sector_context")
        assert "does not change the band" in sensitive_note["description"]

    def test_an_unknown_sector_is_handled_without_inventing_a_note(self):
        result = run([observation("60.0")], sector="Astronaut supplies")
        note = next(s for s in result.methodology_steps if s["step"] == "sector_context")

        assert "No documented sector sensitivity note" in note["description"]


def test_the_engine_is_deterministic():
    observations = [observation("120.0"), observation("64.0", date="2026-08-28")]
    fixed_time = datetime(2026, 9, 4, tzinfo=timezone.utc)

    first = assess(
        zone_id="SURAT-DEMO-Z1",
        peril="EXTREME_RAINFALL",
        sector="Textile manufacturing",
        observations=observations,
        assessed_at_utc=fixed_time,
    )
    second = assess(
        zone_id="SURAT-DEMO-Z1",
        peril="EXTREME_RAINFALL",
        sector="Textile manufacturing",
        observations=list(reversed(observations)),
        assessed_at_utc=fixed_time,
    )

    assert first == second
