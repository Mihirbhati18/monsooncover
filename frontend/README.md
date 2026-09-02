# MonsoonCover frontend

Offline-first React and TypeScript demonstration interface for MonsoonCover's lender operations journey.

## Available screens

- Overview command center
- Synthetic MSME portfolio with search and coverage filters
- Borrower facility, coverage snapshot, exposure, and event detail
- Advisory climate-risk concentration
- Versioned policy references and evidence gates
- Event calculation trace and lender-safe insurer review state
- Settlement reconciliation and mismatch handling
- Evidence registry and append-only audit chronology

Every screen keeps the demo disclosure visible and distinguishes `REAL`, `DERIVED`, and `SIMULATED` data. The frontend does not connect to live insurer, lender, climate, or payment systems.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

## Current boundary

This package is a complete frontend demonstration backed by local typed fixtures. Backend adapters, authentication, live datasets, insurer actions, lender posting, and real transactions are intentionally unavailable.
