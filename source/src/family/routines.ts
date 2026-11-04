/**
 * Sessions (called "routines" in code): a list of steps done in order against the clock.
 *
 * A routine is the saved plan. A run is one go at it: `start`, then each step ticked off or skipped, with pauses, extra time
 * and an end. Like the timers, a run is only ever appended to and everything shown (which step is current, how long it has
 * taken, how much time is left) is worked out from the timestamps, so it stays right if the phone sleeps, and two phones
 * showing the same run always agree.
 *
 * Time is measured in "active" seconds: the time between start and now with any paused stretches taken out. A step's time is
 * the active time between the previous step being ticked and this one being ticked.
 */
import { isOffDaySession, noLeavingOnDaysOff, withHabitSteps } from './checkin/routineHabits'
import type { AgendaItem } from './calendar'
import { parseDump } from './dump'
import { fmtDuration, fromMin, toMin, tsOf, ymdOf } from './dates'
import { expandDates, occursOn, type RecurCtx } from './recur'
import { homeworkSessionSteps } from './homeworkCore'
import { projectSessionSteps } from './projects'
import { duePlantSteps } from './plants'
import type { FamilyState, Hm, MemberId, RoutineEvent, RoutineStep, RunEvent, Ymd } from './types'

// ------------------------------------------------------------------- the plan

export const stepSec = (s: Pick<RoutineStep, 'minutes'>): number => Math.max(0, Math.round(s.minutes * 60))

/** Total planned minutes of a routine's steps. */
export const plannedMinutes = (steps: readonly Pick<RoutineStep, 'minutes'>[]): number => steps.reduce((t, s) => t + s.minutes, 0)

/** When to start to finish on time, as 'HH:mm' (undefined if there is no finish-by time). */
export function startBy(finishBy: Hm | undefined, steps: readonly Pick<RoutineStep, 'minutes'>[]): Hm | undefined {
  if (!finishBy) return undefined
  return fromMin((toMin(finishBy) - Math.ceil(plannedMinutes(steps)) + 1440) % 1440)
}

/** Where a routine's finish-by time falls, as a timestamp on `date`. A time that is much earlier than the start is treated as after midnight. */
export function finishByTs(date: Ymd, finishBy: Hm, startedTs: number): number {
  let t = tsOf(date, finishBy)
  if (t < startedTs - 6 * 3_600_000) t += 86_400_000
  return t
}

// ----------------------------------------------------------------- one run

export type StepStatus = 'todo' | 'done' | 'skipped'

export interface RunStepState {
  step: RoutineStep
  /** Planned seconds, before any extra time. */
  plannedSec: number
  /** Extra seconds added with "+1 min" while it was the current step. */
  extraSec: number
  status: StepStatus
  doneTs?: number
  /** Active seconds spent on it (only once it is done or skipped). */
  activeSec?: number
  /** The `run` event that finished it, so it can be undone. */
  eventId?: string
  /** It was the step being worked on when it was finished (not ticked off out of turn), so its time is a fair reading. */
  inOrder?: boolean
}

export interface Segment {
  from: number
  to?: number
}

export type RunStatus = 'running' | 'paused' | 'done' | 'abandoned'

export interface RunState {
  id: string
  routineId?: string
  title: string
  emoji?: string
  memberId: MemberId
  date: Ymd
  finishBy?: Hm
  startedTs: number
  startEventId: string
  status: RunStatus
  endedTs?: number
  steps: RunStepState[]
  segments: Segment[]
  /** When the last thing happened. */
  lastTs: number
}

/** Active milliseconds up to `t`: the time inside the running segments. */
export function activeMsAt(segments: readonly Segment[], t: number): number {
  let ms = 0
  for (const s of segments) {
    const to = Math.min(s.to ?? t, t)
    if (to > s.from) ms += to - s.from
  }
  return ms
}

/**
 * Fold a run's events. `voided` is the family's undo map: an undone step goes back to "to do" (and a run that had finished
 * because of it is running again).
 */
