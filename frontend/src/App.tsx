import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { AdminPage } from './routes/AdminPage'
import { BorrowerDetailPage } from './routes/BorrowerDetailPage'
import { BorrowerExperiencePage } from './routes/BorrowerExperiencePage'
import { ClimateRiskPage } from './routes/ClimateRiskPage'
import { EvidenceAuditPage } from './routes/EvidenceAuditPage'
import { EventsTriggersPage } from './routes/EventsTriggersPage'
import { InsurerSandboxPage } from './routes/InsurerSandboxPage'
import { OverviewPage } from './routes/OverviewPage'
import { PoliciesPage } from './routes/PoliciesPage'
import { PortfolioPage } from './routes/PortfolioPage'
import { ReconciliationPage } from './routes/ReconciliationPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="portfolio/:borrowerId" element={<BorrowerDetailPage />} />
        <Route path="climate-risk" element={<ClimateRiskPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="events-triggers" element={<EventsTriggersPage />} />
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="evidence-audit" element={<EvidenceAuditPage />} />
        <Route path="insurer-sandbox" element={<InsurerSandboxPage />} />
        <Route path="borrower" element={<BorrowerExperiencePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
