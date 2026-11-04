/**
 * Everything a person can do with the house and family sessions, as functions that return the events to append (no React here,
 * same rules as actions.ts): seed and edit the rooms and jobs, save session types, and run a session - start it, hand out jobs,
 * tick them, pause, join, leave, end.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import { completeTask, logPet, saveTask } from '../actions'
import { SEED_TS } from '../planActions'
import { pauseRun, resumeRun } from '../planActions'
import { activeRunFor, runOf } from '../routines'
import { ymdOf } from '../dates'
import type { FamilyState, HouseDepth, HouseJobEvent, HouseRoomEvent, HouseRunJob, HouseTypeEvent, MemberId, Ymd } from '../types'
import { houseCoins, isHouseChild, liveHouseJobs, liveHouseRooms, theDog } from './house'
import { houseRunOf, isHouseLive } from './run'
import { STARTER_ROOMS } from './starter'
import { autoAssign } from './assign'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

function bodyOf<T extends { type: string; id: string; ts: number; day: string; learnerId: string; v: number }>(e: T): Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = e
  return rest
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// ------------------------------------------------------------------ the starter catalogue

export const starterRoomId = (key: string, childId?: MemberId): string => `hr-${key}${childId ? `-${childId}` : ''}`

/** Starter rooms the family does not have yet (even a deleted one counts as "had it"; use restoreStarterRoom for that). */
export function missingStarterRooms(f: FamilyState): { key: string; name: string; childId?: MemberId }[] {
  const children = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const out: { key: string; name: string; childId?: MemberId }[] = []
  for (const s of STARTER_ROOMS) {
    if (s.perChild) {
      for (const c of children) if (!f.houseRooms[starterRoomId(s.key, c.id)]) out.push({ key: s.key, name: `${c.name}'s room`, childId: c.id })
    } else if (!f.houseRooms[starterRoomId(s.key)]) out.push({ key: s.key, name: s.name })
  }
  return out
}

const STARTER_TYPES: { typeId: string; name: string; emoji: string; depth: HouseDepth; rooms: HouseTypeEvent['rooms']; order: number }[] = [
  { typeId: 'hs-type-clean', name: 'House clean', emoji: '🧹', depth: 'standard', rooms: 'indoor', order: 1 },
  { typeId: 'hs-type-quick', name: 'Quick tidy', emoji: '✨', depth: 'quick', rooms: 'quick', order: 2 },
  { typeId: 'hs-type-garden', name: 'Garden day', emoji: '🌿', depth: 'standard', rooms: 'outdoor', order: 3 },
  { typeId: 'hs-type-deep', name: 'Deep clean', emoji: '🧽', depth: 'deep', rooms: 'indoor', order: 4 },
]

/** Events for one starter room and its jobs. Ids and times are fixed, so two phones adding it at once make one copy and any later edit wins. */
function roomEvents(actor: MemberId, f: FamilyState, key: string, childId: MemberId | undefined, order: number): AppEvent[] {
  const s = STARTER_ROOMS.find((r) => r.key === key)
  if (!s) return []
  const roomId = starterRoomId(key, childId)
  const child = childId ? f.members[childId] : undefined
  const out: AppEvent[] = [
    ev(
      actor,
      {
        type: 'house-room',
        roomId,
        name: child ? `${child.name}'s room` : s.name,
        emoji: s.emoji,
        outdoor: s.outdoor,
        ownerId: childId,
        quickTidy: s.quickTidy,
        requires: s.requires,
        order,
        starterKey: key,
      },
      SEED_TS,
      `seed-${roomId}`,
    ),
  ]
  const idOf = (title: string) => `${roomId}-${slug(title)}`
  s.jobs.forEach((j, i) => {
    const jobId = idOf(j.title)
    out.push(
      ev(
        actor,
        {
          type: 'house-job',
          jobId,
          roomId,
          title: j.title,
          minutes: j.minutes,
          minAge: j.minAge,
          depth: j.depth,
          resetDays: j.resetDays,
          months: j.months,
          requires: j.requires,
          link: j.link,
          phase: j.phase,
          after: j.after ? idOf(j.after) : undefined,
          notes: j.notes,
          shopName: j.shopName,
          cleaner: j.cleaner,
          order: i,
          starterKey: slug(j.title),
        },
        SEED_TS,
        `seed-${jobId}`,
      ),
    )
  })
  return out
}

