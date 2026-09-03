"""Risk Engine — MONSOONCOVER_SPEC.md §7.1.

Question: how exposed or vulnerable is this MSME/location to a peril?

Deliberate constraints, all from the specification:

- Output is an interpretable statistic-and-rule band (LOW/MODERATE/HIGH)
  with its methodology attached, not an opaque score. §7.1 allows ML only
  in a later phase "when a defensible dataset and evaluation exist", and
  no such dataset exists here.
- It must not approve or deny a loan, set an insurance price, or decide a
  claim. This module returns data and performs no side effect.
- An exposure band NEVER creates policy eligibility (§7.2: "A risk score
  alone never creates eligibility"). That check lives in the separate
  policy-matching engine and is enforced by its own tests.
- Sector sensitivity is reported as a separate labelled note rather than
  folded into the band, so a reader can see exactly what drove the result.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal

from app.models.climate import ClimateObservation
from app.models.risk import ExposureBand

METHODOLOGY_VERSION = "risk-engine-v1"

# Documented, inspectable thresholds. Changing these changes the published
# methodology and therefore requires a version bump.
HEAVY_DAY_THRESHOLD_MM = Decimal("50")
HIGH_MAX_DAILY_MM = Decimal("100")
HIGH_HEAVY_DAY_COUNT = 3
MODERATE_MAX_DAILY_MM = Decimal("50")

# Sector notes are advisory context, never a numeric adjustment to the band.
SECTOR_SENSITIVITY = {
    "Textile manufacturing": "Ground-floor looms and stored fabric are sensitive to standing water.",
    "Food processing": "Cold-chain and hygiene interruptions follow water ingress and power loss.",
    "Cold-chain logistics": "Continuity depends on power; flooding raises spoilage risk sharply.",
    "Paper products": "Raw stock is highly water-sensitive.",
    "Light engineering": "Machinery tolerates brief water exposure better than stock-based sectors.",
    "Apparel": "Finished-goods inventory is water-sensitive.",
}


@dataclass(frozen=True)
class RiskResult:
    exposure_band: ExposureBand
    max_daily_value: Decimal
    total_value: Decimal
    heavy_day_count: int
    observation_count: int
    normalized_unit: str
    methodology_version: str
    assessed_at_utc: datetime
    methodology_steps: list[dict] = field(default_factory=list)


def assess(
    *,
    zone_id: str,
    peril: str,
    sector: str,
    observations: list[ClimateObservation],
    assessed_at_utc: datetime | None = None,
) -> RiskResult:
    """Computes an exposure band for one zone from its observation history."""

    assessed_at_utc = assessed_at_utc or datetime.now(timezone.utc)
    in_zone = [item for item in observations if item.zone_id == zone_id]

    unit = in_zone[0].normalized_unit if in_zone else "mm"
    values = [item.normalized_value for item in in_zone]
    max_daily = max(values, default=Decimal("0"))
    total = sum(values, Decimal("0"))
    heavy_days = sum(1 for value in values if value >= HEAVY_DAY_THRESHOLD_MM)

    steps: list[dict] = [
        {
            "step": "observations_selected",
            "description": (
                f"Selected {len(in_zone)} observation(s) for zone {zone_id} from "
                f"{len(observations)} supplied record(s)."
            ),
            "value": len(in_zone),
        },
        {
            "step": "statistics_computed",
            "description": (
                f"Maximum daily {peril.lower().replace('_', ' ')} {max_daily} {unit}; "
                f"total {total} {unit}; {heavy_days} day(s) at or above {HEAVY_DAY_THRESHOLD_MM} {unit}."
            ),
            "value": {
                "max_daily": str(max_daily),
                "total": str(total),
                "heavy_days": heavy_days,
            },
        },
    ]

    if max_daily >= HIGH_MAX_DAILY_MM or heavy_days >= HIGH_HEAVY_DAY_COUNT:
        band = ExposureBand.HIGH
        rule = (
            f"max daily {max_daily} >= {HIGH_MAX_DAILY_MM} {unit}"
            if max_daily >= HIGH_MAX_DAILY_MM
            else f"{heavy_days} heavy days >= {HIGH_HEAVY_DAY_COUNT}"
        )
    elif max_daily >= MODERATE_MAX_DAILY_MM or heavy_days >= 1:
        band = ExposureBand.MODERATE
        rule = (
            f"max daily {max_daily} >= {MODERATE_MAX_DAILY_MM} {unit}"
            if max_daily >= MODERATE_MAX_DAILY_MM
            else f"{heavy_days} heavy day(s) >= 1"
        )
    else:
        band = ExposureBand.LOW
        rule = f"max daily {max_daily} < {MODERATE_MAX_DAILY_MM} {unit} and no heavy days"

    steps.append(
        {
            "step": "band_applied",
            "description": f"Applied methodology {METHODOLOGY_VERSION}: {rule} -> {band.value}.",
            "value": band.value,
        }
    )

    sector_note = SECTOR_SENSITIVITY.get(sector)
    steps.append(
        {
            "step": "sector_context",
            "description": (
                f"Sector context for {sector}: {sector_note}"
                if sector_note
                else f"No documented sector sensitivity note for {sector}."
            )
            + " Reported as context only; it does not change the band.",
            "value": sector,
        }
    )

    steps.append(
        {
            "step": "boundary",
            "description": (
                "Advisory exposure only. This result does not approve or deny credit, set a "
                "price, decide a claim, or make any policy applicable (§7.1, §7.2)."
            ),
            "value": None,
        }
    )

    return RiskResult(
        exposure_band=band,
        max_daily_value=max_daily,
        total_value=total,
        heavy_day_count=heavy_days,
        observation_count=len(in_zone),
        normalized_unit=unit,
        methodology_version=METHODOLOGY_VERSION,
        assessed_at_utc=assessed_at_utc,
        methodology_steps=steps,
    )
