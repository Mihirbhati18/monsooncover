export function DemoEnvironmentBanner() {
  return (
    <div
      role="status"
      aria-label="Demo environment disclosure"
      className="border-b border-amber/25 bg-amber/10 px-4 py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-amber sm:text-xs"
    >
      DEMO ENVIRONMENT — synthetic borrower/loan and sandbox partner systems; no real
      insurance or financial transactions.
    </div>
  )
}