/** First visit: add the starter rooms, jobs and four saved sessions. Later: add any starter room that is missing (e.g. a new child's room). */
export function seedHouse(actor: MemberId, f: FamilyState): AppEvent[] {
  const first = Object.keys(f.houseRooms).length === 0
  const missing = missingStarterRooms(f)
  const out: AppEvent[] = []
  let order = Object.keys(f.houseRooms).length
  for (const m of missing) out.push(...roomEvents(actor, f, m.key, m.childId, order++))
  if (first && !Object.keys(f.houseTypes).length)
    for (const t of STARTER_TYPES)
      out.push(ev(actor, { type: 'house-type', typeId: t.typeId, name: t.name, emoji: t.emoji, depth: t.depth, rooms: t.rooms, order: t.order }, SEED_TS, `seed-${t.typeId}`))
  return out
}

/** Bring a removed room back (with its jobs, which were only hidden). */
export function restoreRoom(actor: MemberId, room: HouseRoomEvent, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'house-room', ...bodyOf(room), deleted: false }, now)]
}

// ------------------------------------------------------------------ rooms and jobs

export type RoomDraft = Omit<HouseRoomEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'roomId' | 'order'> & { roomId?: string; order?: number }

export function saveRoom(actor: MemberId, f: FamilyState, r: RoomDraft, now = Date.now()): AppEvent[] {
  const { roomId, order, name, ...rest } = r
  const existing = roomId ? f.houseRooms[roomId] : undefined
  return [ev(actor, { type: 'house-room', roomId: roomId ?? uid('hr'), name: name.trim() || 'Room', order: order ?? existing?.order ?? liveHouseRooms(f).length, ...rest }, now)]
}

