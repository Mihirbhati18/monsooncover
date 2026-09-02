# MonsoonCover — Frozen Single Source-of-Truth Build Specification

**Document status:** FROZEN FOR MVP PLANNING  
**Version:** 1.0  
**Frozen on:** 2026-09-02  
**Project:** Innovation Unbound Hackathon  
**Implementation status:** Specification only; application coding has not started.

## 0. Authority, use, and change control

This file is the authoritative specification for the MonsoonCover hackathon project. Every future architecture document, database model, API, screen, seed record, test, diagram, and presentation must agree with it.

Before doing implementation work, an agent or contributor must read this file completely. If code and this specification conflict, this specification wins until the owner explicitly approves a change.

This document is frozen, not infallible. A change is allowed only when:

1. the reason is documented;
2. the affected evidence and classifications are updated;
3. downstream schema, API, test, demo, and documentation impacts are identified;
4. the project owner explicitly approves it; and
5. the version and change log are updated.

Do not silently reinterpret ambiguous financial, insurance, climate, or regulatory requirements. Research them, or classify the implementation as a transparent simulation.

---

## 1. Product definition

### 1.1 Name and positioning

**Product name:** MonsoonCover  
**Technical positioning:** Climate-risk infrastructure for MSME lending  
**First use case:** Embedded parametric climate protection for MSME working-capital loans

MonsoonCover is a technology, data, and workflow-orchestration platform connecting an MSME borrower, a lender, a licensed insurer, and climate-data providers.

It supports this chain:

> climate-risk assessment → suitable policy reference/matching → voluntary borrower opt-in → policy/loan linkage → climate monitoring → contractual trigger-candidate detection → insurer review → payout-status orchestration → lender posting → reconciliation → borrower and portfolio visibility

It is not merely a weather alert application and it is not merely a page for selling insurance. Its value is the integration of climate evidence with a specific policy, borrower, loan account, insurer workflow, lender-servicing workflow, and auditable financial outcome.

### 1.2 Problem

An otherwise viable MSME may experience a flood, extreme rainfall, heatwave, cyclone, or another covered climate event. Operations and revenue can fall while wages, suppliers, utilities, and loan repayments remain due. This creates a temporary cash-flow and repayment shock and can turn a normally healthy borrower into a stressed borrower.

MonsoonCover does not claim that savings, emergency credit, moratoria, government relief, mutual funds, traditional insurance, or direct purchase of parametric insurance do not exist. The opportunity is to arrange optional protection before a loss and connect it to the lending journey and loan-servicing workflow.

### 1.3 Product promise

The defensible promise is:

> MonsoonCover makes insurer-defined climate protection easier to offer, monitor, and connect to an MSME loan, while giving lenders auditable portfolio-level climate-risk visibility.

It is **repayment-shock protection**, not complete disaster recovery. It does not promise to replace all business losses, save every affected business, eliminate default, or protect a credit score.

### 1.4 Core differentiator

The building blocks already exist: MSME lending, parametric insurance, climate data, and loan servicing. MonsoonCover connects them through:

- policy-to-loan mapping;
- evidence-gated policy configuration;
- climate-data provenance and validation;
- deterministic trigger evaluation;
- replaceable lender and insurer adapters;
- payout and posting reconciliation;
- portfolio risk, exception, and audit views.

### 1.5 Initial case-study framing

UGRO Capital may be used as an example of a technology-oriented MSME lender and as the real-company case study required by the hackathon. It is **not** a partner, customer, sponsor, integration, or endorser of MonsoonCover.

Permitted wording:

> “A proposed use case for an MSME lender such as UGRO Capital.”

Forbidden wording:

> “UGRO uses, supports, partnered with, or integrated MonsoonCover.”

---

## 2. Glossary

| Term | Meaning in this project |
|---|---|
| MSME | A micro, small, or medium enterprise; the borrower and potentially the insured business. |
| Working capital | Money used for ordinary business operations such as inventory, salaries, power, and supplier payments. |
| Lender | A bank, NBFC, or other authorized entity that originates and services the loan. |
| Insurer | A licensed insurance company that designs the insurance product, carries risk, and makes claim/payout decisions. |
| Parametric insurance | Insurance whose payout eligibility is linked to a contractually defined measurable index rather than only to an assessment of the insured’s exact physical loss. |
| Index | The measurable parameter and aggregation used by the policy, such as cumulative rainfall in a defined zone and period. |
| Strike | The contract-defined index value at which payout eligibility begins. |
| Exit | The contract-defined index value at which the full applicable payout may be reached. |
| Risk period | The dates and local timezone during which observations count for the policy. |
| Term Sheet / Policy Schedule | The insurer-controlled document containing the applicable index, geography, dates, strike, exit, payout rule, sum insured, and data source. |
| Reference Data Provider | The provider specified by the insurer/policy whose certified observations may be used for settlement. |
| Trigger candidate | MonsoonCover’s evidence-backed finding that configured conditions appear satisfied; it is not a claim approval. |
| Basis risk | The mismatch between an index outcome and an individual business’s actual loss. |
| Reconciliation | Verifying that insurer payout records, lender receipt/posting records, amounts, references, and status agree. |
| Sandbox | A clearly labelled simulated external partner system that performs no production financial or insurance transaction. |

---

## 3. Real-world roles and hard boundaries

| Party | Real-world responsibility | What the MVP represents |
|---|---|---|
| MSME borrower | Applies for the loan, receives required disclosures, voluntarily accepts or declines cover, and receives status information. | Synthetic borrower and explicit consent/status view. |
| Lender/NBFC | Performs KYC and credit underwriting, approves and services the loan, and decides how an authorized insurance payment is applied under the agreement. | Lender Sandbox plus lender dashboard; no real underwriting or servicing integration. |
| Licensed insurer | Designs and issues the policy, defines contractual parameters and authorized data, carries risk, reviews the event, and approves/rejects/settles the claim. | Insurer Sandbox with explicit human approve/reject/need-more-data controls. |
| Climate-data provider | Supplies observations or index data with defined provenance, units, time, geography, and quality. | Verified local historical data plus optional prototype API. |
| MonsoonCover | Assesses exposure, matches policy availability, stores immutable policy snapshots, ingests data, evaluates deterministic rules, submits trigger evidence, orchestrates statuses, reconciles records, notifies users, and provides audit/portfolio visibility. | These are the components actually built by the project. |

