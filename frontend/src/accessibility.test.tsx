import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { PortfolioMap } from './components/finance/PortfolioMap'
import { demoPortfolio } from './features/portfolio/demoPortfolio'
import { signInForTests, stubApi } from './test/apiStub'
import { GlassSurface } from './visuals/glass/GlassSurface'

beforeEach(() => {
  signInForTests()
  stubApi({
    '/api/v1/triggers': [],
    '/api/v1/borrowers': [],
    '/api/v1/loans': [],
    '/api/v1/risk/assessments': [],
    '/api/v1/policies/eligibility': [],
    '/api/v1/policies/versions': [],
    '/api/v1/policies/snapshots': [],
    '/api/v1/climate/datasets': [],
    '/api/v1/evidence/activation-gate': { product_code: 'X', can_activate: true, summary: 'ok', satisfied_fields: [], blocking_errors: [] },
    '/api/v1/evidence': [],
    '/settlement/exceptions': [],
    '/api/v1/audit': [],
  })
})

const allRoutes = [
  '/',
  '/portfolio',
  '/portfolio/MC-BOR-001',
  '/climate-risk',
  '/policies',
  '/events-triggers',
  '/reconciliation',
  '/evidence-audit',
  '/insurer-sandbox',
  '/borrower',
  '/admin',
]

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('accessibility contract', () => {
  it.each(allRoutes)('exposes one main landmark and one h1 on %s', (path) => {
    renderApp(path)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('offers a skip link that targets the main landmark', () => {
    renderApp('/')

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it.each(allRoutes)('keeps the demo disclosure announced on %s', (path) => {
    renderApp(path)

    expect(screen.getByRole('status', { name: 'Demo environment disclosure' })).toBeVisible()
  })

  it('gives every portfolio filter control an accessible name', () => {
    renderApp('/portfolio')

    expect(screen.getByRole('searchbox', { name: 'Search portfolio' })).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Switch demo role' })).toBeVisible()
  })

  it('hides the decorative weather canvas from assistive technology', () => {
    const { container } = renderApp('/')

    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('role boundaries', () => {
  it('keeps lender operational navigation out of the borrower experience', () => {
    renderApp('/borrower')

    expect(screen.queryByRole('link', { name: 'Portfolio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reconciliation' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'My Cover' }).length).toBeGreaterThan(0)
  })

  it('gives the borrower no insurer decision controls', () => {
    renderApp('/borrower')

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Submit sandbox decision' }),
    ).not.toBeInTheDocument()
  })

  it('keeps lender navigation out of the administration workspace', () => {
    renderApp('/admin')

    expect(screen.queryByRole('link', { name: 'Portfolio' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Platform Health' }).length).toBeGreaterThan(0)
  })
})

describe('GlassSurface', () => {
  it('renders a div tinted cyan by default', () => {
    const { container } = render(<GlassSurface>panel</GlassSurface>)
    const element = container.firstElementChild

    expect(element?.tagName).toBe('DIV')
    expect(element).toHaveClass('glass-surface', 'glass-surface--cyan')
  })

  it('preserves semantic elements and applies the requested tint', () => {
    render(
      <GlassSurface as="section" tint="danger" aria-label="exception">
        alert
      </GlassSurface>,
    )

    const element = screen.getByRole('region', { name: 'exception' })
    expect(element.tagName).toBe('SECTION')
    expect(element).toHaveClass('glass-surface--danger')
  })
})

describe('PortfolioMap fallback', () => {
  it('lists borrowers statically when the map cannot mount', () => {
    const { container } = render(<PortfolioMap borrowers={demoPortfolio} />)

    expect(container.querySelector('.leaflet-container')).toBeNull()

    const fallback = container.querySelector('.mc-map-fallback')
    expect(fallback).not.toBeNull()
    for (const borrower of demoPortfolio) {
      expect(within(fallback as HTMLElement).getByText(new RegExp(borrower.name))).toBeVisible()
    }
  })
})
