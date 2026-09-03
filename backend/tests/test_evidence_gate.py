"""The evidence gate — MONSOONCOVER_SPEC.md §4.3.

"Missing evidence must be a blocking validation error, not a warning that
can be ignored." These tests exist to keep that true.
"""

from datetime import datetime, timezone

import pytest

from app.models.evidence import EvidenceRecord
from app.modules.evidence.gate import SETTLEMENT_CRITICAL_FIELDS, evaluate_activation_gate

RULE = {"peril": "EXTREME_RAINFALL", "strike_threshold": "160.0"}
RULE_WITH_EXIT = {**RULE, "exit_threshold": "400.0"}


def record(subject_field: str, **overrides) -> EvidenceRecord:
    defaults = dict(
        evidence_id=f"EV-{subject_field}",
        subject_type="policy_version",
        subject_field=subject_field,
        value_or_claim="demo value",
        classification="SIMULATED",
        simulation_reason="No authorized term sheet was available.",
        review_status="APPROVED",
        reviewer="admin@demo.monsooncover.local",
        registered_at_utc=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    return EvidenceRecord(**defaults)


def complete_set(**overrides) -> list[EvidenceRecord]:
    return [record(field, **overrides.get(field, {})) for field in SETTLEMENT_CRITICAL_FIELDS]


class TestGateBlocks:
    def test_an_empty_registry_blocks_activation(self):
        result = evaluate_activation_gate(trigger_rule=RULE, evidence_records=[])

        assert result.can_activate is False
        assert len(result.blocking_errors) == len(SETTLEMENT_CRITICAL_FIELDS)

    def test_one_missing_field_blocks_activation(self):
        records = [r for r in complete_set() if r.subject_field != "strike"]

        result = evaluate_activation_gate(trigger_rule=RULE, evidence_records=records)

        assert result.can_activate is False
        assert any("'strike': no evidence record registered." in e for e in result.blocking_errors)

    def test_simulated_without_a_reason_blocks_activation(self):
        result = evaluate_activation_gate(
            trigger_rule=RULE,
            evidence_records=complete_set(strike={"simulation_reason": None}),
        )

        assert result.can_activate is False
        assert any("without a simulation reason" in e for e in result.blocking_errors)

    def test_real_without_a_source_blocks_activation(self):
        result = evaluate_activation_gate(
            trigger_rule=RULE,
            evidence_records=complete_set(
                timezone={"classification": "REAL", "simulation_reason": None, "source_title": None}
            ),
        )

        assert result.can_activate is False
        assert any("classified REAL without a source" in e for e in result.blocking_errors)

    def test_derived_without_a_formula_blocks_activation(self):
        result = evaluate_activation_gate(
            trigger_rule=RULE,
            evidence_records=complete_set(
                duplicate_rule={
                    "classification": "DERIVED",
                    "simulation_reason": None,
                    "source_title": "spec",
                    "transformation_or_formula": None,
                }
            ),
        )

        assert result.can_activate is False
        assert any("without a documented transformation or formula" in e for e in result.blocking_errors)

    def test_unapproved_evidence_blocks_activation(self):
        result = evaluate_activation_gate(
            trigger_rule=RULE, evidence_records=complete_set(peril={"review_status": "DRAFT"})
        )

        assert result.can_activate is False
        assert any("review status is DRAFT" in e for e in result.blocking_errors)

    def test_evidence_without_a_reviewer_blocks_activation(self):
        result = evaluate_activation_gate(
            trigger_rule=RULE, evidence_records=complete_set(peril={"reviewer": None})
        )

        assert result.can_activate is False
        assert any("no approving reviewer recorded" in e for e in result.blocking_errors)

    def test_an_exit_threshold_in_the_rule_requires_its_own_evidence(self):
        """A conditional settlement-critical field becomes mandatory the
        moment the policy actually uses it."""
        complete = complete_set()

        assert evaluate_activation_gate(trigger_rule=RULE, evidence_records=complete).can_activate is True

        result = evaluate_activation_gate(trigger_rule=RULE_WITH_EXIT, evidence_records=complete)
        assert result.can_activate is False
        assert any("'exit_threshold': no evidence record registered." in e for e in result.blocking_errors)


class TestGatePasses:
    def test_a_complete_registry_permits_activation(self):
        result = evaluate_activation_gate(trigger_rule=RULE, evidence_records=complete_set())

        assert result.can_activate is True
        assert result.blocking_errors == []
        assert set(result.satisfied_fields) == set(SETTLEMENT_CRITICAL_FIELDS)
        assert "13 settlement-critical fields" in result.summary


class TestNoOverride:
    def test_the_gate_offers_no_way_to_skip_the_check(self):
        """§4.3 does not permit an ignorable warning, so there must be no
        force/override parameter to reach for under demo pressure."""
        import inspect

        parameters = set(inspect.signature(evaluate_activation_gate).parameters)
        assert parameters.isdisjoint({"force", "override", "skip", "ignore_errors", "warn_only"})


@pytest.mark.parametrize("field_name", SETTLEMENT_CRITICAL_FIELDS)
def test_every_settlement_critical_field_is_individually_required(field_name):
    records = [r for r in complete_set() if r.subject_field != field_name]

    result = evaluate_activation_gate(trigger_rule=RULE, evidence_records=records)

    assert result.can_activate is False, f"removing {field_name} should block activation"