export const deleteRoom = (actor: MemberId, room: HouseRoomEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-room', ...bodyOf(room), deleted: true }, now)]

export type JobDraft = Omit<HouseJobEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'jobId' | 'order' | 'phase' | 'minAge' | 'depth' | 'resetDays'> &
  Partial<Pick<HouseJobEvent, 'order' | 'phase' | 'minAge' | 'depth' | 'resetDays'>> & { jobId?: string }

export function saveJob(actor: MemberId, f: FamilyState, j: JobDraft, now = Date.now()): AppEvent[] {
  const { jobId, title, minutes, order, phase, minAge, depth, resetDays, ...rest } = j
  const existing = jobId ? f.houseJobs[jobId] : undefined
  return [
    ev(
      actor,
      {
        type: 'house-job',
        jobId: jobId ?? uid('hj'),
        title: title.trim() || 'Job',
        minutes: Math.max(1, Math.round(minutes || 5)),
        order: order ?? existing?.order ?? liveHouseJobs(f, j.roomId).length,
        phase: phase ?? existing?.phase ?? 3,
        minAge: minAge ?? existing?.minAge ?? 6,
        depth: depth ?? existing?.depth ?? 'standard',
        resetDays: Math.max(0, Math.round(resetDays ?? existing?.resetDays ?? 0)),
        ...rest,
      },
      now,
    ),
  ]
}

export const deleteJob = (actor: MemberId, job: HouseJobEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-job', ...bodyOf(job), deleted: true }, now)]

// ------------------------------------------------------------------ saved sessions

export type TypeDraft = Omit<HouseTypeEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'typeId'> & { typeId?: string }

export function saveType(actor: MemberId, t: TypeDraft, now = Date.now()): AppEvent[] {
  const { typeId, name, ...rest } = t
  return [ev(actor, { type: 'house-type', typeId: typeId ?? uid('hs'), name: name.trim() || 'Family session', ...rest }, now)]
}

export const deleteType = (actor: MemberId, t: HouseTypeEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-type', ...bodyOf(t), deleted: true }, now)]

export const setHouseCleaner = (actor: MemberId, cleaner: boolean, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-config', cleaner }, now)]

// ------------------------------------------------------------------ running a session

export interface PickedJob {
  room: HouseRoomEvent
  job: HouseJobEvent
  /** link 'plants': the plants due in this room. */
  plantIds?: string[]
}

export interface StartInput {
  typeId?: string
  title: string
  emoji?: string
  people: MemberId[]
  picked: PickedJob[]
  /** jobId -> person, as confirmed on the setup screen. */
  assignments?: Record<string, MemberId | undefined>
  date?: Ymd
}

/**
 * Begin a family session. Every job is copied into the start event (so editing the catalogue later never rewrites what was
 * done), and anyone taking part who has a personal session running has it paused; it is resumed when this one ends.
 */
export function startHouseRun(actor: MemberId, f: FamilyState, input: StartInput, now = Date.now()): { runId: string; events: AppEvent[] } {
  const runId = uid('hrun')
  if (!input.picked.length || !input.people.length) return { runId, events: [] }
  const date = input.date ?? ymdOf(now)
  const rooms = new Map<string, { roomId: string; name: string; emoji?: string }>()
  const jobs: HouseRunJob[] = input.picked.map(({ room, job, plantIds }) => {
    if (!rooms.has(room.roomId)) rooms.set(room.roomId, { roomId: room.roomId, name: room.name, emoji: room.emoji })
    return {
      jobId: job.jobId,
      roomId: room.roomId,
      roomName: room.name,
      roomEmoji: room.emoji,
      title: job.title,
      minutes: job.minutes,
      coins: houseCoins(job),
      minAge: job.minAge,
      phase: job.phase,
      after: job.after,
      link: job.link,
      shopName: job.shopName,
      notes: job.notes,
      plantIds: job.link === 'plants' ? (plantIds ?? []) : undefined,
      assignee: input.assignments?.[job.jobId],
    }
  })
  const paused: AppEvent[] = []
  const pausedIds: string[] = []
  input.people.forEach((p, i) => {
    const mine = activeRunFor(f, p, now)
    if (mine && mine.status === 'running') {
      paused.push(...pauseRun(actor, mine.id, now + 1 + i))
      pausedIds.push(mine.id)
    }
  })
  const start = ev(
    actor,
    {
      type: 'house-run',
      runId,
      action: 'start',
      typeId: input.typeId,
      title: input.title,
      emoji: input.emoji,
      date,
      people: [...new Set(input.people)],
      rooms: [...rooms.values()],
      jobs,
      linked: pausedIds,
    },
    now,
  )
  return { runId, events: [start, ...paused] }
}

/** Hand jobs to people (`to` undefined = up for grabs). */
export function assignJobs(actor: MemberId, runId: string, assignments: { jobId: string; to?: MemberId }[], now = Date.now()): AppEvent[] {
  return assignments.length ? [ev(actor, { type: 'house-run', runId, action: 'assign', assignments }, now)] : []
}

/** Share the jobs nobody has been given between the people taking part (after someone joins, say). */
export function shareOutRest(actor: MemberId, f: FamilyState, runId: string, now = Date.now()): AppEvent[] {
  const run = houseRunOf(f, runId)
  if (!run || !isHouseLive(run)) return []
  const todo = run.jobs.filter((j) => j.status === 'todo')
  const locked: Record<string, MemberId> = {}
  for (const j of todo) if (j.assignee && run.people.includes(j.assignee)) locked[j.job.jobId] = j.assignee
  const byRoom = new Map<string, { roomId: string; ownerId?: MemberId; jobs: { jobId: string; minutes: number; minAge: number }[] }>()
  for (const j of todo) {
    const r = byRoom.get(j.job.roomId) ?? { roomId: j.job.roomId, ownerId: f.houseRooms[j.job.roomId]?.ownerId, jobs: [] }
    r.jobs.push({ jobId: j.job.jobId, minutes: j.job.minutes, minAge: j.job.minAge })
    byRoom.set(j.job.roomId, r)
  }
  const who = autoAssign(f, run.people, [...byRoom.values()], run.date, locked)
  return assignJobs(
    actor,
    runId,
    todo.filter((j) => !j.assignee && who[j.job.jobId]).map((j) => ({ jobId: j.job.jobId, to: who[j.job.jobId] })),
    now,
  )
}

/** Resume the personal sessions this one paused (the ones still paused). */
function resumePersonal(actor: MemberId, f: FamilyState, ids: readonly string[], now: number): AppEvent[] {
  return ids.flatMap((id, i) => {
    const r = runOf(f, id)
    return r && r.status === 'paused' ? resumeRun(actor, id, now + i) : []
  })
}

/**
 * Tick a job (done or skipped). Whoever did it is `by` (ticking for a child) or the person tapping. Done jobs may have effects:
 * "Change dog water" logs the dog's water, and a child earns the job's coins (waiting for a parent's check unless a parent
 * ticked). Plants watered are worked out from the tick itself (see plants.ts). All of it is undone with the tick. Returns
 * nothing if the job is already finished or the session is not open, so a double tap or a second phone never double-counts.
 */
export function tickHouseJob(actor: MemberId, f: FamilyState, runId: string, jobId: string, status: 'done' | 'skipped', by?: MemberId, now = Date.now()): AppEvent[] {
  const run = houseRunOf(f, runId)
  if (!run || !isHouseLive(run)) return []
  const j = run.jobs.find((x) => x.job.jobId === jobId)
  if (!j || j.status !== 'todo') return []
  const doer = by ?? actor
  const linked: AppEvent[] = []
  if (status === 'done') {
    if (j.job.link === 'dog-water') {
      const dog = theDog(f)
      if (dog) linked.push(...logPet(doer, f, { petId: dog.id, kind: 'water', at: now }, now + 1))
    }
    if (isHouseChild(f, doer) && j.job.coins > 0) {
      const taskId = `house-${runId}-${jobId}`
      const have = f.done[`${taskId}|${run.date}`]
      if (!have || have.status === 'rejected') {
        const [task] = saveTask(
          actor,
          {
            taskId,
            title: `${j.job.roomName}: ${j.job.title}`,
            assignee: doer,
            kind: 'chore',
            part: 'any',
            date: run.date,
            minutes: j.job.minutes,
            coins: j.job.coins,
            check: 'parent',
            source: `house:${runId}`,
          },
          now + 2,
        )
        if (task && task.type === 'task') linked.push(task, ...completeTask(actor, f, task, run.date, { minutes: j.job.minutes }, now + 3))
      }
    }
  }
  const tick = ev(actor, { type: 'house-run', runId, action: 'job', jobId, status, by: by && by !== actor ? by : undefined, linked: linked.map((e) => e.id) }, now)
  const out = [tick, ...linked]
  // That was the last job: the session is over, so personal sessions it paused carry on.
  if (run.jobs.every((x) => x.job.jobId === jobId || x.status !== 'todo')) out.push(...resumePersonal(actor, f, run.pausedRuns, now + 10))
  return out
}

/** Take a tick back: the job, and everything it set going. If a second phone ticked the same job, that tick goes too, or the job would still show as done. */
export function untickHouseJob(actor: MemberId, f: FamilyState, runId: string, jobId: string, now = Date.now()): AppEvent[] {
  const run = houseRunOf(f, runId)
  const j = run?.jobs.find((x) => x.job.jobId === jobId)
  if (!run || !j || j.status === 'todo') return []
  const ticks = (f.houseRuns[runId] ?? []).filter((e) => e.action === 'job' && e.jobId === jobId && !f.voided[e.id])
  const targets = [...new Set(ticks.flatMap((e) => [e.id, ...(e.linked ?? [])]))]
  return targets.map((targetId, i) => ev(actor, { type: 'void', targetId }, now + i))
}

export const joinHouseRun = (actor: MemberId, f: FamilyState, runId: string, memberId: MemberId, now = Date.now()): AppEvent[] => {
  const run = houseRunOf(f, runId)
  if (!run || !isHouseLive(run) || run.people.includes(memberId)) return []
  const mine = activeRunFor(f, memberId, now)
  const paused = mine && mine.status === 'running' ? pauseRun(actor, mine.id, now + 1) : []
  return [ev(actor, { type: 'house-run', runId, action: 'join', memberId, linked: paused.length ? [mine!.id] : undefined }, now), ...paused]
}

export const leaveHouseRun = (actor: MemberId, f: FamilyState, runId: string, memberId: MemberId, now = Date.now()): AppEvent[] => {
  const run = houseRunOf(f, runId)
  if (!run || !isHouseLive(run) || !run.people.includes(memberId)) return []
  return [ev(actor, { type: 'house-run', runId, action: 'leave', memberId }, now)]
}

export const pauseHouseRun = (actor: MemberId, runId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-run', runId, action: 'pause' }, now)]
export const resumeHouseRun = (actor: MemberId, runId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'house-run', runId, action: 'resume' }, now)]

/** Finish the session now (whatever is left stays undone), or call it off. */
export function endHouseRun(actor: MemberId, f: FamilyState, runId: string, outcome?: 'abandoned', now = Date.now()): AppEvent[] {
  const run = houseRunOf(f, runId)
  if (!run || !isHouseLive(run)) return []
  return [ev(actor, { type: 'house-run', runId, action: 'end', outcome }, now), ...resumePersonal(actor, f, run.pausedRuns, now + 1)]
}