export function foldRun(events: readonly RunEvent[], voided: Record<string, true> = {}): RunState | undefined {
  const live = events.filter((e) => !voided[e.id])
  const start = live.find((e) => e.action === 'start')
  if (!start) return undefined
  const steps: RunStepState[] = (start.steps ?? []).map((step) => ({ step, plannedSec: stepSec(step), extraSec: 0, status: 'todo' }))
  const run: RunState = {
    id: start.runId,
    routineId: start.routineId,
    title: start.title ?? 'Session',
    emoji: start.emoji,
    memberId: start.memberId ?? start.learnerId,
    date: start.date ?? ymdOf(start.ts),
    finishBy: start.finishBy,
    startedTs: start.ts,
    startEventId: start.id,
    status: 'running',
    steps,
    segments: [{ from: start.ts }],
    lastTs: start.ts,
  }
  let marker = 0 // active ms at the last step being finished
  const close = (ts: number) => {
    const last = run.segments[run.segments.length - 1]
    if (last && last.to == null) last.to = Math.max(last.from, ts)
  }
  for (const e of live) {
    if (e === start) continue
    if (run.status === 'done' || run.status === 'abandoned') break
    run.lastTs = Math.max(run.lastTs, e.ts)
    if (e.action === 'pause' && run.status === 'running') {
      close(e.ts)
      run.status = 'paused'
    } else if (e.action === 'resume' && run.status === 'paused') {
      run.segments.push({ from: e.ts })
      run.status = 'running'
    } else if (e.action === 'extend') {
      const cur = steps.find((s) => s.status === 'todo')
      if (cur) cur.extraSec += Math.max(0, Math.round(e.sec ?? 0))
    } else if (e.action === 'step') {
      const s = steps.find((x) => x.step.id === e.stepId)
      if (!s || s.status !== 'todo') continue
      const at = activeMsAt(run.segments, e.ts)
      s.inOrder = steps.find((x) => x.status === 'todo') === s
      s.status = e.status === 'skipped' ? 'skipped' : 'done'
      s.doneTs = e.ts
      s.activeSec = Math.max(0, Math.round((at - marker) / 1000))
      s.eventId = e.id
      marker = at
      if (!steps.some((x) => x.status === 'todo')) {
        close(e.ts)
        run.status = 'done'
        run.endedTs = e.ts
      }
    } else if (e.action === 'end') {
      close(e.ts)
      run.status = e.outcome === 'abandoned' ? 'abandoned' : 'done'
      run.endedTs = e.ts
    }
  }
  return run
}

const runsCache = new WeakMap<object, { voided: object; runs: RunState[] }>()

/** Every run in the family state, newest first. Remembered until a run event (or an undo) changes the state. */
export function allRuns(f: FamilyState): RunState[] {
  const hit = runsCache.get(f.runs)
  if (hit && hit.voided === f.voided) return hit.runs
  const runs = Object.values(f.runs)
    .map((evs) => foldRun(evs, f.voided))
    .filter((r): r is RunState => !!r)
    .sort((a, b) => b.startedTs - a.startedTs || (a.id < b.id ? -1 : 1))
  runsCache.set(f.runs, { voided: f.voided, runs })
  return runs
}

export const runOf = (f: FamilyState, runId: string): RunState | undefined => {
  const evs = f.runs[runId]
  return evs ? foldRun(evs, f.voided) : undefined
}

export const isLive = (r: RunState): boolean => r.status === 'running' || r.status === 'paused'

/** A run nobody has touched for this long is assumed forgotten, so it does not sit on the home screen for ever. */
export const STALE_MS = 8 * 3_600_000

export const isStale = (r: RunState, now: number): boolean => isLive(r) && now - r.lastTs > STALE_MS

/** The run this person has open right now, if any. */
export function activeRunFor(f: FamilyState, memberId: MemberId, now: number): RunState | undefined {
  return allRuns(f).find((r) => r.memberId === memberId && isLive(r) && !isStale(r, now))
}

// --------------------------------------------------------------- the live readout

export interface RunView {
  run: RunState
  current?: RunStepState
  /** The step after the current one. */
  next?: RunStepState
  /** Seconds on the current step so far. */
  stepElapsedSec: number
  stepPlannedSec: number
  /** Planned minus elapsed; negative once the step has run over. */
  stepLeftSec: number
  /** Active seconds since the session started. */
  elapsedSec: number
  /** Planned seconds of every step that is not skipped. */
  plannedSec: number
  /** Planned seconds still to go (the current step counts what is left of it, never below zero). */
  plannedLeftSec: number
  /** If every remaining step takes what was planned, when it will be done. */
  projectedEnd: number
  finishByTs?: number
  /** Seconds to spare before finish-by (negative = running behind). Undefined without a finish-by time. */
  spareSec?: number
  /** Actual minus planned over the steps already finished (positive = behind the plan). */
  driftSec: number
  done: number
  skipped: number
  total: number
}