MonsoonCover must never:

- lend or approve a loan;
- perform KYC or credit-bureau decisions in the MVP;
- underwrite insurance or carry insurance risk;
- create or issue a real insurance policy;
- take premium or insurance money into a MonsoonCover wallet;
- approve a claim or final payout;
- let AI decide claim eligibility;
- guarantee payout timing, EMI protection, no default, or credit-score/CIBIL protection;
- imply that a public insurer or lender is a partner;
- treat a demo posting as a real transfer of funds.

In a production arrangement, premium and payout routing must follow the insurer, lender, intermediary, and applicable legal/regulatory agreement. The software records and orchestrates the agreed flow; it does not invent that flow.

---

## 4. Truth, proof, and evidence rules

### 4.1 Governing rule

Anything presented as a real banking, insurance, climate, company, or regulatory fact must have traceable evidence. Anything unavailable in reality must be simulated transparently, never guessed and presented as real.

Before implementing a material rule, ask:

> “What proves this is how the real system works?”

- If proof exists, register it and implement within its scope.
- If proof might exist, research it before implementation.
- If proof is unavailable or private, use a sandbox/design hypothesis and label it `SIMULATED`.

### 4.2 Mandatory classifications

Every critical fact, configuration value, dataset, derived field, dashboard metric, and demo claim must be classified.

#### `REAL`

Directly supported by a primary or authoritative source, such as:

- official insurer policy wording or filed product document;
- insurer-issued policy schedule/term sheet supplied through an authorized arrangement;
- RBI, IRDAI, government, regulator, or lender official publication;
- official/public climate dataset with recorded provenance;
- a partner API response in a future authorized production integration.

`REAL` means the referenced fact or observation is real. It does not mean that MonsoonCover has a partnership or that a public policy is active for a demo borrower.

#### `DERIVED`

Calculated or transformed from one or more `REAL` sources using a documented, reproducible method. Examples include:

- hourly rainfall aggregated into a daily or risk-period total;
- a climate-exposure score calculated from documented data;
- a demo rule adapted from a published case, with every modification recorded;
- portfolio totals calculated from underlying records.

A `DERIVED` item must link to all inputs, transformation code/version or written formula, units, assumptions, and validation result.

#### `SIMULATED`

Synthetic or illustrative information used because production access or commercial terms are unavailable. Examples include:

- borrower identity and contact details;
- demo loan and EMI;
- insurer/lender API replies;
- demo premium, sum insured, payout, and servicing allocation unless supported by a specific authorized term sheet;
- a fabricated policy ID or payment reference;
- replay clock and notification delivery.

Every `SIMULATED` value shown to a user must be visibly marked as demo/illustrative. It must never be mixed into a `REAL` claim without disclosure.

### 4.3 Evidence-Gated Configuration

A policy configuration cannot become `ACTIVE` unless every settlement-critical field has:

- an evidence/classification record;
- a source or explicit simulation reason;
- a policy/version identifier;
- units, geography, local timezone, effective dates, and risk period where applicable;
- a documented payout formula and rounding rule;
- a named reference-data-provider configuration;
- a validation result; and
- an approving admin identity and timestamp.

Missing evidence must be a blocking validation error, not a warning that can be ignored.

Settlement-critical fields include at minimum: peril, index definition, aggregation window, strike, exit if used, payout curve/formula, sum insured, covered geography, risk period, timezone, reference data provider, missing-data rule, duplicate rule, and payout-routing instruction.

### 4.4 Evidence registry

Maintain `evidence/evidence_registry.csv` as the index and `evidence/sources.md` as human-readable notes. Store source documents or permitted snapshots in `data/policy_reference/` or an appropriate evidence subfolder.

Required registry fields:

```text
evidence_id
subject_type
subject_field
value_or_claim
classification                 # REAL | DERIVED | SIMULATED
source_title
source_organization
source_type
source_url_or_local_path
publication_or_effective_date
accessed_or_verified_at
geographic_scope
applicability_scope
units
transformation_or_formula
simulation_reason
checksum_sha256
used_by
review_status
reviewer
notes
```

### 4.5 Provenance display

The admin/evidence view must let a reviewer trace a policy field or critical metric to its evidence. Public/demo screens may use a concise badge and disclosure, but the underlying API and database must preserve full provenance.

### 4.6 No unsafe policy extraction

The MVP may offer manual import/reference of a policy or term sheet, but it must not automatically extract a PDF and activate executable financial rules. Any future OCR/LLM extraction is draft assistance only and requires field-by-field human verification before activation.

---

## 5. Policy-reference strategy

### 5.1 Reference framework

The project may preload the publicly available **Digit Parametric Insurance Policy**, UIN **IRDAN158RP0020V01202324**, as a `REAL` reference for general parametric-policy concepts such as index, strike, exit, risk period, geographic area, sum insured, reference data provider, term sheet, payout structure, group-policy concepts, and bank/financial-institution clauses.

This is a policy-structure reference only. It does not establish:

- a Digit partnership;
- a live policy for the demo borrower;
- a quotation, premium, sum insured, or payout amount;
- a Surat-specific trigger;
- permission to use Digit branding as if integrated.

The actual source file and authoritative URL must be added to the evidence registry before its contents are represented as `REAL` in the application.

### 5.2 Numerical examples

Published cases may be used to understand realistic structures, including examples previously researched for rainfall/temperature loan protection and Chennai business interruption. A numerical rule may be classified `DERIVED` only when the source, geography, peril, measurement window, transformation, and changes are documented.

Do not transplant a threshold from one geography or insured use case into another and imply it is real. If the demo uses “ABC Textiles, Surat” with a threshold not supported by a Surat-specific authorized term sheet, the threshold is `SIMULATED` even if it resembles another public example.

### 5.3 Product ownership

The insurer owns product design and final term-sheet values. The lender and authorized insurance distribution arrangement offer the product. MonsoonCover stores an executable representation of insurer-approved terms and monitors them.

Use labels such as:

- **Policy Library**
- **Reference Policy**
- **Import Partner Policy / Term Sheet**
- **Demo Term Sheet**

Do not label the feature **Create Insurance Policy**.

### 5.4 Voluntary participation

