/**
 * The weekly round table (0.14): the home server works out the coming week and how last week went, the family
 * assistant reads it, suggests fixes and posts a short agenda, and everyone can raise things beforehand. This is the
 * timing and the bits the screens need; see the home server's weekly.py for the rest.
 */
import { addDays, toMin, weekday } from '../dates'
import type { FamilyState, Hm, Ymd } from '../types'
import type { RoundTableEvent, RoundTableNoteEvent } from './types'

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const NOTES_AT: Hm = '18:00'
/** How long "the round table is ready" shows in Needs you. */
export const READY_SHOW_MS = 36 * 3_600_000

export interface RoundTableSettings {
  on: boolean
  /** 0 = Monday ... 6 = Sunday */
  weekday: number
  at: Hm
}

export function rtSettingsOf(f: FamilyState): RoundTableSettings {
  const s = f.travel.rtSettings
  return { on: s?.on !== false, weekday: s?.weekday ?? 6, at: s?.at ?? '17:00' }
}

const monIndex = weekday // 0 = Monday

/** This week's round table: when it runs, when notes are asked for, and the week it plans (the Monday after). */
export function scheduleFor(today: Ymd, s: RoundTableSettings): { run: Ymd; notesFrom: Ymd; weekOf: Ymd } {
  const monday = addDays(today, -monIndex(today))
  const run = addDays(monday, s.weekday)
  return { run, notesFrom: addDays(run, -1), weekOf: addDays(monday, 7) }
}

/** The newest round table for this week or the next. */
export function currentRoundTable(f: FamilyState, today: Ymd): RoundTableEvent | undefined {
  const monday = addDays(today, -monIndex(today))
  return Object.values(f.travel.roundTables)
    .filter((r) => r.weekOf >= monday)
    .sort((a, b) => b.weekOf.localeCompare(a.weekOf))[0]
}

export const notesFor = (f: FamilyState, weekOf: Ymd): RoundTableNoteEvent[] =>
  Object.values(f.travel.rtNotes)
    .filter((n) => n.weekOf === weekOf && !n.deleted && n.text)
    .sort((a, b) => a.ts - b.ts)

export type RoundTablePhase = 'off' | 'later' | 'raise' | 'waiting' | 'ready'

/** Where this week's round table is up to, for Needs you and the screen's header. */
export function phaseOf(f: FamilyState, today: Ymd, now: Hm): RoundTablePhase {
  const s = rtSettingsOf(f)
  if (!s.on) return 'off'
  const { run, notesFrom, weekOf } = scheduleFor(today, s)
  const rt = f.travel.roundTables[weekOf]
  if (rt) return rt.status
  if (today === notesFrom ? toMin(now) >= toMin(NOTES_AT) : today === run && toMin(now) < toMin(s.at)) return 'raise'
  return 'later'
}

export const whenText = (s: RoundTableSettings): string => `${WEEKDAYS[s.weekday]} at ${s.at}`

/** A short line for last week's "on track?" answers. */
export function reviewLine(r: { asked: number; ok: number; done: number; later: number; late: number; skip: number; swap: number; none: number; tasksDone: number }): string {
  const bits = [r.ok + r.done ? `${r.ok + r.done} on track` : '', r.later ? `${r.later} later` : '', r.late ? `${r.late} running late` : '', r.skip ? `${r.skip} skipped` : '', r.swap ? `${r.swap} handed over` : '', r.none ? `${r.none} no answer` : '']
  const asked = r.asked ? `Asked ${r.asked} time${r.asked === 1 ? '' : 's'}: ${bits.filter(Boolean).join(', ')}` : 'No “on track?” questions'
  return `${asked}. ${r.tasksDone} task${r.tasksDone === 1 ? '' : 's'} ticked off.`
}

export const isThisWeeksReady = (f: FamilyState, today: Ymd, nowMs: number): RoundTableEvent | undefined => {
  const rt = currentRoundTable(f, today)
  return rt && rt.status === 'ready' && nowMs - rt.ts < READY_SHOW_MS && !Object.values(f.summits).some((x) => x.ts >= rt.ts) ? rt : undefined
}
