# MonsoonCover Shared Project Notes

**Purpose:** This is the shared, human-readable project notebook for decisions, ideas, progress, implementation records and contributor notes.

**Authority:** `MONSOONCOVER_SPEC.md` remains the single source of truth for product and business behavior. This notebook cannot override it. If a note conflicts with the specification, the specification wins and the conflict must be recorded for review.

## How this notebook is maintained

- When Mihir says **“add this to notes”** or **“add this information”**, append the information to the most appropriate section of this file.
- When Mihir says **“add this to special”**, **“add this to special notes”**, or equivalent wording, append the information to the final **Special Notes** section.
- When a name is supplied, such as **“add this to notes under Anvi”**, attribute the entry to that person.
- When no name is supplied, attribute a user-requested note to **Mihirbhati18 (Mihir)**.
- Use an ISO date (`YYYY-MM-DD`) and identify the author on every entry.
- Append new information instead of silently rewriting a contributor's history.
- If an earlier note is wrong, add a dated correction and link it to the original entry.
- Separate confirmed decisions from suggestions and unfinished ideas.
- Never store passwords, API keys, access tokens, private customer data or other secrets here.
- Feature records are added only after implementation begins. Planned work must be marked `PLANNED`, not `IMPLEMENTED`.
- Important additions should link to the relevant files, issue, branch or pull request.

## Status vocabulary

- `IDEA` — suggested but not reviewed.
- `PROPOSED` — documented for review.
- `APPROVED` — accepted direction; implementation may not have started.
- `IN PROGRESS` — currently being implemented.
- `IMPLEMENTED` — added to the repository and locally verified.
- `IN REVIEW` — submitted for review or awaiting merge.
- `MERGED` — merged into the protected main branch.
- `BLOCKED` — cannot proceed until a recorded dependency or decision is resolved.
- `REJECTED` — considered and intentionally not selected.

## Project snapshot

### 2026-09-02 — Repository and collaboration foundation

**Author:** Codex, for Mihirbhati18  
**Status:** `IMPLEMENTED` / partially `IN REVIEW`

- Public repository: <https://github.com/Mihirbhati18/monsooncover>
- The repository has a protected `main` branch and a pull-request review workflow.
- `Mihirbhati18` is the current code owner.
- Contributor guidance and a pull-request template are present.
- A write-access collaborator invitation was sent to `anvisharan19`.
- The Phase 0 evidence foundation is in Pull Request #2 and is not treated as merged until GitHub confirms it: <https://github.com/Mihirbhati18/monsooncover/pull/2>

### 2026-09-02 — Single source of truth

**Author:** Codex, for Mihirbhati18  
**Status:** `IMPLEMENTED`

- `MONSOONCOVER_SPEC.md` contains the frozen product and build specification.
- `.cursor/rules/monsooncover-source-of-truth.mdc` reminds coding agents to follow that specification.
- All product, workflow, evidence, classification and role behavior must remain consistent with the specification.

### 2026-09-02 — Frontend design and technical planning

**Author:** Codex, for Mihirbhati18  
**Status:** `APPROVED`; not implemented

- The frontend direction is documented in `docs/FRONTEND_PLAN.md`.
- The intended experience is a premium climate-fintech command center using deep navy, monsoon blue, restrained warning colors, selective glass and strong numerical hierarchy.
- The plan actively evaluates:
  - `paper-design/liquid-logo`
  - `ruucm/shadergradient`
  - `dashersw/liquid-glass-js`
  - `pmndrs/react-three-fiber`
- Paper Design's source will not be copied because its repository uses the PolyForm Shield license. Its visual language will be recreated with an original treatment and permissively licensed tooling.
- ShaderGradient is proposed for the login/landing treatment and dashboard hero.
- React Three Fiber is proposed only for climate exposure and historical event replay.
- Liquid-glass principles will be adapted into a lightweight React component with a normal CSS fallback; the vanilla repository will not be installed directly.
- A maximum of one WebGL canvas is allowed per screen.
- The complete application must work without WebGL and with reduced motion.
- No React application, frontend packages or visual effects have been implemented yet.

## Decisions

Use this section for decisions that affect project direction.

### Decision template

#### YYYY-MM-DD — Decision title

**Author:** Contributor name  
**Status:** `PROPOSED` or `APPROVED`  
**Context:** Why the decision was needed.  
**Decision:** What was selected.  
**Reasoning:** Why it was selected.  
**Consequences:** What this enables, restricts or postpones.  
**Related files/PRs:** Links or paths.

### 2026-09-02 — The specification remains authoritative

**Author:** Mihirbhati18 and Codex  
**Status:** `APPROVED`  
**Context:** Multiple contributors and coding agents will work on the project.  
**Decision:** `MONSOONCOVER_SPEC.md` is the single source of truth. This notebook records history and context but cannot change business rules by itself.  
**Consequences:** Any proposed product-rule change must first be explicitly reviewed and reflected in the specification.

### 2026-09-02 — Frontend remains React, TypeScript and Vite