Cover must be optional. The borrower receives disclosures and chooses `ACCEPT` or `DECLINE`. The MVP must store consent timestamp, policy version/snapshot, language, disclosure version, and actor/channel. Declining cover must not block the synthetic loan flow.

### 5.5 Immutable policy snapshot

Policies and configurations are append-only/versioned. When a borrower accepts an offer, create an immutable borrower-specific snapshot of exactly what was shown and accepted. Never re-evaluate an old borrower using the “current” mutable product configuration.

The snapshot includes all trigger fields, payout rules, evidence references, disclosures, consent record, dates, timezone, geography, and routing instructions.

---

## 6. Climate-data strategy

### 6.1 Separate purposes

The system must distinguish:

1. **Risk/monitoring data** — may support exposure scoring, dashboards, alerts, dry runs, and cross-checking.
2. **Settlement-reference data** — only the source specified by the policy/insurer may support a trigger candidate intended for insurer processing.

Open-Meteo may be used for free prototype and historical exploration, but it is not a production settlement source unless an insurer-approved policy explicitly says so.

### 6.2 Processing stages

Climate records progress through immutable stages:

```text
RAW → NORMALIZED → VALIDATED → VERIFIED_REFERENCE_DATA
```

- `RAW`: byte-for-byte/source-faithful ingestion metadata is preserved.
- `NORMALIZED`: units, timestamps, and geographic identifiers are standardized.
- `VALIDATED`: completeness, range, schema, duplicate, and time/zone checks pass.
- `VERIFIED_REFERENCE_DATA`: the observation also matches the provider and use authorized by the policy configuration.

Only `VERIFIED_REFERENCE_DATA` can support a settlement-oriented trigger candidate.

### 6.3 Observation fields

Each observation must retain at least:

```text
observation_id
provider
provider_record_id
source_classification
source_uri_or_file
ingested_at_utc
observed_at_utc
source_timezone
policy_local_date
latitude
longitude
zone_id
parameter
raw_value
raw_unit
normalized_value
normalized_unit
quality_status
processing_version
checksum_or_source_hash
```

### 6.4 Dataset integrity

Every frozen historical dataset must record:

- source organization and URL/document;
- download/access date;
- original filename;
- geographic and temporal coverage;
- parameter definitions and units;
- original-file SHA-256 checksum;
- transformations and transformation version;
- transformed-file checksum;
- known gaps or caveats;
- license/usage notes where relevant.

The principal demo must use a locally stored, verified, checksummed dataset so it remains reproducible without internet access.

### 6.5 Validation rules

Before an observation affects a policy evaluation, verify:

- expected source/provider;
- correct parameter and units;
- covered location/zone;
- correct risk period in the policy’s local timezone;
- expected observation frequency and aggregation window;
- missing or late data;
- duplicate provider record or duplicate content;
- plausible range and quality flag;
- processing/version compatibility.

Missing, conflicting, or invalid data must create an exception/manual-review item. The system must not silently substitute another provider for settlement.

### 6.6 Geography and time

Store backend timestamps in UTC and store each policy’s IANA timezone separately. Risk-period boundaries are evaluated in the policy’s local timezone.

Coverage must be explicit using coordinates and a versioned GeoJSON zone/polygon or radius. A city name alone is insufficient for executable policy evaluation. PostgreSQL is the MVP database; PostGIS may be added later if spatial querying requires it.

### 6.7 Historical replay and dry run

Historical replay processes frozen observations chronologically through the same normalization, validation, and trigger code used by ordinary monitoring. It must not bypass the engine or directly set a trigger state.

Dry Run evaluates a proposed, inactive configuration against historical data and reports how often it would have reached near-trigger, strike, exit, and payout bands. Dry Run never creates claims, payouts, lender postings, or borrower notifications. Its purpose is configuration validation and basis-risk explanation, not actuarial certification.

---

## 7. Three separate engines

These concepts must remain separate in data models, services, APIs, tests, and UI language.

### 7.1 Risk Engine

Question: **How exposed or vulnerable is this MSME/location/portfolio?**

Inputs may include location, sector, and historical climate data. MVP output can be interpretable rules/statistics such as flood exposure `HIGH`, heat exposure `MEDIUM`, with evidence and methodology.

It must not approve/deny a loan, set an insurance price, or decide a claim. AI/ML is optional Phase 2 and may be used only when a defensible dataset and evaluation exist.

### 7.2 Eligibility and Policy-Matching Engine

Question: **Is an approved/reference product applicable to this borrower, peril, geography, and period?**

It matches explicit policy constraints. A risk score alone never creates eligibility.

### 7.3 Trigger Engine

Question: **Did verified reference data satisfy the exact rule in the accepted policy snapshot?**

This is deterministic, explainable, versioned code. Its output is `NO_TRIGGER`, `NEAR_TRIGGER`, or `TRIGGER_CANDIDATE`, plus a calculation trace. It never outputs `CLAIM_APPROVED`.

---

## 8. MVP scope: real, built, derived, and simulated

### 8.1 Real/reference inputs where evidence is registered

- official public policy wording and terminology;
- official/public company and regulatory facts;
- public historical climate observations;
- documented policy/example structures;
- open-source framework capabilities.

### 8.2 Components actually implemented by MonsoonCover

- user authentication and roles;
- synthetic MSME/loan registry and CSV/manual import;
- climate Risk Engine;
- Policy Library and immutable accepted snapshots;
- Evidence Registry and activation gate;
- borrower offer, disclosures, and consent;
- climate-data adapters, normalization, validation, and storage;
- historical replay and dry run;
- deterministic Trigger Engine and calculation trace;
- Insurer Sandbox and adapter;
- payout-status orchestrator;
- Lender Sandbox and adapter;
- reconciliation and exception queue;
- audit log and correlation tracing;
- lender portfolio and borrower detail views;
- in-app notifications;
- reproducible demo seeding.

### 8.3 Simulated external systems and data

- borrower identity, contact, KYC, and loan book;
- lender underwriting and servicing API;
- insurer submission, decision, settlement, and payout API;
- premium collection and policy issuance;
- actual movement of money;
- demo policy IDs, payment references, and unavailable commercial values;
- email/SMS/WhatsApp delivery unless actually integrated and labelled.

### 8.4 Explicitly out of scope for the hackathon MVP

