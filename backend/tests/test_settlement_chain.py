"""The MONSOONCOVER_SPEC.md §25 chain, end to end.

    verified observations -> deterministic trigger candidate
      -> independent insurer decision -> illustrative payout
      -> idempotent lender posting -> reconciliation -> audit trail

Plus the §10.1 requirement that impossible sequences are *rejected*: a
payout before approval, or a posting before a payout, must raise.
"""

from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import pytest

from app.adapters.climate.historical_csv import ingest
from app.adapters.insurer.sandbox import SandboxInsurerAdapter
from app.adapters.lender.base import LenderLoanRecord
from app.adapters.lender.sandbox import SandboxLenderAdapter
from app.models.audit import AuditEvent
from app.models.borrower import Borrower
from app.models.climate import ClimateDataset
from app.models.loan import Loan
from app.models.policy import BorrowerPolicySnapshot, PolicyState, PolicyVersion
from app.models.settlement import (
    ExceptionCase,
    InsurerDecisionOutcome,
    LenderPostingState,
    PayoutState,
    ReconciliationState,
)
from app.models.trigger import CalculationTrace, TriggerEvaluation, TriggerOutcome
from app.modules.settlement.orchestrator import (
    TransitionInvariantError,
    initiate_payout,
    post_to_lender,
    reconcile,
    record_insurer_decision,
    submit_candidate_to_insurer,
)
from app.modules.trigger_engine.engine import evaluate

REPO_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = REPO_ROOT / "data" / "historical" / "raw" / "surat_rainfall_2026.csv"
MANIFEST_PATH = REPO_ROOT / "data" / "manifests" / "surat_rainfall_2026.json"

CORRELATION_ID = "EVENT-MC-2026-00427"
SNAPSHOT_REFERENCE = "MC-PS-2026-0142-v1"

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
    "payout_amount": "40000.00",
    "currency": "INR",
}


@pytest.fixture()
def chain(db_session):
    """Seeds borrower, loan, policy snapshot, and runs the real trigger
    engine over the real frozen dataset."""

    borrower = Borrower(name="ABC Textiles", sector="Textile manufacturing", city="Surat", state="Gujarat")
    db_session.add(borrower)
    db_session.flush()

    loan = Loan(
        borrower_id=borrower.id,
        loan_type="Working-capital loan",
        principal_amount=Decimal("1000000.00"),
        emi_amount=Decimal("62000.00"),
        outstanding_amount=Decimal("840000.00"),
        currency="INR",
    )
    dataset = ClimateDataset(
        dataset_code="DS-MC-RAIN-2026-01",
        source_organization="MonsoonCover project (synthetic demo fixture)",
        source_uri_or_document="generated-in-repository",
        original_filename="surat_rainfall_2026.csv",
        accessed_at_utc=datetime(2026, 9, 3, tzinfo=timezone.utc),
        geographic_coverage="SURAT-DEMO-Z1",
        temporal_coverage="2026-06-15..2026-09-25",
        parameter_definitions="precipitation mm",
        original_sha256="29d97cfba58731aeb433741680e85b4683ead8205db4044e1cd23c81fc5c0693",
        transformation_version="historical-csv-v1",
        source_classification="SIMULATED",
    )
    version = PolicyVersion(
        product_code="MC-DEMO-POL-RAIN-01",
        version="1.0",
        display_name="Extreme rainfall protection reference",
        trigger_rule=RULE,
        disclosure_version="v1",
        classification="SIMULATED",
    )
    db_session.add_all([loan, dataset, version])
    db_session.flush()

    snapshot = BorrowerPolicySnapshot(
        snapshot_reference=SNAPSHOT_REFERENCE,
        borrower_id=borrower.id,
        loan_id=loan.id,
        policy_version_id=version.id,
        trigger_rule_snapshot=RULE,
        disclosure_version="v1",
        consent_recorded_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
        accepted_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
        snapshot_checksum="snapshot-checksum",
        state=PolicyState.ACTIVE,
    )
    db_session.add(snapshot)
    db_session.flush()

    observations = ingest(
        csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id=dataset.id, trigger_rule=RULE
    )
    for observation in observations:
        db_session.add(observation)
    db_session.flush()

    result = evaluate(
        snapshot_reference=SNAPSHOT_REFERENCE, trigger_rule=RULE, observations=observations
    )

    evaluation = TriggerEvaluation(
        evaluation_key=result.evaluation_key,
        snapshot_id=snapshot.id,
        correlation_id=CORRELATION_ID,
        outcome=result.outcome,
        observed_value=result.observed_value,
        strike_threshold=result.strike_threshold,
        normalized_unit=result.normalized_unit,
        window_start_local=result.window_start_local,
        window_end_local=result.window_end_local,
        evaluated_at_utc=result.evaluated_at_utc,
        evaluation_version=result.evaluation_version,
        observation_ids=result.observation_ids,
    )
    db_session.add(evaluation)
    db_session.flush()
    db_session.add(
        CalculationTrace(evaluation_id=evaluation.id, steps=result.steps, inputs_digest=result.inputs_digest)
    )
    db_session.flush()

    lender = SandboxLenderAdapter()
    lender.register_loan(
        LenderLoanRecord(external_loan_id=loan.id, outstanding_amount=Decimal("840000.00"), currency="INR")
    )

    return {
        "db": db_session,
        "loan": loan,
        "evaluation": evaluation,
        "result": result,
        "insurer": SandboxInsurerAdapter(),
        "lender": lender,
    }


