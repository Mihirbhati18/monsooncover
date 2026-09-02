# Contributing to MonsoonCover

## Before starting

1. Read `MONSOONCOVER_SPEC.md` completely.
2. Confirm that the proposed work belongs to the current development phase.
3. Do not change frozen product, insurance, financial, evidence, or security rules without explicit owner approval.
4. Never commit credentials, real borrower data, personal identifiers, or unapproved copyrighted datasets.

## Branch workflow

Create a branch from the latest `main` using one of these prefixes:

- `feature/` for a new capability;
- `fix/` for a correction;
- `docs/` for documentation;
- `test/` for tests;
- `chore/` for repository maintenance.

Examples:

```text
docs/architecture-diagram
feature/evidence-registry
fix/timezone-boundary
```

Keep each branch focused on one reviewable outcome. Push the branch and open a pull request. Do not combine unrelated changes.

## Pull-request requirements

- Explain what changed and why.
- Link the relevant specification section.
- State the `REAL`, `DERIVED`, and `SIMULATED` impact.
- Include tests or explain why none are applicable.
- Confirm no secrets or real sensitive borrower information were added.
- Resolve review conversations before merging.
- Update documentation and evidence records when behavior or factual claims change.

Only merge after review confirms that the change follows the specification and required checks pass.

