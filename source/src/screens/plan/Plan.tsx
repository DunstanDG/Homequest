import { Link, useSearchParams } from 'react-router-dom'
import { useFamily, useMe } from '@/app/context'
import { startOfWeek, weekday, ymdOf } from '@/family/dates'
import { Icon } from '@/ui/icons'
import { SyncDot } from '@/ui/ux'
import { Dump } from './Dump'
import { Meals } from './Meals'
import { Projects } from './Projects'
import { Sessions } from './Sessions'
import { Shopping } from './Shopping'

type Tab = 'sessions' | 'projects' | 'dump' | 'meals' | 'shop'
const TABS: Tab[] = ['sessions', 'projects', 'dump', 'meals', 'shop']

const remembered = (): Tab => {
  try {
    const t = localStorage.getItem('hq.plan.tab') as Tab | null
    if (t && TABS.includes(t)) return t
  } catch {
    /* fine */
  }
  return 'sessions'
}

/** Plan: sessions to work through, projects (big goals broken into steps), a brain dump for things to sort out later, the week's meals, and the shopping list. */
export function Plan() {
  const f = useFamily()
  const me = useMe()!
  const [params, setParams] = useSearchParams()
  const asked = params.get('t') as Tab | null
  const tab: Tab = asked && TABS.includes(asked) ? asked : remembered()
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
            <Link to="/summit" className={`btn small${summitNudge ? ' primary' : ' ghost'} summit-label`} aria-label={summitDone ? 'Weekly summit (done this week)' : 'Weekly summit: plan the week ahead'}>
              <Icon name="compass" size={16} /> {summitDone ? 'Week planned' : 'Plan the week'}
            </Link>
          )}
          <SyncDot />
        </div>
      </header>
      <nav className="plan-tabs" aria-label="Plan sections">
        {group('Do', [
          { id: 'sessions', label: 'Clean-ups' },
          { id: 'projects', label: 'Projects' },
          { id: 'dump', label: 'Brain dump' },
        ])}
        {group('Home', [
          { id: 'meals', label: 'Meals' },
          { id: 'shop', label: 'Shopping' },
        ])}
      </nav>
      <div className="plan-body">
        {tab === 'sessions' && <Sessions />}
        {tab === 'projects' && <Projects />}
        {tab === 'dump' && <Dump />}
        {tab === 'meals' && <Meals />}
        {tab === 'shop' && <Shopping />}
      </div>
    </div>
  )
}
