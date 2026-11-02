# MonsoonCover

Climate-risk infrastructure for MSME lending. Built for the Innovation Unbound Hackathon.

Small businesses in India often take working-capital loans right before the monsoon, and a bad rainfall season can wipe out their ability to repay. MonsoonCover links a loan to a **parametric climate policy**: if a measured rainfall event crosses a contractual threshold, the platform raises a trigger, sends an evidence packet to the insurer for review, and reconciles the payout against the loan.

The core idea is **evidence-gated**: nothing is auto-paid. Every number shown in the UI traces back to a registered dataset and a calculation trace, and every decision is recorded against the person who made it.

## What it does

- **Climate risk assessment**: computes a borrower's exposure from a registered rainfall dataset and shows the methodology beside the result. Policy eligibility runs in a separate engine that never reads exposure.
- **Trigger detection**: replays a historical rainfall event and checks it against the policy strike (for example 184 mm against a 160 mm strike) with a full calculation trace.
- **Insurer review**: role-based sandbox where only the insurer can approve or reject a trigger. The server refuses the action for any other role.
- **Reconciliation**: three ordered steps that the server enforces even if the UI is bypassed, ending with lender and insurer amounts matched.
- **Audit trail**: every action is linked by a correlation ID, with idempotent replays so a repeated request can't double-post.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Alembic, Pydantic, JWT auth |
| Database | SQLite for local runs, PostgreSQL 17 verified |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet |
| Tests | pytest (130+ backend tests), Vitest + Testing Library (60 frontend tests) |

## Run it locally

Full walkthrough with demo accounts: [`RUN_DEMO.md`](./RUN_DEMO.md).

```bash
# backend
cd backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
python -m scripts.seed_demo --reset
uvicorn app.main:app --port 8000
```

```bash
# frontend
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Honest limits

- The rainfall dataset is **synthetic**, generated for this project, and the UI labels it `SIMULATED`.
- 10 of 13 settlement-critical fields are simulated because no real insurer term sheet was available. [`evidence/sources.md`](./evidence/sources.md) records which ones and why.
- MonsoonCover is a prototype. It is not a lender, insurer or payment service, and no lender or insurer named in the demo is a partner.

## Docs

- [`MONSOONCOVER_SPEC.md`](./MONSOONCOVER_SPEC.md): product scope, roles, evidence rules and architecture
- [`RUN_DEMO.md`](./RUN_DEMO.md): step-by-step demo path
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): branch and PR workflow

## Author

Built by **Mihir Bhati** ([@Mihirbhati18](https://github.com/Mihirbhati18)).
