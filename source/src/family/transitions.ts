/**
 * Visual transition warnings: "10 minutes until we leave for School", shown at 10, 5 and 1 minutes before the next
 * change in the day for the person holding the phone. Pure, so it can be unit tested; the banner lives in
 * ui/calmShell.tsx.
 *
 * The next change is their next leave-by time from the home server's travel plan (travel-day legs), or else the start of
 * their next timed calendar event (a club or school event counts; the everyday school block and lessons don't).
 */
import { itemsOn, type AgendaItem, type CalCtx } from './calendar'
import { tsOf, ymdOf } from './dates'
import { legsFor } from './travel/travel'
import type { TravelLeg } from './travel/types'
import type { MemberId, Ymd } from './types'

export interface Transition {
  /** Stable per change, for dismissing. */
  key: string
  kind: 'leave' | 'start'
  /** "School", "home", "Swimming". */
  title: string
  /** When (ms). */
  at: number
}

/** The stages the warning shows at, in minutes before. */
export const STAGES = [10, 5, 1] as const
export type Stage = (typeof STAGES)[number]

const MIN = 60_000
const START_SOURCES = new Set<AgendaItem['source']>(['cal', 'club', 'school-event'])

/** The next change after `now` from a day's travel legs and agenda items (already filtered to this person). */
export function nextTransitionFrom(legs: TravelLeg[], items: AgendaItem[], date: Ymd, now: number): Transition | undefined {
  const all: Transition[] = []
  for (const l of legs) {
    if (!l.leaveBy) continue
    all.push({ key: `leave:${l.key}:${date}`, kind: 'leave', title: l.direction === 'back' ? 'home' : l.toName, at: tsOf(date, l.leaveBy) })
  }
  for (const it of items) {
    if (it.allDay || !it.start || !START_SOURCES.has(it.source)) continue
    all.push({ key: `start:${it.key}:${date}`, kind: 'start', title: it.title, at: tsOf(date, it.start) })
  }
  // Leaving comes first when both fall at the same minute.
  return all.filter((t) => t.at > now).sort((a, b) => a.at - b.at || (a.kind === 'leave' ? -1 : 1))[0]
}

/** The next change for `me` today, from the family state. */
export function nextTransition(ctx: CalCtx, me: MemberId, now = Date.now()): Transition | undefined {
  const date = ymdOf(now)
  return nextTransitionFrom(legsFor(ctx.family, me, date), itemsOn(ctx, date, { members: [me], skipTasks: true }), date, now)
}

/** Which warning is due: 10 (5-10 minutes to go), 5 (1-5 minutes) or 1 (the last minute). Nothing outside 10 minutes. */
export function stageOf(t: Pick<Transition, 'at'>, now: number): Stage | undefined {
  const left = t.at - now
  if (left <= 0 || left > 10 * MIN) return undefined
  return left > 5 * MIN ? 10 : left > MIN ? 5 : 1
}

/** Whole minutes to go, rounded up ("7 minutes"). */
export const minutesLeft = (t: Pick<Transition, 'at'>, now: number): number => Math.max(1, Math.ceil((t.at - now) / MIN))

/** How full the calm bar is: 1 at 10 minutes to go, draining to 0. */
export const drainOf = (t: Pick<Transition, 'at'>, now: number, windowMin = 10): number => Math.min(1, Math.max(0, (t.at - now) / (windowMin * MIN)))

/**
 * The banner's words. Normally "7 minutes until we leave for School"; with countdowns hidden there are no ticking
 * numbers, just the stage: "We leave for School in about 5 minutes".
 */
export function transitionText(t: Transition, now: number, hideCountdowns: boolean): string {
  const what = t.kind === 'leave' ? `we leave for ${t.title}` : t.title
  if (hideCountdowns) {
    const st = stageOf(t, now) ?? 1
    const when = st === 1 ? 'in about a minute' : `in about ${st} minutes`
    return t.kind === 'leave' ? `We leave for ${t.title} ${when}` : `${t.title} starts ${when}`
  }
  const m = minutesLeft(t, now)
  return `${m} ${m === 1 ? 'minute' : 'minutes'} until ${what}`
}
