# MonsoonCover Frontend Design and Technical Plan

**Status:** Approved planning baseline; implementation has not started  
**Authority:** This document is subordinate to `MONSOONCOVER_SPEC.md`. If the two documents conflict, `MONSOONCOVER_SPEC.md` wins.

## 1. Objective

Build MonsoonCover as a premium climate-fintech command center using React, TypeScript, Vite, Tailwind CSS, Motion, Recharts, Leaflet and OpenStreetMap.

The interface must feel appropriate for professional banking, lending and insurance operations. It must not resemble a generic admin template, gaming interface or crypto dashboard.

No frontend presentation may change the business meaning defined in `MONSOONCOVER_SPEC.md`:

- `TRIGGER_CANDIDATE` is not claim approval.
- The insurer approves or rejects.
- MonsoonCover orchestrates the workflow.
- The lender posts the payment.
- Reconciliation confirms settlement.
- `REAL`, `DERIVED` and `SIMULATED` labels remain visible wherever relevant.
- Demo data is always clearly identified.
- The interface must not imply a real partnership with a named lender, insurer or other company.

## 2. Reference Repository Audit

### 2.1 paper-design/liquid-logo

Reference: <https://github.com/paper-design/liquid-logo>

The repository uses a custom WebGL2 liquid shader with image textures, time-based movement, edge treatment and refraction. Its application architecture is Next.js and will not be adopted.

The repository uses the PolyForm Shield license rather than a standard permissive open-source license. MonsoonCover will therefore not copy its source code or fragment shader. Its liquid optical language will be recreated through an original MonsoonCover treatment using permissively licensed tools.

Planned adaptation:

- A liquid MonsoonCover mark in the login/landing hero.
- Slow, restrained refraction rather than energetic distortion.
- Monsoon blue, cyan, silver and deep navy instead of rainbow or iridescent branding.
- A static SVG/CSS logo fallback.

### 2.2 ruucm/shadergradient

Reference: <https://github.com/ruucm/shadergradient>

ShaderGradient is MIT-licensed, supports React and has an official Vite example. Its React package supports React 18/19, Three.js and React Three Fiber.

Planned adaptation:

- Login/landing brand treatment.
- Dashboard overview hero.
- Subtle, low-motion backgrounds only.
- Lazy loading and reduced pixel density.

ShaderGradient uses React Three Fiber internally and therefore consumes the one-WebGL-canvas budget for a screen.

### 2.3 dashersw/liquid-glass-js

Reference: <https://github.com/dashersw/liquid-glass-js>

The repository is MIT-licensed but is a vanilla JavaScript/WebGL demonstration rather than a production React package. Its runtime page capture and multiple WebGL surfaces would be too costly for dashboard cards.

MonsoonCover will build its own reusable React `GlassSurface` component using the reference's edge, rim, tint and refraction parameter model. The default implementation will use lightweight CSS and optional SVG filtering, with an opaque CSS fallback.

Planned uses:

- Selected KPI cards.
- Policy summary.
- Trigger status summary.
- Important alerts.
- Small overlays.

Glass will not be the default treatment for every card.

### 2.4 pmndrs/react-three-fiber

Reference: <https://github.com/pmndrs/react-three-fiber>

React Three Fiber is an MIT-licensed React renderer for Three.js. It supports React 19 and provides Canvas fallbacks for unavailable or failed WebGL contexts.

Planned uses:

- Geographic MSME climate-exposure visualization.
- Rainfall/flood historical event replay.

It will not be used for tables, forms, standard charts, policy content or workflow controls.

## 3. Information Architecture

MonsoonCover will be one React application with role-scoped experiences.

### 3.1 Shared entry and shell

- Login/demo entry.
- Persistent `DEMO ENVIRONMENT` disclosure.
- Current user role and organization context.
- Data-as-of timestamp.
- Alert and exception indicator.
- Responsive navigation rail.

### 3.2 Lender command center

#### Overview

Portfolio exposure, active cover, trigger candidates, pending insurer decisions, payments awaiting posting and reconciliation exceptions.

#### Portfolio

Searchable MSME portfolio, segmentation, exposure totals, Leaflet map and data provenance.

#### Borrower detail

Borrower profile, facility, climate exposure, offer history, policy reference, event timeline and settlement status.

#### Climate risk

Geographic exposure, rainfall/flood indicators, concentration analysis, source methodology and data classifications.

#### Policies

