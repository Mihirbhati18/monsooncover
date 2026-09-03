# Running the MonsoonCover demo

Two terminals. Everything runs locally with no internet access required.

## Terminal 1 — backend

```bash
cd backend

# First time only
python -m venv .venv
.venv/Scripts/activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt

# Seed and run
python -m scripts.seed_demo --reset
uvicorn app.main:app --port 8000
```

API docs: <http://localhost:8000/docs>

## Terminal 2 — frontend

```bash
cd frontend
npm install                     # first time only
npm run dev
```

Open <http://localhost:5173>.

## Demo accounts

All use password `demo-pass-123`:

| Role | Email |
|---|---|
| Lender operations | `lender@demo.monsooncover.local` |
| Insurer sandbox | `insurer@demo.monsooncover.local` |
| Administration | `admin@demo.monsooncover.local` |
| Borrower | `borrower@demo.monsooncover.local` |

## The demo path

Sign in as the **lender**:

1. **Climate Risk** → *Assess climate risk*. Exposure is computed from the
   registered dataset and shown beside the methodology that produced it. The
   panel headed *Separate engine* shows policy eligibility, which is decided
   without consulting exposure at all.
2. **Events & Triggers** → *Replay historical climate event*. The engine reads
   the checksummed CSV and computes `TRIGGER_CANDIDATE` at 184.0 mm against
   the 160 mm strike. Open the calculation trace — this is the moment that
   proves the event was computed rather than staged.
3. Still as the lender, press *Submit for insurer review*.
4. **Insurer Sandbox** → try to approve it. The server refuses:
   *"Role 'lender' is not permitted to perform this action."*

Sign out, sign in as the **insurer**:

5. **Insurer Sandbox** → review the evidence packet, choose APPROVED, give a
   reason, confirm. The decision is recorded against your identity.

Sign out, sign in as the **lender**:

6. **Reconciliation** → run the three ordered steps. Each is disabled until
   its prerequisite exists, and the server refuses out-of-order calls
   independently. The register ends at `RECONCILED`, 40000.00 on both sides.
7. **Evidence & Audit** → the activation gate result, the evidence registry,
   and the full correlation-linked audit trail for the whole run.

## Running the whole chain headless

```bash
cd backend
python -m scripts.run_demo_chain
```

Prints every step, the calculation trace, an idempotency replay, and the
audit trail. Useful as a backup if the browser misbehaves during judging.

## Tests

```bash
cd backend && pytest          # 131 tests
cd frontend && npm run test   # 60 tests
```

## Honest notes before you present

- **The rainfall dataset is synthetic.** It was generated for this project,
  not sourced from a meteorological agency. `evidence/sources.md` records
  that, and the UI classifies it `SIMULATED`. Please do not describe it as
  real observation data.
- **10 of 13 settlement-critical fields are `SIMULATED`.** No insurer term
  sheet was available. The evidence registry records exactly which fields
  those are and why.
- **PostgreSQL has not been exercised.** The frozen stack is PostgreSQL and
  the app targets it, but every test run so far has used SQLite because no
  Postgres or Docker was available in the development environment. Before
  judging, run `docker compose up -d postgres`, point `DATABASE_URL` at it,
  run `alembic upgrade head`, and walk the demo path once. See
  `backend/README.md`.
- **Sandbox adapters hold state in process.** Restarting the backend clears
  the insurer/lender sandboxes while the database rows persist. Re-seed with
  `--reset` for a clean run rather than restarting mid-demo.