- real KYC, PAN, Aadhaar, GST, bank-statement, or CIBIL integrations;
- real lending, insurance sales, underwriting, policy issuance, or payments;
- live insurer or lender production APIs;
- regulatory approval or legal certification;
- actuarial pricing/capital modelling;
- a nationwide or multi-peril production rollout;
- a full insurer, regulator, or borrower mobile application;
- LLM-based claim or policy decisions;
- guaranteed real-time climate settlement;
- production-grade disaster recovery, high availability, or scale.

---

## 9. Canonical demo data and disclosure

The default seed scenario may use:

```text
Borrower: ABC Textiles
Sector: Textile manufacturing
Location: Surat (exact demo GeoJSON zone required)
Loan type: Working-capital loan
Loan amount: ₹10,00,000
EMI: ₹62,000
Outstanding amount: ₹8,40,000
Illustrative insurer-approved payout: ₹40,000
```

All values above are `SIMULATED` unless individually replaced by registered evidence. The climate dataset can be `REAL`; any transformation is `DERIVED`. The trigger configuration is `SIMULATED` unless a geography- and use-case-applicable source supports it.

The UI must show a persistent banner in Demo Mode:

> **DEMO ENVIRONMENT — synthetic borrower/loan and sandbox partner systems; no real insurance or financial transactions.**

The seed must never use real PAN, Aadhaar, bank statements, credit reports, personal phone numbers, or other sensitive identity data.

---

## 10. Lifecycle and state machines

### 10.1 Why states are strict

Statuses are controlled transitions, not editable labels. Impossible sequences—such as a payout before insurer approval or lender posting before payout initiation—must be rejected.

### 10.2 Main demonstration lifecycle

```text
LOAN_CREATED
  → CLIMATE_ASSESSED
  → COVER_OFFERED
      → BORROWER_DECLINED                         [terminal for this offer]
      → BORROWER_ACCEPTED
          → POLICY_PENDING_ISSUANCE
          → POLICY_ACTIVE
          → CLIMATE_MONITORING
          → TRIGGER_CANDIDATE
          → INSURER_REVIEW
              → INSURER_REJECTED                 [review outcome]
              → INSURER_NEEDS_MORE_DATA → INSURER_REVIEW
              → INSURER_APPROVED
                  → PAYOUT_INITIATED
                  → LENDER_RECEIVED
                  → LOAN_POSTED
                  → RECONCILED                   [successful terminal state]
```

From any integration/validation stage, a recoverable failure may create `EXCEPTION_OPEN → MANUAL_REVIEW`. Resolution returns to a specifically recorded allowed state or ends as `CANCELLED`. It must never skip the underlying domain transition.

### 10.3 Recommended separate aggregate states

The implementation should not store the entire process as one mutable status. Use separate state fields/events for:

- **Offer:** `OFFERED | ACCEPTED | DECLINED | EXPIRED`
- **Policy:** `PENDING_ISSUANCE | ACTIVE | SUSPENDED | EXPIRED | CANCELLED`
- **Trigger:** `NO_TRIGGER | NEAR_TRIGGER | CANDIDATE | SUBMITTED | CLOSED`
- **Insurer decision:** `PENDING | NEEDS_MORE_DATA | APPROVED | REJECTED`
- **Payout:** `NOT_APPLICABLE | APPROVED | INITIATED | PAID | FAILED`
- **Lender posting:** `NOT_REQUESTED | PENDING | RECEIVED | POSTED | FAILED`
- **Reconciliation:** `NOT_READY | PENDING | RECONCILED | MISMATCH`
- **Exception:** `OPEN | IN_REVIEW | RESOLVED | CANCELLED`

The event log provides the combined timeline shown to users.

### 10.4 Transition invariants

- An offer requires an eligible policy version and disclosure version.
- Acceptance requires explicit consent; no default/forced opt-in.
- Policy activation requires evidence-gated validation and an immutable snapshot.
- Monitoring requires an active policy and current risk period.
- A trigger candidate requires verified reference data and a reproducible calculation trace.
- Insurer approval requires an insurer-adapter response or explicit sandbox user action.
- Payout initiation requires insurer approval.
- Lender posting requires a payout/transfer reference and routing instruction.
- Reconciliation requires matching insurer and lender records.
- Rejected, expired, cancelled, or already-triggered states cannot silently re-enter processing.
- Every manual override requires actor, reason, timestamp, before/after states, and audit event.

---

## 11. Architecture and free/open stack

### 11.1 Architecture style

Use a **modular monolith with replaceable adapters**. One FastAPI backend contains well-separated domain modules. Do not begin with microservices.

Reasons:

- fastest credible path for a small hackathon team;
- one deployment and transaction boundary;
- simpler debugging and offline demo;
- fewer network and operational failures;
- module boundaries still permit later service extraction.

### 11.2 Technology choices

| Layer | Frozen choice | Purpose and rationale |
|---|---|---|
| Frontend | React + TypeScript + Vite | Dashboard/forms/replay UI; fast development and typed contracts without unnecessary SSR/SEO complexity. |
| Styling | Tailwind CSS plus small reusable components | Rapid polished UI with a controlled project design system. |
| Charts | Recharts | Native React-friendly rainfall, trigger-progress, and portfolio charts. |
| Maps | Leaflet + OpenStreetMap | Free map visualization without requiring Google Maps billing. |
| Backend | Python + FastAPI | Strong validation/API documentation and natural fit for climate/statistical processing. |
| Validation | Pydantic | Typed validation for financial, policy, climate, and adapter payloads. |
| Database | PostgreSQL | Relational integrity and transactions for borrower-loan-policy-payout relationships; future PostGIS option. |
| ORM | SQLAlchemy 2.x | Mature data access with explicit transactions and models. |
| Migrations | Alembic | Versioned, repeatable schema evolution. |
| Scheduling | APScheduler | Sufficient for hackathon polling/replay without Redis/Celery operations. |
| Auth | First-party FastAPI auth, JWT access tokens, strong password hashing | No paid identity dependency; adequate for demo roles when implemented carefully. |
| Backend tests | pytest | Unit, integration, state-machine, and adapter contract tests. |
| Frontend tests | Vitest + React Testing Library | Component and workflow tests. |
| Version control | Git + GitHub | Collaboration, review, and submission. |
| Reproducibility | Docker Compose optional; direct local startup fallback mandatory | Consistent team environment while preserving a competition-laptop fallback. |
| Deployment | Optional free-tier frontend/backend/database only | A public link is secondary; the principal demo is local/offline-first. |

