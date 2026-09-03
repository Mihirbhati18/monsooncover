import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { ExposureBarChart } from './ExposureBarChart'
import type { PortfolioMap } from './PortfolioMap'

// Leaflet and Recharts are the two heaviest dependencies in the bundle and are
// used on two routes only, so they are split out per docs/FRONTEND_PLAN.md §10.
const PortfolioMapImpl = lazy(() =>
  import('./PortfolioMap').then((module) => ({ default: module.PortfolioMap })),
)

const ExposureBarChartImpl = lazy(() =>
  import('./ExposureBarChart').then((module) => ({ default: module.ExposureBarChart })),
)

function VisualSkeleton({ label, className }: { label: string; className: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`animate-pulse rounded-xl border border-white/7 bg-deep/65 ${className}`}
    />
  )
}

export function LazyPortfolioMap(props: ComponentProps<typeof PortfolioMap>) {
  return (
    <Suspense fallback={<VisualSkeleton label="Loading borrower map" className="h-88" />}>
      <PortfolioMapImpl {...props} />
    </Suspense>
  )
}

export function LazyExposureBarChart(props: ComponentProps<typeof ExposureBarChart>) {
  return (
    <Suspense fallback={<VisualSkeleton label="Loading exposure chart" className="h-56" />}>
      <ExposureBarChartImpl {...props} />
    </Suspense>
  )
}
