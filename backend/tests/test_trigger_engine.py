from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.models.climate import ClimateObservation, QualityStatus
from app.models.trigger import TriggerOutcome
from app.modules.trigger_engine.engine import TriggerRuleError, build_evaluation_key, evaluate

# Mirrors the canonical demo configuration: Surat, extreme rainfall, 160 mm
# strike (MONSOONCOVER_SPEC.md §9 and the frontend's demo copy).
RULE = {
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


def make_observation(
    *,
    value: str,
    local_date: str = "2026-08-27",
    provider: str = "HistoricalCSVProvider",
    parameter: str = "precipitation",
    unit: str = "mm",
    zone_id: str = "SURAT-DEMO-Z1",
    quality: QualityStatus = QualityStatus.VERIFIED_REFERENCE_DATA,
    record_id: str | None = None,
) -> ClimateObservation:
    return ClimateObservation(
        id=record_id or f"obs-{local_date}-{value}",
        dataset_id="dataset-1",
        provider=provider,
        provider_record_id=record_id or f"rec-{local_date}-{value}",
        source_classification="REAL",
        source_uri_or_file="data/historical/raw/surat_rainfall.csv",
        ingested_at_utc=datetime(2026, 9, 1, tzinfo=timezone.utc),
        observed_at_utc=datetime.fromisoformat(f"{local_date}T00:00:00+00:00"),
        source_timezone="Asia/Kolkata",
        policy_local_date=local_date,
        latitude=Decimal("21.170200"),
        longitude=Decimal("72.831100"),
        zone_id=zone_id,
        parameter=parameter,
        raw_value=Decimal(value),
        raw_unit=unit,
        normalized_value=Decimal(value),
        normalized_unit=unit,
        quality_status=quality,
        processing_version="v1",
        checksum_or_source_hash="abc123",
    )


class TestOutcomeBands:
    def test_at_or_above_strike_is_a_trigger_candidate(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1",
            trigger_rule=RULE,
            observations=[make_observation(value="120.0"), make_observation(value="64.0", local_date="2026-08-28")],
        )

        assert result.outcome is TriggerOutcome.TRIGGER_CANDIDATE
        assert result.observed_value == Decimal("184.0")

    def test_exactly_at_strike_is_a_candidate(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=[make_observation(value="160.0")]
        )

        assert result.outcome is TriggerOutcome.TRIGGER_CANDIDATE

    def test_between_near_and_strike_is_near_trigger(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=[make_observation(value="130.0")]
        )

        assert result.outcome is TriggerOutcome.NEAR_TRIGGER

    def test_below_the_near_band_is_no_trigger(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=[make_observation(value="12.0")]
        )

        assert result.outcome is TriggerOutcome.NO_TRIGGER

    def test_no_observations_is_no_trigger_not_an_error(self):
        result = evaluate(snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=[])

        assert result.outcome is TriggerOutcome.NO_TRIGGER
        assert result.observed_value == Decimal("0")


class TestSpecSection65Validation:
    """Each of these observations would push the total past the strike if it
    were counted. None of them may be."""

    @pytest.mark.parametrize(
        ("kwargs", "reason_fragment"),
        [
            ({"quality": QualityStatus.NORMALIZED}, "VERIFIED_REFERENCE_DATA"),
            ({"provider": "OpenMeteoProvider"}, "settlement source"),
            ({"parameter": "temperature"}, "parameter"),
            ({"unit": "cm"}, "unit"),
            ({"zone_id": "BHARUCH-DEMO-Z2"}, "zone"),
            ({"local_date": "2026-10-15"}, "outside the aggregation window"),
        ],
    )
    def test_ineligible_observations_are_excluded_with_a_recorded_reason(self, kwargs, reason_fragment):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1",
            trigger_rule=RULE,
            observations=[make_observation(value="500.0", **kwargs)],
        )

        assert result.outcome is TriggerOutcome.NO_TRIGGER
        assert result.observed_value == Decimal("0")

        screening = next(step for step in result.steps if step["step"] == "observations_screened")
        excluded = screening["value"]["excluded"]
        assert len(excluded) == 1
        assert reason_fragment in excluded[0]["reason"]

    def test_a_settlement_source_mismatch_cannot_be_silently_substituted(self):
        """§6.5: the system must not silently substitute another provider for
        settlement, even when that provider's data would satisfy the rule."""
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1",
            trigger_rule=RULE,
            observations=[
                make_observation(value="200.0", provider="OpenMeteoProvider", record_id="openmeteo-1"),
                make_observation(value="10.0", record_id="csv-1"),
            ],
        )

        assert result.outcome is TriggerOutcome.NO_TRIGGER
        assert result.observed_value == Decimal("10.0")