export function runView(run: RunState, now: number): RunView {
  const t = run.endedTs ?? now
  const active = activeMsAt(run.segments, t)
  const finished = run.steps.filter((s) => s.status !== 'todo')
  const marker = finished.length ? Math.max(...finished.map((s) => (s.doneTs ?? 0))) : run.startedTs
  const markerActive = activeMsAt(run.segments, marker)
  const todo = run.steps.filter((s) => s.status === 'todo')
  const current = todo[0]
  const next = todo[1]
  const stepElapsedSec = current ? Math.max(0, Math.round((active - markerActive) / 1000)) : 0
  const stepPlannedSec = current ? current.plannedSec + current.extraSec : 0
  const stepLeftSec = stepPlannedSec - stepElapsedSec
  const later = todo.slice(1).reduce((s, x) => s + x.plannedSec + x.extraSec, 0)
  const plannedLeftSec = current ? Math.max(0, stepLeftSec) + later : 0
  const plannedSec = run.steps.filter((s) => s.status !== 'skipped').reduce((s, x) => s + x.plannedSec, 0)
  const projectedEnd = t + plannedLeftSec * 1000
  const fb = run.finishBy ? finishByTs(run.date, run.finishBy, run.startedTs) : undefined
  const drift = finished.filter((s) => s.status === 'done').reduce((d, s) => d + ((s.activeSec ?? 0) - s.plannedSec), 0)
  return {
    run,
    current,
    next,
    stepElapsedSec,
    stepPlannedSec,
    stepLeftSec,
    elapsedSec: Math.round(active / 1000),
    plannedSec,
    plannedLeftSec,
    projectedEnd,
    finishByTs: fb,
    spareSec: fb != null && isLive(run) ? Math.round((fb - projectedEnd) / 1000) : undefined,
    driftSec: drift,
    done: run.steps.filter((s) => s.status === 'done').length,
    skipped: run.steps.filter((s) => s.status === 'skipped').length,
    total: run.steps.length,
  }
}

/** "3 min spare", "2 min behind", "on time". */
export function spareLabel(spareSec: number): string {
  const m = Math.round(Math.abs(spareSec) / 60)
  if (m === 0) return 'right on time'
  return `${fmtDuration(m)} ${spareSec > 0 ? 'to spare' : 'behind'}`
}

// ------------------------------------------------------------- learning the usual

/** Runs that finished properly (every step done or skipped), for a routine, newest first. */
export const finishedRunsOf = (f: FamilyState, routineId: string): RunState[] => allRuns(f).filter((r) => r.routineId === routineId && r.status === 'done' && r.steps.every((s) => s.status !== 'todo') && r.steps.some((s) => s.status === 'done'))

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2)
}

/** How long each step usually takes: the middle value of the last five times it was done. Steps never done are left out. */
export function typicalSec(f: FamilyState, routineId: string): Record<string, { sec: number; n: number }> {
  const seen: Record<string, number[]> = {}
  for (const r of finishedRunsOf(f, routineId).slice(0, 5)) {
    for (const s of r.steps) if (s.status === 'done' && s.inOrder && s.activeSec != null && s.activeSec >= 5) (seen[s.step.id] ??= []).push(s.activeSec)
  }
  const out: Record<string, { sec: number; n: number }> = {}
  for (const [id, xs] of Object.entries(seen)) out[id] = { sec: median(xs), n: xs.length }
  return out
}

/** The routine's steps with their minutes set to what they usually take (rounded to half a minute, never under 30 seconds). */
export function stepsAtTypicalTimes(steps: readonly RoutineStep[], typical: Record<string, { sec: number; n: number }>): RoutineStep[] {
  return steps.map((s) => {
    const t = typical[s.id]
    return t ? { ...s, minutes: Math.max(0.5, Math.round(t.sec / 30) / 2) } : s
  })
}

/** Minutes as a short label: 0.5 -> '30s', 1 -> '1 min', 12 -> '12 min'. */
export function minLabel(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  const rounded = Math.round(minutes * 2) / 2
  return `${rounded} min`
}

// ------------------------------------------------------------------ scheduling

export const liveRoutines = (f: FamilyState): RoutineEvent[] =>
  Object.values(f.routines)
    .filter((r) => !r.deleted)
    .sort((a, b) => a.title.localeCompare(b.title))

