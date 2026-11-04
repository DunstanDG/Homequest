/** The weekly summit: a short guided walk-through rather than a new place to manage things — each step reads from the
 * screens that already own that data (calendar, brain dump, meals, Together) and links straight there. */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe } from '@/app/context'
import { makeCalCtx, itemsBetween } from '@/family/calendar'
import { addDays, dayName, startOfWeek, weekday, ymdOf } from '@/family/dates'
import { bornBabies } from '@/family/arrival/arrival'
import { shiftPlanFor } from '@/family/shifts'
import { ShiftCard } from './careShifts'
import { HomeworkSummitStep } from './homeworkCards'
import { dumpList } from '@/family/dump'
import { mealAt, weekDates } from '@/family/meals'
import { Icon } from '@/ui/icons'
import { currentRoundTable } from '@/family/travel/roundTable'

type StepId = 'week' | 'outstanding' | 'homework' | 'shifts' | 'meals' | 'together'
const ALL_STEPS: { id: StepId; title: string; icon: 'calendar' | 'check' | 'clock' | 'book' | 'heart' | 'school' }[] = [
  { id: 'week', title: "What's coming up", icon: 'calendar' },
  { id: 'outstanding', title: "What's outstanding", icon: 'check' },
  // Only offered when there's a school-age child: what's due next week, and planning any piece without a day.
  { id: 'homework', title: 'Homework', icon: 'school' },
  // Only offered when there's a baby to cover - see family/shifts.ts. The weekly summit is where the day/night
  // split gets proposed and agreed, so each parent knows ahead of time which nights they can sleep through.
  { id: 'shifts', title: 'Baby shifts', icon: 'clock' },
  { id: 'meals', title: 'Meals for the week', icon: 'book' },
  { id: 'together', title: 'Anything to agree', icon: 'heart' },
]

