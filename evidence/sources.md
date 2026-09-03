# MonsoonCover Evidence Sources

This file explains how the initial source set may and may not be used. The machine-readable index is `evidence_registry.csv`.

## Review statuses

- `SOURCE_IDENTIFIED`: an authoritative-looking source has been located but its complete content still requires review.
- `SOURCE_VERIFIED`: the source was opened and the registered claim was checked against it.
- `CONTENT_ARCHIVED`: a permitted local copy and SHA-256 checksum have been recorded.
- `REJECTED`: the source or claim is unsuitable; retain the record and reason rather than silently deleting history.

`SOURCE_VERIFIED` is not legal, actuarial, regulatory, or production approval.

## EVD-POL-001 — Digit parametric policy wording

Official source: <https://www.godigit.com/content/dam/godigit/directportal/en/downloads/others/policy-wordings-digit-parametric-insurance-policy.pdf>

Permitted use: demonstrate that an Indian insurer publishes a parametric policy framework containing defined index, strike, risk-period, data-provider, term-sheet, payout, and related concepts.

Not permitted: claiming a Digit partnership; claiming the policy covers the synthetic borrower; inventing a Digit premium, Surat threshold, payout, quotation, or active certificate.

## EVD-REG-001 — RBI NBFC insurance boundary

Official source: <https://www.rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=10568>

Permitted use: support the MVP requirements for voluntary participation, prominent disclosure, separation from loan availability, direct premium flow to the insurer, and separation of insurance risk from the NBFC.

Limitation: the project must re-check the currently applicable RBI and IRDAI framework with qualified legal/compliance professionals before any real pilot. This registry is not legal advice.

## EVD-CLM-001 — WRI India MSME vulnerability research

Official source: <https://wri-india.org/research/resilience-micro-small-and-medium-enterprises-climate-risks-vulnerability-assessment>

Permitted use: support the existence of heat and flooding exposure and operational/economic resilience concerns among surveyed manufacturing MSMEs in the named clusters.

Not permitted: treating the report as proof that MonsoonCover reduces missed payments or defaults. Exact statistics must not enter the pitch or Risk Engine until the complete report is reviewed and the relevant page/table is registered.

## EVD-LND-001 — UGRO embedded financing

Official source: <https://www.ugrocapital.com/embedded-financing>

Permitted use: explain why a data-led MSME lender with embedded-finance and API-oriented capabilities is a plausible case-study context.

Not permitted: claiming UGRO requested, tested, endorsed, partnered with, or integrated MonsoonCover; claiming private API access; claiming UGRO borrowers specifically demand this product without separate evidence.

## Next evidence work

1. Obtain and review the complete WRI report and register exact page/table references.
2. Register a geography-aligned historical climate dataset with license, units, coverage, raw checksum, and transformation plan.
3. Identify an authoritative climate-data source suitable for the chosen demo geography.
4. Locate any public numerical parametric case used for dry-run inspiration; keep it separate from the synthetic Surat term sheet.
5. Review current IRDAI rules applicable to the proposed distribution/intermediary arrangement.
6. Record every demo loan, premium, trigger, sum insured, payout, and allocation as `SIMULATED` until stronger applicable evidence exists.

