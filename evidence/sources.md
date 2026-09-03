# Evidence sources

Human-readable companion to `evidence_registry.csv` (MONSOONCOVER_SPEC.md §4.4).
The CSV is the index; this file explains the reasoning behind each entry.

## Honest summary

**Almost everything in this demo is `SIMULATED`, and that is recorded rather
than hidden.** Of the thirteen settlement-critical fields registered for
`MC-DEMO-POL-RAIN-01`:

- **1 is `REAL`** — the IANA timezone identifier `Asia/Kolkata`, which is a
  genuine published standard.
- **2 are `DERIVED`** — the missing-data and duplicate rules, both of which
  are documented implementations of specification requirements rather than
  external facts.
- **10 are `SIMULATED`** — peril, index definition, aggregation window,
  strike, payout formula, sum insured, covered geography, risk period,
  reference data provider, and payout routing.

No insurer term sheet, filed product document, or authorized lender
arrangement was available to this project. Every commercial value is a
project assumption, and §4.1 requires that be stated plainly rather than
guessed and presented as real.

## What would change these classifications

| Field | To make it `REAL` |
|---|---|
| peril, index definition, strike, exit | An insurer-issued or filed product document naming them for this geography |
| sum insured, payout formula | An authorized term sheet |
| covered geography | An insurer-defined coverage polygon rather than a project demo zone |
| reference data provider | A registered public observation dataset (IMD, NASA POWER, ERA5) with recorded provenance, replacing the synthetic fixture |
| payout routing | A documented lender servicing arrangement |

## Climate dataset

`data/historical/raw/surat_rainfall_2026.csv` is **synthetic**, generated
in-repository for the offline demo. Its manifest
(`data/manifests/surat_rainfall_2026.json`) says so explicitly and records
the SHA-256 the ingestion pipeline verifies on every replay.

It is *not* observation data from any meteorological agency. Swapping in a
registered public dataset — and updating the manifest's source fields and
checksum — is the single change that would move `EV-010` from `SIMULATED`
toward `REAL`.

## Reminder on what `REAL` means

§4.2: `REAL` means the referenced fact or observation is real. It does not
mean MonsoonCover has a partnership, or that a public policy is active for
a demo borrower. No entry in this registry should be read as evidence of a
commercial relationship with any named organization.
