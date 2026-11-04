/**
 * The homework pieces that sit on other screens: the after-school check-in and the "nothing logged this week?"
 * nudge (Today, for a child), the parents' one-glance summary (Today, for a parent), the daily homework time and
 * "plan it for me" (School), and the weekly summit step. The logic is all in family/homework.ts.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { useApp, useCalCtx, useFamily, useMe, useNow } from '@/app/context'
import { addDays, friendlyDay, startOfWeek, ymdOf } from '@/family/dates'
import { checkinPrompt, homeworkSummary, missingHomework, nextLessonOf, planUnplanned } from '@/family/homework'
import { liveRoutines } from '@/family/routines'
import type { Member, Ymd } from '@/family/types'
import { Avatar } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { TaskSheet, type TaskDefaults } from './shared'
import { FreshStartButton } from './calmParts'

/** 'today', 'tomorrow' or 'Mon 5 Oct', for the middle of a sentence. */
const dayWord = (d: Ymd, today: Ymd): string => {
  const w = friendlyDay(d, today)
  return w === 'Today' || w === 'Tomorrow' || w === 'Yesterday' ? w.toLowerCase() : w
}

const listOf = (xs: string[]): string => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** "Any homework from today's lessons?" - shown after the last lesson until the evening, until it's answered. */
export function HomeworkCheckinCard({ child }: { child: Member }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const now = useNow(60_000)
  const [none, setNone] = useState<string[]>([])
  const [adding, setAdding] = useState<TaskDefaults | undefined>()
  const p = checkinPrompt(ctx, child.id, now)
  if (!p || (!p.subjects.length && !p.logged.length)) return null
  const mine = child.id === me.id
  const finish = () => {
    act(
      A.homeworkCheckin(
        me.id,
        f,
        child.id,
        p.date,
        none.filter((s) => p.subjects.includes(s)),
        p.logged.length,
      ),
    )
    toast(p.logged.length ? 'Homework logged. Plan when to do it on the School screen.' : 'Thanks, noted.')
  }
  return (
    <section className="card hw-checkin">
      <h3>
        <Icon name="book" size={20} /> {mine ? 'Any homework today?' : `Any homework for ${child.name} today?`}
      </h3>
      <p className="muted">
        {mine ? 'You had' : `${child.name} had`} {listOf([...p.logged, ...p.subjects])}. Add anything that was set, or tap None.
      </p>
      <ul className="log-list">
        {p.logged.map((s) => (
          <li key={s}>
            <span className="log-what">{s}</span>
            <span className="pill tone-good">Added</span>
          </li>
        ))}
        {p.subjects.map((s) => (
          <li key={s}>
            <span className="log-what">{s}</span>
            <button type="button" className="btn small" onClick={() => setAdding({ assignee: child.id, kind: 'homework', subject: s, date: nextLessonOf(ctx, child.id, s, p.date) })}>
              <Icon name="plus" size={16} /> Add
            </button>
            <button
              type="button"
              className={`chip small${none.includes(s) ? ' selected' : ''}`}
              aria-pressed={none.includes(s)}
              onClick={() => setNone((n) => (n.includes(s) ? n.filter((x) => x !== s) : [...n, s]))}
            >
              None
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn primary block" onClick={finish}>
        <Icon name="check" size={18} /> That's everything
      </button>
      <TaskSheet key={adding?.subject ?? 'none'} open={!!adding} onClose={() => setAdding(undefined)} defaults={adding} />
    </section>
  )
}

/** From Thursday: subjects that usually set homework this week (the school's Week A/B rule) with nothing logged. */
export function HomeworkNudgeCard({ child }: { child: Member }) {
  const { act } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const [adding, setAdding] = useState<TaskDefaults | undefined>()
  const missing = missingHomework(ctx, child.id, today)
  if (!missing.length) return null
  const week = ctx.schools[child.id]?.weekOf(today)?.week
  const mine = child.id === me.id
  return (
    <section className="card callout">
      <Icon name="info" size={24} />
      <div className="grow">
        <h3>Any homework from {listOf(missing)} this week?</h3>
        <p className="muted">
          {listOf(missing)} usually set{missing.length === 1 ? 's' : ''} homework in Week {week}. {mine ? 'Want to have a quick look on MCAS? Add it here, or tap None set.' : `Maybe have a look on MCAS with ${child.name}.`}
        </p>
        <div className="chips small-gap">
          {missing.map((s) => (
            <span key={s} className="btn-row">
              <button type="button" className="btn small" onClick={() => setAdding({ assignee: child.id, kind: 'homework', subject: s, date: nextLessonOf(ctx, child.id, s, today) })}>
                <Icon name="plus" size={16} /> {s}
              </button>
              <button type="button" className="btn ghost small" onClick={() => act(A.markNoHomework(me.id, f, child.id, today, s))}>
                None set
              </button>
            </span>
          ))}
        </div>
      </div>
      <TaskSheet key={adding?.subject ?? 'none'} open={!!adding} onClose={() => setAdding(undefined)} defaults={adding} />
    </section>
  )
}

/** One line per child for a parent: what's due, what isn't planned, what's left from before, what's waiting for a
 * check. Never "late" or red (0.18): left-over pieces are "from before", with a Fresh start to give them new days. */
export function HomeworkParentCard({ kids }: { kids: Member[] }) {
  const ctx = useCalCtx()
  const now = useNow(60_000)
  const today = ymdOf(now)
  const rows = kids.map((k) => ({ k, s: homeworkSummary(ctx, k.id, today) })).filter(({ s }) => s.open.length || s.waitingCheck.length || s.missing.length)
  if (!rows.length) return null
  return (
    <section className="card">
      <h3>
        <Icon name="book" size={20} /> Homework
      </h3>
      <ul className="log-list">
        {rows.map(({ k, s }) => {
          const bits = [
            s.overdue.length && `${s.overdue.length} from before`,
            s.slipped.length && `${s.slipped.length} to re-plan`,
            s.dueThisWeek.length && `${s.dueThisWeek.length} this week`,
            s.unplanned.length && `${s.unplanned.length} without a day yet`,
            s.waitingCheck.length && `${s.waitingCheck.length} to check`,
            s.missing.length && `nothing logged yet for ${listOf(s.missing)}`,
          ].filter(Boolean)
          return (
            <li key={k.id}>
              <Avatar m={k} size={24} />
              <span className="log-what">
                <strong>{k.name}</strong>
                <small className="muted"> {bits.join(' · ') || 'all handed in'}</small>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="btn-row">
        <Link to="/school" className="btn small">
          Open homework
        </Link>
        <FreshStartButton memberIds={rows.filter(({ s }) => s.overdue.length || s.slipped.length).map(({ k }) => k.id)} today={today} only={(t) => t.kind === 'homework'} className="btn small ghost" />
      </div>
    </section>
  )
}

/** "Plan it for me": a day for every open piece without one, saved in one go. */
export function PlanAllButton({ child, label = 'Plan it for me' }: { child: Member; label?: string }) {
  const { act, toast } = useApp()
  const ctx = useCalCtx()
  const me = useMe()!
  const plan = planUnplanned(ctx, child.id, Date.now())
  if (!plan.length) return null
  return (
    <button
      type="button"
      className="btn primary small"
      onClick={() => {
        const now = Date.now()
        act(plan.flatMap((p, i) => A.planHomework(me.id, p.task, p.doOn.date, now + i)))
        toast(`Planned ${plan.length} piece${plan.length === 1 ? '' : 's'}: ${plan.map((p) => `${p.task.subject ?? p.task.title} ${dayWord(p.doOn.date, ymdOf(now))}`).join(', ')}.`)
      }}
    >
      <Icon name="calendar" size={16} /> {label} ({plan.length})
    </button>
  )
}

/** The daily homework session: a repeating session on school days whose steps are that day's planned homework. */
export function HomeworkTimeCard({ child }: { child: Member }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(Date.now())
  const existing = liveRoutines(f).find((r) => r.homework && r.ownerId === child.id)
  const [at, setAt] = useState(existing?.startAt ?? '16:30')
  const save = () => {
    act(
      P.saveRoutine(me.id, {
        routineId: existing?.routineId,
        title: 'Homework',
        emoji: '📚',
        ownerId: child.id,
        steps: [],
        homework: true,
        startAt: at,
        date: existing?.date ?? today,
        recur: existing?.recur ?? { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4], schoolDaysOnly: true },
      }),
    )
    toast(existing ? 'Homework time changed.' : `Homework time set: ${at} on school days.`)
  }
  return (
    <section className="card">
      <h3>Daily homework time</h3>
      <p className="muted">
        {existing
          ? `${existing.startAt ?? 'Any time'} on school days. Starting it runs through that day's planned homework, one piece at a time, and finishing a piece ticks it off.`
          : `A set time each school day to work through whatever is planned for that day. It shows on ${child.name}'s Today with a Start button.`}
      </p>
      <div className="btn-row">
        <input type="time" className="tbox slim" aria-label="Homework time" value={at} onChange={(e) => setAt(e.target.value)} />
        <button type="button" className="btn primary small" disabled={!at || at === existing?.startAt} onClick={save}>
          {existing ? 'Change' : 'Set homework time'}
        </button>
        {existing && (
          <button type="button" className="btn ghost small" onClick={() => (act(P.deleteRoutine(me.id, existing)), toast('Homework time removed.'))}>
            Remove
          </button>
        )}
      </div>
    </section>
  )
}

/** The weekly summit's homework step: next week's load per child, and planning anything not yet planned. */
export function HomeworkSummitStep({ kids }: { kids: Member[] }) {
  const ctx = useCalCtx()
  const now = useNow(60_000)
  const today = ymdOf(now)
  const nextMon: Ymd = addDays(startOfWeek(today), 7)
  return (
    <>
      {kids.map((k) => {
        const s = homeworkSummary(ctx, k.id, today)
        const nextWeek = s.open.filter((t) => t.date && t.date >= nextMon && t.date <= addDays(nextMon, 6))
        return (
          <div key={k.id} className="stack-gap">
            <p>
              <strong>{k.name}</strong>
              <span className="muted">
                {' '}
                · {s.open.length} open · {nextWeek.length} due next week · {s.unplanned.length} not planned
                {s.overdue.length ? ` · ${s.overdue.length} from before` : ''}
              </span>
            </p>
            {s.overdue.length > 0 && <p className="note">From before: {s.overdue.map((t) => `${t.subject ? `${t.subject}: ` : ''}${t.title}`).join(', ')}</p>}
            <div className="btn-row">
              <PlanAllButton child={k} />
              <FreshStartButton memberIds={[k.id]} today={today} only={(t) => t.kind === 'homework'} className="btn small ghost" />
            </div>
          </div>
        )
      })}
      <Link to="/school" className="btn block">
        Open homework
      </Link>
    </>
  )
}
