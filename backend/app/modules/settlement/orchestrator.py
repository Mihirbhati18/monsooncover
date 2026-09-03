"""Settlement orchestration: candidate -> insurer -> payout -> posting -> reconciliation.

This module enforces the transition invariants in MONSOONCOVER_SPEC.md
§10.4 in code rather than by convention:

- Payout initiation requires insurer approval.
- Lender posting requires a payout reference and routing instruction.
- Reconciliation requires matching insurer and lender records.

Each of those is a raised error, not a comment, so an impossible sequence
(a payout before approval, a posting before a payout) cannot be produced
by calling these functions in the wrong order.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.insurer.base import InsurerAdapter
from app.adapters.lender.base import LenderAdapter
from app.models.settlement import (
    ExceptionCase,
    ExceptionState,
    InsurerDecision,
    InsurerDecisionOutcome,
    InsurerRequest,
    LenderPosting,
    LenderPostingState,
    Payout,
    PayoutState,
    ReconciliationRecord,
    ReconciliationState,
)
from app.models.trigger import TriggerEvaluation, TriggerOutcome
from app.modules.audit.service import record_audit_event


class TransitionInvariantError(RuntimeError):
    """An attempted state transition the spec forbids (§10.1: impossible
    sequences must be rejected, not tolerated)."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def submit_candidate_to_insurer(
    db: Session,
    *,
    evaluation: TriggerEvaluation,
    snapshot_reference: str,
    trigger_evidence: dict,
    adapter: InsurerAdapter,
    actor_id: str,
) -> InsurerRequest:
    """Only a TRIGGER_CANDIDATE may be submitted for review."""

    if evaluation.outcome is not TriggerOutcome.TRIGGER_CANDIDATE:
        raise TransitionInvariantError(
            f"Only a TRIGGER_CANDIDATE may be submitted to the insurer; this evaluation is {evaluation.outcome.value}."
        )

    # §13: the idempotency key is derived from the evaluation, so resubmitting
    # the same candidate cannot open a second insurer request.
    idempotency_key = f"insurer-submit:{evaluation.evaluation_key}"

    existing = db.scalar(select(InsurerRequest).where(InsurerRequest.idempotency_key == idempotency_key))
    if existing is not None:
        return existing

    result = adapter.submit_trigger_candidate(
        policy_snapshot_reference=snapshot_reference,
        trigger_evidence=trigger_evidence,
        idempotency_key=idempotency_key,
    )

    request = InsurerRequest(
        evaluation_id=evaluation.id,
        snapshot_id=evaluation.snapshot_id,
        correlation_id=evaluation.correlation_id,
        idempotency_key=idempotency_key,
        external_request_id=result.external_request_id,
        submitted_at_utc=result.submitted_at_utc,
        adapter_name=result.adapter_name,
        adapter_version=result.adapter_version,
    )
    db.add(request)
    db.flush()

    record_audit_event(
        db,
        correlation_id=evaluation.correlation_id,
        event_type="INSURER_REQUEST_SUBMITTED",
        actor_type="system",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="InsurerRequest",
        entity_id=request.id,
        classification="SIMULATED",
        previous_state="TRIGGER_CANDIDATE",
        new_state="INSURER_REVIEW",
        reason="Candidate submitted for independent insurer-sandbox review. This is not approval.",
        request_or_evidence_reference=result.external_request_id,
    )
    return request


def record_insurer_decision(
    db: Session, *, request: InsurerRequest, adapter: InsurerAdapter, actor_id: str
) -> InsurerDecision:
    """Reads the decision the insurer sandbox made. MonsoonCover records it;
    it does not make it."""

    result = adapter.get_decision(request.external_request_id)

    if result.outcome is InsurerDecisionOutcome.PENDING:
        raise TransitionInvariantError("The insurer has not yet recorded a decision for this request.")

    decision = InsurerDecision(
        request_id=request.id,
        correlation_id=request.correlation_id,
        outcome=result.outcome,
        reason=result.reason,
        decided_at_utc=result.decided_at_utc,
        decided_by=result.decided_by,
        approved_amount=result.approved_amount,
        currency=result.currency,
    )
    db.add(decision)
    db.flush()

    record_audit_event(
        db,
        correlation_id=request.correlation_id,
        event_type="INSURER_DECISION_RECORDED",
        actor_type="insurer_sandbox",
        actor_id=result.decided_by or actor_id,
        source_system=adapter.name,
        entity_type="InsurerDecision",
        entity_id=decision.id,
        classification="SIMULATED",
        previous_state="INSURER_REVIEW",
        new_state=f"INSURER_{result.outcome.value}",
        reason=result.reason,
        request_or_evidence_reference=request.external_request_id,
    )
    return decision


