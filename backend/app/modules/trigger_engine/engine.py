"""Deterministic, explainable, versioned Trigger Engine.

MONSOONCOVER_SPEC.md §7.3: "Did verified reference data satisfy the exact
rule in the accepted policy snapshot?" The output is NO_TRIGGER,
NEAR_TRIGGER or TRIGGER_CANDIDATE plus a calculation trace. It never
outputs CLAIM_APPROVED and never performs a side effect — approval is an
insurer action (§3), and this module deliberately cannot express one.

The engine is pure: same inputs produce the same outcome, the same
evaluation key and the same trace, so a reviewer can re-run it and compare.
"""

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal

from app.models.climate import ClimateObservation, QualityStatus
from app.models.trigger import TriggerOutcome

EVALUATION_VERSION = "trigger-engine-v1"


class TriggerRuleError(ValueError):
    """The policy snapshot's rule is unusable. Per §6.5 this must surface as
    an exception for manual review, never a silent NO_TRIGGER."""


@dataclass(frozen=True)
class TriggerResult:
    outcome: TriggerOutcome
    observed_value: Decimal
    strike_threshold: Decimal
    near_trigger_threshold: Decimal
    normalized_unit: str
    window_start_local: str
    window_end_local: str
    evaluation_key: str
    evaluation_version: str
    evaluated_at_utc: datetime
    inputs_digest: str
    observation_ids: list[str] = field(default_factory=list)
    steps: list[dict] = field(default_factory=list)


REQUIRED_RULE_FIELDS = (
    "peril",
    "parameter",
    "normalized_unit",
    "aggregation",
    "strike_threshold",
    "near_trigger_threshold",
    "zone_id",
    "risk_period_start_local",
    "risk_period_end_local",
    "policy_timezone",
    "required_provider",
)


def _validate_rule(rule: dict) -> None:
    missing = [name for name in REQUIRED_RULE_FIELDS if rule.get(name) in (None, "")]
    if missing:
        raise TriggerRuleError(f"Policy snapshot rule is missing required fields: {', '.join(missing)}")

    if rule["aggregation"] != "SUM":
        raise TriggerRuleError(f"Unsupported aggregation '{rule['aggregation']}'; this engine version implements SUM only.")

    if Decimal(str(rule["near_trigger_threshold"])) > Decimal(str(rule["strike_threshold"])):
        raise TriggerRuleError("near_trigger_threshold must not exceed strike_threshold.")


def aggregation_window(rule: dict) -> tuple[str, str]:
    """The window whose observations are aggregated.

    §6.5 lists "correct risk period" and "expected observation frequency and
    aggregation window" as separate checks, so a policy may cover a whole
    season while a trigger aggregates a short event window inside it. When a
    rule omits the event window, the risk period is used, which keeps
    single-window policies working unchanged.
    """

    return (
        rule.get("event_window_start_local") or rule["risk_period_start_local"],
        rule.get("event_window_end_local") or rule["risk_period_end_local"],
    )


def _is_eligible(observation: ClimateObservation, rule: dict) -> tuple[bool, str]:
    """Applies the §6.5 validation rules. Returns (eligible, reason)."""

    if observation.quality_status is not QualityStatus.VERIFIED_REFERENCE_DATA:
        return False, f"quality_status is {observation.quality_status.value}, not VERIFIED_REFERENCE_DATA (§6.2)"
    if observation.provider != rule["required_provider"]:
        return False, f"provider '{observation.provider}' is not the settlement source the policy specifies (§6.1)"
    if observation.parameter != rule["parameter"]:
        return False, f"parameter '{observation.parameter}' does not match the policy parameter"
    if observation.normalized_unit != rule["normalized_unit"]:
        return False, f"unit '{observation.normalized_unit}' does not match the policy unit"
    if observation.zone_id != rule["zone_id"]:
        return False, f"zone '{observation.zone_id}' is outside the covered zone"
    window_start, window_end = aggregation_window(rule)
    if not (window_start <= observation.policy_local_date <= window_end):
        return False, (
            f"local date {observation.policy_local_date} is outside the "
            f"aggregation window {window_start}..{window_end}"
        )
    return True, "eligible"


def build_evaluation_key(*, snapshot_reference: str, rule: dict) -> str:
    """Deterministic key per §13: policy snapshot, zone, risk period,
    peril/index and evaluation version."""

    window_start, window_end = aggregation_window(rule)
    parts = [
        snapshot_reference,
        rule["zone_id"],
        window_start,
        window_end,
        rule["peril"],
        rule["parameter"],
        EVALUATION_VERSION,
    ]
    return "|".join(parts)


