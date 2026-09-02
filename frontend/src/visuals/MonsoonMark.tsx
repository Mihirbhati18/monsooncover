type MonsoonMarkProps = {
  compact?: boolean
}

export function MonsoonMark({ compact = false }: MonsoonMarkProps) {
  return (
    <div className={compact ? 'monsoon-mark monsoon-mark--compact' : 'monsoon-mark'} aria-hidden="true">
      <div className="monsoon-mark__halo" />
      <div className="monsoon-mark__orb">
        <div className="monsoon-mark__flow monsoon-mark__flow--one" />
        <div className="monsoon-mark__flow monsoon-mark__flow--two" />
        <div className="monsoon-mark__shine" />
      </div>
      {!compact && (
        <div className="monsoon-mark__label">
          <span>MONSOON</span>
          <span>INTELLIGENCE</span>
        </div>
      )}
    </div>
  )
}
