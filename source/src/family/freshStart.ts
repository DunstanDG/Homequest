/**
 * Fresh start (0.18, calm Today): everything left over from before (one-off tasks and homework past their day, and
 * homework planned for a day that has gone) is spread over the days from today, at most two a day per person, homework
 * first and the shortest first. Things nobody has touched for a long time can wait for "Someday" in the brain dump
 * instead (parents only). Nothing new is stored: it writes the same task and dump events a person would by hand.
 *
 * Pure logic, so it can be shown as a summary first ("Move 3 things to this week?") and then applied.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from './actions'
import * as P from './planActions'
import { addDays, daysBetween, friendlyDay, startOfWeek } from './dates'
import { minutesOf } from './homeworkCore'
import type { FamilyState, MemberId, TaskEvent, Ymd } from './types'

/** At most this many moved things land on one person's day. */
export const FRESH_PER_DAY = 2
/** A non-homework task this many days past its day, and not edited for as long, can go to Someday instead. */
export const SOMEDAY_AFTER_DAYS = 28
/** Assumed length of a chore with no estimate, for "shortest first". */
const DEFAULT_TASK_MIN = 15
const DAY_MS = 86_400_000

export interface FreshMove {
  task: TaskEvent
  /** The new day, or 'someday' (back to the brain dump, marked someday). */
  to: Ymd | 'someday'
}

export interface FreshPlan {
  /** The day it was worked out for. */
  today: Ymd
  moves: FreshMove[]
  /** The days things land on, earliest first. */
  days: Ymd[]
}

const isDone = (f: FamilyState, t: TaskEvent): boolean => {
  const d = f.done[`${t.taskId}|${t.date ?? 'any'}`]
  return !!d && d.status !== 'rejected'
}

/** One-off things for this person that are left over from before today: past their day, or homework planned for a
 * day that has gone. Repeating tasks and "whenever" tasks never are. */
export function leftOver(f: FamilyState, memberId: MemberId, today: Ymd): TaskEvent[] {
  return Object.values(f.tasks).filter((t) => {
    if (t.deleted || t.dropped || t.recur || t.assignee !== memberId || !t.date || isDone(f, t)) return false
    if (t.date < today) return true
    return t.kind === 'homework' && !!t.doOn && t.doOn < today
  })
}

const lengthOf = (t: TaskEvent): number => (t.kind === 'homework' ? minutesOf(t) : (t.minutes ?? DEFAULT_TASK_MIN))

/** Homework first, then the shortest, then the oldest. */
const order = (a: TaskEvent, b: TaskEvent): number =>
  Number(b.kind === 'homework') - Number(a.kind === 'homework') || lengthOf(a) - lengthOf(b) || (a.date ?? '').localeCompare(b.date ?? '') || a.title.localeCompare(b.title)

export interface FreshOpts {
  now?: number
  perDay?: number
  /** Let long-untouched chores go to Someday (parents only: a child shouldn't take a grown-up's job off the list). */
  allowSomeday?: boolean
  somedayAfterDays?: number
  /** Only these (e.g. homework, on the School screen). */
  only?: (t: TaskEvent) => boolean
}

/** Should this one wait for Someday rather than come back onto a day? */
export function canWaitForSomeday(t: TaskEvent, today: Ymd, now: number, afterDays = SOMEDAY_AFTER_DAYS): boolean {
  if (t.kind === 'homework' || !t.date) return false
  return daysBetween(t.date, today) >= afterDays && now - t.ts >= afterDays * DAY_MS
}

