import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { signInForTests, stubApi, stubApiFailure } from './test/apiStub'

// Shaped like the backend's TriggerEvaluationDetail response.
const TRIGGER_DETAIL = {
  id: 'eval-1',
  evaluation_key: 'MC-PS-2026-0142-v1|SURAT-DEMO-Z1|2026-08-27|2026-08-28|EXTREME_RAINFALL|precipitation|trigger-engine-v1',
  correlation_id: 'EVENT-MC-2026-00427',
  outcome: 'TRIGGER_CANDIDATE',
  observed_value: '184.0',
  strike_threshold: '160.0',
  normalized_unit: 'mm',
  window_start_local: '2026-08-27',
  window_end_local: '2026-08-28',
  evaluation_version: 'trigger-engine-v1',
  evaluated_at_utc: '2026-09-03T12:00:00Z',
  inputs_digest: 'f90c20645fe7b115b6832a05fa8466fa',
  observation_count: 2,
  trace_steps: [
    { step: 'rule_loaded', description: 'Loaded accepted snapshot MC-PS-2026-0142-v1.', value: null },
    { step: 'aggregated', description: 'Summed 2 eligible observation(s).', value: '184.0 mm' },
    { step: 'compared', description: 'Compared aggregate against the accepted thresholds: 184.0 >= 160.0 mm.', value: '184.0 >= 160.0' },
  ],
}

const INSURER_REQUEST = {
  id: 'req-1',
  external_request_id: 'INS-REQ-00001',
  correlation_id: 'EVENT-MC-2026-00427',
  evaluation_id: 'eval-1',
  submitted_at_utc: '2026-09-03T12:01:00Z',
  adapter_name: 'SandboxInsurerAdapter',
}