All essential development paths must be possible with free/open-source tools. Do not add a paid API or subscription as a core dependency.

### 11.3 Backend modules

```text
auth
borrowers
loans
climate_risk
policy_library
evidence
consent
policy_registry
climate_data
historical_replay
trigger_engine
insurer_integration
payout_orchestration
lender_integration
reconciliation
notifications
exceptions
audit
```

### 11.4 Frontend surfaces

Build only the surfaces needed for the story:

1. **Lender Dashboard** — portfolio KPIs, risk/coverage table, map, active events, exceptions.
2. **Borrower Offer/Status View** — disclosure, accept/decline, policy and payout timeline.
3. **Insurer Sandbox Panel** — review evidence and choose approve/reject/need more data.
4. **Admin/Evidence View** — policy versions, evidence, activation validation, datasets, exceptions, audit.

Do not build large separate regulator, insurer, lender, and consumer applications.

### 11.5 Data model expectations

At minimum, plan relational entities for:

```text
User, Role
Borrower, BusinessLocation, CoverageZone
Lender, Loan, RepaymentSchedule
PolicyProduct, PolicyVersion, PolicyTerm, PolicyEvidenceLink
PolicyOffer, ConsentRecord, BorrowerPolicySnapshot
ClimateDataset, ClimateObservation, DataTransformation
RiskAssessment, PolicyEligibility
TriggerEvaluation, TriggerEvent, CalculationTrace
InsurerRequest, InsurerDecision, Payout
LenderPosting, ReconciliationRecord
Notification
ExceptionCase
AuditEvent
IdempotencyRecord
```

Money uses PostgreSQL `NUMERIC` and Python `Decimal`, never binary floating point. Store currency explicitly. Define rounding modes at the policy/formula level.

---

## 12. Adapter pattern and external boundaries

Core domain logic must depend on interfaces, never directly on sandbox implementations or vendor-specific payloads.

### 12.1 Lender adapter

Minimum contract:

```text
get_loan(lender_id, external_loan_id)
post_insurance_credit(loan_id, amount, currency, payout_reference, idempotency_key)
get_posting_status(external_posting_id)
```

Implement `SandboxLenderAdapter` first. A future real adapter must pass the same contract tests and map vendor responses into canonical domain types.

### 12.2 Insurer adapter

Minimum contract:

```text
submit_trigger_candidate(policy_id, trigger_evidence, idempotency_key)
get_decision(external_request_id)
get_payout_status(external_payout_id)
```

Implement `SandboxInsurerAdapter` first. It must support `APPROVED`, `REJECTED`, and `NEEDS_MORE_DATA`. Approval remains a sandbox action, not a trigger-engine side effect.

### 12.3 Climate-data provider

Minimum contract:

```text
fetch_observations(source_config, geography, start, end)
normalize(raw_observation)
validate(normalized_observation, policy_snapshot)
```

Initial providers:

- `HistoricalCSVProvider` for the principal reproducible demo;
- `OpenMeteoProvider` for prototype/monitoring use;
- future `InsurerReferenceProvider` or `IMDProvider` when authorized and technically available.

### 12.4 Notification adapter

The MVP requires in-app notifications. Email/SMS/WhatsApp are optional adapters and must not block the workflow.

### 12.5 Canonical payload rules

Adapters translate external schemas at the boundary. Domain services receive canonical typed models only. Preserve raw request/response metadata safely for audit, redact secrets, and record adapter name/version.

---

## 13. Idempotency, duplicates, retries, and concurrency

Financial and trigger operations must be safe to repeat.

- Every ingest record uses provider identity plus provider record ID/content hash to reject duplicates.
- Every trigger evaluation has a deterministic key based on policy snapshot, zone, risk/phase period, peril/index, and evaluation version.
- Only one active trigger event may exist for the same policy/covered phase unless the policy explicitly permits repeated events.
- Every insurer submission, callback, payout event, and lender posting requires an idempotency key.
- Replayed callbacks return the original result and never create a second claim, payout, or posting.
- Database uniqueness constraints enforce the main duplicate rules; application checks alone are insufficient.
- State transitions use transactions and optimistic locking/version fields where concurrent updates are possible.
- Retries use bounded exponential backoff for transient failures and preserve the same idempotency key.
- Permanent validation errors and exhausted retries create an exception; they do not silently disappear.
- A historical replay uses a run ID and isolated/resettable demo state so rerunning the demonstration is predictable.

---

## 14. Reconciliation rules

Reconciliation compares:

- policy and borrower/loan identity;
- insurer request, decision, and payout references;
- approved, paid, received, and posted amounts/currency;
- lender posting reference and timestamp;
- expected routing/allocation instruction;
- correlation ID and idempotency keys.

Example:

```text
Insurer: ₹40,000 PAID
Lender:  ₹40,000 POSTED
Result:  RECONCILED
```

If insurer says paid but the lender has no matching receipt/posting, or amount/currency/reference differs, set `MISMATCH`, preserve both records, and create an exception. Never “fix” mismatches by overwriting source records.

Reconciliation must be retryable and idempotent. A resolved mismatch records the resolution method, actor, reason, and linked audit events.

---

## 15. Security, privacy, and audit

### 15.1 MVP security baseline

- authentication for non-public screens;
- role-based access for lender, insurer-sandbox, admin, and borrower/demo views;
- strong password hashing, never plaintext passwords;
- short-lived access tokens and secure token handling;
- server-side authorization on every protected operation;
- strict Pydantic/input validation and allowlisted file types/sizes;
- secrets in environment variables and `.env.example` containing names only;
- no credentials, tokens, or sensitive raw payloads in logs;
- safe database queries through the ORM/parameters;
- dependency locking and basic vulnerability review;
- CORS restricted to intended origins;
- synthetic data only for borrower/loan/KYC information.

### 15.2 Audit events

Every material operation creates an append-only audit event with:

```text
audit_event_id
correlation_id
event_type
actor_type
actor_id
occurred_at_utc
source_system
entity_type
entity_id
previous_state
new_state
reason
request_or_evidence_reference
classification
application_version
```

The shared correlation ID follows one business event through weather ingestion, trigger evaluation, insurer request/decision, payout, lender posting, notification, and reconciliation—for example `EVENT-MC-2026-00427`.