class TestAggregationWindow:
    """§6.5 separates the cover period from the aggregation window, so a
    season-long policy can trigger on a short event inside it."""

    SEASON_RULE = {
        **RULE,
        "risk_period_start_local": "2026-06-15",
        "risk_period_end_local": "2026-09-30",
        "event_window_start_local": "2026-08-27",
        "event_window_end_local": "2026-08-28",
    }

    def test_the_event_window_narrows_which_observations_count(self):
        result = evaluate(
            snapshot_reference="MC-PS-1",
            trigger_rule=self.SEASON_RULE,
            observations=[
                make_observation(value="120.0", local_date="2026-08-27"),
                make_observation(value="64.0", local_date="2026-08-28"),
                # Inside the season, outside the event window.
                make_observation(value="500.0", local_date="2026-07-01"),
            ],
        )

        assert result.observed_value == Decimal("184.0")
        assert result.window_start_local == "2026-08-27"
        assert result.window_end_local == "2026-08-28"

    def test_the_trace_reports_both_the_window_and_the_cover_period(self):
        result = evaluate(
            snapshot_reference="MC-PS-1",
            trigger_rule=self.SEASON_RULE,
            observations=[make_observation(value="184.0")],
        )
        loaded = next(step for step in result.steps if step["step"] == "rule_loaded")

        assert "between 2026-08-27 and 2026-08-28" in loaded["description"]
        assert "Cover period 2026-06-15..2026-09-30" in loaded["description"]

    def test_a_rule_without_an_event_window_still_uses_the_risk_period(self):
        result = evaluate(
            snapshot_reference="MC-PS-1",
            trigger_rule=RULE,
            observations=[make_observation(value="184.0")],
        )

        assert result.window_start_local == RULE["risk_period_start_local"]
        assert result.outcome is TriggerOutcome.TRIGGER_CANDIDATE


class TestDeterminism:
    def test_same_inputs_produce_an_identical_outcome_key_and_digest(self):
        observations = [make_observation(value="120.0"), make_observation(value="64.0", local_date="2026-08-28")]

        first = evaluate(snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=observations)
        second = evaluate(snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=list(reversed(observations)))

        assert first.outcome is second.outcome
        assert first.observed_value == second.observed_value
        assert first.evaluation_key == second.evaluation_key
        assert first.inputs_digest == second.inputs_digest

    def test_evaluation_key_covers_the_spec_section_13_components(self):
        key = build_evaluation_key(snapshot_reference="MC-PS-2026-0142-v1", rule=RULE)

        for component in ["MC-PS-2026-0142-v1", "SURAT-DEMO-Z1", "2026-06-15", "2026-09-30", "EXTREME_RAINFALL", "trigger-engine-v1"]:
            assert component in key

    def test_a_different_snapshot_produces_a_different_key(self):
        assert build_evaluation_key(snapshot_reference="MC-PS-A", rule=RULE) != build_evaluation_key(
            snapshot_reference="MC-PS-B", rule=RULE
        )


class TestCalculationTrace:
    def test_trace_shows_the_arithmetic_a_reviewer_needs(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1",
            trigger_rule=RULE,
            observations=[make_observation(value="120.0"), make_observation(value="64.0", local_date="2026-08-28")],
        )

        assert [step["step"] for step in result.steps] == [
            "rule_loaded",
            "observations_screened",
            "aggregated",
            "compared",
            "outcome",
        ]
        assert "184.0 >= 160.0" in next(s for s in result.steps if s["step"] == "compared")["value"]

    def test_candidate_trace_states_it_is_not_approval(self):
        result = evaluate(
            snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=[make_observation(value="184.0")]
        )

        outcome_step = next(step for step in result.steps if step["step"] == "outcome")
        assert "not claim approval" in outcome_step["description"]


class TestRuleValidation:
    def test_a_missing_rule_field_raises_rather_than_returning_no_trigger(self):
        broken = {key: value for key, value in RULE.items() if key != "strike_threshold"}

        with pytest.raises(TriggerRuleError, match="strike_threshold"):
            evaluate(snapshot_reference="MC-PS-1", trigger_rule=broken, observations=[])

    def test_an_unsupported_aggregation_raises(self):
        with pytest.raises(TriggerRuleError, match="aggregation"):
            evaluate(snapshot_reference="MC-PS-1", trigger_rule={**RULE, "aggregation": "MAX"}, observations=[])

    def test_a_near_threshold_above_strike_raises(self):
        with pytest.raises(TriggerRuleError, match="near_trigger_threshold"):
            evaluate(snapshot_reference="MC-PS-1", trigger_rule={**RULE, "near_trigger_threshold": "999"}, observations=[])


def test_the_engine_cannot_express_claim_approval():
    """§7.3: the engine never outputs CLAIM_APPROVED. Enforced by the type,
    not by convention."""
    assert {outcome.value for outcome in TriggerOutcome} == {"NO_TRIGGER", "NEAR_TRIGGER", "TRIGGER_CANDIDATE"}
