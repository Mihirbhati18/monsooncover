from app.modules.idempotency.service import get_idempotent_response, record_idempotent_response


def test_get_idempotent_response_returns_none_when_absent(db_session):
    assert get_idempotent_response(db_session, scope="lender_posting", idempotency_key="abc") is None


def test_record_idempotent_response_stores_and_returns_it(db_session):
    result = record_idempotent_response(
        db_session,
        scope="lender_posting",
        idempotency_key="posting-001",
        response_payload={"status": "POSTED", "amount": "40000.00"},
    )
    db_session.commit()

    assert result == {"status": "POSTED", "amount": "40000.00"}
    assert get_idempotent_response(db_session, scope="lender_posting", idempotency_key="posting-001") == result


def test_replaying_the_same_key_returns_the_original_response_not_a_new_one(db_session):
    first = record_idempotent_response(
        db_session, scope="lender_posting", idempotency_key="posting-002", response_payload={"amount": "1"}
    )
    db_session.commit()

    replayed = record_idempotent_response(
        db_session, scope="lender_posting", idempotency_key="posting-002", response_payload={"amount": "999"}
    )
    db_session.commit()

    assert replayed == first
    assert replayed["amount"] == "1"


def test_the_same_key_in_a_different_scope_is_independent(db_session):
    record_idempotent_response(
        db_session, scope="lender_posting", idempotency_key="shared-key", response_payload={"scope": "lender"}
    )
    db_session.commit()

    insurer_result = record_idempotent_response(
        db_session, scope="insurer_submission", idempotency_key="shared-key", response_payload={"scope": "insurer"}
    )
    db_session.commit()

    assert insurer_result == {"scope": "insurer"}


def test_database_unique_constraint_backs_the_duplicate_rule(db_session):
    from app.models.idempotency import IdempotencyRecord

    db_session.add(IdempotencyRecord(scope="s", idempotency_key="k", response_payload={"a": 1}))
    db_session.commit()

    db_session.add(IdempotencyRecord(scope="s", idempotency_key="k", response_payload={"a": 2}))
    try:
        db_session.commit()
        raised = False
    except Exception:
        db_session.rollback()
        raised = True

    assert raised, "Expected the database unique constraint to reject a raw duplicate insert"