/** Where everything left over for these people would go, from `today`. */
export function freshStartPlan(f: FamilyState, memberIds: readonly MemberId[], today: Ymd, o: FreshOpts = {}): FreshPlan {
  const now = o.now ?? Date.now()
  const perDay = Math.max(1, o.perDay ?? FRESH_PER_DAY)
  const moves: FreshMove[] = []
  for (const m of memberIds) {
    const items = leftOver(f, m, today)
      .filter((t) => !o.only || o.only(t))
      .sort(order)
    let slot = 0
    for (const t of items) {
      if (o.allowSomeday && canWaitForSomeday(t, today, now, o.somedayAfterDays)) {
        moves.push({ task: t, to: 'someday' })
        continue
      }
      moves.push({ task: t, to: addDays(today, Math.floor(slot / perDay)) })
      slot++
    }
  }
  const days = [...new Set(moves.map((x) => x.to).filter((d): d is Ymd => d !== 'someday'))].sort()
  return { today, moves, days }
}

type Body<T> = Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'>
function bodyOf(t: TaskEvent): Body<TaskEvent> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = t
  return rest
}

/** The events that carry the plan out: ordinary task re-saves (a new `date`, and `doOn` for homework) and, for
 * Someday, the task coming off the day and its brain-dump item (or a new one) marked someday. */
export function freshStartEvents(actor: MemberId, f: FamilyState, plan: FreshPlan, now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  let n = 0
  const at = () => now + n++ * 3
  for (const { task: t, to } of plan.moves) {
    if (to === 'someday') {
      const dumpId = t.source?.startsWith('dump:') ? t.source.slice(5) : undefined
      const item = dumpId ? f.dump[dumpId] : undefined
      if (item && !item.deleted) out.push(...P.unscheduleDump(actor, f, { ...item, priority: 'someday' }, at()))
      else {
        const when = at()
        out.push(...A.deleteTask(actor, t, when), ...P.addDump(actor, [{ title: t.title, ownerId: t.assignee, minutes: t.minutes, notes: t.notes, priority: 'someday', private: !!t.priv && t.priv === actor }], when + 1))
      }
      continue
    }
    const body = bodyOf(t)
    if (t.kind === 'homework' && t.date && t.date >= plan.today) {
      // Still due later, only the plan had slipped: move the plan, never past the due day.
      out.push(makeEvent(actor, { type: 'task', ...body, doOn: to <= t.date ? to : t.date }, at()))
    } else if (t.kind === 'homework') {
      // Past its due day: planned for the new day and handed in the day after, so it shows from that day (planned
      // homework appears from its day, or the day before it's due) and not on today's list ahead of time.
      out.push(makeEvent(actor, { type: 'task', ...body, date: addDays(to, 1), doOn: to }, at()))
    } else out.push(makeEvent(actor, { type: 'task', ...body, date: to }, at()))
  }
  return out
}

export interface FreshSummary {
  /** "Move 3 things to this week?" */
  title: string
  /** One line per day: "Today: Maths sheet, Tidy room". */
  lines: string[]
  /** "2 can wait for Someday: …" */
  someday?: string
  count: number
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What the plan will do, in words, to show before doing it. */
export function freshStartSummary(plan: FreshPlan, today: Ymd): FreshSummary {
  const dated = plan.moves.filter((m) => m.to !== 'someday')
  const later = plan.moves.filter((m) => m.to === 'someday')
  const last = plan.days[plan.days.length - 1]
  const weekEnd = addDays(startOfWeek(today), 6)
  const where = !last || last === today ? 'today' : last <= weekEnd ? 'this week' : `the next ${daysBetween(today, last) + 1} days`
  const title = dated.length
    ? `Move ${plural(dated.length, 'thing')} to ${where}?`
    : later.length
      ? `Let ${plural(later.length, 'thing')} wait for Someday?`
      : 'Nothing to move'
  const lines = plan.days.map((d) => `${friendlyDay(d, today)}: ${dated.filter((m) => m.to === d).map((m) => m.task.title).join(', ')}`)
  const someday = later.length ? `${later.length === 1 ? '1 can' : `${later.length} can`} wait for Someday in the brain dump: ${later.map((m) => m.task.title).join(', ')}` : undefined
  return { title, lines, someday, count: plan.moves.length }
}