Policy-reference records, coverage windows, eligibility parameters, trigger definitions and source documents. Policy references must not be presented as partnerships.

#### Events and triggers

Event feed, calculation trace, evidence and lifecycle status. A `TRIGGER_CANDIDATE` must say that insurer review is required.

#### Settlement and reconciliation

Approved instructions, lender posting status, reconciliation results and exceptions.

#### Evidence and audit

Evidence registry, source snapshots, classification, calculation history and audit chronology.

### 3.3 Insurer sandbox

The insurer sandbox is a separately labelled, role-scoped surface containing:

- Candidate event evidence.
- Policy reference.
- Trigger calculation trace.
- Source provenance.
- Approve and reject controls.
- Mandatory decision reason.
- Explicit confirmation before submission.

The interface must make clear that the insurer, not MonsoonCover, makes this decision.

### 3.4 Borrower experience

A simpler mobile-first experience containing:

- Offer and consent.
- Coverage summary.
- Current status.
- Event notification.
- Settlement status.

Borrowers must not see lender or insurer operational controls.

### 3.5 Administration and exceptions

- Evidence management.
- Adapter health.
- Manual-review queue.
- Reconciliation exceptions.
- Audit exports.

Business calculations must not be reimplemented inside these screens.

## 4. State Presentation

The frontend will preserve canonical state-machine values from the source-of-truth specification. Friendly descriptions may accompany them but cannot replace or reinterpret them.

The key lifecycle will be presented as:

1. Event observed.
2. `TRIGGER_CANDIDATE` — insurer decision required; not approved.
3. Insurer approves or rejects.
4. If approved, MonsoonCover orchestrates the instruction.
5. Lender posts the payment.
6. Reconciliation confirms settlement.

Status colors are supporting cues only:

- Candidate: amber.
- Insurer approved but not posted: blue/cyan.
- Lender posted: distinct intermediate status.
- Reconciled: final muted green.
- Rejected or exception: restrained red with visible reason.

## 5. Component System

### 5.1 Foundations

- `AppShell`
- `RoleHeader`
- `NavigationRail`
- `DemoEnvironmentBanner`
- `PageHeader`
- `SectionPanel`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`

### 5.2 Data integrity

- `DataClassificationBadge`
- `DemoDataBadge`
- `ProvenancePopover`
- `SourceReference`
- `AsOfTimestamp`
- `CanonicalStateBadge`
- `CalculationTrace`
- `AuditTimeline`

These components are mandatory where corresponding business data appears.

### 5.3 Finance and insurance

- `MetricCard`
- `ExposureSummary`
- `PolicySummary`
- `TriggerCandidateCard`
- `DecisionPanel`
- `PaymentPostingPanel`
- `ReconciliationStatus`
- `ExceptionAlert`
- `RiskBandLegend`

### 5.4 Advanced visual components

- `MonsoonLiquidMark`
- `ShaderHero`
- `GlassSurface`
- `ClimateExposureScene`
- `EventReplayScene`
- `WebGLBoundary`
- `StaticVisualFallback`

## 6. Advanced Visual Placement

### Login/landing

One ShaderGradient canvas will provide a restrained liquid MonsoonCover mark or hero treatment. It will be surrounded by a static CSS gradient and will have a static SVG/CSS fallback.

### Dashboard overview

One low-motion ShaderGradient canvas will sit behind the portfolio snapshot. This screen will not also load a custom Three.js scene.

### KPI area

Only the three or four highest-priority metrics will use `GlassSurface`. Other information panels will use solid navy surfaces.

### Climate-risk overview

One custom React Three Fiber scene will show geographic MSME exposure using restrained elevation and rainfall intensity. The operational map below it will remain Leaflet. This screen will not load ShaderGradient.

### Historical event replay

One custom React Three Fiber scene will show rainfall/flood development over time. Playback controls, classifications, charts and calculations will remain standard DOM components.

### Policy detail

Glass is limited to the policy summary. Terms, source references and tabular content remain solid and highly readable.

### Trigger detail

Glass is limited to the status summary and important alert. Evidence and insurer decision controls remain plain.

### Reconciliation

Only an exception alert may use glass. The reconciliation table remains plain.

### Borrower status

A subtle CSS glass summary may be used. WebGL is not required.

## 7. Plain and Functional Areas

The following must not use distracting distortion or continuous animation:

- Insurer approval/rejection controls.
- Borrower consent.
- Policy terms and exclusions.
- Data tables.
- Evidence registry.
- Source links.
- Audit trails.
- Reconciliation matching.
- Exception resolution.
- Search and filters.
- Forms.
- Legal and demo disclosures.

Motion will communicate hierarchy, state changes and navigation. It will not decorate critical decisions or animate numbers unnecessarily.

## 8. Visual System

Initial color direction:

- Deep background: `#07111F`.
- Raised background: `#0D1B2A`.
- Solid panel: `#132436`.
- Monsoon blue: `#159DD8`.
- Cyan highlight: `#58D5E8`.
- Amber warning: `#E4A23A`.
- Restrained red: `#D95C65`.
- Success: muted teal-green, reserved for completed states.

