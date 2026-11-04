/**
 * Small shared bits from the UX tidy-up: help text that shows once and then hides behind an ⓘ, and the sync dot
 * that sits in screen headers.
 */
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSyncStatus } from '@/app/context'
import { Icon } from './icons'

const seenKey = (id: string) => `hq.help.${id}`
const readSeen = (id: string) => {
  try {
    return localStorage.getItem(seenKey(id)) === '1'
  } catch {
    return false
  }
}

/** Explanatory text shown in full the first time, with "Got it". After that it folds away behind an ⓘ button
 * (per phone, so each person sees it once). */
export function HelpOnce({ id, children }: { id: string; children: ReactNode }) {
  const [seen, setSeen] = useState(() => readSeen(id))
  const [open, setOpen] = useState(false)
  if (!seen || open)
    return (
      <div className="help-once">
        <Icon name="info" size={16} />
        <div className="grow">{children}</div>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setOpen(false)
            setSeen(true)
            try {
              localStorage.setItem(seenKey(id), '1')
            } catch {
              /* private mode: shows again next time */
            }
          }}
        >
          {seen ? 'Hide' : 'Got it'}
        </button>
      </div>
    )
  return (
    <button type="button" className="help-i" aria-label="What is this?" onClick={() => setOpen(true)}>
      <Icon name="info" size={16} />
    </button>
  )
}

/** A small cloud in the header: hidden when sync isn't set up, amber while syncing, red on an error. */
export function SyncDot() {
  const sync = useSyncStatus()
  if (sync.status === 'off') return null
  const label = sync.status === 'error' ? 'Sync problem: open Data to check' : sync.status === 'syncing' ? 'Syncing…' : 'Synced'
  return (
    <Link to="/parent?tab=data" className={`icon-btn sync-dot s-${sync.status}`} aria-label={label} title={label}>
      <Icon name="cloud" size={20} />
      <i />
    </Link>
  )
}

/** A section heading whose explanation is shown once (HelpOnce) and then folds into an ⓘ beside the title. */
export function HelpHead({ title, helpId, help, action, as = 'section' }: { title: ReactNode; helpId: string; help: ReactNode; action?: ReactNode; as?: 'section' | 'day' }) {
  return (
    <div className={`sec-head help-head${as === 'day' ? ' day' : ''}`}>
      <div className="sec-help">
        <h2 className={`section${as === 'day' ? ' day-title' : ''}`}>{title}</h2>
        <HelpOnce id={helpId}>{help}</HelpOnce>
      </div>
      {action}
    </div>
  )
}
