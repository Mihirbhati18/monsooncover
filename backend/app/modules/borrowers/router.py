from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import Role, User
from app.modules.auth.deps import require_role
from app.modules.borrowers import service
from app.schemas.borrower import BorrowerCreate, BorrowerRead

router = APIRouter(prefix="/borrowers", tags=["borrowers"])

READERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)
WRITERS = require_role(Role.LENDER, Role.ADMIN)


@router.get("", response_model=list[BorrowerRead])
def list_borrowers(db: Session = Depends(get_db), _current_user: User = Depends(READERS)) -> list:
    return service.list_borrowers(db)


@router.get("/{borrower_id}", response_model=BorrowerRead)
def get_borrower(borrower_id: str, db: Session = Depends(get_db), _current_user: User = Depends(READERS)):
    borrower = service.get_borrower(db, borrower_id)
    if borrower is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrower not found")
    return borrower


@router.post("", response_model=BorrowerRead, status_code=status.HTTP_201_CREATED)
def create_borrower(
    data: BorrowerCreate, db: Session = Depends(get_db), current_user: User = Depends(WRITERS)
):
    borrower = service.create_borrower(db, data, actor_id=current_user.id)
    db.commit()
    db.refresh(borrower)
    return borrower
