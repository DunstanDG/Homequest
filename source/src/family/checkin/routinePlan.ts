/**
 * Routine setup for one person: when they get up, leave the house and go to bed (on school/work days and on days off), a
 * "before you leave" checklist, and the habits they want. From those answers it builds the person's morning and evening sessions
 * (one for weekdays, one for days off, each with a "My habits" step), the checklist as habits, and the check-in opening times.
 *
 * It is safe to run again: everything it makes has a fixed id, so a second run updates the same sessions and habits instead of
 * adding copies, keeps any steps the person has edited, and takes over a Morning or Bedtime session they had already made by hand.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { fromMin, toMin, ymdOf } from '../dates'
import type { CheckinPart, FamilyState, HabitEvent, Hm, MemberId, RoutineDayTimes, RoutineEvent, RoutineStep } from '../types'
import { addStarterHabits, nextOrder } from './actions'
import { STARTER_HABITS } from './habits'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

function bodyOf<T extends { type: string; id: string; ts: number; day: string; learnerId: string; v: number }>(e: T): Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = e
  return rest
}

export interface RoutinePlanInput {
  memberId: MemberId
  weekday: RoutineDayTimes
  weekend: RoutineDayTimes
  /** The "before you leave" checklist (titles; known ones get their emoji). */
  leaving: string[]
  /** Habit suggestions to add to their list (keys from STARTER_HABITS). Ones they already have are left alone. */
  habitKeys: string[]
  /** Weekday = a day their school is open; days off = every other day. False: weekday = Monday to Friday. */
  schoolDays: boolean
}

export const LEAVING_CHILD: { title: string; emoji: string }[] = [
  { title: 'Bag packed', emoji: '🎒' },
  { title: 'Shoes on', emoji: '👟' },
  { title: 'Coat or jumper', emoji: '🧥' },
  { title: 'Water bottle', emoji: '🥤' },
  { title: 'Lunch or snack', emoji: '🥪' },
  { title: 'PE kit (on PE days)', emoji: '🏃' },
]
export const LEAVING_ADULT: { title: string; emoji: string }[] = [
  { title: 'Keys', emoji: '🔑' },
  { title: 'Phone and wallet', emoji: '📱' },
  { title: 'Bag or laptop', emoji: '💼' },
  { title: 'Lunch', emoji: '🥪' },
  { title: 'Windows and doors', emoji: '🚪' },
]
const emojiForLeaving = (title: string): string => [...LEAVING_CHILD, ...LEAVING_ADULT].find((x) => x.title.toLowerCase() === title.trim().toLowerCase())?.emoji ?? '✅'

export function planDefaults(role: 'parent' | 'child'): Pick<RoutinePlanInput, 'weekday' | 'weekend' | 'leaving' | 'habitKeys'> {
  return role === 'child'
    ? {
        weekday: { wake: '07:00', leave: '08:15', bed: '19:30' },
        weekend: { wake: '08:00', bed: '20:00' },
        leaving: LEAVING_CHILD.slice(0, 4).map((x) => x.title),
        habitKeys: ['teeth-am', 'teeth-pm'],
      }
    : {
        weekday: { wake: '06:45', leave: '08:30', bed: '22:30' },
        weekend: { wake: '08:00', bed: '23:00' },
        leaving: LEAVING_ADULT.slice(0, 3).map((x) => x.title),
        habitKeys: ['teeth-am', 'teeth-pm'],
      }
}

/** The ids everything gets, so running setup again finds what it made before. */
export const planIds = (memberId: MemberId) => ({
  routine: (part: CheckinPart, kind: 'wd' | 'we') => `rt-${memberId}-${part === 'morning' ? 'am' : 'pm'}-${kind}`,
  leaving: (title: string) =>
    `hab-${memberId}-leave-${
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'item'
    }`,
})

const MORNING_RE = /^(.*\s)?morning/i
const EVENING_RE = /(bed ?time|evening|night)/i

/** A session this person already has for that part of the day that setup should take over rather than duplicate. */
export function existingRoutine(f: FamilyState, memberId: MemberId, part: CheckinPart): RoutineEvent | undefined {
  const ids = planIds(memberId)
  const mine = Object.values(f.routines).filter((r) => !r.deleted && r.ownerId === memberId && !r.homework && !r.project && !r.plants && r.routineId !== ids.routine(part, 'we'))
  const own = mine.find((r) => r.routineId === ids.routine(part, 'wd'))
  if (own) return own
  const tagged = mine.find((r) => r.part === part)
  if (tagged) return tagged
  const re = part === 'morning' ? MORNING_RE : EVENING_RE
  return mine.find((r) => !r.part && re.test(r.title) && !(part === 'morning' && EVENING_RE.test(r.title)))
}

const slotStep = (routineId: string, part: CheckinPart): RoutineStep => ({
  id: `${routineId}-habits`,
  title: part === 'morning' ? 'My morning habits' : 'My evening habits',
  minutes: 6,
  emoji: '✨',
  habitsSlot: part,
})

function freshSteps(routineId: string, part: CheckinPart, child: boolean): RoutineStep[] {
  const s = (n: string, title: string, minutes: number, emoji: string): RoutineStep => ({ id: `${routineId}-${n}`, title, minutes, emoji })
  return part === 'morning'
    ? [s('up', 'Get up and dressed', 5, '👕'), s('eat', 'Breakfast', 15, '🥣'), slotStep(routineId, 'morning')]
    : [
        s('tidy', 'Tidy up', 5, '🧸'),
        s('pjs', child ? 'Pyjamas' : 'Get ready for bed', 3, '🩳'),
        slotStep(routineId, 'evening'),
        s('read', child ? 'Story or reading' : 'Wind down', 10, '📖'),
        s('lights', 'Lights out', 1, '😴'),
      ]
}

