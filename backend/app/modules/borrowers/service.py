from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.borrower import Borrower
from app.modules.audit.service import record_audit_event
from app.schemas.borrower import BorrowerCreate


def list_borrowers(db: Session) -> list[Borrower]:
    return list(db.scalars(select(Borrower).order_by(Borrower.name)))


def get_borrower(db: Session, borrower_id: str) -> Borrower | None:
    return db.get(Borrower, borrower_id)


def create_borrower(db: Session, data: BorrowerCreate, *, actor_id: str) -> Borrower:
    borrower = Borrower(
        name=data.name,
        sector=data.sector,
        city=data.city,
        state=data.state,
        zone_id=data.zone_id,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(borrower)
    db.flush()

    record_audit_event(
        db,
        correlation_id=f"BORROWER-{borrower.id}",
        event_type="BORROWER_CREATED",
        actor_type="user",
        actor_id=actor_id,
        source_system="monsooncover-backend",
        entity_type="Borrower",
        entity_id=borrower.id,
        classification="SIMULATED",
        new_state="REGISTERED",
    )
    return borrower