def initiate_payout(db: Session, *, decision: InsurerDecision, actor_id: str) -> Payout:
    """§10.4: payout initiation requires insurer approval."""

    if decision.outcome is not InsurerDecisionOutcome.APPROVED:
        raise TransitionInvariantError(
            f"Payout initiation requires insurer approval; this decision is {decision.outcome.value}."
        )
    if decision.approved_amount is None or decision.approved_amount <= 0:
        raise TransitionInvariantError("An approved decision must carry a positive approved amount.")

    idempotency_key = f"payout:{decision.id}"
    existing = db.scalar(select(Payout).where(Payout.idempotency_key == idempotency_key))
    if existing is not None:
        return existing

    payout = Payout(
        decision_id=decision.id,
        correlation_id=decision.correlation_id,
        idempotency_key=idempotency_key,
        payout_reference=f"PAY-{decision.correlation_id}",
        amount=decision.approved_amount,
        currency=decision.currency or "INR",
        state=PayoutState.INITIATED,
        initiated_at_utc=_now(),
    )
    db.add(payout)
    db.flush()

    record_audit_event(
        db,
        correlation_id=decision.correlation_id,
        event_type="PAYOUT_INITIATED",
        actor_type="system",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="Payout",
        entity_id=payout.id,
        classification="SIMULATED",
        previous_state="INSURER_APPROVED",
        new_state="PAYOUT_INITIATED",
        reason="Illustrative payout event created after insurer approval. No real funds move.",
        request_or_evidence_reference=payout.payout_reference,
    )
    return payout


def post_to_lender(
    db: Session, *, payout: Payout, loan_id: str, adapter: LenderAdapter, actor_id: str
) -> LenderPosting:
    """§10.4: lender posting requires a payout/transfer reference."""

    if payout.state not in (PayoutState.INITIATED, PayoutState.PAID):
        raise TransitionInvariantError(
            f"Lender posting requires an initiated payout; this payout is {payout.state.value}."
        )
    if not payout.payout_reference:
        raise TransitionInvariantError("Lender posting requires a payout reference.")

    idempotency_key = f"lender-post:{payout.payout_reference}"
    existing = db.scalar(select(LenderPosting).where(LenderPosting.idempotency_key == idempotency_key))
    if existing is not None:
        return existing

    result = adapter.post_insurance_credit(
        loan_id=loan_id,
        amount=payout.amount,
        currency=payout.currency,
        payout_reference=payout.payout_reference,
        idempotency_key=idempotency_key,
    )

    posting = LenderPosting(
        payout_id=payout.id,
        loan_id=loan_id,
        correlation_id=payout.correlation_id,
        idempotency_key=idempotency_key,
        external_posting_id=result.external_posting_id,
        payout_reference=result.payout_reference,
        amount=result.amount,
        currency=result.currency,
        state=LenderPostingState.POSTED,
        posted_at_utc=result.posted_at_utc,
    )
    db.add(posting)
    payout.state = PayoutState.PAID
    db.flush()

    record_audit_event(
        db,
        correlation_id=payout.correlation_id,
        event_type="LENDER_POSTING_RECORDED",
        actor_type="lender_sandbox",
        actor_id=actor_id,
        source_system=adapter.name,
        entity_type="LenderPosting",
        entity_id=posting.id,
        classification="SIMULATED",
        previous_state="PAYOUT_INITIATED",
        new_state="LOAN_POSTED",
        reason="Lender sandbox recorded the illustrative credit against the demo loan.",
        request_or_evidence_reference=result.external_posting_id,
    )
    return posting


