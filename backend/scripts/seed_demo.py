"""Reproducible demo seed/reset tooling (MONSOONCOVER_SPEC.md §17: "A single
seed/reset command must recreate all synthetic records..."). Run with:

    python -m scripts.seed_demo          # seed (safe to re-run; idempotent by email)
    python -m scripts.seed_demo --reset  # drop and recreate all tables, then seed
"""

import argparse
import csv
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.models.climate import ClimateDataset
from app.models.evidence import EvidenceRecord
from app.models.policy import BorrowerPolicySnapshot, PolicyState, PolicyVersion
from app.models.user import Role
from app.modules.auth.service import create_user, get_user_by_email
from app.modules.borrowers.service import create_borrower, list_borrowers
from app.modules.loans.service import create_loan, list_loans
from app.schemas.borrower import BorrowerCreate
from app.schemas.loan import LoanCreate

SNAPSHOT_REFERENCE = "MC-PS-2026-0142-v1"

# The executable rule the Trigger Engine reads from the accepted snapshot.
TRIGGER_RULE = {
    "peril": "EXTREME_RAINFALL",
    "parameter": "precipitation",
    "normalized_unit": "mm",
    "aggregation": "SUM",
    "strike_threshold": "160.0",
    "near_trigger_threshold": "128.0",
    "zone_id": "SURAT-DEMO-Z1",
    # The cover period is the whole monsoon season...
    "risk_period_start_local": "2026-06-15",
    "risk_period_end_local": "2026-09-30",
    # ...while the trigger aggregates only the event window inside it.
    # Spec §6.5 treats "correct risk period" and "aggregation window" as
    # separate checks; conflating them made the borrower ineligible for
    # their own policy.
    "event_window_start_local": "2026-08-27",
    "event_window_end_local": "2026-08-28",
    "policy_timezone": "Asia/Kolkata",
    "required_provider": "HistoricalCSVProvider",
}

DEMO_USERS = [
    {"email": "lender@demo.monsooncover.local", "password": "demo-pass-123", "display_name": "Sandbox Lender", "role": Role.LENDER},
    {"email": "insurer@demo.monsooncover.local", "password": "demo-pass-123", "display_name": "Sandbox Insurer", "role": Role.INSURER},
    {"email": "admin@demo.monsooncover.local", "password": "demo-pass-123", "display_name": "Platform Admin", "role": Role.ADMIN},
    {"email": "borrower@demo.monsooncover.local", "password": "demo-pass-123", "display_name": "ABC Textiles", "role": Role.BORROWER},
]

# Canonical demo data from MONSOONCOVER_SPEC.md §9.
CANONICAL_BORROWER = BorrowerCreate(
    name="ABC Textiles",
    sector="Textile manufacturing",
    city="Surat",
    state="Gujarat",
    zone_id="SURAT-DEMO-Z1",
    latitude=Decimal("21.170200"),
    longitude=Decimal("72.831100"),
)
CANONICAL_LOAN = {
    "loan_type": "Working-capital loan",
    "principal_amount": Decimal("1000000.00"),
    "emi_amount": Decimal("62000.00"),
    "outstanding_amount": Decimal("840000.00"),
    "currency": "INR",
}


EVIDENCE_CSV = Path(__file__).resolve().parents[2] / "evidence" / "evidence_registry.csv"


def _seed_evidence(db) -> int:
    """Loads evidence/evidence_registry.csv (spec §4.4) into the database.

    The CSV is the authored index; this keeps the running system and the
    reviewable file in step rather than maintaining two truths."""

    if not EVIDENCE_CSV.exists():
        print(f"WARNING: {EVIDENCE_CSV} not found; activation gate will block.")
        return 0

    loaded = 0
    with EVIDENCE_CSV.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if db.scalar(select(EvidenceRecord).where(EvidenceRecord.evidence_id == row["evidence_id"])):
                continue
            db.add(
                EvidenceRecord(
                    **{key: (value or None) for key, value in row.items() if key != "review_status"},
                    review_status=row.get("review_status") or "DRAFT",
                    registered_at_utc=datetime.now(timezone.utc),
                )
            )
            loaded += 1
    db.flush()
    return loaded


