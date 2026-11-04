import { useMemo, useState } from 'react'
import { useFamily, useLearnerOf, ViewLearnerProvider } from '@/app/context'
import { addDays, dayRange, ymdOf } from '@/family/dates'
import { Avatar, MemberChips } from '@/ui/fam'
import { Coins } from '@/ui/fam'
import { useBalance } from '@/screens/family/shared'
import { SubjectPicker, useSubject } from '../SubjectPicker'
import { Goals } from './Goals'
import { Inbox } from './Inbox'
import { Overview } from './Overview'
import { Topics } from './Topics'
import { Writing } from './Writing'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'topics', label: 'Topics' },
  { id: 'writing', label: 'Writing' },
  { id: 'inbox', label: 'Reports' },
  { id: 'rewards', label: 'Goals' },
] as const
type Tab = (typeof TABS)[number]['id']

/** A child's StudyQuest progress plus how they are getting on with homework and jobs. */
export function Progress() {
  const f = useFamily()
  const kids = Object.values(f.members).filter((m) => m.active && (m.role === 'child'))
  const [sel, setSel] = useState<string | undefined>(kids[0]?.id)
  const [tab, setTab] = useState<Tab>('overview')
  const subject = useSubject()
  const learner = useLearnerOf(sel)
  const bal = useBalance(sel)
  const member = sel ? f.members[sel] : undefined

  const stats = useMemo(() => {
    if (!sel) return undefined
    const today = ymdOf(Date.now())
    const from = addDays(today, -6)
    const days = dayRange(from, today)
    let done = 0
    let minutes = 0
    let homework = 0
    for (const d of Object.values(f.done)) {
      const t = f.tasks[d.taskId]
      if ((t?.assignee ?? d.by) !== sel || d.status === 'rejected') continue
      if (ymdOf(d.ts) < from) continue
      done++
      minutes += d.minutes ?? 0
      if (t?.kind === 'homework') homework++
    }
    const xp = days.reduce((s, d) => s + (learner?.xpByDay[d] ?? 0), 0)
    const late = Object.values(f.tasks).filter((t) => t.assignee === sel && !t.deleted && !t.dropped && t.kind === 'homework' && t.date && t.date < today && !f.done[`${t.taskId}|${t.date}`]).length
    return { done, minutes, homework, xp, late }
  }, [f, sel, learner])

  if (!kids.length) return <p className="note">Add a child under Family to follow their progress.</p>
  return (
    <div className="parent-pane">
      {kids.length > 1 && <MemberChips members={kids} value={sel ? [sel] : []} onChange={(v) => setSel(v[0])} />}
      {member && stats && (
        <section className="card kid-summary">
          <div className="ap-top">
            <Avatar m={member} size={40} />
            <div className="grow">
              <strong>{member.name}</strong>
              <p className="muted small">Last 7 days</p>
            </div>
            <Coins n={bal?.available ?? 0} />
          </div>
          <ul className="today-totals">
            <li>
              <strong>{stats.xp}</strong>
              <small>StudyQuest XP</small>
            </li>
            <li>
              <strong>{stats.done}</strong>
              <small>tasks done</small>
            </li>
            <li>
              <strong>{stats.minutes}</strong>
              <small>focus min</small>
            </li>
            <li className={stats.late ? 'warn' : ''}>
              <strong>{stats.late}</strong>
              <small>homework late</small>
            </li>
          </ul>
        </section>
      )}
      <nav className="tabs sub" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? ' selected' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      {(tab === 'overview' || tab === 'topics') && <SubjectPicker />}
      <ViewLearnerProvider value={sel}>
        {tab === 'overview' && <Overview subject={subject} />}
        {tab === 'topics' && <Topics subject={subject} />}
        {tab === 'writing' && sel && <Writing learnerId={sel} />}
        {tab === 'inbox' && <Inbox />}
        {tab === 'rewards' && <Goals />}
      </ViewLearnerProvider>
    </div>
  )
}
