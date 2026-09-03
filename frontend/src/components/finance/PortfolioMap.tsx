import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ClimateRiskBand, PortfolioBorrower } from '../../features/portfolio/demoPortfolio'
import { DataClassificationBadge } from '../data-integrity/Badges'

const riskMarkerColor: Record<ClimateRiskBand, string> = {
  HIGH: '#e4a23a',
  MODERATE: '#58d5e8',
  LOW: '#62b8a5',
}

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// react-leaflet's MapContainer needs a real layout engine (ResizeObserver, measured
// bounds) that jsdom does not provide. Component tests get a static equivalent instead.
const isTestEnvironment = navigator.userAgent.includes('jsdom')

export function PortfolioMap({ borrowers }: { borrowers: PortfolioBorrower[] }) {
  if (isTestEnvironment) {
    return (
      <div className="mc-map-fallback rounded-xl border border-white/7 bg-deep/65 p-4">
        <p className="text-xs text-slate-500">Map preview unavailable in this environment.</p>
        <ul className="mt-2 space-y-1">
          {borrowers.map((borrower) => (
            <li key={borrower.id} className="text-xs text-slate-400">
              {borrower.name} · {borrower.city}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const center: [number, number] = [22.4, 72.1]

  return (
    <div className="mc-map-shell overflow-hidden rounded-xl border border-white/7">
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={false}
        className="mc-leaflet"
        style={{ height: '22rem', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {borrowers.map((borrower) => (
          <CircleMarker
            key={borrower.id}
            center={[borrower.latitude, borrower.longitude]}
            radius={9}
            pathOptions={{
              color: riskMarkerColor[borrower.riskBand],
              fillColor: riskMarkerColor[borrower.riskBand],
              fillOpacity: 0.55,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="mc-map-popup">
                <p className="mc-map-popup__title">{borrower.name}</p>
                <p className="mc-map-popup__meta">
                  {borrower.city}, {borrower.state} · {borrower.sector}
                </p>
                <p className="mc-map-popup__meta">
                  Outstanding: {formatInr.format(borrower.outstandingInr)}
                </p>
                <p className="mc-map-popup__meta">
                  Exposure band: {borrower.riskBand} · {borrower.primaryPeril}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/7 bg-deep/70 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(riskMarkerColor) as ClimateRiskBand[]).map((band) => (
            <span key={band} className="flex items-center gap-1.5 text-[0.65rem] text-slate-400">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: riskMarkerColor[band] }}
              />
              {band}
            </span>
          ))}
        </div>
        <DataClassificationBadge classification="SIMULATED" />
      </div>
    </div>
  )
}
