import type { FamilyState, MemberId, TimerState } from './types'

/** Time actually spent on a timer (pauses excluded). Derived from timestamps, so it stays right if the phone sleeps or the app is closed. */
export function elapsedMs(t: TimerState, now: number): number {
  let ms = 0
  for (const s of t.segments) ms += Math.max(0, (s.to ?? now) - s.from)
  return ms
}

export const elapsedSec = (t: TimerState, now: number): number => Math.floor(elapsedMs(t, now) / 1000)

export const totalSec = (t: TimerState): number => (t.plannedSec > 0 ? t.plannedSec + t.extraSec : 0)

/** Seconds left on a countdown (negative once it is over time), or undefined for a count-up timer. */
export function remainingSec(t: TimerState, now: number): number | undefined {
  const total = totalSec(t)
  if (!total) return undefined
  return total - elapsedSec(t, now)
}

export const isFinishing = (t: TimerState, now: number): boolean => t.status === 'running' && (remainingSec(t, now) ?? 1) <= 0

/** Timers still in progress (running or paused), newest first, optionally for one person or one baby/pet. */
export function activeTimers(f: FamilyState, opts: { memberId?: MemberId; subjectId?: MemberId } = {}): TimerState[] {
  return Object.values(f.timers)
    .filter((t) => (t.status === 'running' || t.status === 'paused') && (!opts.memberId || t.memberId === opts.memberId) && (!opts.subjectId || t.subjectId === opts.subjectId))
    .sort((a, b) => b.startedTs - a.startedTs)
}

/** '12:05' or '1:02:09'. Negative values show as '+0:42' style overtime (caller decides on the sign). */
export function fmtClock(sec: number): string {
  const s = Math.abs(Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return h ? `${h}:${mm}:${String(r).padStart(2, '0')}` : `${mm}:${String(r).padStart(2, '0')}`
}
