"""Reproducible demo seed/reset tooling (MONSOONCOVER_SPEC.md §17: "A single
seed/reset command must recreate all synthetic records..."). Run with:

    python -m scripts.seed_demo          # seed (safe to re-run; idempotent by email)
    python -m scripts.seed_demo --reset  # drop and recreate all tables, then seed
"""

import argparse
from decimal import Decimal

from app.core.database import Base, SessionLocal, engine
from app.models.user import Role
from app.modules.auth.service import create_user, get_user_by_email
from app.modules.borrowers.service import create_borrower, list_borrowers
from app.modules.loans.service import create_loan, list_loans
from app.schemas.borrower import BorrowerCreate
from app.schemas.loan import LoanCreate

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
)
CANONICAL_LOAN = {
    "loan_type": "Working-capital loan",
    "principal_amount": Decimal("1000000.00"),
    "emi_amount": Decimal("62000.00"),
    "outstanding_amount": Decimal("840000.00"),
    "currency": "INR",
}


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

        if not list_loans(db, borrower_id=borrower.id):
            create_loan(db, LoanCreate(borrower_id=borrower.id, **CANONICAL_LOAN), actor_id=admin.id)

        db.commit()
        print(f"Seeded {len(DEMO_USERS)} demo users and canonical borrower '{borrower.name}' ({borrower.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="Drop all tables before seeding.")
    args = parser.parse_args()
    seed(reset=args.reset)
