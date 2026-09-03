import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type ExposureBar = {
  city: string
  exposureCr: number
  band: 'High' | 'Moderate' | 'Low'
}

const bandColor: Record<ExposureBar['band'], string> = {
  High: '#e4a23a',
  Moderate: '#58d5e8',
  Low: '#62b8a5',
}

function ExposureTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ExposureBar }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-white/12 bg-panel px-3 py-2 text-xs shadow-lg shadow-black/40">
      <p className="font-semibold text-slate-200">{point.city}</p>
      <p className="mt-1 text-slate-400">
        ₹{point.exposureCr.toFixed(2)}Cr illustrative exposure · {point.band} band
      </p>
    </div>
  )
}

export function ExposureBarChart({ data }: { data: ExposureBar[] }) {
  return (
    <div aria-hidden="true" className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            unit="Cr"
          />
          <YAxis
            type="category"
            dataKey="city"
            width={80}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ExposureTooltip />} />
          <Bar dataKey="exposureCr" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={entry.city} fill={bandColor[entry.band]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
