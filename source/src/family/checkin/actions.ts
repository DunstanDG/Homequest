/**
 * Every write for check-ins and habits, as functions that return the events to append (no React; same rules as actions.ts).
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import { completeTask, saveTask } from '../actions'
import { suggestCoins } from '../economy'
import { tsOf, ymdOf } from '../dates'
import type { CheckinConfigEvent, CheckinPart, FamilyState, HabitEvent, HabitWhen, MemberId, Ymd } from '../types'
import { habitTicks, liveHabits, STARTER_HABITS } from './habits'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

function bodyOf<T extends { type: string; id: string; ts: number; day: string; learnerId: string; v: number }>(e: T): Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = e
  return rest
}

// ------------------------------------------------------------------ habits

export interface HabitDraft {
  habitId?: string
  memberId: MemberId
  title: string
  emoji?: string
  when: HabitWhen
  everyDays: number
  weekdays?: number[]
  starterKey?: string
  /** Part of the morning "before you leave" checklist. */
  leaving?: boolean
}

/** The place after the last habit (not just the count, which a deleted habit would leave clashing with the last one). */
export const nextOrder = (f: FamilyState, memberId: MemberId): number => liveHabits(f, memberId).reduce((m, h) => Math.max(m, h.order + 1), 0)

export function saveHabit(actor: MemberId, f: FamilyState, d: HabitDraft, now = Date.now()): AppEvent[] {
  const existing = d.habitId ? f.habits[d.habitId] : undefined
  const weekdays = d.weekdays?.length ? [...new Set(d.weekdays)].sort((a, b) => a - b) : undefined
  return [
    ev(
      actor,
      {
        type: 'habit',
        habitId: d.habitId ?? uid('hab'),
        memberId: d.memberId,
        title: d.title.trim() || 'Habit',
        emoji: d.emoji?.trim() || undefined,
        when: d.when,
        everyDays: Math.max(1, Math.round(d.everyDays || 1)),
        weekdays,
        order: existing?.order ?? nextOrder(f, d.memberId),
        starterKey: d.starterKey ?? existing?.starterKey,
        leaving: (d.leaving ?? existing?.leaving) && d.when !== 'evening' ? true : undefined,
      },
      now,
    ),
  ]
}

/**
 * Move a habit one place up (-1) or down (1) in its person's list. The whole list is renumbered 0, 1, 2... so two habits that
 * happened to share a number (two phones adding at once) end up in the order everyone saw, and only the ones that changed are written.
 */
export function moveHabit(actor: MemberId, f: FamilyState, habitId: string, dir: -1 | 1, now = Date.now()): AppEvent[] {
  const h = f.habits[habitId]
  if (!h || h.deleted) return []
  const list = liveHabits(f, h.memberId)
  const i = list.findIndex((x) => x.habitId === habitId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return []
  const next = [...list]
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  return next.flatMap((x, n) => (x.order === n ? [] : [ev(actor, { type: 'habit', ...bodyOf(x), order: n }, now + n)]))
}

export const deleteHabit = (actor: MemberId, h: HabitEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'habit', ...bodyOf(h), deleted: true }, now)]

export const starterHabitId = (memberId: MemberId, key: string): string => `hab-${memberId}-${key}`

/** Add suggested habits to a person's own list (ones they already have are left alone, so adding twice makes no copies). */
export function addStarterHabits(actor: MemberId, f: FamilyState, memberId: MemberId, keys: readonly string[], now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  let n = nextOrder(f, memberId)
  for (const k of keys) {
    const s = STARTER_HABITS.find((x) => x.key === k)
    const id = starterHabitId(memberId, k)
    if (!s || (f.habits[id] && !f.habits[id]!.deleted)) continue
    out.push(
      ev(actor, { type: 'habit', habitId: id, memberId, title: s.title, emoji: s.emoji, when: s.when, everyDays: s.everyDays, weekdays: s.weekdays, order: n++, starterKey: k }, now + out.length),
    )
  }
  return out
}

/** Tick a habit for a day. Does nothing if it is already ticked for that day. */
export function tickHabit(actor: MemberId, f: FamilyState, habitId: string, date: Ymd, now = Date.now()): AppEvent[] {
  const h = f.habits[habitId]
  if (!h || h.deleted || habitTicks(f, habitId).some((e) => e.date === date)) return []
  return [ev(actor, { type: 'habit-done', habitId, memberId: h.memberId, date, at: now }, now)]
}

/** Take back a tick (every tick of that day, in case two phones ticked it). */
export function untickHabit(actor: MemberId, f: FamilyState, habitId: string, date: Ymd, now = Date.now()): AppEvent[] {
  return habitTicks(f, habitId)
    .filter((e) => e.date === date)
    .map((e, i) => ev(actor, { type: 'void', targetId: e.id }, now + i))
}

// ------------------------------------------------------------------ check-ins

/** Finish a check-in (and record how the person is). Finishing it again just updates the mood or note. */
export function finishCheckin(actor: MemberId, memberId: MemberId, date: Ymd, part: CheckinPart, o: { mood?: number; why?: string; note?: string } = {}, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'checkin', memberId, date, part, mood: o.mood && o.mood >= 1 && o.mood <= 5 ? Math.round(o.mood) : undefined, why: o.why?.trim() || undefined, note: o.note?.trim() || undefined }, now)]
}

export function saveCheckinConfig(actor: MemberId, memberId: MemberId, c: Omit<CheckinConfigEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'memberId'>, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'checkin-config', memberId, ...c }, now)]
}

// ------------------------------------------------------------------ untracked things

export interface ActivityDraft {
  memberId: MemberId
  title: string
  minutes?: number
  /** The day it counts for. */
  date: Ymd
  /** Coins to earn (children only; a parent has to check unless a parent adds it). 0 or left out = none. */
  coins?: number
}

/** The coins offered by default for something a child did for this long. */
export const activityCoins = (minutes?: number): number => suggestCoins('chore', minutes)

/**
 * Something that was done but never tracked: it becomes a one-off task for that day, already ticked off, so it shows in the
 * day's "done" list and counts like any other. A child's earns coins if asked for (waiting for a parent's check, unless a parent
 * is the one adding it). Returns nothing without a name.
 */
export function addActivity(actor: MemberId, f: FamilyState, d: ActivityDraft, now = Date.now()): AppEvent[] {
  const title = d.title.trim()
  if (!title) return []
  const child = f.members[d.memberId]?.role === 'child'
  const coins = child ? Math.max(0, Math.round(d.coins ?? 0)) : 0
  // For an earlier day the events are stamped that evening, so everything that looks at the day something was done (the day's
  // review, the task list, the coin history) puts it where it belongs.
  const at = d.date < ymdOf(now) ? tsOf(d.date, '20:00') : now
  const [task] = saveTask(
    actor,
    { taskId: uid('act'), title, assignee: d.memberId, kind: 'chore', part: 'any', date: d.date, minutes: d.minutes, coins, check: coins > 0 ? 'parent' : 'self', source: 'checkin:activity' },
    at,
  )
  if (!task || task.type !== 'task') return []
  return [task, ...completeTask(actor, f, task, d.date, { minutes: d.minutes }, at + 1)]
}
