"""End-to-end: frozen CSV on disk -> ingestion pipeline -> Trigger Engine.

This is the test that backs MONSOONCOVER_SPEC.md §17 step 9 — proving the
demo's trigger is computed from a verified dataset, not a hard-coded screen
change.
"""

from decimal import Decimal
from pathlib import Path

import pytest

from app.adapters.climate.historical_csv import (
    DatasetIntegrityError,
    DatasetManifest,
    ingest,
    normalize,
    verify_dataset_checksum,
)
from app.models.climate import QualityStatus
from app.models.trigger import TriggerOutcome
from app.modules.trigger_engine.engine import evaluate

REPO_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = REPO_ROOT / "data" / "historical" / "raw" / "surat_rainfall_2026.csv"
MANIFEST_PATH = REPO_ROOT / "data" / "manifests" / "surat_rainfall_2026.json"

RULE = {
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


def test_the_frozen_dataset_matches_its_manifest_checksum():
    manifest = DatasetManifest.load(MANIFEST_PATH)
    assert verify_dataset_checksum(CSV_PATH, manifest) == manifest.original_sha256


def test_a_tampered_dataset_stops_the_pipeline(tmp_path):
    manifest = DatasetManifest.load(MANIFEST_PATH)
    tampered = tmp_path / "tampered.csv"
    tampered.write_text(CSV_PATH.read_text(encoding="utf-8") + "SURAT-FAKE,2026-08-29,21.1,72.8,SURAT-DEMO-Z1,precipitation,999.0,mm\n", encoding="utf-8")

    with pytest.raises(DatasetIntegrityError, match="checksum"):
        verify_dataset_checksum(tampered, manifest)


def test_the_canonical_demo_window_reaches_trigger_candidate():
    """The 27-28 Aug window sums to 184.0 mm against a 160 mm strike -
    the exact figures the demo UI shows."""
    observations = ingest(
        csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id="dataset-1", trigger_rule=RULE
    )

    result = evaluate(
        snapshot_reference="MC-PS-2026-0142-v1", trigger_rule=RULE, observations=observations
    )

    assert result.outcome is TriggerOutcome.TRIGGER_CANDIDATE
    assert result.observed_value == Decimal("184.0")
    assert len(result.observation_ids) == 2


def test_the_full_season_is_screened_by_risk_period():
    """Every row in the file is ingested and verified, but only the two
    inside the policy's risk period may contribute to the outcome."""
    observations = ingest(
        csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id="dataset-1", trigger_rule=RULE
    )

    assert len(observations) == 14
    assert all(o.quality_status is QualityStatus.VERIFIED_REFERENCE_DATA for o in observations)

    result = evaluate(snapshot_reference="MC-PS-1", trigger_rule=RULE, observations=observations)
    screening = next(step for step in result.steps if step["step"] == "observations_screened")
    assert screening["value"]["eligible"] == 2
    assert len(screening["value"]["excluded"]) == 12


def test_a_full_season_policy_period_aggregates_the_whole_season():
    season_rule = {**RULE, "risk_period_start_local": "2026-06-15", "risk_period_end_local": "2026-09-30"}
    observations = ingest(
        csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id="dataset-1", trigger_rule=season_rule
    )

    result = evaluate(snapshot_reference="MC-PS-1", trigger_rule=season_rule, observations=observations)

    assert result.observed_value == Decimal("387.9")
    assert result.outcome is TriggerOutcome.TRIGGER_CANDIDATE


def test_replay_is_reproducible_across_runs():
    first = evaluate(
        snapshot_reference="MC-PS-1",
        trigger_rule=RULE,
        observations=ingest(csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id="d1", trigger_rule=RULE),
    )
    second = evaluate(
        snapshot_reference="MC-PS-1",
        trigger_rule=RULE,
        observations=ingest(csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id="d1", trigger_rule=RULE),
    )

    assert first.inputs_digest == second.inputs_digest
    assert first.observed_value == second.observed_value
    assert first.outcome is second.outcome


def test_centimetre_source_values_are_normalized_to_millimetres():
    normalized = normalize(
        {
            "record_id": "X-1",
            "date_local": "2026-08-27",
            "latitude": "21.17",
            "longitude": "72.83",
            "zone_id": "SURAT-DEMO-Z1",
            "parameter": "precipitation",
            "value": "12.0",
            "unit": "cm",
        }
    )

    assert normalized["normalized_value"] == Decimal("120")
    assert normalized["normalized_unit"] == "mm"
    assert normalized["raw_value"] == Decimal("12.0")
    assert normalized["raw_unit"] == "cm"