beforeEach(() => {
  signInForTests()
  stubApi({ '/api/v1/triggers': [] })
})

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('MonsoonCover frontend foundation', () => {
  it('keeps the demo environment and synthetic-data disclosures visible', () => {
    renderApp()

    expect(screen.getByLabelText('Demo environment disclosure')).toHaveTextContent(
      'no real insurance or financial transactions',
    )
    expect(screen.getAllByText('DEMO DATA').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Data classification: SIMULATED').length).toBeGreaterThan(0)
  })

  it('renders the complete data classification vocabulary', () => {
    renderApp()

    expect(screen.getByLabelText('Data classification: REAL')).toBeVisible()
    expect(screen.getByLabelText('Data classification: DERIVED')).toBeVisible()
    expect(screen.getAllByLabelText('Data classification: SIMULATED').length).toBeGreaterThan(0)
  })

  it('states that a trigger candidate requires insurer review and is not approval', () => {
    renderApp()

    expect(screen.getByLabelText('Canonical state: TRIGGER_CANDIDATE')).toBeVisible()
    expect(screen.getByText('Insurer review is required.')).toBeVisible()
    expect(screen.getByText(/This is not approval/i)).toBeVisible()
  })

  it('keeps insurer, orchestration, lender posting, and reconciliation stages distinct', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Insurer review' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'MonsoonCover orchestration' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Lender posting' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Reconciliation' })).toBeVisible()
  })

  it('renders evidence and audit under the same persistent disclosure', () => {
    renderApp('/evidence-audit')

    expect(screen.getByRole('heading', { name: 'Evidence & audit' })).toBeVisible()
    expect(screen.getByLabelText('Demo environment disclosure')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Correlation-linked audit trail' })).toBeVisible()
  })

  it('filters the synthetic portfolio without dropping its provenance labels', async () => {
    const user = userEvent.setup()
    renderApp('/portfolio')

    expect(screen.getByRole('heading', { name: 'Portfolio exposure' })).toBeVisible()
    expect(screen.getByText('ABC Textiles')).toBeVisible()
    expect(screen.getByText('Showing 6 of 6 synthetic records')).toBeVisible()

    await user.type(screen.getByRole('searchbox', { name: 'Search portfolio' }), 'Navsari')

    expect(screen.getByText('Coastal Cold Chain')).toBeVisible()
    expect(screen.queryByText('ABC Textiles')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 6 synthetic records')).toBeVisible()
    expect(screen.getAllByLabelText('Data classification: SIMULATED').length).toBeGreaterThan(0)
  })

  it('opens the primary demo borrower with clear decision boundaries', () => {
    renderApp('/portfolio/MC-BOR-001')

    expect(screen.getByRole('heading', { name: 'ABC Textiles' })).toBeVisible()
    expect(screen.getByText('Insurer decision required')).toBeVisible()
    expect(screen.getByText(/It is not an approved claim or payout/i)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Coverage snapshot' })).toBeVisible()
    expect(screen.getByText('Consent record captured')).toBeVisible()
    expect(screen.getByText(/does not make, change, or recommend a lending decision/i)).toBeVisible()
  })

  it.each([
    ['/climate-risk', 'Climate risk', 'No hidden model outputs'],
    ['/policies', 'Policies', 'Evidence-gate register'],
    ['/events-triggers', 'Events & triggers', 'Candidate provenance'],
    ['/reconciliation', 'Reconciliation', 'Insurer and lender records'],
  ])('renders the completed %s route', (path, pageHeading, sectionHeading) => {
    renderApp(path)

    expect(screen.getByRole('heading', { name: pageHeading })).toBeVisible()
    expect(screen.getByRole('heading', { name: sectionHeading })).toBeVisible()
    expect(screen.getByLabelText('Demo environment disclosure')).toBeVisible()
  })

  it('shows an empty state when the engine has produced no evaluation yet', async () => {
    renderApp('/events-triggers')

    expect(await screen.findByText('No evaluation has been run yet')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Replay historical climate event' })).toBeEnabled()
  })

  it('renders a real trigger evaluation and its calculation trace from the backend', async () => {
    stubApi({
      '/api/v1/triggers/eval-1': TRIGGER_DETAIL,
      '/api/v1/triggers': [{ ...TRIGGER_DETAIL }],
    })
    renderApp('/events-triggers')

    expect(await screen.findByRole('heading', { name: 'Insurer review required' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Calculation trace' })).toBeVisible()
    expect(screen.getAllByLabelText('Canonical state: TRIGGER_CANDIDATE').length).toBeGreaterThan(0)
    expect(screen.getByText(/184.0 mm/)).toBeVisible()
    expect(screen.getByText(/has not approved a claim, initiated a payout, or instructed lender posting/i)).toBeVisible()
    expect(screen.getByText(/Compared aggregate against the accepted thresholds/)).toBeVisible()
  })

  it('surfaces a backend failure instead of silently showing nothing', async () => {
    stubApi({
      '/api/v1/triggers': new Response(JSON.stringify({ detail: 'Backend unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    })
    renderApp('/events-triggers')

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend unavailable')
  })

  it('returns the user to sign-in when the stored token is rejected', async () => {
    stubApiFailure(401, 'Could not validate credentials')
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(localStorage.getItem('monsooncover.access_token')).toBeNull()
  })

  it('filters the evidence registry by classification', async () => {
    const user = userEvent.setup()
    renderApp('/evidence-audit')

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter evidence classification' }),
      'REAL',
    )

    expect(screen.getByText('Showing 1 evidence records')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Policy wording reference' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Surat trigger configuration' })).not.toBeInTheDocument()
  })

  it('renders role-scoped navigation for the insurer sandbox', () => {
    renderApp('/insurer-sandbox')

    expect(screen.getByRole('heading', { name: 'Insurer review' })).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'Candidate Review' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Portfolio' })).not.toBeInTheDocument()
  })

  it('tells the insurer when no candidate is awaiting review', async () => {
    stubApi({ '/api/v1/settlement/insurer-requests': [] })
    renderApp('/insurer-sandbox')

    expect(await screen.findByText('No candidate awaiting review')).toBeVisible()
  })

  it('shows the evidence packet and records a decision through the API', async () => {
    const user = userEvent.setup()
    stubApi({
      '/api/v1/settlement/insurer-requests': [INSURER_REQUEST],
      '/api/v1/triggers/eval-1': TRIGGER_DETAIL,
    })
    renderApp('/insurer-sandbox')

    expect(await screen.findByRole('heading', { name: 'Evidence packet' })).toBeVisible()
    expect(screen.getByText(/184.0 mm/)).toBeVisible()

    const submit = screen.getByRole('button', { name: 'Submit sandbox decision' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'APPROVED' }))
    await user.type(
      screen.getByRole('textbox', { name: /Decision reason/i }),
      'Evidence reviewed against the accepted snapshot rule.',
    )
    await user.click(screen.getByRole('checkbox'))
    expect(submit).toBeEnabled()

    stubApi({
      '/api/v1/settlement/insurer-requests': [INSURER_REQUEST],
      '/api/v1/triggers/eval-1': TRIGGER_DETAIL,
      '/decision': {
        id: 'dec-1',
        correlation_id: 'EVENT-MC-2026-00427',
        outcome: 'APPROVED',
        reason: 'Evidence reviewed against the accepted snapshot rule.',
        decided_by: 'insurer@demo.monsooncover.local',
        decided_at_utc: '2026-09-03T12:05:00Z',
        approved_amount: '40000.00',
        currency: 'INR',
      },
    })
    await user.click(submit)

    expect(await screen.findByText('Sandbox decision recorded: APPROVED')).toBeVisible()
  })

  it('surfaces the server refusing a decision from the wrong role', async () => {
    const user = userEvent.setup()
    stubApi({
      '/api/v1/settlement/insurer-requests': [INSURER_REQUEST],
      '/api/v1/triggers/eval-1': TRIGGER_DETAIL,
      '/decision': new Response(
        JSON.stringify({ detail: "Role 'lender' is not permitted to perform this action." }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    })
    renderApp('/insurer-sandbox')

    await screen.findByRole('heading', { name: 'Evidence packet' })
    await user.click(screen.getByRole('button', { name: 'REJECTED' }))
    await user.type(
      screen.getByRole('textbox', { name: /Decision reason/i }),
      'Attempting a decision from a role that may not make one.',
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Submit sandbox decision' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('is not permitted')
  })

  it('shows a computed exposure band with the methodology that produced it', async () => {
    stubApi({
      '/api/v1/borrowers': [
        { id: 'bor-1', name: 'ABC Textiles', sector: 'Textile manufacturing', city: 'Surat', state: 'Gujarat', zone_id: 'SURAT-DEMO-Z1', latitude: null, longitude: null },
      ],
      '/api/v1/risk/assessments': [
        {
          id: 'risk-1',
          borrower_id: 'bor-1',
          zone_id: 'SURAT-DEMO-Z1',
          peril: 'EXTREME_RAINFALL',
          sector: 'Textile manufacturing',
          exposure_band: 'HIGH',
          max_daily_value: '120.0000',
          total_value: '387.9000',
          heavy_day_count: 2,
          observation_count: 14,
          normalized_unit: 'mm',
          methodology_version: 'risk-engine-v1',
          methodology_steps: [
            { step: 'band_applied', description: 'Applied methodology risk-engine-v1: max daily 120.0 >= 100 mm -> HIGH.', value: 'HIGH' },
            { step: 'boundary', description: 'Advisory exposure only. This result does not approve or deny credit.', value: null },
          ],
          dataset_code: 'DS-MC-RAIN-2026-01',
          assessed_at_utc: '2026-09-04T09:00:00Z',
          classification: 'DERIVED',
        },
      ],
      '/api/v1/policies/eligibility': [],
    })
    renderApp('/climate-risk')

    expect(await screen.findByLabelText('Canonical state: HIGH')).toBeVisible()
    expect(screen.getByText(/does not approve or deny credit/)).toBeVisible()
    expect(screen.getByRole('heading', { name: /Methodology · risk-engine-v1/ })).toBeVisible()
  })

  it('shows that eligibility is decided without consulting climate exposure', async () => {
    stubApi({
      '/api/v1/borrowers': [
        { id: 'bor-2', name: 'Far Away Mills', sector: 'Apparel', city: 'Rajkot', state: 'Gujarat', zone_id: 'RAJKOT-DEMO-Z9', latitude: null, longitude: null },
      ],
      '/api/v1/risk/assessments': [
        {
          id: 'risk-2',
          borrower_id: 'bor-2',
          zone_id: 'RAJKOT-DEMO-Z9',
          peril: 'EXTREME_RAINFALL',
          sector: 'Apparel',
          exposure_band: 'HIGH',
          max_daily_value: '120.0000',
          total_value: '120.0000',
          heavy_day_count: 1,
          observation_count: 1,
          normalized_unit: 'mm',
          methodology_version: 'risk-engine-v1',
          methodology_steps: [{ step: 'band_applied', description: 'HIGH.', value: 'HIGH' }],
          dataset_code: 'DS-MC-RAIN-2026-01',
          assessed_at_utc: '2026-09-04T09:00:00Z',
          classification: 'DERIVED',
        },
      ],
      '/api/v1/policies/eligibility': [
        {
          id: 'elig-1',
          borrower_id: 'bor-2',
          policy_version_id: 'pol-1',
          is_eligible: false,
          reasons: [
            { constraint: 'geography', satisfied: false, detail: 'Borrower zone RAJKOT-DEMO-Z9 does not match covered zone SURAT-DEMO-Z1.' },
            { constraint: 'risk_score_excluded', satisfied: true, detail: 'Climate exposure was not consulted. A risk band never creates eligibility (§7.2).' },
          ],
          matching_version: 'policy-matching-v1',
          evaluated_at_utc: '2026-09-04T09:00:00Z',
        },
      ],
    })
    renderApp('/climate-risk')

    // High exposure, yet not eligible - the two engines stay separate.
    expect(await screen.findByLabelText('Canonical state: HIGH')).toBeVisible()
    expect(screen.getByLabelText('Canonical state: NOT_COVERED')).toBeVisible()
    expect(screen.getByText(/A risk band never creates eligibility/)).toBeVisible()
  })

  it('renders reconciliation records returned by the backend', async () => {
    stubApi({
      '/settlement/reconciliations': [
        {
          id: 'rec-1',
          correlation_id: 'EVENT-MC-2026-00427',
          state: 'RECONCILED',
          insurer_amount: '40000.00',
          lender_amount: '40000.00',
          difference_reason: null,
        },
      ],
      '/settlement/decisions': [],
      '/settlement/payouts': [],
      '/settlement/postings': [],
      '/settlement/exceptions': [],
    })
    renderApp('/reconciliation')

    expect(await screen.findByText('1 reconciliation record(s)')).toBeVisible()
    expect(screen.getByLabelText('Canonical state: RECONCILED')).toBeVisible()
    expect(screen.getByText('Records match')).toBeVisible()
  })

  it('shows a reconciliation mismatch as an open exception', async () => {
    stubApi({
      '/settlement/reconciliations': [
        {
          id: 'rec-2',
          correlation_id: 'EVENT-MC-2026-00427',
          state: 'MISMATCH',
          insurer_amount: '40000.00',
          lender_amount: '25000.00',
          difference_reason: 'amount insurer=40000.00 lender=25000.00',
        },
      ],
      '/settlement/decisions': [],
      '/settlement/payouts': [],
      '/settlement/postings': [],
      '/settlement/exceptions': [
        {
          id: 'exc-1',
          correlation_id: 'EVENT-MC-2026-00427',
          case_reference: 'MC-EXC-abc12345',
          entity_type: 'ReconciliationRecord',
          entity_id: 'rec-2',
          summary: 'Insurer and lender records disagree',
          detail: 'amount insurer=40000.00 lender=25000.00',
          state: 'OPEN',
          opened_at_utc: '2026-09-04T09:00:00Z',
        },
      ],
    })
    renderApp('/reconciliation')

    expect(
      await screen.findByRole('heading', { name: 'Insurer and lender records disagree' }),
    ).toBeVisible()
    expect(screen.getByLabelText('Canonical state: MISMATCH')).toBeVisible()
    expect(screen.getAllByText(/insurer=40000.00 lender=25000.00/).length).toBeGreaterThan(0)
  })

  it('renders the real correlation-linked audit trail', async () => {
    stubApi({
      '/api/v1/audit': [
        {
          id: 'aud-1',
          correlation_id: 'EVENT-MC-2026-00427',
          event_type: 'TRIGGER_EVALUATED',
          actor_type: 'user',
          actor_id: 'user-1',
          occurred_at_utc: '2026-09-04T09:00:00Z',
          entity_type: 'TriggerEvaluation',
          entity_id: 'eval-1',
          previous_state: 'CLIMATE_MONITORING',
          new_state: 'TRIGGER_CANDIDATE',
          reason: 'Historical replay produced TRIGGER_CANDIDATE at 184.0 mm.',
          classification: 'DERIVED',
        },
      ],
      '/settlement/exceptions': [],
    })
    renderApp('/evidence-audit')

    expect(await screen.findByText('TRIGGER_EVALUATED')).toBeVisible()
    expect(screen.getByText('CLIMATE_MONITORING → TRIGGER_CANDIDATE')).toBeVisible()
    expect(screen.getAllByText('EVENT-MC-2026-00427').length).toBeGreaterThan(0)
  })

  it.each([
    ['/borrower', 'Borrower experience', 'Your climate cover is active.'],
    ['/admin', 'Platform administration', 'System health & exceptions'],
  ])('renders the %s role experience', (path, roleHeading, pageHeading) => {
    renderApp(path)
    expect(screen.getByRole('heading', { name: roleHeading })).toBeVisible()
    expect(screen.getByRole('heading', { name: pageHeading })).toBeVisible()
    expect(screen.getByLabelText('Demo environment disclosure')).toBeVisible()
  })
})