def _digest(payload: object) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()


def evaluate(
    *,
    snapshot_reference: str,
    trigger_rule: dict,
    observations: list[ClimateObservation],
    evaluated_at_utc: datetime | None = None,
) -> TriggerResult:
    """Evaluates one policy snapshot against candidate observations.

    Raises TriggerRuleError if the rule itself is unusable (§6.5: invalid
    configuration becomes a manual-review exception, not a silent pass)."""

    _validate_rule(trigger_rule)
    evaluated_at_utc = evaluated_at_utc or datetime.now(timezone.utc)

    strike = Decimal(str(trigger_rule["strike_threshold"]))
    near = Decimal(str(trigger_rule["near_trigger_threshold"]))
    unit = trigger_rule["normalized_unit"]
    window_start, window_end = aggregation_window(trigger_rule)

    steps: list[dict] = [
        {
            "step": "rule_loaded",
            "description": (
                f"Loaded rule from {snapshot_reference}: {trigger_rule['aggregation']} of "
                f"{trigger_rule['parameter']} in {unit} over zone {trigger_rule['zone_id']} between "
                f"{window_start} and {window_end} "
                f"({trigger_rule['policy_timezone']}), settlement source {trigger_rule['required_provider']}. "
                f"Cover period {trigger_rule['risk_period_start_local']}.."
                f"{trigger_rule['risk_period_end_local']}."
            ),
            "value": None,
        }
    ]

    eligible: list[ClimateObservation] = []
    excluded: list[dict] = []
    for observation in sorted(observations, key=lambda item: (item.observed_at_utc, item.provider_record_id)):
        ok, reason = _is_eligible(observation, trigger_rule)
        if ok:
            eligible.append(observation)
        else:
            excluded.append({"provider_record_id": observation.provider_record_id, "reason": reason})

    steps.append(
        {
            "step": "observations_screened",
            "description": (
                f"Screened {len(observations)} observation(s) against the §6.5 validation rules: "
                f"{len(eligible)} eligible, {len(excluded)} excluded."
            ),
            "value": {"eligible": len(eligible), "excluded": excluded},
        }
    )

    total = sum((observation.normalized_value for observation in eligible), Decimal("0"))
    steps.append(
        {
            "step": "aggregated",
            "description": f"Summed {len(eligible)} eligible observation(s) of {trigger_rule['parameter']}.",
            "value": f"{total} {unit}",
        }
    )

    if total >= strike:
        outcome = TriggerOutcome.TRIGGER_CANDIDATE
        comparison = f"{total} >= {strike}"
    elif total >= near:
        outcome = TriggerOutcome.NEAR_TRIGGER
        comparison = f"{near} <= {total} < {strike}"
    else:
        outcome = TriggerOutcome.NO_TRIGGER
        comparison = f"{total} < {near}"

    steps.append(
        {
            "step": "compared",
            "description": f"Compared aggregate against the accepted thresholds: {comparison} {unit}.",
            "value": comparison,
        }
    )
    steps.append(
        {
            "step": "outcome",
            "description": (
                f"Outcome {outcome.value}. "
                + (
                    "This is a candidate for independent insurer review only; it is not claim approval, "
                    "a payout instruction, or a lender posting (§3, §7.3)."
                    if outcome is TriggerOutcome.TRIGGER_CANDIDATE
                    else "No insurer submission is created for this outcome."
                )
            ),
            "value": outcome.value,
        }
    )

    observation_ids = [observation.id for observation in eligible]
    inputs_digest = _digest(
        {
            "snapshot_reference": snapshot_reference,
            "rule": trigger_rule,
            "observations": [
                {
                    "provider": observation.provider,
                    "provider_record_id": observation.provider_record_id,
                    "normalized_value": str(observation.normalized_value),
                    "policy_local_date": observation.policy_local_date,
                }
                for observation in eligible
            ],
        }
    )

    return TriggerResult(
        outcome=outcome,
        observed_value=total,
        strike_threshold=strike,
        near_trigger_threshold=near,
        normalized_unit=unit,
        window_start_local=window_start,
        window_end_local=window_end,
        evaluation_key=build_evaluation_key(snapshot_reference=snapshot_reference, rule=trigger_rule),
        evaluation_version=EVALUATION_VERSION,
        evaluated_at_utc=evaluated_at_utc,
        inputs_digest=inputs_digest,
        observation_ids=observation_ids,
        steps=steps,
    )