def _approve(chain, amount="40000.00"):
    request = submit_candidate_to_insurer(
        chain["db"],
        evaluation=chain["evaluation"],
        snapshot_reference=SNAPSHOT_REFERENCE,
        trigger_evidence={"observed": str(chain["result"].observed_value)},
        adapter=chain["insurer"],
        actor_id="system",
    )
    chain["insurer"].record_decision(
        external_request_id=request.external_request_id,
        outcome=InsurerDecisionOutcome.APPROVED,
        reason="Evidence reviewed in sandbox; threshold satisfied.",
        decided_by="insurer@demo.monsooncover.local",
        approved_amount=Decimal(amount),
        currency="INR",
    )
    return record_insurer_decision(chain["db"], request=request, adapter=chain["insurer"], actor_id="system")


class TestHappyPathChain:
    def test_the_full_chain_reaches_reconciled(self, chain):
        db = chain["db"]

        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")
        posting = post_to_lender(
            db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system"
        )
        record = reconcile(db, payout=payout, actor_id="system")
        db.commit()

        assert chain["evaluation"].outcome.value == "TRIGGER_CANDIDATE"
        assert chain["evaluation"].observed_value == Decimal("184.0")
        assert decision.outcome is InsurerDecisionOutcome.APPROVED
        assert payout.state is PayoutState.PAID
        assert posting.state is LenderPostingState.POSTED
        assert record.state is ReconciliationState.RECONCILED
        assert record.insurer_amount == record.lender_amount == Decimal("40000.00")

    def test_the_chain_shares_one_correlation_id_across_every_audit_event(self, chain):
        db = chain["db"]
        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")
        post_to_lender(db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system")
        reconcile(db, payout=payout, actor_id="system")
        db.commit()

        events = db.query(AuditEvent).filter(AuditEvent.correlation_id == CORRELATION_ID).all()
        types = [event.event_type for event in events]

        assert types == [
            "INSURER_REQUEST_SUBMITTED",
            "INSURER_DECISION_RECORDED",
            "PAYOUT_INITIATED",
            "LENDER_POSTING_RECORDED",
            "RECONCILIATION_COMPLETED",
        ]

    def test_the_lender_sandbox_reduces_the_demo_outstanding_balance(self, chain):
        db = chain["db"]
        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")
        post_to_lender(db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system")

        updated = chain["lender"].get_loan(lender_id="sandbox", external_loan_id=chain["loan"].id)
        assert updated.outstanding_amount == Decimal("800000.00")


class TestTransitionInvariants:
    """§10.1: impossible sequences must be rejected, not tolerated."""

    def test_payout_before_insurer_approval_is_rejected(self, chain):
        db = chain["db"]
        request = submit_candidate_to_insurer(
            db,
            evaluation=chain["evaluation"],
            snapshot_reference=SNAPSHOT_REFERENCE,
            trigger_evidence={},
            adapter=chain["insurer"],
            actor_id="system",
        )
        chain["insurer"].record_decision(
            external_request_id=request.external_request_id,
            outcome=InsurerDecisionOutcome.REJECTED,
            reason="Evidence insufficient for this sandbox review.",
            decided_by="insurer@demo.monsooncover.local",
        )
        decision = record_insurer_decision(db, request=request, adapter=chain["insurer"], actor_id="system")

        with pytest.raises(TransitionInvariantError, match="requires insurer approval"):
            initiate_payout(db, decision=decision, actor_id="system")

    def test_reading_a_decision_before_the_insurer_makes_one_is_rejected(self, chain):
        db = chain["db"]
        request = submit_candidate_to_insurer(
            db,
            evaluation=chain["evaluation"],
            snapshot_reference=SNAPSHOT_REFERENCE,
            trigger_evidence={},
            adapter=chain["insurer"],
            actor_id="system",
        )

        with pytest.raises(TransitionInvariantError, match="not yet recorded a decision"):
            record_insurer_decision(db, request=request, adapter=chain["insurer"], actor_id="system")

    def test_a_non_candidate_evaluation_cannot_be_submitted(self, chain, db_session):
        chain["evaluation"].outcome = TriggerOutcome.NEAR_TRIGGER

        with pytest.raises(TransitionInvariantError, match="Only a TRIGGER_CANDIDATE"):
            submit_candidate_to_insurer(
                db_session,
                evaluation=chain["evaluation"],
                snapshot_reference=SNAPSHOT_REFERENCE,
                trigger_evidence={},
                adapter=chain["insurer"],
                actor_id="system",
            )

    def test_the_insurer_sandbox_requires_a_decision_reason(self, chain):
        request = submit_candidate_to_insurer(
            chain["db"],
            evaluation=chain["evaluation"],
            snapshot_reference=SNAPSHOT_REFERENCE,
            trigger_evidence={},
            adapter=chain["insurer"],
            actor_id="system",
        )

        with pytest.raises(ValueError, match="reason is mandatory"):
            chain["insurer"].record_decision(
                external_request_id=request.external_request_id,
                outcome=InsurerDecisionOutcome.APPROVED,
                reason="   ",
                decided_by="insurer@demo.monsooncover.local",
                approved_amount=Decimal("40000.00"),
            )


class TestIdempotency:
    """§13: replays return the original and never create a second effect."""

    def test_resubmitting_the_same_candidate_reuses_the_request(self, chain):
        db = chain["db"]
        kwargs = dict(
            evaluation=chain["evaluation"],
            snapshot_reference=SNAPSHOT_REFERENCE,
            trigger_evidence={},
            adapter=chain["insurer"],
            actor_id="system",
        )
        first = submit_candidate_to_insurer(db, **kwargs)
        second = submit_candidate_to_insurer(db, **kwargs)

        assert first.id == second.id
        assert first.external_request_id == second.external_request_id

    def test_replaying_a_payout_does_not_create_a_second_one(self, chain):
        db = chain["db"]
        decision = _approve(chain)

        first = initiate_payout(db, decision=decision, actor_id="system")
        second = initiate_payout(db, decision=decision, actor_id="system")

        assert first.id == second.id

    def test_replaying_a_lender_posting_does_not_double_credit_the_loan(self, chain):
        db = chain["db"]
        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")

        first = post_to_lender(db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system")
        second = post_to_lender(db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system")

        assert first.id == second.id
        updated = chain["lender"].get_loan(lender_id="sandbox", external_loan_id=chain["loan"].id)
        assert updated.outstanding_amount == Decimal("800000.00")


class TestReconciliationMismatch:
    def test_a_missing_lender_posting_produces_a_mismatch_and_an_exception(self, chain):
        db = chain["db"]
        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")

        record = reconcile(db, payout=payout, actor_id="system")
        db.commit()

        assert record.state is ReconciliationState.MISMATCH
        assert record.lender_amount is None
        assert "no matching posting" in record.difference_reason

        case = db.query(ExceptionCase).filter(ExceptionCase.correlation_id == CORRELATION_ID).one()
        assert case.state.value == "OPEN"
        assert case.summary == "Paid record has no lender match"

    def test_a_mismatch_preserves_both_source_amounts(self, chain):
        """§14: never 'fix' a mismatch by overwriting a source record."""
        db = chain["db"]
        decision = _approve(chain)
        payout = initiate_payout(db, decision=decision, actor_id="system")
        posting = post_to_lender(
            db, payout=payout, loan_id=chain["loan"].id, adapter=chain["lender"], actor_id="system"
        )

        # Simulate the lender having recorded a different amount.
        posting.amount = Decimal("25000.00")
        db.flush()

        record = reconcile(db, payout=payout, actor_id="system")
        db.commit()

        assert record.state is ReconciliationState.MISMATCH
        assert record.insurer_amount == Decimal("40000.00")
        assert record.lender_amount == Decimal("25000.00")
        assert "amount insurer=40000.00 lender=25000.00" in record.difference_reason
        assert payout.amount == Decimal("40000.00")
        assert posting.amount == Decimal("25000.00")
