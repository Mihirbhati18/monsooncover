"""HTTP surface for the settlement chain.

Role boundaries here mirror MONSOONCOVER_SPEC.md §3: the insurer decides,
the lender posts, MonsoonCover orchestrates. The decision endpoint is
restricted to the insurer role — a lender cannot approve a candidate
through this API, which is the boundary the whole product rests on.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.insurer.sandbox import SandboxInsurerAdapter
from app.adapters.lender.base import LenderLoanRecord
from app.adapters.lender.sandbox import SandboxLenderAdapter
from app.core.database import get_db
from app.models.policy import BorrowerPolicySnapshot
from app.models.settlement import (
    ExceptionCase,
    InsurerDecision,
    InsurerRequest,
    LenderPosting,
    Payout,
    ReconciliationRecord,
)
from app.models.trigger import TriggerEvaluation
from app.models.user import Role, User
from app.modules.auth.deps import require_role
from app.modules.settlement import orchestrator
from app.modules.settlement.deps import get_insurer_adapter, get_lender_adapter
from app.schemas.workflow import (
    ExceptionCaseRead,
    InsurerDecisionCreate,
    InsurerDecisionRead,
    InsurerRequestRead,
    LenderPostingRead,
    PayoutRead,
    ReconciliationRead,
)

router = APIRouter(prefix="/settlement", tags=["settlement"])

OPERATORS = require_role(Role.LENDER, Role.ADMIN)
INSURERS = require_role(Role.INSURER, Role.ADMIN)
VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)


def _invariant_error(error: orchestrator.TransitionInvariantError) -> HTTPException:
    """§10.1 violations are client sequencing errors, not server faults."""
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))


@router.post("/insurer-requests/{evaluation_id}", response_model=InsurerRequestRead, status_code=201)
def submit_to_insurer(
    evaluation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
    adapter: SandboxInsurerAdapter = Depends(get_insurer_adapter),
):
    evaluation = db.get(TriggerEvaluation, evaluation_id)
    if evaluation is None:
        raise HTTPException(status_code=404, detail="Trigger evaluation not found")

    snapshot = db.get(BorrowerPolicySnapshot, evaluation.snapshot_id)

    try:
        request = orchestrator.submit_candidate_to_insurer(
            db,
            evaluation=evaluation,
            snapshot_reference=snapshot.snapshot_reference,
            trigger_evidence={
                "observed_value": str(evaluation.observed_value),
                "strike_threshold": str(evaluation.strike_threshold),
                "unit": evaluation.normalized_unit,
            },
            adapter=adapter,
            actor_id=current_user.id,
        )
    except orchestrator.TransitionInvariantError as error:
        raise _invariant_error(error) from error

    db.commit()
    db.refresh(request)
    return request


@router.get("/insurer-requests", response_model=list[InsurerRequestRead])
def list_insurer_requests(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(InsurerRequest).order_by(InsurerRequest.submitted_at_utc)))


@router.post("/insurer-requests/{request_id}/decision", response_model=InsurerDecisionRead, status_code=201)
def record_decision(
    request_id: str,
    payload: InsurerDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(INSURERS),
    adapter: SandboxInsurerAdapter = Depends(get_insurer_adapter),
):
    """Restricted to the insurer role. §3: the insurer decides, not the
    lender and not MonsoonCover."""

    request = db.get(InsurerRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Insurer request not found")

    adapter.ensure_submission(request.external_request_id, submitted_at_utc=request.submitted_at_utc)

    try:
        adapter.record_decision(
            external_request_id=request.external_request_id,
            outcome=payload.outcome,
            reason=payload.reason,
            decided_by=current_user.email,
            approved_amount=payload.approved_amount,
            currency=payload.currency,
        )
        decision = orchestrator.record_insurer_decision(
            db, request=request, adapter=adapter, actor_id=current_user.id
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except orchestrator.TransitionInvariantError as error:
        raise _invariant_error(error) from error

    db.commit()
    db.refresh(decision)
    return decision


@router.post("/payouts/{decision_id}", response_model=PayoutRead, status_code=201)
def create_payout(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
):
    decision = db.get(InsurerDecision, decision_id)
    if decision is None:
        raise HTTPException(status_code=404, detail="Insurer decision not found")

    try:
        payout = orchestrator.initiate_payout(db, decision=decision, actor_id=current_user.id)
    except orchestrator.TransitionInvariantError as error:
        raise _invariant_error(error) from error

    db.commit()
    db.refresh(payout)
    return payout


@router.get("/decisions", response_model=list[InsurerDecisionRead])
def list_decisions(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(InsurerDecision).order_by(InsurerDecision.decided_at_utc)))


@router.get("/exceptions", response_model=list[ExceptionCaseRead])
def list_exceptions(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    """§10.2: exceptions never disappear silently, so they are readable."""
    return list(db.scalars(select(ExceptionCase).order_by(ExceptionCase.opened_at_utc)))


@router.get("/payouts", response_model=list[PayoutRead])
def list_payouts(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(Payout).order_by(Payout.initiated_at_utc)))


@router.get("/payouts/{payout_id}", response_model=PayoutRead)
def get_payout(payout_id: str, db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    payout = db.get(Payout, payout_id)
    if payout is None:
        raise HTTPException(status_code=404, detail="Payout not found")
    return payout


@router.post("/postings/{payout_id}", response_model=LenderPostingRead, status_code=201)
def create_posting(
    payout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
    adapter: SandboxLenderAdapter = Depends(get_lender_adapter),
):
    payout = db.get(Payout, payout_id)
    if payout is None:
        raise HTTPException(status_code=404, detail="Payout not found")

    request = db.get(InsurerRequest, db.get(InsurerDecision, payout.decision_id).request_id)
    snapshot = db.get(BorrowerPolicySnapshot, request.snapshot_id)

    # The sandbox lender must know the loan before it can post against it.
    try:
        adapter.get_loan(lender_id="sandbox", external_loan_id=snapshot.loan_id)
    except KeyError:
        from app.models.loan import Loan

        loan = db.get(Loan, snapshot.loan_id)
        adapter.register_loan(
            LenderLoanRecord(
                external_loan_id=loan.id, outstanding_amount=loan.outstanding_amount, currency=loan.currency
            )
        )

    try:
        posting = orchestrator.post_to_lender(
            db, payout=payout, loan_id=snapshot.loan_id, adapter=adapter, actor_id=current_user.id
        )
    except orchestrator.TransitionInvariantError as error:
        raise _invariant_error(error) from error

    db.commit()
    db.refresh(posting)
    return posting


@router.post("/reconciliations/{payout_id}", response_model=ReconciliationRead, status_code=201)
def run_reconciliation(
    payout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
):
    payout = db.get(Payout, payout_id)
    if payout is None:
        raise HTTPException(status_code=404, detail="Payout not found")

    record = orchestrator.reconcile(db, payout=payout, actor_id=current_user.id)
    db.commit()
    db.refresh(record)
    return record


@router.get("/reconciliations", response_model=list[ReconciliationRead])
def list_reconciliations(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(ReconciliationRecord).order_by(ReconciliationRecord.reconciled_at_utc)))


@router.get("/postings", response_model=list[LenderPostingRead])
def list_postings(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(LenderPosting).order_by(LenderPosting.posted_at_utc)))
