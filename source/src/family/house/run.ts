/**
 * One go at a family session, worked out from its events. Like the personal session runs (routines.ts), a house run is only ever
 * appended to - start, assign, tick, join, leave, pause, resume, end - and everything shown comes from folding them, so two
 * phones ticking jobs at the same moment always agree. The first tick of a job wins; undoing a tick (a `void` event) puts the
 * job back, and a run that had finished because of it is running again.
 */
import { activeMsAt, type Segment } from '../routines'
import { ymdOf } from '../dates'
import type { FamilyState, HouseRunEvent, HouseRunJob, HouseRunRoom, MemberId, Ymd } from '../types'

export type HouseJobStatus = 'todo' | 'done' | 'skipped'
export type HouseRunStatus = 'running' | 'paused' | 'done' | 'abandoned'

export interface HouseJobState {
  job: HouseRunJob
  assignee?: MemberId
  status: HouseJobStatus
  doneTs?: number
  /** Who did it (may differ from who tapped, or from who it was given to). */
  doneBy?: MemberId
  /** The tick's event id, so it can be undone. */
  eventId?: string
  /** Other events the tick created (a pet's water, a child's coins): undone with it. */
  linked: string[]
}

export interface HouseRunState {
  id: string
  typeId?: string
  title: string
  emoji?: string
  date: Ymd
  startedTs: number
  startedBy: MemberId
  status: HouseRunStatus
  endedTs?: number
  people: MemberId[]
  rooms: HouseRunRoom[]
  jobs: HouseJobState[]
  segments: Segment[]
  lastTs: number
  /** Personal sessions that were paused when this began (resumed when it ends). */
  pausedRuns: string[]
}

