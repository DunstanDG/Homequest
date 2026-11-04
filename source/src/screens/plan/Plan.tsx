import { Link, useSearchParams } from 'react-router-dom'
import { useFamily, useMe } from '@/app/context'
import { startOfWeek, weekday, ymdOf } from '@/family/dates'
import { Icon } from '@/ui/icons'
import { SyncDot } from '@/ui/ux'
import { Dump } from './Dump'
import { Meals } from './Meals'
import { Projects } from './Projects'
import { Routines } from './Routines'
import { Shopping } from './Shopping'

type Tab = 'routines' | 'projects' | 'dump' | 'meals' | 'shop'
const TABS: Tab[] = ['routines', 'projects', 'dump', 'meals', 'shop']

/** Old links and remembered tabs said 'sessions'; that is Routines now. */
const tabOf = (t: string | null): Tab | undefined => (t === 'sessions' ? 'routines' : t && (TABS as string[]).includes(t) ? (t as Tab) : undefined)

const remembered = (): Tab => {
  try {
    return tabOf(localStorage.getItem('hq.plan.tab')) ?? 'routines'
  } catch {
    return 'routines'
  }
}

/** Plan: routines (with clean-ups and focus sessions), projects (big goals broken into steps), a brain dump for things to sort out later, the week's meals, and the shopping list. Always in that order. */
export function Plan() {
  const f = useFamily()
  const me = useMe()!
  const [params, setParams] = useSearchParams()
  const tab: Tab = tabOf(params.get('t')) ?? remembered()
  const weekStart = startOfWeek(ymdOf(Date.now()))
  const summitDone = !!f.summits[weekStart]
  // Same rule as Today's "Needs you": nudge from Friday, when the week ahead is worth planning.
  const summitNudge = !summitDone && weekday(ymdOf(Date.now())) >= 4
  const go = (t: Tab) => {
    try {
      localStorage.setItem('hq.plan.tab', t)
    } catch {
      /* fine */
    }
    setParams({ t }, { replace: true })
    document.querySelector('.app-body')?.scrollTo({ top: 0 })
  }
  const group = (title: string, ids: { id: Tab; label: string }[]) => (
    <div className="plan-group" role="group" aria-label={title}>
      <small>{title}</small>
      <div className="chips">
        {ids.map((o) => (
          <button key={o.id} type="button" className={`chip${tab === o.id ? ' selected' : ''}`} aria-pressed={tab === o.id} onClick={() => go(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="screen plan">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">Plan</p>
          <h1>Get things done</h1>
        </div>
        <div className="head-actions">
          <Link to="/plan/new-thing" className="btn small ghost" aria-label="Plan a thing: break an event into small steps">
            <Icon name="plus" size={16} /> Plan a thing
          </Link>
          {me.role === 'parent' && (
            <Link to="/week" className={`btn small${summitNudge ? ' primary' : ' ghost'} summit-label`} aria-label={summitDone ? 'Weekly plan (done this week)' : 'Weekly plan: plan the week ahead'}>
              <Icon name="compass" size={16} /> {summitDone ? 'Week planned' : 'Plan the week'}
            </Link>
          )}
          <SyncDot />
        </div>
      </header>
      <nav className="plan-tabs" aria-label="Plan sections">
        {group('Do', [
          { id: 'routines', label: 'Routines' },
          { id: 'projects', label: 'Projects' },
          { id: 'dump', label: 'Brain dump' },
        ])}
        {group('Home', [
          { id: 'meals', label: 'Meals' },
          { id: 'shop', label: 'Shopping' },
        ])}
      </nav>
      <div className="plan-body">
        {tab === 'routines' && <Routines />}
        {tab === 'projects' && <Projects />}
        {tab === 'dump' && <Dump />}
        {tab === 'meals' && <Meals />}
        {tab === 'shop' && <Shopping />}
      </div>
    </div>
  )
}
