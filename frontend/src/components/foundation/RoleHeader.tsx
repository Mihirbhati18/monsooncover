import { useNavigate } from 'react-router-dom'

export type WorkspaceRole = 'lender' | 'insurer' | 'borrower' | 'admin'

const roleConfig: Record<WorkspaceRole, { label: string; context: string; initials: string }> = {
  lender: { label: 'Lender operations', context: 'Sandbox lender workspace', initials: 'LO' },
  insurer: { label: 'Insurer review', context: 'Independent insurer sandbox', initials: 'IR' },
  borrower: { label: 'Borrower experience', context: 'Synthetic borrower view', initials: 'AB' },
  admin: { label: 'Platform administration', context: 'Demo operations control', initials: 'PA' },
}

const roleDestinations: Record<WorkspaceRole, string> = {
  lender: '/', insurer: '/insurer-sandbox', borrower: '/borrower', admin: '/admin',
}

export function RoleHeader({ role }: { role: WorkspaceRole }) {
  const navigate = useNavigate()
  const current = roleConfig[role]
  return (
    <header className="role-header flex min-h-20 items-center justify-between gap-4 border-b border-white/7 px-4 py-4 sm:px-6 lg:px-10">
      <div className="min-w-0"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Operational workspace</p><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"><h1 className="truncate text-base font-semibold text-white">{current.label}</h1><span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">Sandbox role</span></div></div>
      <div className="flex items-center gap-3">
        <label className="hidden sm:block"><span className="sr-only">Switch demo role</span><select aria-label="Switch demo role" value={role} onChange={(event) => navigate(roleDestinations[event.target.value as WorkspaceRole])} className="h-9 rounded-lg border border-white/10 bg-deep/70 px-3 text-xs font-medium text-slate-300 outline-none focus:border-cyan/60"><option value="lender">Lender operations</option><option value="insurer">Insurer sandbox</option><option value="borrower">Borrower view</option><option value="admin">Administration</option></select></label>
        <div className="hidden text-right lg:block"><p className="text-xs font-medium text-slate-300">{current.context}</p><p className="mt-1 text-[0.68rem] text-slate-500">No partner connection</p></div>
        <div aria-label={`${current.label} demo profile`} className="grid size-9 place-items-center rounded-full border border-white/10 bg-panel text-xs font-bold text-cyan">{current.initials}</div>
      </div>
    </header>
  )
}
