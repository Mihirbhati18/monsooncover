"""HistoricalCSVProvider — the principal reproducible demo source.

Implements the climate-data provider contract from MONSOONCOVER_SPEC.md
§12.3 (fetch_observations / normalize / validate) and walks records through
the §6.2 processing stages:

    RAW -> NORMALIZED -> VALIDATED -> VERIFIED_REFERENCE_DATA

Only VERIFIED_REFERENCE_DATA can support a settlement-oriented trigger
candidate, so nothing here promotes a record to that stage unless it also
matches the provider and use authorized by the policy configuration.
"""

import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

from app.models.climate import ClimateObservation, QualityStatus

PROVIDER_NAME = "HistoricalCSVProvider"
PROCESSING_VERSION = "historical-csv-v1"


class DatasetIntegrityError(RuntimeError):
    """The dataset on disk does not match its manifest checksum.

    §6.4 requires the demo to run from a verified, checksummed dataset. A
    settlement-reference file that has changed since registration must stop
    the pipeline, never be used with a warning."""


@dataclass(frozen=True)
class DatasetManifest:
    dataset_code: str
    classification: str
    original_sha256: str
    source_uri_or_file: str
    transformation_version: str

    @classmethod
    def load(cls, manifest_path: Path) -> "DatasetManifest":
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
        return cls(
            dataset_code=payload["dataset_code"],
            classification=payload["classification"],
            original_sha256=payload["original_sha256"],
            source_uri_or_file=payload["original_filename"],
            transformation_version=payload["transformation_version"],
        )


def verify_dataset_checksum(csv_path: Path, manifest: DatasetManifest) -> str:
    actual = hashlib.sha256(csv_path.read_bytes()).hexdigest()
    if actual != manifest.original_sha256:
        raise DatasetIntegrityError(
            f"Dataset {manifest.dataset_code} failed checksum verification. "
            f"Manifest expects {manifest.original_sha256}, file on disk is {actual}. "
            "Refusing to use unverified settlement-reference data (§6.4)."
        )
    return actual


def fetch_observations(csv_path: Path) -> list[dict]:
    """Stage RAW: source-faithful ingestion, no interpretation."""
    with csv_path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def normalize(raw: dict) -> dict:
    """Stage NORMALIZED: standardize units, timestamps and identifiers."""
    value = Decimal(raw["value"])
    unit = raw["unit"]

    if unit == "cm":
        value, unit = value * Decimal("10"), "mm"
    elif unit != "mm":
        raise ValueError(f"Unsupported source unit '{unit}' for parameter '{raw['parameter']}'")

    return {
        "provider_record_id": raw["record_id"],
        "policy_local_date": raw["date_local"],
        "observed_at_utc": datetime.fromisoformat(f"{raw['date_local']}T00:00:00+00:00"),
        "latitude": Decimal(raw["latitude"]),
        "longitude": Decimal(raw["longitude"]),
        "zone_id": raw["zone_id"],
        "parameter": raw["parameter"],
        "raw_value": Decimal(raw["value"]),
        "raw_unit": raw["unit"],
        "normalized_value": value,
        "normalized_unit": unit,
    }


def validate(normalized: dict, trigger_rule: dict) -> tuple[bool, str]:
    """Stage VALIDATED -> VERIFIED_REFERENCE_DATA.

    Applies the §6.5 checks that belong to ingestion. The Trigger Engine
    re-applies the policy-facing checks independently; that duplication is
    deliberate, so a bug in one layer cannot silently admit data into a
    settlement decision."""

    if normalized["normalized_value"] < 0:
        return False, "negative precipitation is outside the plausible range"
    if normalized["parameter"] != trigger_rule["parameter"]:
        return False, f"parameter '{normalized['parameter']}' is not the policy parameter"
    if normalized["normalized_unit"] != trigger_rule["normalized_unit"]:
        return False, f"unit '{normalized['normalized_unit']}' is not the policy unit"
    if normalized["zone_id"] != trigger_rule["zone_id"]:
        return False, f"zone '{normalized['zone_id']}' is outside the covered zone"
    return True, "verified against the policy-authorized provider and use"


def ingest(
    *, csv_path: Path, manifest_path: Path, dataset_id: str, trigger_rule: dict
) -> list[ClimateObservation]:
    """Runs the full RAW -> VERIFIED_REFERENCE_DATA pipeline for one dataset.

    Historical replay must go through this same code path rather than
    bypassing it (§6.7)."""

    manifest = DatasetManifest.load(manifest_path)
    checksum = verify_dataset_checksum(csv_path, manifest)
    ingested_at = datetime.now(timezone.utc)

    observations: list[ClimateObservation] = []
    for raw in fetch_observations(csv_path):
        normalized = normalize(raw)
        is_valid, _reason = validate(normalized, trigger_rule)

        observations.append(
            ClimateObservation(
                dataset_id=dataset_id,
                provider=PROVIDER_NAME,
                source_classification=manifest.classification,
                source_uri_or_file=manifest.source_uri_or_file,
                ingested_at_utc=ingested_at,
                source_timezone=trigger_rule["policy_timezone"],
                quality_status=(
                    QualityStatus.VERIFIED_REFERENCE_DATA if is_valid else QualityStatus.REJECTED
                ),
                processing_version=PROCESSING_VERSION,
                checksum_or_source_hash=checksum,
                **normalized,
            )
        )

    return observations
