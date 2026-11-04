import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, useFamily, useMe } from '@/app/context'
import { Icon, type IconName } from '@/ui/icons'
import { useKeepSelectedInView } from '../SubjectPicker'
import { Approvals } from './Approvals'
import { Data } from './Data'
import { Family } from './Family'
import { Gate } from './Gate'
import { Progress } from './Progress'

const TABS: readonly { id: string; label: string; icon: IconName }[] = [
  { id: 'approvals', label: 'To do', icon: 'checklist' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'family', label: 'Family', icon: 'users' },
  { id: 'data', label: 'Data', icon: 'cloud' },
]
type Tab = 'approvals' | 'progress' | 'family' | 'data'

export function Parent() {
  const { parentUnlocked, lockParent, settings } = useApp()
  const f = useFamily()
  const me = useMe()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const trusted = !!settings.trustDevice && me?.role === 'parent'
  const [open, setOpen] = useState(parentUnlocked() || trusted)
  const asked = params.get('tab')
  const tab: Tab = TABS.some((t) => t.id === asked) ? (asked as Tab) : 'approvals'
  const tabsRef = useKeepSelectedInView<HTMLElement>(tab)
  // ?s=<section> (from the More hub) scrolls straight to that card once the tab has rendered.
  const section = params.get('s')
  useEffect(() => {
    if (!open || !section) return
    const t = setTimeout(() => document.getElementById(`sec-${section}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [open, tab, section])
  const waiting = Object.values(f.done).filter((d) => d.status === 'pending').length + Object.values(f.redeems).filter((r) => r.status === 'pending').length

  if (!open) {
    return (
      <div className="screen">
        <button type="button" className="icon-btn back" onClick={() => nav(-1)} aria-label="Back">
          <Icon name="back" />
        </button>
        <Gate onOpen={() => setOpen(true)} />
      </div>
    )
  }

  return (
    <div className="screen parent">
      <header className="parent-head">
        <div>
          <p className="eyebrow">Parent area</p>
          <h1>{f.name || 'Family'}</h1>
        </div>
        <div className="head-actions">
          <button type="button" className="btn ghost small" aria-label="Done" onClick={() => nav('/')}>
            <Icon name="home" size={16} /> <span className="ptab-hide-narrow">Done</span>
          </button>
          {!trusted && (
            <button
              type="button"
              className="btn ghost small"
              aria-label="Lock"
              onClick={() => {
                lockParent()
                nav('/')
              }}
            >
              <Icon name="lock" size={16} /> <span className="ptab-hide-narrow">Lock</span>
            </button>
          )}
        </div>
      </header>
      {/* Equal-width tabs that fit a 360px phone; if more tabs are ever added the row scrolls sideways (never the
          page) and keeps the selected one in view. ?tab= links (approvals, progress, family, data) are unchanged. */}
      <nav ref={tabsRef} className="ptabs" role="tablist" aria-label="Parent area">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`ptab${tab === t.id ? ' selected' : ''}`} onClick={() => setParams({ tab: t.id }, { replace: true })}>
            <span className="ptab-ic">
              <Icon name={t.icon} size={18} />
              {t.id === 'approvals' && waiting > 0 && (
                <span className="ptab-count">
                  {waiting > 99 ? '99+' : waiting}
                  <span className="lq-sr"> waiting</span>
                </span>
              )}
            </span>
            <span className="ptab-label">{t.label}</span>
          </button>
        ))}
      </nav>
      {tab === 'approvals' && <Approvals />}
      {tab === 'progress' && <Progress />}
      {tab === 'family' && <Family />}
      {tab === 'data' && <Data />}
    </div>
  )
}
