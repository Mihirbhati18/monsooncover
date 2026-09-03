from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.loan import Loan
from app.modules.audit.service import record_audit_event
from app.schemas.loan import LoanCreate


def list_loans(db: Session, *, borrower_id: str | None = None) -> list[Loan]:
    query = select(Loan)
    if borrower_id is not None:
        query = query.where(Loan.borrower_id == borrower_id)
    return list(db.scalars(query))


def create_loan(db: Session, data: LoanCreate, *, actor_id: str) -> Loan:
    loan = Loan(
        borrower_id=data.borrower_id,
        loan_type=data.loan_type,
        principal_amount=data.principal_amount,
        emi_amount=data.emi_amount,
        outstanding_amount=data.outstanding_amount,
        currency=data.currency,
    )
    db.add(loan)
    db.flush()

    record_audit_event(
        db,
        correlation_id=f"LOAN-{loan.id}",
        event_type="LOAN_CREATED",
        actor_type="user",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="Loan",
        entity_id=loan.id,
        classification="SIMULATED",
        new_state="LOAN_CREATED",
    )
    return loan