Audit records must not be silently edited or deleted through ordinary UI/API operations. Corrections are additional events.

### 15.3 Manual overrides

Every override requires a permitted role, mandatory reason, actor, timestamp, before/after values, correlation ID, and audit entry. Overrides cannot create otherwise impossible transitions; a corrective workflow must be explicit.

---

## 16. User experience and wording rules

The UI must distinguish:

- **risk score** from **policy eligibility**;
- **near trigger** from **trigger candidate**;
- **trigger candidate** from **insurer approval**;
- **insurer approval** from **payment made**;
- **payment made** from **lender posting**;
- **lender posting** from **reconciliation complete**.

Preferred borrower messages:

- Policy active: “Your climate protection is active for the dates and location shown.”
- Candidate: “A climate trigger condition was detected. Insurer review is underway.”
- Approved: “The insurer sandbox approved an illustrative payout of ₹X.”
- Posted: “The lender sandbox recorded ₹X according to the demo loan terms.”

Never use “claim automatically approved,” “instant guaranteed payout,” or “credit score protected.”

Every screen using sandbox or synthetic content must retain a visible demo disclosure. `REAL`, `DERIVED`, and `SIMULATED` badges must be understandable rather than hidden in developer-only metadata.

---

## 17. Canonical 2–3 minute demo flow

The demo must execute real project logic, not a collection of hard-coded screen changes.

1. Open the Lender Dashboard with the persistent Demo Mode banner.
2. Add or import synthetic **ABC Textiles** and its simulated working-capital loan.
3. Run **Assess Climate Risk**; show interpretable exposure and its evidence/method.
4. Match an applicable reference/demo parametric product; show policy provenance and classifications.
5. Open the borrower view, show the basis-risk and demo disclosures, and explicitly accept the offer.
6. Create the immutable accepted policy snapshot and activate it only after evidence-gate validation.
7. Start **Replay Historical Climate Event** using the frozen local dataset.
8. Animate actual processed values and calculation progress: safe → near trigger → trigger candidate.
9. Open the calculation/evidence trace to prove the event was computed, not button-triggered.
10. Show the Insurer Sandbox receiving the candidate; choose `APPROVED` for the main path. Optionally demonstrate `NEEDS_MORE_DATA` separately.
11. Create the illustrative payout event and send it through the Lender Sandbox using one correlation ID and idempotency key.
12. Show the lender receipt/posting and updated simulated loan obligation. The allocation remains labelled as demo treatment.
13. Run reconciliation and show `RECONCILED` only after both sides match.
14. Show the borrower in-app notification, updated portfolio dashboard, and full audit timeline.

The backup demo must run locally with no internet. A single seed/reset command must recreate all synthetic records, policy configuration, dataset registration, and expected main-path outcome.

---

## 18. Testing and verification

No feature is complete merely because the happy-path UI works.

### 18.1 Unit tests

- money and rounding with `Decimal`;
- timezone and risk-period boundaries;
- geographic-zone matching;
- unit conversion and aggregation;
- risk-score rules;
- policy matching;
- strike/exit/payout calculations;
- evidence-gate validation;
- allowed and forbidden state transitions;
- duplicate/idempotency-key generation.

### 18.2 Trigger-engine edge cases

- exactly below, at, and above strike;
- exactly at exit;
- observation before/after risk period;
- midnight/local-time and UTC boundary;
- wrong geography;
- wrong provider;
- missing observation;
- duplicate observation;
- conflicting providers;
- expired/suspended policy;
- already-triggered policy phase;
- changed product version after borrower acceptance;
- unsupported unit or aggregation window.

### 18.3 Adapter contract tests

Run the same behavior contract against every sandbox and future real implementation:

- canonical request/response mapping;
- authentication/error mapping;
- timeout and retry behavior;
- same idempotency key returns same result;
- duplicate callback does not duplicate state;
- pending, success, rejection, and permanent-failure states;
- raw external references retained without leaking secrets.

### 18.4 Integration tests

- create loan → offer → consent → snapshot → activation;
- ingest dataset → normalize → verify → trigger candidate;
- candidate → insurer decision → payout → lender posting → reconciliation;
- `NEEDS_MORE_DATA` loop;
- insurer unavailable and retry exhaustion;
- lender unavailable after insurer approval;
- reconciliation mismatch and manual resolution;
- replay reset and repeatability.

### 18.5 Frontend tests

- demo banner and classification badges always display where required;
- accept/decline and disclosures;
- role-based actions;
- accurate distinction between candidate, approval, payment, posting, and reconciliation;
- exception and audit timelines;
- accessible loading, error, and empty states.

### 18.6 Security tests

- authorization denial across roles;
- invalid/oversized CSV and malicious fields;
- token expiry;
- secret/PII absence in logs;
- input-validation failures;
- no unprotected admin/sandbox decision endpoints.

### 18.7 Demo acceptance test

From a clean environment, seed the system, start it locally, run the full canonical flow without internet, and verify the expected correlation-linked audit sequence and reconciliation result. Repeat it twice to prove idempotency and reset reliability.

---

## 19. Limitations and judge-defense statements

These are constraints to disclose, not hide.

1. **Basis risk:** real loss and index outcome can differ in either direction. Smaller zones and better data may reduce but not eliminate it.
2. **Not full recovery:** an EMI-linked or fixed payout may cover only part of the business’s losses or repayment burden.
3. **Insurer dependency:** no insurance product can launch without a licensed insurer willing to design, price, and carry the concentrated climate risk.
4. **Partner/regulatory dependency:** production distribution, premium flow, policy issuance, claims, assignment, and lender allocation require authorized agreements and legal/regulatory review.
5. **Data dependency:** settlement is only as reliable as the policy-approved reference data; gaps and disputes require an insurer-defined rule/manual process.
6. **Catastrophe concentration:** one event may affect many borrowers simultaneously; the insurer must manage aggregation, limits, capital, and reinsurance.
7. **No proven outcome yet:** the hackathon prototype does not prove lower defaults, cleaner bureau histories, willingness to pay, or commercial viability.
8. **Risk-score fairness:** climate exposure must not silently become a reason to deny credit or worsen inclusion. The MVP score is advisory/portfolio intelligence only.
9. **Standalone alternatives exist:** an MSME can buy insurance directly; a lender can offer relief, a moratorium, or emergency credit. MonsoonCover’s value is pre-arranged integration and automation, not exclusivity.
10. **Sandbox limits:** no real partner API, policy, claim, payout, loan posting, or money movement is demonstrated.
11. **Historical replay is not live monitoring:** it proves deterministic processing and orchestration, not live operational readiness.
12. **Prototype data sources:** Open-Meteo or other convenient APIs are monitoring/prototype sources unless explicitly authorized for settlement.
13. **Security/scale:** the MVP baseline is not certification for production security, availability, privacy, or disaster recovery.

