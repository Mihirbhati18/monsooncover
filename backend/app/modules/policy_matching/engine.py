"""Eligibility and Policy-Matching Engine — MONSOONCOVER_SPEC.md §7.2.

Question: is an approved/reference product applicable to this borrower,
peril, geography and period?

The single most important property of this module is what it does NOT
take as input. §7.2 states plainly: "A risk score alone never creates
eligibility." This function therefore has no parameter for an exposure
band or risk assessment at all — the rule is enforced by the signature,
not by a reviewer remembering it. `test_policy_matching.py` asserts that.

Matching is against explicit policy constraints only, and every constraint
checked is recorded in `reasons` so an ineligible result explains itself.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

MATCHING_VERSION = "policy-matching-v1"


@dataclass(frozen=True)
class EligibilityResult:
    is_eligible: bool
    reasons: list[dict]
    matching_version: str
    evaluated_at_utc: datetime


@dataclass(frozen=True)
class BorrowerFacts:
    """The explicit, checkable facts about a borrower. Deliberately does
    not carry a risk band or exposure score."""

    zone_id: str
    sector: str
    requested_peril: str


def _reason(constraint: str, satisfied: bool, detail: str) -> dict:
    return {"constraint": constraint, "satisfied": satisfied, "detail": detail}


def match(
    *,
    borrower: BorrowerFacts,
    trigger_rule: dict,
    cover_start_local: str,
    cover_end_local: str,
    policy_state: str,
    evaluated_at_utc: datetime | None = None,
) -> EligibilityResult:
    """Checks a borrower against one policy version's explicit constraints."""

    evaluated_at_utc = evaluated_at_utc or datetime.now(timezone.utc)
    reasons: list[dict] = []

    zone_ok = borrower.zone_id == trigger_rule.get("zone_id")
    reasons.append(
        _reason(
            "geography",
            zone_ok,
            f"Borrower zone {borrower.zone_id} "
            + ("matches" if zone_ok else "does not match")
            + f" covered zone {trigger_rule.get('zone_id')}.",
        )
    )

    peril_ok = borrower.requested_peril == trigger_rule.get("peril")
    reasons.append(
        _reason(
            "peril",
            peril_ok,
            f"Requested peril {borrower.requested_peril} "
            + ("matches" if peril_ok else "does not match")
            + f" policy peril {trigger_rule.get('peril')}.",
        )
    )

    period_ok = (
        cover_start_local >= trigger_rule.get("risk_period_start_local", "")
        and cover_end_local <= trigger_rule.get("risk_period_end_local", "")
    )
    reasons.append(
        _reason(
            "risk_period",
            period_ok,
            f"Requested cover {cover_start_local}..{cover_end_local} "
            + ("falls inside" if period_ok else "falls outside")
            + f" the policy risk period {trigger_rule.get('risk_period_start_local')}.."
            + f"{trigger_rule.get('risk_period_end_local')}.",
        )
    )

    state_ok = policy_state == "ACTIVE"
    reasons.append(
        _reason(
            "policy_state",
            state_ok,
            f"Policy version state is {policy_state}; only ACTIVE versions may be offered.",
        )
    )

    provider_ok = bool(trigger_rule.get("required_provider"))
    reasons.append(
        _reason(
            "settlement_source",
            provider_ok,
            (
                f"Policy names {trigger_rule.get('required_provider')} as its settlement source."
                if provider_ok
                else "Policy does not name a settlement data source, so a trigger could not be "
                "evaluated against an authorized provider (§6.1)."
            ),
        )
    )

    reasons.append(
        _reason(
            "risk_score_excluded",
            True,
            "Climate exposure was not consulted. A risk band never creates eligibility (§7.2).",
        )
    )

    return EligibilityResult(
        is_eligible=all(item["satisfied"] for item in reasons),
        reasons=reasons,
        matching_version=MATCHING_VERSION,
        evaluated_at_utc=evaluated_at_utc,
    )
