from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.idempotency import IdempotencyRecord


def get_idempotent_response(db: Session, *, scope: str, idempotency_key: str) -> dict | None:
    record = db.scalar(
        select(IdempotencyRecord).where(
            IdempotencyRecord.scope == scope,
            IdempotencyRecord.idempotency_key == idempotency_key,
        )
    )
    return record.response_payload if record else None


def record_idempotent_response(
    db: Session, *, scope: str, idempotency_key: str, response_payload: dict
) -> dict:
    """Stores a response under (scope, idempotency_key), relying on the
    database unique constraint (MONSOONCOVER_SPEC.md §13) rather than an
    application-level check alone. A replay of the same key returns the
    original stored response instead of repeating the effect."""

    existing = get_idempotent_response(db, scope=scope, idempotency_key=idempotency_key)
    if existing is not None:
        return existing

    record = IdempotencyRecord(scope=scope, idempotency_key=idempotency_key, response_payload=response_payload)
    db.add(record)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        existing = get_idempotent_response(db, scope=scope, idempotency_key=idempotency_key)
        if existing is None:
            raise
        return existing

    return response_payload