Concise defense of novelty:

> MonsoonCover does not claim to invent lending or parametric insurance. Its innovation is evidence-gated, loan-linked climate-risk infrastructure that joins policy terms, trusted data, insurer review, lender posting, reconciliation, and portfolio visibility.

---

## 20. Pilot design and success metrics

A credible future pilot begins narrowly: one willing lender, one licensed insurer/authorized distribution path, one geography/cluster, one peril/index, one approved reference-data source, and a limited cohort. The previously discussed 500–1,000-loan range is a planning hypothesis, not a committed or validated partner pilot.

### 20.1 Operational metrics

- eligible borrowers offered cover;
- opt-in/decline rate and disclosure completion;
- policy issuance/activation success rate;
- reference-data completeness and validation-failure rate;
- median trigger-candidate-to-insurer-submission time;
- median insurer decision time;
- median approved-payout-to-lender-receipt/posting time;
- reconciliation success and mismatch rates;
- duplicate suppression and accidental duplicate financial-event count (target: zero);
- adapter failure/retry and manual-review rates;
- notification delivery/read rate.

### 20.2 Customer/product metrics

- premium affordability and willingness to pay;
- borrower comprehension of trigger and basis risk;
- complaints and basis-risk cases;
- amount/timing of liquidity or repayment relief;
- renewal/continued-participation intent;
- borrower satisfaction after a trigger event.

### 20.3 Lender/portfolio metrics

- share of exposed portfolio with applicable cover;
- climate concentration by geography/peril;
- missed or late EMI rate among triggered covered borrowers versus a carefully defined comparison group;
- arrears/default transition after climate events;
- lender operations time saved and exception burden.

### 20.4 Interpretation rules

- Do not claim causation from a small uncontrolled pilot.
- Define denominator, cohort, geography, and observation period for every rate.
- Report failures and declined offers, not only successful payouts.
- Separate `REAL` observed outcomes from `DERIVED` calculations and `SIMULATED` forecasts.
- A useful pilot may disprove assumptions; that is evidence, not failure.

---

## 21. Repository structure

The intended repository layout is:

```text
monsooncover/
├── MONSOONCOVER_SPEC.md                 # Read first; frozen authority
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml                   # Optional reproducible environment
│
├── docs/
│   ├── architecture.md
│   ├── workflow.md
│   ├── data_model.md
│   ├── api_contracts.md
│   ├── insurance_reference.md
│   ├── lender_reference.md
│   ├── evidence_policy.md
│   ├── demo_flow.md
│   └── limitations.md
│
├── evidence/
│   ├── evidence_registry.csv
│   └── sources.md
│
├── data/
│   ├── historical/
│   │   ├── raw/
│   │   └── processed/
│   ├── demo/
│   ├── policy_reference/
│   └── manifests/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── modules/
│   │   └── adapters/
│   ├── migrations/
│   ├── scripts/
│   │   └── seed_demo.py
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── tests/
│
└── tests/
    ├── contract/
    ├── end_to_end/
    └── fixtures/
```

This structure is the target for the coding phase. Creating it or application files is intentionally outside the current request.

---

## 22. Development phases and gates

### Phase 0 — Freeze truth and evidence policy

- approve this specification;
- collect authoritative policy, regulatory, company, and climate sources;
- create the evidence registry and dataset manifests;
- select one geography-aligned historical dataset and demo trigger configuration.

**Exit gate:** no unresolved claim is presented as real; every critical proposed configuration is classified.

### Phase 1 — Architecture, data model, and contracts

- detailed component/data-flow diagram;
- relational schema and migrations plan;
- state-transition table;
- API contracts and canonical adapter types;
- threat model and authorization matrix;
- exact demo storyboard.

**Exit gate:** architecture, schema, APIs, state machine, and evidence model agree.

### Phase 2 — Backend foundation

- FastAPI project, configuration, database, migrations, auth/RBAC;
- core entities, immutable policy snapshots, audit/correlation, idempotency;
- seed/reset tooling.

**Exit gate:** core constraints and state invariants have tests.

### Phase 3 — Policy, evidence, and climate pipeline

- Policy Library and Evidence Registry;
- activation gate;
- CSV/manual lender ingestion;
- historical provider, normalization, validation, provenance;
- Risk Engine and policy matching;
- replay and dry run.

**Exit gate:** verified local data produces reproducible calculations without partner sandboxes.

### Phase 4 — Trigger and partner workflow

- deterministic Trigger Engine;
- Insurer Sandbox/adapter;
- payout orchestrator;
- Lender Sandbox/adapter;
- reconciliation, retries, and exception queue;
- adapter contract tests.

**Exit gate:** end-to-end backend flow is idempotent and auditable.

### Phase 5 — Focused user interfaces

- lender dashboard and borrower detail;
- borrower consent/status;
- insurer sandbox review;
- admin evidence/exception/audit views;
- clear classifications and Demo Mode disclosure.

**Exit gate:** all states and role boundaries are accurately communicated.

### Phase 6 — Verification and demo hardening

- full unit/integration/frontend/security test suite;
- clean-machine setup and offline rehearsal;
- repeatable seed/reset and historical replay;
- failure-path rehearsal;
- accessibility and visual QA;
- judge questions and evidence drill-down.

**Exit gate:** the 2–3 minute demo works twice from a clean reset without internet and does not make unsupported claims.

### Phase 7 — Optional enhancements only after MVP passes

- justified ML climate-risk model;
- live monitoring API;
- email/SMS/WhatsApp adapter;
- public free-tier deployment;
- PostGIS/spatial optimization;
- partner-specific adapters.

---

## 23. Alternatives considered and rejected for MVP

