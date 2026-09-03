import type { HTMLAttributes, ReactNode } from 'react'

export type GlassTint = 'cyan' | 'amber' | 'teal' | 'danger' | 'neutral'

type GlassSurfaceProps = {
  tint?: GlassTint
  as?: 'div' | 'article' | 'section'
  children: ReactNode
} & HTMLAttributes<HTMLElement>

// Original MonsoonCover treatment of the edge/rim/tint model described in
// docs/FRONTEND_PLAN.md §2.3. CSS and an opaque navy fallback only — no WebGL,
// no page capture, and no code taken from the reference repository.
export function GlassSurface({
  tint = 'cyan',
  as: Element = 'div',
  className = '',
  children,
  ...rest
}: GlassSurfaceProps) {
  return (
    <Element className={`glass-surface glass-surface--${tint} ${className}`.trim()} {...rest}>
      {children}
    </Element>
  )
}
