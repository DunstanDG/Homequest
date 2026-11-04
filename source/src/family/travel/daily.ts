/**
 * The day as it happens (0.13): the home server's suggested plan for each person's day, the morning overview it sends
 * to their phone, and the "on track?" questions it asks as things come up. The server does the planning and the
 * sending; this is what the Today screen needs to show them and answer them.
 */
import { hmOf, toMin } from '../dates'
import type { FamilyState, Hm, MemberId, Ymd } from '../types'
import type { DayPlanEvent, NudgeAnswer, NudgeEvent, NudgeReplyEvent, PlanBlock, PlanKind } from './types'

export const DEFAULT_MORNING_AT: Hm = '07:00'

/** How long a question stays on Today without an answer. */
export const NUDGE_OPEN_MIN = 90

export interface DailyPrefs {
  morning: boolean
  morningAt: Hm
  nudges: boolean
}

export function dailyPrefsOf(f: FamilyState, m: MemberId): DailyPrefs {
  const p = f.travel.dailyPrefs[m]
  return { morning: p?.morning !== false, morningAt: p?.morningAt ?? DEFAULT_MORNING_AT, nudges: p?.nudges !== false }
}

export const dayPlanOf = (f: FamilyState, m: MemberId, date: Ymd): DayPlanEvent | undefined => f.travel.dayPlans[`${m}|${date}`]

export const PLAN_EMOJI: Record<PlanKind, string> = {
  event: '📅',
  school: '🏫',
  club: '♣️',
  travel: '🚆',
  meal: '🍽️',
  homework: '✏️',
  task: '☑️',
  care: '🍼',
  walk: '🐕',
  cook: '🍳',
  free: '🌿',
}

/** The blocks worth listing: everything except meals (they're on the timeline already) and free time under an hour. */
export function planRows(p: DayPlanEvent): PlanBlock[] {
  return p.blocks.filter((b) => b.kind !== 'meal' && (b.kind !== 'free' || toMin(b.end) - toMin(b.start) >= 60))
}

/** Where the day is up to: the block on now (if any) and those still to come. */
export function nowAndNext(rows: PlanBlock[], now: number): { now?: PlanBlock; next: PlanBlock[]; past: number } {
  const t = hmOf(now)
  const cur = rows.find((b) => b.start <= t && t < b.end && b.kind !== 'free')
  const next = rows.filter((b) => b.start > t)
  return { now: cur, next, past: rows.filter((b) => b.end <= t).length }
}

export const spareText = (n: number): string => {
  if (n <= 0) return 'No spare time today'
  const h = Math.floor(n / 60)
  const m = n % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m spare` : `${m} min spare`
}

export const latestReply = (f: FamilyState, nudgeId: string): NudgeReplyEvent | undefined => f.travel.nudgeReplies[nudgeId]

/** Questions for this person today that nobody has answered yet (a later re-ask replaces the earlier one). */
export function openNudges(f: FamilyState, m: MemberId, date: Ymd, now: number): NudgeEvent[] {
  const mine = Object.values(f.travel.nudges).filter((n) => n.memberId === m && n.date === date)
  const base = (n: NudgeEvent) => n.nudgeId.split('-')[0]!
  const newest = new Map<string, number>()
  for (const n of mine) newest.set(base(n), Math.max(newest.get(base(n)) ?? 0, n.n ?? 1))
  return mine
    .filter((n) => (n.n ?? 1) === newest.get(base(n)) && !latestReply(f, n.nudgeId) && now - n.ts < NUDGE_OPEN_MIN * 60_000)
    .sort((a, b) => a.ts - b.ts)
}

export function question(n: NudgeEvent): string {
  if (n.kind === 'travel') return `${n.title}: leave at ${n.start}. On track?`
  if (n.kind === 'homework' || n.kind === 'task') return `${n.title} is planned for ${n.start}${n.minutes ? ` (about ${n.minutes} min)` : ''}. Ready to start?`
  return `${n.title} at ${n.start}. Still on for it?`
}

export interface NudgeButton {
  answer: NudgeAnswer
  label: string
  minutes?: number
  /** Also start a timer for the task (homework/task "Start now"). */
  timer?: boolean
  /** Also tick the task off. */
  tick?: boolean
  primary?: boolean
}

/** The answers offered for each kind of question. "Can someone else?" only makes sense for a parent's jobs. */
export function buttonsFor(n: NudgeEvent, isParent: boolean, hasTask: boolean): NudgeButton[] {
  if (n.kind === 'travel')
    return [
      { answer: 'ok', label: 'On track', primary: true },
      { answer: 'late', label: 'Running late' },
      { answer: 'skip', label: 'Not going' },
    ]
  if (n.kind === 'homework' || n.kind === 'task')
    return [
      hasTask ? { answer: 'ok', label: 'Start now', timer: true, primary: true } : { answer: 'ok', label: 'On it', primary: true },
      ...(hasTask ? [{ answer: 'done' as const, label: 'Already done', tick: true }] : []),
      { answer: 'later', label: 'In 15 min', minutes: 15 },
      { answer: 'skip', label: 'Not today' },
    ]
  return [
    { answer: 'ok', label: 'On it', primary: true },
    { answer: 'later', label: 'In 15 min', minutes: 15 },
    ...(isParent ? [{ answer: 'swap' as const, label: 'Can someone else?' }] : []),
  ]
}

export const ANSWER_TOAST: Record<NudgeAnswer, string> = {
  ok: 'Great, good luck!',
  done: 'Nice one!',
  later: 'OK, I’ll ask again in a bit.',
  late: 'Thanks, the others have been told.',
  skip: 'OK, no more questions about that today.',
  swap: 'Asked the other grown-ups to take it.',
}
