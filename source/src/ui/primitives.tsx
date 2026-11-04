import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'

/** Bottom sheet used for the feedback form, skill details and parent dialogs.
 *
 * Rendered via a portal straight onto `document.body`, NOT in place in the component tree. `.sheet-wrap` is
 * `position: fixed` with a z-index above the tab bar, which should be enough on its own - but `.app-body`
 * (its ordinary DOM ancestor here, since every screen that opens a Sheet lives inside it) sets
 * `-webkit-overflow-scrolling: touch` for momentum scrolling, and that specific property is a long-known
 * WebKit quirk: contrary to spec, it makes the element create its own compositing/stacking layer. That traps
 * any `position: fixed` descendant inside `.app-body`'s own stacking context - no z-index on the sheet can
 * then put it above the tab bar, which sits outside that trap as `.app-body`'s sibling. A portal sidesteps
 * the whole question by physically moving the sheet's DOM node out of `.app-body` to be a sibling of `#root`
 * instead, so there is no trapping ancestor left for it to be stuck behind. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grab" />
        <div className="sheet-head">
          {title && <h2>{title}</h2>}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Circular progress ring with optional centre content. value is 0..1. */
export function Ring({ value, size = 64, stroke = 7, children, tone = 'accent' }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: 'accent' | 'xp' | 'good' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className={`ring tone-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-val"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

export function Bar({ value, tone = 'accent', label }: { value: number; tone?: 'accent' | 'xp' | 'good' | 'warn' | 'bad'; label?: string }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className={`bar tone-${tone}`} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="bar-fill" style={{ width: `${v * 100}%` }} />
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent' | 'xp' }) {
  return <span className={`pill tone-${tone}`}>{children}</span>
}

export function EmptyState({ icon, title, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} size={36} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  )
}

/** Small haptic tick on phones that support it. */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}