def seed(reset: bool) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for spec in DEMO_USERS:
            if get_user_by_email(db, spec["email"]) is None:
                create_user(db, email=spec["email"], password=spec["password"], display_name=spec["display_name"], role=spec["role"])

        admin = get_user_by_email(db, "admin@demo.monsooncover.local")

        existing = [b for b in list_borrowers(db) if b.name == CANONICAL_BORROWER.name]
        borrower = existing[0] if existing else create_borrower(db, CANONICAL_BORROWER, actor_id=admin.id)

        loans = list_loans(db, borrower_id=borrower.id)
        loan = loans[0] if loans else create_loan(
            db, LoanCreate(borrower_id=borrower.id, **CANONICAL_LOAN), actor_id=admin.id
        )

        dataset = db.scalar(select(ClimateDataset).where(ClimateDataset.dataset_code == "DS-MC-RAIN-2026-01"))
        if dataset is None:
            dataset = ClimateDataset(
                dataset_code="DS-MC-RAIN-2026-01",
                source_organization="MonsoonCover project (synthetic demo fixture)",
                source_uri_or_document="generated-in-repository",
                original_filename="surat_rainfall_2026.csv",
                accessed_at_utc=datetime(2026, 9, 3, tzinfo=timezone.utc),
                geographic_coverage="Surat demo zone SURAT-DEMO-Z1",
                temporal_coverage="2026-06-15 to 2026-09-25 (Asia/Kolkata)",
                parameter_definitions="precipitation: daily accumulated depth, mm",
                original_sha256="29d97cfba58731aeb433741680e85b4683ead8205db4044e1cd23c81fc5c0693",
                transformation_version="historical-csv-v1",
                known_gaps_or_caveats="Synthetic fixture; see data/manifests/surat_rainfall_2026.json.",
                license_notes="Synthetic project fixture; no third-party licence applies.",
                source_classification="SIMULATED",
            )
            db.add(dataset)

        version = db.scalar(
            select(PolicyVersion).where(PolicyVersion.product_code == "MC-DEMO-POL-RAIN-01")
        )
        if version is None:
            version = PolicyVersion(
                product_code="MC-DEMO-POL-RAIN-01",
                version="1.0",
                display_name="Extreme rainfall protection reference",
                trigger_rule=TRIGGER_RULE,
                disclosure_version="v1",
                classification="SIMULATED",
            )
            db.add(version)
        db.flush()

        snapshot = db.scalar(
            select(BorrowerPolicySnapshot).where(
                BorrowerPolicySnapshot.snapshot_reference == SNAPSHOT_REFERENCE
            )
        )
        if snapshot is None:
            db.add(
                BorrowerPolicySnapshot(
                    snapshot_reference=SNAPSHOT_REFERENCE,
                    borrower_id=borrower.id,
                    loan_id=loan.id,
                    policy_version_id=version.id,
                    trigger_rule_snapshot=TRIGGER_RULE,
                    disclosure_version="v1",
                    consent_recorded_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
                    accepted_at_utc=datetime(2026, 6, 15, tzinfo=timezone.utc),
                    snapshot_checksum="demo-snapshot-checksum",
                    state=PolicyState.ACTIVE,
                )
            )

        evidence_count = _seed_evidence(db)

        db.commit()
        print(f"Seeded {len(DEMO_USERS)} demo users, borrower '{borrower.name}' ({borrower.id}),")
        print(f"dataset DS-MC-RAIN-2026-01 and accepted policy snapshot {SNAPSHOT_REFERENCE}.")
        print(f"Evidence registry: {evidence_count} record(s) loaded from evidence/evidence_registry.csv.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="Drop all tables before seeding.")
    args = parser.parse_args()
    seed(reset=args.reset)