**Author:** Mihirbhati18  
**Status:** `APPROVED`  
**Context:** The reference projects use different architectures, including Next.js.  
**Decision:** MonsoonCover will remain React + TypeScript + Vite and will not migrate to Next.js.  
**Consequences:** Reference techniques may be adapted only when compatible with the approved stack and licensing rules.  
**Related files:** `docs/FRONTEND_PLAN.md`

## Feature and working register

This section explains every feature after work begins: what was added, why it exists, how it works, which technologies it uses, its business logic boundaries and how it was verified.

### Feature record template

#### Feature: Name

**Status:** `IN PROGRESS`, `IMPLEMENTED`, `IN REVIEW` or `MERGED`  
**Added by:** Contributor name  
**Date:** YYYY-MM-DD  
**Purpose:** The problem or user need addressed.  
**User experience:** What the user sees and can do.  
**How it works:** Plain-language working description.  
**Technology used:** Frameworks, packages and services.  
**Logic and data flow:** Inputs, transformations, decisions, adapters and outputs.  
**Business boundaries:** Roles and actions the feature must not perform.  
**Data classification:** Where `REAL`, `DERIVED`, `SIMULATED` and demo labels appear.  
**Files changed:** Relevant paths.  
**Configuration:** Required non-secret environment variable names or setup steps.  
**Testing performed:** Automated and manual verification.  
**Fallbacks and accessibility:** Reduced motion, WebGL failure, keyboard and screen-reader behavior.  
**Known limitations:** Deliberately unfinished or unsupported behavior.  
**Related issue/branch/PR:** Links.  
**Last updated by:** Contributor name and date.

### Feature: Protected collaboration workflow

**Status:** `IMPLEMENTED`  
**Added by:** Codex, for Mihirbhati18  
**Date:** 2026-09-02  
**Purpose:** Allow friends to contribute safely through branches and pull requests without uncontrolled changes to `main`.  
**User experience:** Contributors create branches and pull requests; the repository owner reviews changes before merging.  
**How it works:** GitHub branch protection, code ownership and pull-request guidance define the review path.  
**Technology used:** Git, GitHub, CODEOWNERS and GitHub branch protection.  
**Logic and data flow:** Contributor branch → pull request → review/checks → approved merge into `main`.  
**Business boundaries:** Repository approval is technical governance and does not constitute insurer approval, lender posting or reconciliation.  
**Files changed:** `.github/CODEOWNERS`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, `.gitignore`.  
**Testing performed:** Repository initialization and initial push were completed; branch protection was configured.  
**Known limitations:** Owner-authored pull requests cannot satisfy their own required approval. The team may need a second eligible code owner or an explicit admin merge for those pull requests.  
**Related repository:** <https://github.com/Mihirbhati18/monsooncover>  
**Last updated by:** Codex — 2026-09-02.

### Feature: Frontend command center

**Status:** `APPROVED`; implementation not started  
**Added by:** Not applicable yet  
**Date:** 2026-09-02  
**Purpose:** Provide role-accurate lender, insurer, borrower and administrative experiences.  
**Current record:** This is a planned feature only. Its intended screens, components, technologies, fallbacks and performance rules are documented in `docs/FRONTEND_PLAN.md`. A complete implementation record must replace or extend this entry when development begins.  
**Business boundaries:** `TRIGGER_CANDIDATE` is not approval; insurer decisions, lender posting and reconciliation remain separate actions.  
**Related files:** `MONSOONCOVER_SPEC.md`, `docs/FRONTEND_PLAN.md`.

## General notes

Add short facts, reminders and project information here when they do not require a full decision or feature record.

### Note template

#### YYYY-MM-DD — Note title

**Author:** Contributor name  
**Type:** Fact, reminder, question, suggestion or correction  
**Status:** Optional status  
**Note:** Information being recorded.  
**Related files/links:** Optional paths or links.

## Open questions

Questions stay here until resolved. When resolved, add a dated resolution rather than deleting the question.

### Question template

#### YYYY-MM-DD — Question

**Asked by:** Contributor name  
**Owner:** Person responsible for resolving it  
**Status:** `OPEN`, `BLOCKED` or `RESOLVED`  
**Context:** Relevant information.  
**Resolution:** Added when known.  
**Related decision:** Link to a decision entry if applicable.

## Contributor journals

Contributors may add personal working notes under their own names. Shared decisions and completed features must still be copied into the appropriate shared sections above.

### Mihirbhati18 (Mihir)

Add dated entries below this line.

### anvisharan19

Add dated entries below this line.

### Codex

#### 2026-09-02 — Notebook created

- Created the shared note structure.
- Recorded the existing repository foundation and frontend plan.
- Added templates for decisions, features, general notes, questions and named contributor journals.

### New contributor template

Copy the following section and replace the name:

```markdown
### Contributor name

#### YYYY-MM-DD — Entry title

- Note or progress update.
- Related file, issue, branch or pull request.
```

## Special Notes

Use this final section for information that Mihir explicitly asks to add to “special” or “special notes.” Keep this section at the end of the notebook.

### Special note template

#### YYYY-MM-DD — Special note title

**Author:** Contributor name  
**Status:** Applicable status  
**Note:** Information being recorded.  
**Related files/links:** Optional paths or links.