export function Summit() {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const today = ymdOf(Date.now())
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const alreadyDone = !!f.summits[weekStart]
  const babies = bornBabies(f)
  const kids = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const STEPS = ALL_STEPS.filter((s) => (s.id !== 'shifts' || babies.length > 0) && (s.id !== 'homework' || kids.length > 0))
  // Late in the week the useful thing to agree is NEXT week; earlier on, this week if it isn't settled yet.
  const shiftWeek = (babyId: string): 'this' | 'next' => (weekday(today) >= 5 || shiftPlanFor(f, babyId, weekStart)?.confirmed ? 'next' : 'this')

  const ctx = useMemo(() => makeCalCtx(f), [f])
  const weekItems = useMemo(() => Object.entries(itemsBetween(ctx, weekStart, weekEnd)).flatMap(([, items]) => items), [ctx, weekStart, weekEnd])
  const outstanding = useMemo(() => dumpList(f, { show: 'open' }), [f])
  const overdueTasks = useMemo(() => Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && t.date && t.date < today), [f, today])
  const mealGaps = useMemo(() => weekDates(weekStart).filter((d) => !mealAt(f, d, 'dinner')).length, [f, weekStart])
  const awaitingVotes = useMemo(() => Object.values(f.ideas).filter((idea) => idea.status === 'open'), [f])

  const roundTable = currentRoundTable(f, today)
  const step = STEPS[i]!
  const finish = () => {
    act(A.completeSummit(me.id, weekStart))
    toast('Nice — this week is planned.')
    nav('/plan')
  }

  return (
    <div className="screen summit">
      <header className="screen-head">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">Plan</p>
          <h1>Weekly summit</h1>
        </div>
      </header>
      <p className="note">
        {dayName(weekStart)}–{dayName(weekEnd)}. A quick walk-through, not more admin — each step links straight to where you'd actually fix something.
        {alreadyDone && ' Already marked done for this week — go through it again any time.'}
      </p>

      <div className="chips">
        {STEPS.map((s, idx) => (
          <button key={s.id} type="button" className={`chip small${idx === i ? ' selected' : ''}`} onClick={() => setI(idx)}>
            {s.title}
          </button>
        ))}
      </div>

      <section className="card">
        <h3>
          <Icon name={step.icon} size={20} /> {step.title}
        </h3>
        {step.id === 'week' && (
          <>
            {roundTable && (
              <Link to="/round-table" className="card glance rt-link">
                <span aria-hidden="true">🪑</span>
                <span className="grow">
                  <strong>The assistant’s round table</strong>
                  <small className="muted"> {roundTable.agenda?.summary ?? 'Being prepared…'}</small>
                </span>
              </Link>
            )}
            <p className="muted">{weekItems.length} things on the calendar this week.</p>
            <ul className="log-list">
              {weekItems.slice(0, 8).map((it) => (
                <li key={it.key}>
                  <span className="log-time">{dayName(it.date).slice(0, 3)}</span>
                  <span className="log-what">{it.title}</span>
                </li>
              ))}
            </ul>
            {weekItems.length === 0 && <p className="empty-note">Nothing on the calendar yet this week.</p>}
            <Link to="/calendar" className="btn block">
              Open calendar
            </Link>
          </>
        )}
        {step.id === 'outstanding' && (
          <>
            <p className="muted">
              {outstanding.length} thing{outstanding.length === 1 ? '' : 's'} in the brain dump, {overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}.
            </p>
            <ul className="log-list">
              {outstanding.slice(0, 6).map((d) => (
                <li key={d.itemId}>
                  <span className="log-what">{d.title}</span>
                </li>
              ))}
            </ul>
            {outstanding.length === 0 && overdueTasks.length === 0 && <p className="empty-note">All clear.</p>}
            <Link to="/plan?t=dump" className="btn block">
              Open brain dump
            </Link>
          </>
        )}
        {step.id === 'homework' && (
          <>
            <p className="muted">What's due next week, and a day for anything not yet planned.</p>
            <HomeworkSummitStep kids={kids} />
          </>
        )}
        {step.id === 'shifts' && (
          <>
            <p className="muted">By default this is last week's rota with the two of you swapped, so the hard shifts take turns. Confirm it, or adjust it first.</p>
            {babies.map((b) => (
              <div key={b.id}>
                {babies.length > 1 && <p className="eyebrow">{b.name}</p>}
                <ShiftCard baby={b} initialWeek={shiftWeek(b.id)} />
              </div>
            ))}
          </>
        )}
        {step.id === 'meals' && (
          <>
            <p className="muted">{mealGaps > 0 ? `${mealGaps} night${mealGaps === 1 ? '' : 's'} without a dinner planned.` : 'Every night this week has a dinner planned.'}</p>
            <Link to="/plan?t=meals" className="btn block">
              Open meal planner
            </Link>
          </>
        )}
        {step.id === 'together' && (
          <>
            <p className="muted">{awaitingVotes.length} idea{awaitingVotes.length === 1 ? '' : 's'} still waiting on votes.</p>
            <ul className="log-list">
              {awaitingVotes.slice(0, 6).map((idea) => (
                <li key={idea.id}>
                  <span className="log-what">{idea.title}</span>
                </li>
              ))}
            </ul>
            {awaitingVotes.length === 0 && <p className="empty-note">Nothing waiting on a vote.</p>}
            <Link to="/calendar?v=plans" className="btn block">
              Open Plans &amp; ideas
            </Link>
          </>
        )}
      </section>

      <div className="btn-row">
        {i > 0 && (
          <button type="button" className="btn" onClick={() => setI(i - 1)}>
            Back
          </button>
        )}
        {i < STEPS.length - 1 ? (
          <button type="button" className="btn primary grow" onClick={() => setI(i + 1)}>
            Next
          </button>
        ) : (
          <button type="button" className="btn primary grow" onClick={finish}>
            <Icon name="check" size={18} /> {alreadyDone ? 'Done again' : "Done — mark this week planned"}
          </button>
        )}
      </div>
    </div>
  )
}