def reconcile(db: Session, *, payout: Payout, actor_id: str) -> ReconciliationRecord:
    """§14: compare both sides. On a mismatch, preserve both records and
    open an exception — never overwrite a source record to make it agree."""

    posting = db.scalar(select(LenderPosting).where(LenderPosting.payout_id == payout.id))
    now = _now()

    if posting is None:
        record = ReconciliationRecord(
            correlation_id=payout.correlation_id,
            payout_id=payout.id,
            posting_id=None,
            state=ReconciliationState.MISMATCH,
            insurer_amount=payout.amount,
            lender_amount=None,
            difference_reason="Insurer side reports a payout, but the lender sandbox has no matching posting.",
            reconciled_at_utc=now,
        )
        db.add(record)
        db.flush()
        _open_exception(
            db,
            correlation_id=payout.correlation_id,
            entity_type="ReconciliationRecord",
            entity_id=record.id,
            summary="Paid record has no lender match",
            detail=record.difference_reason,
            actor_id=actor_id,
        )
        _audit_reconciliation(db, record=record, actor_id=actor_id)
        return record

    amounts_match = payout.amount == posting.amount
    currencies_match = payout.currency == posting.currency
    references_match = payout.payout_reference == posting.payout_reference

    if amounts_match and currencies_match and references_match:
        state, reason = ReconciliationState.RECONCILED, None
    else:
        state = ReconciliationState.MISMATCH
        differences = []
        if not amounts_match:
            differences.append(f"amount insurer={payout.amount} lender={posting.amount}")
        if not currencies_match:
            differences.append(f"currency insurer={payout.currency} lender={posting.currency}")
        if not references_match:
            differences.append(
                f"payout reference insurer={payout.payout_reference} lender={posting.payout_reference}"
            )
        reason = "; ".join(differences)

    record = ReconciliationRecord(
        correlation_id=payout.correlation_id,
        payout_id=payout.id,
        posting_id=posting.id,
        state=state,
        insurer_amount=payout.amount,
        lender_amount=posting.amount,
        difference_reason=reason,
        reconciled_at_utc=now,
    )
    db.add(record)
    db.flush()

    if state is ReconciliationState.MISMATCH:
        _open_exception(
            db,
            correlation_id=payout.correlation_id,
            entity_type="ReconciliationRecord",
            entity_id=record.id,
            summary="Insurer and lender records disagree",
            detail=reason or "",
            actor_id=actor_id,
        )

    _audit_reconciliation(db, record=record, actor_id=actor_id)
    return record


def _audit_reconciliation(db: Session, *, record: ReconciliationRecord, actor_id: str) -> None:
    record_audit_event(
        db,
        correlation_id=record.correlation_id,
        event_type="RECONCILIATION_COMPLETED",
        actor_type="system",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="ReconciliationRecord",
        entity_id=record.id,
        classification="DERIVED",
        previous_state="LOAN_POSTED",
        new_state=record.state.value,
        reason=record.difference_reason or "Insurer and lender records match.",
    )


def _open_exception(
    db: Session, *, correlation_id: str, entity_type: str, entity_id: str, summary: str, detail: str, actor_id: str
) -> ExceptionCase:
    case = ExceptionCase(
        correlation_id=correlation_id,
        case_reference=f"MC-EXC-{entity_id[:8]}",
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        detail=detail,
        state=ExceptionState.OPEN,
        opened_at_utc=_now(),
    )
    db.add(case)
    db.flush()

    record_audit_event(
        db,
        correlation_id=correlation_id,
        event_type="EXCEPTION_OPENED",
        actor_type="system",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="ExceptionCase",
        entity_id=case.id,
        classification="DERIVED",
        new_state=ExceptionState.OPEN.value,
        reason=summary,
    )
    return case


def compute_reconciled_outstanding(*, outstanding: Decimal, posted_amount: Decimal) -> Decimal:
    """Illustrative demo treatment of the posted credit against the loan."""
    return outstanding - posted_amount