Typography will use an open-source variable typeface such as Inter, with tabular numerals for financial and climate measurements.

Panels will use restrained 12–18px corner radii, low-opacity shadows, fine borders and strong text contrast.

## 9. Proposed Dependencies

No dependency is approved merely by appearing in this list. Exact versions must be verified together before installation.

### Core

- `react`
- `react-dom`
- `vite`
- `typescript`
- `tailwindcss`
- `motion`
- `react-router-dom`
- `recharts`
- `leaflet`
- `react-leaflet`
- `@types/leaflet`

### Advanced visuals

- `three`
- `@react-three/fiber`
- `@types/three`
- `@shadergradient/react`

The target compatibility family is React 19.2, React Three Fiber 9.x and ShaderGradient 2.4.x. Exact patches will be locked only after a clean installation and production build check.

### Utilities

- `lucide-react`
- `clsx`
- `tailwind-merge`

### Testing

- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `playwright`
- `@axe-core/playwright`

### Excluded

- Next.js.
- Direct use of `liquid-glass-js` as a package.
- Paper Design code or shaders under the current repository license.
- GSAP.
- Generic dashboard templates.
- A second charting library.
- Heavy post-processing packages unless later justified and reviewed.
- Proprietary map providers.

## 10. Performance, Accessibility and Fallback Contract

- Maximum one WebGL canvas per screen.
- Advanced visuals are route-level lazy-loaded.
- Canvases mount only when visible.
- Device-pixel ratio is capped, initially around 1–1.5.
- Background shaders use low-power settings.
- Animation pauses when hidden or outside the viewport.
- `prefers-reduced-motion` produces a static version.
- R3F uses on-demand rendering except during event replay.
- Drawing buffers are not preserved unless an approved export feature requires it.
- WebGL failure renders a CSS/SVG fallback in the same layout.
- Application controls and critical content remain outside the canvas.
- Glass falls back to an opaque navy panel.
- Keyboard navigation, visible focus, screen-reader labels and WCAG contrast are mandatory.

## 11. Planned Internal Frontend Structure

When implementation is authorized, the frontend source should be organized approximately as:

```text
src/
  app/                 application shell, routing and providers
  routes/              route-level screens
  features/
    portfolio/
    borrowers/
    climate-risk/
    policies/
    triggers/
    insurer-sandbox/
    reconciliation/
    evidence/
    audit/
  components/
    ui/                 plain reusable controls
    data-integrity/     classification and provenance
    finance/            domain presentation components
  visuals/
    shader/
    glass/
    three/
    fallbacks/
  adapters/             typed UI-facing service adapters
  lib/                  formatting and non-business utilities
  styles/               tokens and global styles
  test/                 shared testing utilities
```

Visual components must not connect directly to Supabase, external climate services or insurer/lender systems. They consume typed data supplied through the adapter and application layers defined by the source-of-truth specification.

## 12. Frontend Delivery Phases

1. Scaffold React, TypeScript and Vite in the specification-approved repository location.
2. Create design tokens, typography and the plain application shell.
3. Build business screens using typed, explicitly labelled demo data.
4. Add provenance, classification, audit and state components.
5. Add Recharts and Leaflet.
6. Add the lightweight React glass system.
7. Add ShaderGradient to login and dashboard only.
8. Add climate exposure and historical replay R3F scenes.
9. Test reduced motion, WebGL failure, responsiveness and accessibility.
10. Run visual regression and production bundle checks.

The complete application must be accurate and usable before advanced visual effects are introduced.

## 13. Approval Boundary

This document approves a frontend direction, not implementation. Starting the frontend scaffold, adding dependencies, changing business logic or connecting external services requires a separate implementation step and review against `MONSOONCOVER_SPEC.md`.
