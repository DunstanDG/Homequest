/**
 * "I'm overwhelmed", the synced part (see docs/calm/CONTRACT.md). A `calm-pause` event per person says questions and
 * reminders wait until `until`; the latest per person wins and `until <= now` means not paused. `askHelp` asks a
 * grown-up (or, from an adult, the family) for a calm moment and some help; "I'm on it" re-writes it with
 * `askHelp: false` and `helper` set, so every phone stops showing the request.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import type { CalmPauseEvent, FamilyState, MemberId } from './types'

export interface CalmPause {
  until: number
  askHelp: boolean
  helper?: MemberId
  /** When it was last written (ms). */
  ts: number
  ev: CalmPauseEvent
}

/** This person's pause, if it is still on at `now`. */
export function calmPauseOf(f: FamilyState, memberId: MemberId, now = Date.now()): CalmPause | undefined {
  const ev = f.calmPauses?.[memberId]
  if (!ev || !(ev.until > now)) return undefined
  return { until: ev.until, askHelp: !!ev.askHelp, helper: ev.helper, ts: ev.ts, ev }
}

/** Who is asking for help right now, oldest first (never the viewer themselves). */
export function helpRequests(f: FamilyState, now = Date.now(), viewer?: MemberId): { memberId: MemberId; pause: CalmPause }[] {
  const out: { memberId: MemberId; pause: CalmPause }[] = []
  for (const memberId of Object.keys(f.calmPauses ?? {})) {
    if (memberId === viewer) continue
    const p = calmPauseOf(f, memberId, now)
    if (p?.askHelp) out.push({ memberId, pause: p })
  }
  return out.sort((a, b) => a.pause.ts - b.pause.ts)
}

/** Pause questions and reminders for `memberId` until `until`; keeps an open help request unless told otherwise. */
export function pauseCalm(actor: MemberId, f: FamilyState, memberId: MemberId, until: number, opts: { askHelp?: boolean } = {}, now = Date.now()): AppEvent[] {
  const cur = calmPauseOf(f, memberId, now)
  const askHelp = opts.askHelp ?? cur?.askHelp ?? false
  return [makeEvent(actor, { type: 'calm-pause', memberId, until: Math.max(until, cur?.until ?? 0), ...(askHelp ? { askHelp: true } : {}) }, now)]
}

/** "I'm on it": a grown-up has seen the request. The pause itself carries on. */
export function helpOnIt(actor: MemberId, f: FamilyState, memberId: MemberId, now = Date.now()): AppEvent[] {
  const cur = calmPauseOf(f, memberId, now)
  if (!cur?.askHelp) return []
  return [makeEvent(actor, { type: 'calm-pause', memberId, until: cur.until, askHelp: false, helper: actor }, now)]
}

/** "Back to normal": ends the pause (and any help request). Nothing to write if there is no pause on. */
export function endCalmPause(actor: MemberId, f: FamilyState, memberId: MemberId, now = Date.now()): AppEvent[] {
  if (!calmPauseOf(f, memberId, now)) return []
  return [makeEvent(actor, { type: 'calm-pause', memberId, until: now }, now)]
}