const withSlot = (routineId: string, part: CheckinPart, steps: RoutineStep[]): RoutineStep[] => {
  if (steps.some((s) => s.habitsSlot === part)) return steps
  const slot = slotStep(routineId, part)
  return part === 'morning' || steps.length < 2 ? [...steps, slot] : [...steps.slice(0, -1), slot, steps[steps.length - 1]!]
}

const clampHm = (min: number): Hm => fromMin(Math.max(0, Math.min(23 * 60 + 59, Math.round(min))))
/** The evening check-in opens an hour before bed (not before 4pm). */
const eveningOpens = (bed: Hm): Hm => clampHm(Math.max(16 * 60, toMin(bed) - 60))

export function applyRoutinePlan(actor: MemberId, f: FamilyState, input: RoutinePlanInput, now = Date.now()): AppEvent[] {
  const m = f.members[input.memberId]
  if (!m) return []
  const out: AppEvent[] = []
  const push = (body: EventBody) => out.push(ev(actor, body, now + out.length))
  const ids = planIds(input.memberId)
  const child = m.role === 'child'
  const today = ymdOf(now)

  push({ type: 'routine-plan', memberId: input.memberId, weekday: input.weekday, weekend: input.weekend, leaving: input.leaving })

  // ---- sessions
  const kinds: { kind: 'wd' | 'we'; times: RoutineDayTimes }[] = [
    { kind: 'wd', times: input.weekday },
    { kind: 'we', times: input.weekend },
  ]
  for (const part of ['morning', 'evening'] as const) {
    const adopted = existingRoutine(f, input.memberId, part)
    for (const { kind, times } of kinds) {
      const old = kind === 'wd' ? adopted : f.routines[ids.routine(part, kind)]
      const routineId = old?.routineId ?? ids.routine(part, kind)
      const steps = withSlot(routineId, part, old && !old.deleted ? old.steps : freshSteps(routineId, part, child))
      const minutes = steps.reduce((t, s) => t + s.minutes, 0)
      const recur =
        kind === 'wd'
          ? input.schoolDays
            ? { freq: 'daily' as const, schoolDaysOnly: true }
            : { freq: 'weekly' as const, byWeekday: [0, 1, 2, 3, 4] }
          : input.schoolDays
            ? { freq: 'daily' as const, offDaysOnly: true }
            : { freq: 'weekly' as const, byWeekday: [5, 6] }
      const startAt = part === 'morning' ? times.wake : clampHm(toMin(times.bed) - minutes)
      const finishBy = part === 'morning' ? times.leave : times.bed
      const label = kind === 'wd' ? '' : 'weekend '
      const title = part === 'morning' ? `${m.name}'s ${label}${kind === 'wd' ? 'morning routine' : 'morning'}` : `${m.name}'s ${label}${kind === 'wd' ? 'bedtime routine' : 'bedtime'}`
      push({
        type: 'routine',
        ...(old ? bodyOf(old) : {}),
        routineId,
        title: old && !old.deleted && old.routineId !== ids.routine(part, kind) ? old.title : title,
        emoji: old?.emoji ?? (part === 'morning' ? '🌅' : '🌙'),
        ownerId: input.memberId,
        steps,
        startAt,
        finishBy,
        date: old?.date && old.date < today ? old.date : today,
        recur,
        part,
        deleted: false,
      })
    }
  }

  // ---- habits: suggestions, then the before-you-leave checklist
  const keys = input.habitKeys.filter((k) => STARTER_HABITS.some((s) => s.key === k))
  out.push(...addStarterHabits(actor, f, input.memberId, keys, now + out.length + 100))
  let order = nextOrder(f, input.memberId) + keys.length
  const wanted = new Set<string>()
  for (const raw of input.leaving) {
    const title = raw.trim()
    if (!title) continue
    const habitId = ids.leaving(title)
    if (wanted.has(habitId)) continue
    wanted.add(habitId)
    const have = f.habits[habitId]
    if (have && !have.deleted && have.leaving) continue
    const h: Omit<HabitEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> = {
      habitId,
      memberId: input.memberId,
      title,
      emoji: emojiForLeaving(title),
      when: 'morning',
      everyDays: 1,
      order: have?.order ?? order++,
      leaving: true,
    }
    push({ type: 'habit', ...h })
  }
  for (const h of Object.values(f.habits)) {
    if (h.deleted || h.memberId !== input.memberId || !h.leaving || !h.habitId.startsWith(`hab-${input.memberId}-leave-`) || wanted.has(h.habitId)) continue
    push({ type: 'habit', ...bodyOf(h), deleted: true })
  }

  // ---- check-in windows follow the times
  const c = f.checkinConfig[input.memberId]
  const until = (from: Hm, keep: Hm | undefined): Hm => (keep && toMin(keep) > toMin(from) ? keep : clampHm(Math.max(toMin(from) + 4 * 60, 12 * 60)))
  const wdFrom = input.weekday.wake
  const weFrom = input.weekend.wake
  const wdUntil = until(wdFrom, c?.morningUntil)
  push({
    type: 'checkin-config',
    memberId: input.memberId,
    enabled: c?.enabled ?? true,
    remind: c?.remind ?? false,
    morningFrom: wdFrom,
    morningUntil: wdUntil,
    eveningFrom: eveningOpens(input.weekday.bed),
    weekend: { morningFrom: weFrom, morningUntil: until(weFrom, c?.weekend?.morningUntil ?? wdUntil), eveningFrom: eveningOpens(input.weekend.bed) },
  })
  return out
}
