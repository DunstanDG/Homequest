/** The weekly summit's steps (0.18: they are now steps of the weekly plan at /week, see WeekPlan.tsx; /summit goes
 * there). A short guided walk-through rather than a new place to manage things: each step reads from the screens
 * that already own that data (calendar, brain dump, meals, Plans and ideas) and links straight there. */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFamily } from '@/app/context'
import { dayName, startOfWeek, weekday } from '@/family/dates'
import { bornBabies } from '@/family/arrival/arrival'
import { shiftPlanFor } from '@/family/shifts'
import { ShiftCard } from './careShifts'
import { HomeworkSummitStep } from './homeworkCards'
import { dumpList, dumpState } from '@/family/dump'
import { mealAt, weekDates } from '@/family/meals'
import { looseEnds, weekGlance } from '@/family/weekPlan'
import type { Member, Ymd } from '@/family/types'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What's coming up: the week at a glance, one line per day with what makes that day different. */
export function ComingUpStep({ weekOf }: { weekOf: Ymd }) {
  const f = useFamily()
  const days = useMemo(() => weekGlance(f, weekOf), [f, weekOf])
  return (
    <div className="card wk-card">
      <ul className="log-list wk-glance">
        {days.map((d) => (
          <li key={d.date}>
            <span className="log-time">{dayName(d.date).slice(0, 3)}</span>
            <span className={`log-what${d.titles.length ? '' : ' muted'}`}>{d.titles.length ? d.titles.join(', ') : 'The usual'}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">“The usual” is school, clubs, meals and routines.</p>
      <Link to="/calendar" className="btn block">
        Open the calendar
      </Link>
    </div>
  )
}

/** Loose ends, kindly: one-off tasks from before today get offered a fresh start on Today, and the brain dump is
 * there for whenever. Never a count of "overdue" things. */
export function LooseEndsStep({ today }: { today: Ymd }) {
  const f = useFamily()
  const before = useMemo(() => looseEnds(f, today), [f, today])
  const thoughts = useMemo(() => dumpList(f, { show: 'open' }).filter((d) => dumpState(f, d) === 'open'), [f])
  return (
    <>
      <div className="card wk-card">
        {before.length > 0 ? (
          <>
            <p>
              <strong>{plural(before.length, 'thing')} from before:</strong> want to give {before.length === 1 ? 'it' : 'them'} a fresh start?
            </p>
            <ul className="log-list">
              {before.slice(0, 5).map((t) => (
                <li key={t.taskId}>
                  <span className="log-what">{t.title}</span>
                </li>
              ))}
            </ul>
            {before.length > 5 && <p className="muted small">and {plural(before.length - 5, 'more')}.</p>}
            <Link to="/" className="btn primary block">
              Open Today
            </Link>
          </>
        ) : (
          <p className="muted">Nothing left over from before. Lovely.</p>
        )}
      </div>
      <div className="card wk-card">
        <p className="muted">{thoughts.length ? `${plural(thoughts.length, 'thought')} in the brain dump, for whenever you’re ready.` : 'The brain dump is empty.'}</p>
        <Link to="/plan?t=dump" className="btn block">
          Open the brain dump
        </Link>
      </div>
    </>
  )
}

/** Homework: what's due next week, and a day for anything not yet planned (only when there are children). */
export function HomeworkStep({ kids }: { kids: Member[] }) {
  if (!kids.length) return null
  return (
    <div className="card wk-card">
      <h3>Homework</h3>
      <p className="muted">What’s due next week, and a day for anything not yet planned.</p>
      <HomeworkSummitStep kids={kids} />
    </div>
  )
}

/** Meals for the week, and (with a baby) who's on nights: the proposed rota to confirm or adjust. */
export function MealsAndNightsStep({ weekOf, today }: { weekOf: Ymd; today: Ymd }) {
  const f = useFamily()
  const babies = bornBabies(f)
  const gaps = useMemo(() => weekDates(weekOf).filter((d) => !mealAt(f, d, 'dinner')).length, [f, weekOf])
  // Late in the week the useful thing to agree is NEXT week; earlier on, this week if it isn't settled yet.
  const shiftWeek = (babyId: string): 'this' | 'next' => (weekday(today) >= 5 || shiftPlanFor(f, babyId, startOfWeek(today))?.confirmed ? 'next' : 'this')
  return (
    <>
      <div className="card wk-card">
        <h3>Meals</h3>
        <p className="muted">{gaps > 0 ? `${plural(gaps, 'night')} without a dinner yet.` : 'Every night that week has a dinner planned.'}</p>
        <Link to="/plan?t=meals" className="btn block">
          Open the meal planner
        </Link>
      </div>
      {babies.length > 0 && (
        <div className="card wk-card">
          <h3>Who’s on nights</h3>
          <p className="muted">By default this is last week’s rota with the two of you swapped, so the hard shifts take turns. Confirm it, or change it first.</p>
          {babies.map((b) => (
            <div key={b.id}>
              {babies.length > 1 && <p className="eyebrow">{b.name}</p>}
              <ShiftCard baby={b} initialWeek={shiftWeek(b.id)} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/** Anything to agree: ideas still waiting on votes. */
export function IdeasToAgree() {
  const f = useFamily()
  const open = useMemo(() => Object.values(f.ideas).filter((idea) => idea.status === 'open'), [f])
  if (!open.length) return null
  return (
    <div className="card wk-card">
      <h3>Ideas to agree</h3>
      <p className="muted">{plural(open.length, 'idea')} waiting on votes.</p>
      <ul className="log-list">
        {open.slice(0, 5).map((idea) => (
          <li key={idea.id}>
            <span className="log-what">{idea.title}</span>
          </li>
        ))}
      </ul>
      <Link to="/calendar?v=plans" className="btn block">
        Open Plans and ideas
      </Link>
    </div>
  )
}
