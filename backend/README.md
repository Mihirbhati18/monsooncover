# MonsoonCover backend

FastAPI backend foundation per `MONSOONCOVER_SPEC.md` §22 Phase 2. Read the
spec first — this README explains how to run what's here, not what it means.

## What's implemented (Phase 2 — Backend foundation)

- FastAPI project structure, configuration, database, and Alembic migrations.
- Auth: JWT login, password hashing (bcrypt), role-based access control
  (`lender` / `insurer` / `borrower` / `admin`, matching the frontend).
- Core entities: `User`, `Borrower`, `Loan`.
- Append-only `AuditEvent` log (spec §15.2 field set) and an `IdempotencyRecord`
  service backed by a database unique constraint (spec §13).
- Seed/reset tooling (`scripts/seed_demo.py`) using the canonical demo data
  from spec §9.

**Not yet implemented:** the climate/policy/trigger pipeline and the
insurer/lender sandbox adapters — spec Phases 3 and 4. Borrower/loan
endpoints here are foundation-layer CRUD, not the eligibility, trigger, or
reconciliation engines.

## Running locally

### 1. Database

Spec §11.2 freezes PostgreSQL. Either:

```bash
docker compose up -d postgres          # from the repo root
```

or point `DATABASE_URL` at a PostgreSQL instance you already have running.

### 2. Environment

```bash
cp ../.env.example .env                # edit backend/.env with real local values
```

### 3. Install and migrate

```bash
python -m venv .venv
.venv/Scripts/activate                 # .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
alembic upgrade head
python -m scripts.seed_demo            # add --reset to drop and recreate first
```

### 4. Run

```bash
uvicorn app.main:app --reload
```

## Testing

```bash
pytest
```

**Test database:** by default the suite runs against in-memory SQLite so it
needs no running server. The identical suite also runs against real
PostgreSQL:

```bash
TEST_DATABASE_URL=postgresql+psycopg://monsooncover:monsooncover@localhost:5432/monsooncover_test pytest
```

**Both paths pass (132 tests).** The Postgres path is the one that exercises
native `ENUM` types, `NUMERIC` precision and real constraint behaviour, none
of which SQLite reproduces faithfully — so run it before a rehearsal, per
spec §18 and §22 Phase 6.

Verified on PostgreSQL 17: all five migrations apply cleanly, creating 21
tables and 10 native enum types, and `scripts/run_demo_chain.py` produces
identical results to the SQLite run.
