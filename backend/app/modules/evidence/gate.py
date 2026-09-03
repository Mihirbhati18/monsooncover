"""Evidence-Gated Configuration — MONSOONCOVER_SPEC.md §4.3.

    "A policy configuration cannot become ACTIVE unless every
     settlement-critical field has [evidence]... Missing evidence must be a
     blocking validation error, not a warning that can be ignored."

This module is the gate that makes "evidence-gated" in the product name
mean something. It returns blocking errors, and the activation endpoint
refuses to proceed on any of them — there is no override flag, because the
specification does not permit one.
"""

from dataclasses import dataclass, field

from app.models.evidence import EvidenceRecord

# §4.3: "Settlement-critical fields include at minimum..." — the list is
# reproduced verbatim. `exit_threshold` is conditional: it is required only
# when the policy actually uses an exit.
SETTLEMENT_CRITICAL_FIELDS = (
    "peril",
    "index_definition",
    "aggregation_window",
    "strike",
    "payout_formula",
    "sum_insured",
    "covered_geography",
    "risk_period",
    "timezone",
    "reference_data_provider",
    "missing_data_rule",
    "duplicate_rule",
    "payout_routing_instruction",
)

CONDITIONAL_FIELDS = {"exit_threshold": "exit_threshold"}

VALID_CLASSIFICATIONS = {"REAL", "DERIVED", "SIMULATED"}


@dataclass(frozen=True)
class GateResult:
    can_activate: bool
    blocking_errors: list[str] = field(default_factory=list)
    satisfied_fields: list[str] = field(default_factory=list)

    @property
    def summary(self) -> str:
        if self.can_activate:
            return f"All {len(self.satisfied_fields)} settlement-critical fields carry evidence."
        return f"{len(self.blocking_errors)} blocking evidence error(s)."


def _required_fields(trigger_rule: dict) -> tuple[str, ...]:
    required = list(SETTLEMENT_CRITICAL_FIELDS)
    for rule_key, field_name in CONDITIONAL_FIELDS.items():
        if trigger_rule.get(rule_key) not in (None, ""):
            required.append(field_name)
    return tuple(required)


def _record_problems(field_name: str, record: EvidenceRecord) -> list[str]:
    """Checks the §4.3 completeness requirements for one record."""

    problems: list[str] = []

    if record.classification not in VALID_CLASSIFICATIONS:
        problems.append(
            f"'{field_name}': classification '{record.classification}' is not REAL, DERIVED or SIMULATED."
        )

    # §4.3: "a source or explicit simulation reason".
    has_source = bool(record.source_url_or_local_path or record.source_title)
    if record.classification == "SIMULATED":
        if not record.simulation_reason:
            problems.append(
                f"'{field_name}': classified SIMULATED without a simulation reason (§4.1)."
            )
    elif not has_source:
        problems.append(f"'{field_name}': classified {record.classification} without a source.")

    # §4.2: a DERIVED item must link to its transformation or formula.
    if record.classification == "DERIVED" and not record.transformation_or_formula:
        problems.append(f"'{field_name}': DERIVED without a documented transformation or formula.")

    # §4.3: "a validation result" and "an approving admin identity".
    if record.review_status != "APPROVED":
        problems.append(
            f"'{field_name}': review status is {record.review_status}, not APPROVED."
        )
    if not record.reviewer:
        problems.append(f"'{field_name}': no approving reviewer recorded.")

    return problems


def evaluate_activation_gate(
    *, trigger_rule: dict, evidence_records: list[EvidenceRecord]
) -> GateResult:
    """Decides whether a policy version may be activated.

    Returns blocking errors, never warnings. A caller that ignores them is
    violating §4.3, so the API surfaces them as a refusal."""

    by_field = {record.subject_field: record for record in evidence_records}
    errors: list[str] = []
    satisfied: list[str] = []

    for field_name in _required_fields(trigger_rule):
        record = by_field.get(field_name)
        if record is None:
            errors.append(f"'{field_name}': no evidence record registered.")
            continue

        problems = _record_problems(field_name, record)
        if problems:
            errors.extend(problems)
        else:
            satisfied.append(field_name)

    return GateResult(can_activate=not errors, blocking_errors=errors, satisfied_fields=satisfied)
