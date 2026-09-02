import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { DemoEnvironmentBanner } from '../components/foundation/DemoEnvironmentBanner'
import { RoleHeader, type WorkspaceRole } from '../components/foundation/RoleHeader'
import { MonsoonMark } from '../visuals/MonsoonMark'

const lenderNavigation = [
  { label: 'Overview', path: '/', marker: '01' }, { label: 'Portfolio', path: '/portfolio', marker: '02' },
  { label: 'Climate Risk', path: '/climate-risk', marker: '03' }, { label: 'Policies', path: '/policies', marker: '04' },
  { label: 'Events & Triggers', path: '/events-triggers', marker: '05' }, { label: 'Reconciliation', path: '/reconciliation', marker: '06' },
  { label: 'Evidence & Audit', path: '/evidence-audit', marker: '07' },
]
const roleNavigation: Record<WorkspaceRole, typeof lenderNavigation> = {
  lender: lenderNavigation,
  insurer: [{ label: 'Candidate Review', path: '/insurer-sandbox', marker: 'IR' }],
  borrower: [{ label: 'My Cover', path: '/borrower', marker: 'BC' }],
  admin: [{ label: 'Platform Health', path: '/admin', marker: 'AD' }],
}
function getRole(pathname: string): WorkspaceRole {
  if (pathname.startsWith('/insurer-sandbox')) return 'insurer'
  if (pathname.startsWith('/borrower')) return 'borrower'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'lender'
}
function NavigationLinks({ role, mobile = false }: { role: WorkspaceRole; mobile?: boolean }) {
  return <nav aria-label={mobile ? `${role} mobile navigation` : `${role} navigation`} className={mobile ? 'flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden' : 'flex flex-1 flex-col gap-1.5 px-3'}>{roleNavigation[role].map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/' || role !== 'lender'} className={({ isActive }) => ['group flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'border-monsoon/35 bg-monsoon/12 text-white' : 'border-transparent text-slate-400 hover:border-white/8 hover:bg-white/4 hover:text-slate-100'].join(' ')}><span aria-hidden="true" className="font-mono text-[0.65rem] tracking-widest text-slate-600">{item.marker}</span>{item.label}</NavLink>)}</nav>
}
export function AppShell() {
  const role = getRole(useLocation().pathname)
  return <div className="app-atmosphere min-h-screen bg-deep text-slate-100"><a href="#main-content" className="sr-only z-50 rounded-md bg-cyan px-4 py-2 font-semibold text-deep focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a><DemoEnvironmentBanner /><div className="mx-auto grid min-h-[calc(100vh-44px)] max-w-[1680px] lg:grid-cols-[248px_minmax(0,1fr)]"><aside className="sidebar-shell hidden border-r border-white/7 lg:flex lg:flex-col"><div className="px-6 pb-6 pt-7"><div className="flex items-center gap-3"><MonsoonMark compact /><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan">MonsoonCover</p><p className="mt-0.5 text-xs text-slate-500">Climate-risk infrastructure</p></div></div></div><NavigationLinks role={role} /><div className="m-4 rounded-xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur-xl"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Current scope</p><p className="mt-2 text-sm font-medium capitalize text-slate-200">{role} sandbox</p><p className="mt-1.5 text-xs leading-5 text-slate-500">Role-specific demo controls only. No live systems or transactions.</p></div></aside><div className="min-w-0"><RoleHeader role={role} /><NavigationLinks role={role} mobile /><main id="main-content" className="px-4 pb-12 pt-5 sm:px-6 lg:px-10 lg:pt-8"><Outlet /></main></div></div></div>
}