export function foldHouseRun(events: readonly HouseRunEvent[], voided: Record<string, true> = {}): HouseRunState | undefined {
  const live = events.filter((e) => !voided[e.id])
  const start = live.find((e) => e.action === 'start')
  if (!start) return undefined
  const jobs: HouseJobState[] = (start.jobs ?? []).map((job) => ({ job, assignee: job.assignee, status: 'todo', linked: [] }))
  const run: HouseRunState = {
    id: start.runId,
    typeId: start.typeId,
    title: start.title ?? 'Family session',
    emoji: start.emoji,
    date: start.date ?? ymdOf(start.ts),
    startedTs: start.ts,
    startedBy: start.learnerId,
    status: 'running',
    people: [...new Set(start.people ?? [])],
    rooms: start.rooms ?? [],
    jobs,
    segments: [{ from: start.ts }],
    lastTs: start.ts,
    pausedRuns: start.linked ?? [],
  }
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
    } else if (e.action === 'join' && e.memberId) {
      if (!run.people.includes(e.memberId)) run.people.push(e.memberId)
      run.pausedRuns = [...run.pausedRuns, ...(e.linked ?? [])]
    } else if (e.action === 'leave' && e.memberId) {
      run.people = run.people.filter((p) => p !== e.memberId)
      for (const j of jobs) if (j.status === 'todo' && j.assignee === e.memberId) j.assignee = undefined
    } else if (e.action === 'assign') {
      for (const a of e.assignments ?? []) {
        const j = jobs.find((x) => x.job.jobId === a.jobId)
        if (j && j.status === 'todo') j.assignee = a.to
      }
    } else if (e.action === 'job') {
      const j = jobs.find((x) => x.job.jobId === e.jobId)
      if (!j || j.status !== 'todo') continue
      j.status = e.status === 'skipped' ? 'skipped' : 'done'
      j.doneTs = e.ts
      j.doneBy = e.by ?? e.learnerId
      j.eventId = e.id
      j.linked = e.linked ?? []
      if (!jobs.some((x) => x.status === 'todo')) {
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

const runsCache = new WeakMap<object, { voided: object; runs: HouseRunState[] }>()

/** Every family session in the state, newest first. */
export function allHouseRuns(f: FamilyState): HouseRunState[] {
  const hit = runsCache.get(f.houseRuns)
  if (hit && hit.voided === f.voided) return hit.runs
  const runs = Object.values(f.houseRuns)
    .map((evs) => foldHouseRun(evs, f.voided))
    .filter((r): r is HouseRunState => !!r)
    .sort((a, b) => b.startedTs - a.startedTs || (a.id < b.id ? -1 : 1))
  runsCache.set(f.houseRuns, { voided: f.voided, runs })
  return runs
}

export const houseRunOf = (f: FamilyState, runId: string): HouseRunState | undefined => allHouseRuns(f).find((r) => r.id === runId)

export const isHouseLive = (r: HouseRunState): boolean => r.status === 'running' || r.status === 'paused'

/** A session nobody has touched for this long is assumed forgotten, so it does not sit on the home screen for ever. */
export const HOUSE_STALE_MS = 12 * 3_600_000

export const isHouseStale = (r: HouseRunState, now: number): boolean => isHouseLive(r) && now - r.lastTs > HOUSE_STALE_MS

/** The family session in progress, if any (the newest one that is not stale). */
export const activeHouseRun = (f: FamilyState, now: number): HouseRunState | undefined => allHouseRuns(f).find((r) => isHouseLive(r) && !isHouseStale(r, now))

/** Is this person part of the session in progress? */
export const inActiveHouseRun = (f: FamilyState, memberId: MemberId, now: number): HouseRunState | undefined => {
  const r = activeHouseRun(f, now)
  return r && r.people.includes(memberId) ? r : undefined
}

/** Did a family session of this saved type finish on `date`? */
export const houseDoneOn = (f: FamilyState, typeId: string, date: Ymd): boolean =>
  allHouseRuns(f).some((r) => r.typeId === typeId && r.date === date && r.status === 'done' && r.jobs.some((j) => j.status === 'done'))

// ------------------------------------------------------------------ last done

const doneCache = new WeakMap<object, { voided: object; map: Map<string, number> }>()

/** When each job was last really done (ticked, not skipped), across every family session. */
function lastDoneMap(f: FamilyState): Map<string, number> {
  const hit = doneCache.get(f.houseRuns)
  if (hit && hit.voided === f.voided) return hit.map
  const map = new Map<string, number>()
  for (const evs of Object.values(f.houseRuns)) {
    for (const e of evs) {
      if (e.action !== 'job' || e.status !== 'done' || !e.jobId || f.voided[e.id]) continue
      if (!evs.some((s) => s.action === 'start' && !f.voided[s.id])) continue
      if (e.ts > (map.get(e.jobId) ?? 0)) map.set(e.jobId, e.ts)
    }
  }
  doneCache.set(f.houseRuns, { voided: f.voided, map })
  return map
}

export const houseJobLastDone = (f: FamilyState, jobId: string): number | undefined => lastDoneMap(f).get(jobId)

// ------------------------------------------------------------------ readouts

export interface PersonShare {
  memberId: MemberId
  done: number
  total: number
  minutesLeft: number
}

export interface HouseProgress {
  done: number
  skipped: number
  total: number
  /** Planned minutes of the jobs still to do. */
  minutesLeft: number
  minutesTotal: number
  /** Jobs nobody has been given. */
  unassigned: number
  elapsedSec: number
  people: PersonShare[]
}

export function houseProgress(run: HouseRunState, now: number): HouseProgress {
  const t = run.endedTs ?? now
  const todo = run.jobs.filter((j) => j.status === 'todo')
  const byPerson = new Map<MemberId, PersonShare>()
  const share = (id: MemberId) => {
    let s = byPerson.get(id)
    if (!s) byPerson.set(id, (s = { memberId: id, done: 0, total: 0, minutesLeft: 0 }))
    return s
  }
  for (const p of run.people) share(p)
  for (const j of run.jobs) {
    const who = j.status === 'todo' ? j.assignee : (j.doneBy ?? j.assignee)
    if (!who) continue
    const s = share(who)
    s.total += 1
    if (j.status !== 'todo') s.done += 1
    else s.minutesLeft += j.job.minutes
  }
  return {
    done: run.jobs.filter((j) => j.status === 'done').length,
    skipped: run.jobs.filter((j) => j.status === 'skipped').length,
    total: run.jobs.length,
    minutesLeft: todo.reduce((t2, j) => t2 + j.job.minutes, 0),
    minutesTotal: run.jobs.reduce((t2, j) => t2 + j.job.minutes, 0),
    unassigned: todo.filter((j) => !j.assignee).length,
    elapsedSec: Math.round(activeMsAt(run.segments, t) / 1000),
    people: [...byPerson.values()],
  }
}

/** The jobs of one room, in the order they were planned. */
export const roomJobsOf = (run: HouseRunState, roomId: string): HouseJobState[] => run.jobs.filter((j) => j.job.roomId === roomId)

/** Can this job be started yet? Its "after" job (same room) has to be done or skipped first - shown as a gentle hint, never a block. */
export const jobWaiting = (run: HouseRunState, j: HouseJobState): HouseJobState | undefined => {
  if (!j.job.after) return undefined
  const before = run.jobs.find((x) => x.job.jobId === j.job.after)
  return before && before.status === 'todo' ? before : undefined
}
