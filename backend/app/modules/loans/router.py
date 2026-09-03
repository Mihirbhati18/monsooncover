from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import Role, User
from app.modules.auth.deps import require_role
from app.modules.borrowers.service import get_borrower
from app.modules.loans import service
from app.schemas.loan import LoanCreate, LoanRead

router = APIRouter(prefix="/loans", tags=["loans"])

READERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)
WRITERS = require_role(Role.LENDER, Role.ADMIN)


@router.get("", response_model=list[LoanRead])
def list_loans(
    borrower_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(READERS),
) -> list:
    return service.list_loans(db, borrower_id=borrower_id)


@router.post("", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
def create_loan(data: LoanCreate, db: Session = Depends(get_db), current_user: User = Depends(WRITERS)):
    if get_borrower(db, data.borrower_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrower not found")

    loan = service.create_loan(db, data, actor_id=current_user.id)
    db.commit()
    db.refresh(loan)
    return loan