| Alternative | Decision | Reason |
|---|---|---|
| Microservices | Rejected | Excess deployment, networking, and debugging cost for hackathon scale. |
| MongoDB | Rejected | Core loan-policy-trigger-payout data is relational and transactional. |
| Firebase as core backend | Rejected | Adds an external dependency without improving the core financial workflow. |
| Celery + Redis initially | Rejected | APScheduler and explicit jobs are sufficient for the MVP. |
| Next.js as required full-stack framework | Rejected | SSR/SEO/server components are unnecessary with FastAPI; React/Vite is simpler. |
| Flask | Rejected | FastAPI provides stronger typed validation and automatic API documentation. |
| Django/DRF | Valid alternative, not selected | Strong business framework, but heavier than needed for this API/data-oriented MVP. |
| SQLite as final database | Rejected | Useful for experiments, but PostgreSQL better matches concurrency, constraints, and production direction. |
| Material UI | Valid fallback, not selected | Faster stock components, but Tailwind offers more control for the intended presentation. |
| Deep-learning climate model | Rejected | Limited justified data and poor explainability; not needed for core value. |
| AI/LLM deciding terms, trigger, or claim | Rejected | Unsafe, non-contractual, and impossible to defend. |
| Automatically extracting a PDF and executing it | Rejected | An extraction error could become a financial-rule error. |
| “Create Insurance Policy” feature | Rejected | MonsoonCover is not an insurer; import/reference insurer-approved terms instead. |
| Fake branded Digit/Bajaj insurer integration | Rejected | Falsely implies a partnership or permission. |
| Real UGRO/private lender API | Rejected for MVP | No commercial access; use a replaceable sandbox adapter. |
| Live payment gateway | Rejected | Adds risk and no meaningful hackathon proof. |
| Real KYC/CIBIL/PAN/Aadhaar | Rejected | Unnecessary, private, regulated, and outside scope. |
| Cloud-only deployment | Rejected | Wi-Fi, quota, and cold-start risk during judging. |
| One giant hard-coded demo | Rejected | The rules and workflow must genuinely execute and remain testable. |
| Weather alert only | Rejected | Does not demonstrate loan-policy-insurer-lender orchestration. |
| Forced/automatic insurance enrollment | Rejected | Cover must be voluntary with explicit opt-in and disclosures. |
| MonsoonCover as insurer/lender/wallet | Rejected | Violates the core role boundary and creates false regulatory claims. |

---

## 24. Non-negotiable build rules

1. Read this file before changing code or architecture.
2. Do not start from invented insurance, lending, regulatory, climate, or company facts.
3. Classify every critical fact/value as `REAL`, `DERIVED`, or `SIMULATED`.
4. Trace every `REAL` claim to an authoritative registered source.
5. Trace every `DERIVED` value to inputs and a reproducible transformation.
6. Label every `SIMULATED` value visibly and explain why simulation is required.
7. Do not imply UGRO, Digit, Bajaj, or any other organization is a partner.
8. MonsoonCover never lends, underwrites, issues insurance, holds funds, or approves claims.
9. Insurance is optional; explicit consent and disclosures are required.
10. Use an insurer-authored/approved policy snapshot; never mutate accepted terms.
11. Evidence-gate settlement-critical configuration before activation.
12. Keep risk scoring, policy eligibility, trigger evaluation, and claim approval separate.
13. Use deterministic contractual rules—not AI—for trigger evaluation.
14. Output `TRIGGER_CANDIDATE`, never `CLAIM_APPROVED`, from the Trigger Engine.
15. Only policy-authorized verified reference data can support a settlement-oriented candidate.
16. Preserve raw data, provenance, transformations, units, versions, and checksums.
17. Evaluate time in the policy’s explicit local timezone while storing timestamps in UTC.
18. Use explicit versioned GeoJSON coverage, not only a city name.
19. Use `Decimal`/`NUMERIC` for money, explicit currency, and documented rounding.
20. Enforce legal state transitions and database invariants.
21. Make insurer/lender/climate connections replaceable adapters with shared contract tests.
22. Require idempotency for ingestion, trigger events, partner calls, payouts, and postings.
23. Never let duplicate delivery create a duplicate claim, payout, or lender credit.
24. Use correlation IDs across the full event chain.
25. Keep audit events append-only; never make manual overrides invisible.
26. Reconcile insurer and lender records; never infer success from only one side.
27. Send failures, data conflicts, and mismatches to an explicit exception/manual-review flow.
28. Use synthetic borrower/loan/KYC data only; no real sensitive personal data.
29. Keep a visible Demo Mode banner and sandbox labels.
30. The canonical demo must run locally/offline from a frozen dataset and be resettable.
31. Do not add paid services as required dependencies.
32. Do not add AI/ML until the deterministic end-to-end MVP works and evidence supports the model.
33. Do not claim reduced defaults, instant payouts, saved credit scores, or commercial viability without pilot evidence.
34. Do not hide basis risk, data limitations, or production partner dependencies.
35. Prefer a complete, testable narrow workflow over additional portals, perils, integrations, or visual features.

---

## 25. Definition of MVP done

The MVP is done only when a clean, local environment can reproducibly demonstrate:

> synthetic loan → evidence-backed risk assessment → applicable policy offer → explicit borrower consent → immutable active policy snapshot → verified historical observations → deterministic trigger candidate → independent insurer-sandbox decision → illustrative payout event → idempotent lender-sandbox posting → successful reconciliation → borrower/portfolio update → complete correlation-linked audit trail

It must also demonstrate at least one controlled failure or exception path, contain no unlabelled simulated facts, pass the required tests, and work without internet for the principal judging flow.

Anything beyond this definition is optional until the core is reliable.

---

## 26. Frozen summary for future Codex sessions

MonsoonCover is a modular-monolith hackathon MVP for evidence-gated, loan-linked parametric climate protection. It uses public policy structures and verified historical climate data where possible, synthetic borrowers and sandbox lender/insurer systems where access is unavailable, and strict `REAL`/`DERIVED`/`SIMULATED` labelling everywhere. The platform assesses climate exposure, matches and snapshots insurer-defined terms, monitors authorized data, detects only trigger candidates, sends them to an insurer sandbox for an independent decision, orchestrates a simulated payout to a lender sandbox, reconciles both sides, and preserves an auditable correlation-linked trail. It never acts as lender or insurer, never uses AI to approve claims, never implies partnerships, and must remain reproducible, idempotent, explainable, secure, and offline-demo capable.