/** Does this routine fall on `date`? Needs a date and (to show on a day) a start time. */
export function routineOccursOn(r: RoutineEvent, date: Ymd, rc: RecurCtx = {}): boolean {
  if (r.deleted || !r.date) return false
  if (r.recur) return occursOn(r.recur, r.date, date, rc) && !(r.exdates ?? []).includes(date)
  return r.date === date && !(r.exdates ?? []).includes(date)
}

/** Has this routine been finished on `date`? (A run that started that day and got to the end.) */
export function routineDoneOn(f: FamilyState, routineId: string, date: Ymd): boolean {
  return allRuns(f).some((r) => r.routineId === routineId && r.date === date && r.status === 'done' && r.steps.every((s) => s.status !== 'todo') && r.steps.some((s) => s.status === 'done'))
}

/** Sessions that are due on `date`, for someone (or for anyone), in start-time order. */
export function routinesOn(f: FamilyState, date: Ymd, opts: { memberId?: MemberId; rc?: (m: MemberId | undefined) => RecurCtx } = {}): RoutineEvent[] {
  return liveRoutines(f)
    .filter((r) => (!opts.memberId || !r.ownerId || r.ownerId === opts.memberId) && routineOccursOn(r, date, opts.rc?.(r.ownerId) ?? {}))
    .sort((a, b) => (a.startAt ?? '99').localeCompare(b.startAt ?? '99') || a.title.localeCompare(b.title))
}

/** The steps a session will run with on `date`: its saved steps, or for a daily homework session, its owner's homework
 * planned for that day (see homeworkCore.ts). Use this rather than `r.steps` anywhere a session is described. */
export function sessionStepsOn(f: FamilyState, r: RoutineEvent, date: Ymd): RoutineStep[] {
  if (r.homework) return homeworkSessionSteps(f, r.ownerId ?? '', date)
  if (r.project) return projectSessionSteps(f, r)
  if (r.plants) return duePlantSteps(f)
  return withHabitSteps(f, r.steps, r.ownerId, date, { noLeaving: isOffDaySession(r) && noLeavingOnDaysOff(f, r.ownerId) })
}

/** Sessions with a start time show on the calendar as a soft (non-blocking) item. */
export function routineItemsOn(f: FamilyState, date: Ymd, rc: (m: MemberId | undefined) => RecurCtx = () => ({})): AgendaItem[] {
  const out: AgendaItem[] = []
  for (const r of routinesOn(f, date, { rc })) {
    const steps = sessionStepsOn(f, r, date)
    const mins = Math.ceil(plannedMinutes(steps))
    out.push({
      key: `session:${r.routineId}:${date}`,
      source: 'routine',
      title: `${r.emoji ? `${r.emoji} ` : ''}${r.title}`,
      sub: r.homework ? `${steps.filter((s) => s.taskId).length} pieces planned · ${fmtDuration(mins)}` : `${steps.length} steps · ${fmtDuration(mins)}`,
      date,
      start: r.startAt,
      end: r.startAt ? fromMin(toMin(r.startAt) + mins) : undefined,
      allDay: !r.startAt,
      members: r.ownerId ? [r.ownerId] : [],
      everyone: !r.ownerId,
      category: 'session',
      busy: false,
      notes: steps.map((s) => `${s.emoji ? `${s.emoji} ` : ''}${s.title} (${minLabel(s.minutes)})`).join('\n'),
    })
  }
  return out
}

/** Next dates (from `from`, up to `days` ahead) a routine is due; for the editor's "next: Mon 21 Sep". */
export function upcomingDates(r: RoutineEvent, from: Ymd, days: number, rc: RecurCtx = {}): Ymd[] {
  if (!r.date) return []
  const to = new Date(Date.parse(`${from}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
  return expandDates(r.recur, r.date, from, to, r.exdates, rc)
}

// ------------------------------------------------------------- typing steps in

/**
 * Turn typed or pasted lines into steps: "Brush teeth ~2", "Shower ~10m", or just "Pack bag" (which gets `fallback` minutes).
 * Uses the same reading as the brain dump, so the two feel the same.
 */
export function parseSteps(text: string, fallback = 5): { title: string; minutes: number }[] {
  return parseDump(text).map((d) => ({ title: d.title, minutes: d.minutes ?? fallback }))
}
