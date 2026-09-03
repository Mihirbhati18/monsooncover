"""Runs the complete MONSOONCOVER_SPEC.md §25 chain against the frozen
dataset and prints the result, including the correlation-linked audit
trail. This is the offline rehearsal harness for the §17 demo flow.

    python -m scripts.run_demo_chain

It executes real project logic — the same trigger engine, adapters and
orchestrator the API uses. Nothing here is a hard-coded screen change.
"""

import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

# Trace text contains section signs; Windows consoles default to cp1252 and
# would render them as mojibake during a live demo.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.adapters.climate.historical_csv import ingest  # noqa: E402
from app.adapters.insurer.sandbox import SandboxInsurerAdapter
from app.adapters.lender.base import LenderLoanRecord
from app.adapters.lender.sandbox import SandboxLenderAdapter
from app.core.database import Base, SessionLocal, engine
from app.models.audit import AuditEvent
from app.models.borrower import Borrower
from app.models.climate import ClimateDataset
from app.models.loan import Loan
from app.models.policy import BorrowerPolicySnapshot, PolicyState, PolicyVersion
from app.models.settlement import InsurerDecisionOutcome
from app.models.trigger import CalculationTrace, TriggerEvaluation
from app.modules.settlement.orchestrator import (
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
    # Cover period is the season; the trigger aggregates only the event
    # window inside it (spec §6.5). Kept identical to scripts/seed_demo.py
    # so the headless run and the UI demo tell the same story.
    "risk_period_start_local": "2026-06-15",
    "risk_period_end_local": "2026-09-30",
    "event_window_start_local": "2026-08-27",
    "event_window_end_local": "2026-08-28",
    "policy_timezone": "Asia/Kolkata",
    "required_provider": "HistoricalCSVProvider",
}


def banner(text: str) -> None:
    print(f"\n{'=' * 72}\n{text}\n{'=' * 72}")


def main(reset: bool) -> None:
    if not reset:
        print(
            "This script builds its own scenario and needs an empty database.\n"
            "It will DROP every table in:\n"
            f"  {engine.url.render_as_string(hide_password=True)}\n\n"
            "Re-run with --reset to confirm:\n"
            "  python -m scripts.run_demo_chain --reset\n\n"
            "Refusing to drop tables without that flag. (An earlier version dropped\n"
            "silently and wiped a seeded demo database mid-session.)"
        )
        raise SystemExit(1)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        borrower = Borrower(name="ABC Textiles", sector="Textile manufacturing", city="Surat", state="Gujarat")
        db.add(borrower)
        db.flush()

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
        db.add_all([loan, dataset, version])
        db.flush()

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
        db.add(snapshot)
        db.flush()

        banner("1. VERIFIED HISTORICAL REPLAY  (spec 6.2, 6.4)")
        observations = ingest(csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id=dataset.id, trigger_rule=RULE)
        for observation in observations:
            db.add(observation)
        db.flush()
        print(f"Dataset DS-MC-RAIN-2026-01 checksum verified; {len(observations)} observations ingested.")
        print("All records reached VERIFIED_REFERENCE_DATA.")

        banner("2. DETERMINISTIC TRIGGER EVALUATION  (spec 7.3)")
        result = evaluate(snapshot_reference=SNAPSHOT_REFERENCE, trigger_rule=RULE, observations=observations)
        for index, step in enumerate(result.steps, start=1):
            print(f"  {index}. [{step['step']}] {step['description']}")
        print(f"\n  OUTCOME: {result.outcome.value}  ({result.observed_value} {result.normalized_unit} vs strike {result.strike_threshold})")

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
        db.add(evaluation)
        db.flush()
        db.add(CalculationTrace(evaluation_id=evaluation.id, steps=result.steps, inputs_digest=result.inputs_digest))
        db.flush()

        insurer = SandboxInsurerAdapter()
        lender = SandboxLenderAdapter()
        lender.register_loan(LenderLoanRecord(external_loan_id=loan.id, outstanding_amount=loan.outstanding_amount, currency="INR"))

        banner("3. INDEPENDENT INSURER SANDBOX DECISION  (spec 3, 12.2)")
        request = submit_candidate_to_insurer(
            db,
            evaluation=evaluation,
            snapshot_reference=SNAPSHOT_REFERENCE,
            trigger_evidence={"observed_value": str(result.observed_value), "digest": result.inputs_digest},
            adapter=insurer,
            actor_id="system",
        )
        print(f"Submitted candidate as {request.external_request_id}. Status now: {insurer.get_decision(request.external_request_id).outcome.value}")
        print("MonsoonCover cannot approve this. Waiting for the insurer sandbox actor...")

        insurer.record_decision(
            external_request_id=request.external_request_id,
            outcome=InsurerDecisionOutcome.APPROVED,
            reason="Evidence packet reviewed; accumulated rainfall satisfied the accepted snapshot rule.",
            decided_by="insurer@demo.monsooncover.local",
            approved_amount=Decimal("40000.00"),
            currency="INR",
        )
        decision = record_insurer_decision(db, request=request, adapter=insurer, actor_id="system")
        print(f"Insurer decision recorded: {decision.outcome.value} for {decision.approved_amount} {decision.currency}")

        banner("4. PAYOUT -> LENDER POSTING -> RECONCILIATION  (spec 10.4, 14)")
        payout = initiate_payout(db, decision=decision, actor_id="system")
        print(f"Payout {payout.payout_reference}: {payout.state.value} {payout.amount} {payout.currency}")

        posting = post_to_lender(db, payout=payout, loan_id=loan.id, adapter=lender, actor_id="system")
        print(f"Lender posting {posting.external_posting_id}: {posting.state.value} {posting.amount} {posting.currency}")

        updated_loan = lender.get_loan(lender_id="sandbox", external_loan_id=loan.id)
        print(f"Demo outstanding balance: {loan.outstanding_amount} -> {updated_loan.outstanding_amount} (illustrative demo treatment)")

        record = reconcile(db, payout=payout, actor_id="system")
        print(f"\n  Insurer: {record.insurer_amount} PAID")
        print(f"  Lender:  {record.lender_amount} POSTED")
        print(f"  Result:  {record.state.value}")

        banner("5. IDEMPOTENCY REPLAY  (spec 13)")
        replay_payout = initiate_payout(db, decision=decision, actor_id="system")
        replay_posting = post_to_lender(db, payout=payout, loan_id=loan.id, adapter=lender, actor_id="system")
        replayed_loan = lender.get_loan(lender_id="sandbox", external_loan_id=loan.id)
        print(f"Re-ran payout and posting with the same keys.")
        print(f"  same payout row:  {replay_payout.id == payout.id}")
        print(f"  same posting row: {replay_posting.id == posting.id}")
        print(f"  balance unchanged at {replayed_loan.outstanding_amount}: {replayed_loan.outstanding_amount == updated_loan.outstanding_amount}")

        db.commit()

        banner(f"6. CORRELATION-LINKED AUDIT TRAIL  ({CORRELATION_ID})")
        events = db.query(AuditEvent).filter(AuditEvent.correlation_id == CORRELATION_ID).all()
        for event in events:
            print(f"  {event.event_type:<30} {str(event.previous_state or '-'):<20} -> {event.new_state}")
        print(f"\n{len(events)} audit events, one correlation ID, append-only.")

    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run the full spec §25 chain headlessly.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Confirm dropping and recreating every table before the run.",
    )
    main(reset=parser.parse_args().reset)
