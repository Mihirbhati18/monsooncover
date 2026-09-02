import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

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
    ['/events-triggers', 'Events & triggers', 'Calculation trace'],
    ['/reconciliation', 'Reconciliation', 'Insurer and lender records'],
  ])('renders the completed %s route', (path, pageHeading, sectionHeading) => {
    renderApp(path)

    expect(screen.getByRole('heading', { name: pageHeading })).toBeVisible()
    expect(screen.getByRole('heading', { name: sectionHeading })).toBeVisible()
    expect(screen.getByLabelText('Demo environment disclosure')).toBeVisible()
  })

  it('keeps trigger candidate, insurer decision, and downstream actions distinct', () => {
    renderApp('/events-triggers')

    expect(screen.getAllByLabelText('Canonical state: TRIGGER_CANDIDATE').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Canonical state: PENDING')).toBeVisible()
    expect(screen.getByText(/has not approved a claim, initiated a payout, or instructed lender posting/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
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
    expect(screen.getByRole('heading', { name: 'Record decision' })).toBeVisible()
  })

  it('requires a reason and confirmation before a sandbox insurer decision', async () => {
    const user = userEvent.setup()
    renderApp('/insurer-sandbox')

    const submit = screen.getByRole('button', { name: 'Submit sandbox decision' })
    expect(submit).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'APPROVED' }))
    await user.type(screen.getByRole('textbox', { name: /Decision reason/i }), 'Evidence reviewed in sandbox')
    await user.click(screen.getByRole('checkbox'))
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(screen.getByText('Sandbox decision recorded: APPROVED')).toBeVisible()
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
