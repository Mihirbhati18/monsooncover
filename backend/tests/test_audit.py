from app.modules.audit.service import record_audit_event


def test_record_audit_event_persists_all_spec_fields(db_session):
    event = record_audit_event(
        db_session,
        correlation_id="EVENT-MC-2026-00427",
        event_type="TRIGGER_CANDIDATE_DETECTED",
        actor_type="system",
        actor_id="trigger-engine",
        source_system="monsooncover-backend",
        entity_type="TriggerEvaluation",
        entity_id="eval-1",
        classification="DERIVED",
        previous_state="NEAR_TRIGGER",
        new_state="TRIGGER_CANDIDATE",
        reason="Accumulated rainfall met the configured demo threshold.",
        request_or_evidence_reference="DS-MC-RAIN-2026-01",
    )
    db_session.commit()

    assert event.id is not None
    assert event.correlation_id == "EVENT-MC-2026-00427"
    assert event.previous_state == "NEAR_TRIGGER"
    assert event.new_state == "TRIGGER_CANDIDATE"
    assert event.application_version


def test_audit_event_model_exposes_no_update_or_delete_route():
    # This is an architectural assertion, not a runtime one: the audit
    # module intentionally exposes only record_audit_event(). If someone adds
    # an update/delete helper later, this test starts failing and should
    # prompt re-reading MONSOONCOVER_SPEC.md §15.2 first.
    import inspect

    from app.modules.audit import service

    public_names = [name for name in dir(service) if not name.startswith("_")]
    exposed_functions = [name for name in public_names if callable(getattr(service, name)) and inspect.isfunction(getattr(service, name))]

    assert exposed_functions == ["record_audit_event"]
