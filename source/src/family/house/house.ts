/**
 * The house catalogue and what a family session would include right now.
 *
 * Rooms and jobs are the family's own list (seeded from starter.ts, then edited freely). A saved session type picks which
 * rooms and how deep to go. `planSetup` works out, for one day, every job a session could include and why it is or is not
 * ticked by default: it is due, it was done recently ("not due yet"), it is out of season, a cleaner usually does it, or it
 * is deeper than this kind of session. Everything except "due" is folded away in the setup screen, ready to be added early.
 */
import { daysBetween, ymdOf } from '../dates'
import { livePlants, plantStatus } from '../plants'
import type { FamilyState, HouseConfigEvent, HouseDepth, HouseJobEvent, HouseNeed, HouseRoomEvent, HouseTypeEvent, Member, MemberId, PlantEvent, Ymd } from '../types'
import { houseJobLastDone } from './run'

// ------------------------------------------------------------------ the catalogue

export const liveHouseRooms = (f: FamilyState): HouseRoomEvent[] =>
  Object.values(f.houseRooms)
    .filter((r) => !r.deleted)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

export const liveHouseJobs = (f: FamilyState, roomId?: string): HouseJobEvent[] =>
  Object.values(f.houseJobs)
    .filter((j) => !j.deleted && (!roomId || j.roomId === roomId) && !!f.houseRooms[j.roomId] && !f.houseRooms[j.roomId]!.deleted)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

export const liveHouseTypes = (f: FamilyState): HouseTypeEvent[] =>
  Object.values(f.houseTypes)
    .filter((t) => !t.deleted)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))

/** True when the family has set up any rooms yet. */
export const hasHouse = (f: FamilyState): boolean => liveHouseRooms(f).length > 0

/** We have a cleaner: jobs marked "a cleaner usually does this" are left out by default. */
export const houseHasCleaner = (f: FamilyState): boolean => (f.houseConfig as HouseConfigEvent | undefined)?.cleaner === true

// ------------------------------------------------------------------ needs and seasons

export const housePets = (f: FamilyState): Member[] => Object.values(f.members).filter((m) => m.active && m.role === 'pet')

export function hasNeed(f: FamilyState, need: HouseNeed | undefined): boolean {
  if (!need) return true
  if (need === 'dog') return housePets(f).some((p) => /dog|puppy/i.test(p.petKind ?? ''))
  if (need === 'baby') return Object.values(f.members).some((m) => m.active && m.role === 'baby')
  return livePlants(f).length > 0
}

/** The first dog in the family (the one "Change dog water" logs for). */
export const theDog = (f: FamilyState): Member | undefined => housePets(f).find((p) => /dog|puppy/i.test(p.petKind ?? ''))

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Plants that live in a room (the plant's "where it lives" text mentions the room's name, either way round). */
export function roomPlants(f: FamilyState, roomName: string): PlantEvent[] {
  const r = norm(roomName)
  if (!r) return []
  return livePlants(f).filter((p) => {
    const w = norm(p.room ?? '')
    return !!w && (w.includes(r) || r.includes(w))
  })
}

export const inSeason = (months: readonly number[] | undefined, date: Ymd): boolean => !months?.length || months.includes(Number(date.slice(5, 7)))

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Mar to Sep", "Oct, Nov, Dec and Jan", "all year". */
export function monthsLabel(months: readonly number[] | undefined): string {
  if (!months?.length || months.length >= 12) return 'all year'
  const set = new Set(months)
  const start = [...set].filter((m) => !set.has(m === 1 ? 12 : m - 1))
  if (start.length !== 1)
    return [...set]
      .sort((a, b) => a - b)
      .map((m) => MONTH_ABBR[m - 1])
      .join(', ')
  let m = start[0]!
  const run = [m]
  while (set.has(m === 12 ? 1 : m + 1) && run.length < 12) {
    m = m === 12 ? 1 : m + 1
    run.push(m)
  }
  return run.length === 1
    ? MONTH_ABBR[run[0]! - 1]!
    : run.length === 2
      ? `${MONTH_ABBR[run[0]! - 1]} and ${MONTH_ABBR[run[1]! - 1]}`
      : `${MONTH_ABBR[run[0]! - 1]} to ${MONTH_ABBR[run[run.length - 1]! - 1]}`
}

/** "Every session", "Every week", "Every 3 weeks", "Every 10 days". */
export function resetLabel(days: number): string {
  if (days <= 0) return 'Every session'
  if (days === 1) return 'Every day'
  if (days % 7 === 0) return days === 7 ? 'Every week' : `Every ${days / 7} weeks`
  return `Every ${days} days`
}

/** Jobs in the order they should be done in a room: phase first (clear, empty, clean, fill, floors), then "after" chains. */
export function orderJobs<T extends { jobId: string; phase: number; after?: string; order?: number; title: string }>(jobs: readonly T[]): T[] {
  const sorted = [...jobs].sort((a, b) => a.phase - b.phase || (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
  const out: T[] = []
  const placed = new Set<string>()
  const ids = new Set(sorted.map((j) => j.jobId))
  const place = (j: T, depth = 0) => {
    if (placed.has(j.jobId)) return
    placed.add(j.jobId)
    const before = j.after && ids.has(j.after) && depth < 20 ? sorted.find((x) => x.jobId === j.after) : undefined
    if (before) place(before, depth + 1)
    out.push(j)
  }
  for (const j of sorted) place(j)
  return out
}

// ------------------------------------------------------------------ the setup

export const DEPTH_RANK: Record<HouseDepth, number> = { quick: 0, standard: 1, deep: 2 }
export const DEPTH_LABEL: Record<HouseDepth, string> = { quick: 'Quick tidy', standard: 'Standard', deep: 'Deep clean' }

/** Why a job is or is not ticked by default. Only 'due' jobs start ticked. */
export type Standing = 'due' | 'recent' | 'offSeason' | 'cleaner' | 'deeper' | 'noPlants'

export interface SetupJob {
  job: HouseJobEvent
  standing: Standing
  /** Ticked when the setup opens. */
  on: boolean
  /** When it was last done, if ever. */
  lastDone?: number
  /** For 'recent': days until it is due again. */
  dueInDays?: number
  /** link 'plants': the plants in this room that are due a water. */
  plantIds?: string[]
}

export interface SetupRoom {
  room: HouseRoomEvent
  /** Included by the session's rule (and not skipped). A room left out is shown, folded, so it can be added. */
  included: boolean
  jobs: SetupJob[]
}

export interface SetupSpec {
  depth: HouseDepth
  rooms: HouseTypeEvent['rooms']
  skipRoomIds?: readonly string[]
  skipJobIds?: readonly string[]
  /** Overrides the family's cleaner setting. */
  cleaner?: boolean
}

function roomInRule(room: HouseRoomEvent, rule: HouseTypeEvent['rooms']): boolean {
  if (Array.isArray(rule)) return rule.includes(room.roomId)
  if (rule === 'indoor') return !room.outdoor
  if (rule === 'outdoor') return !!room.outdoor
  return !!room.quickTidy
}

/**
 * Every room and job a session could include on `date`, with the reason each is on or off. Rooms and jobs the family
 * does not have the thing for (no dog, no baby, no plants) are left out altogether.
 */
export function planSetup(f: FamilyState, spec: SetupSpec, date: Ymd): SetupRoom[] {
  const cleaner = spec.cleaner ?? houseHasCleaner(f)
  const skipRooms = new Set(spec.skipRoomIds ?? [])
  const skipJobs = new Set(spec.skipJobIds ?? [])
  const out: SetupRoom[] = []
  for (const room of liveHouseRooms(f)) {
    if (!hasNeed(f, room.requires)) continue
    const here = roomPlants(f, room.name)
    const jobs: SetupJob[] = []
    for (const job of orderJobs(liveHouseJobs(f, room.roomId))) {
      if (!hasNeed(f, job.requires)) continue
      const last = houseJobLastDone(f, job.jobId)
      let standing: Standing = 'due'
      let dueInDays: number | undefined
      let plantIds: string[] | undefined
      if (!inSeason(job.months, date)) standing = 'offSeason'
      else if (DEPTH_RANK[job.depth] > DEPTH_RANK[spec.depth]) standing = 'deeper'
      else if (cleaner && job.cleaner) standing = 'cleaner'
      else if (job.resetDays > 0 && last != null && daysBetween(ymdOf(last), date) < job.resetDays) {
        standing = 'recent'
        dueInDays = job.resetDays - daysBetween(ymdOf(last), date)
      }
      if (job.link === 'plants') {
        plantIds = here.filter((p) => plantStatus(f, p, Date.parse(`${date}T12:00:00Z`)).due).map((p) => p.plantId)
        if (standing === 'due' && !plantIds.length) standing = 'noPlants'
      }
      jobs.push({ job, standing, on: standing === 'due' && !skipJobs.has(job.jobId), lastDone: last, dueInDays, plantIds })
    }
    const included = roomInRule(room, spec.rooms) && !skipRooms.has(room.roomId)
    out.push({ room, included, jobs })
  }
  return out
}

export const STANDING_LABEL: Record<Standing, string> = {
  due: 'Due',
  recent: 'Done recently',
  offSeason: 'Out of season',
  cleaner: 'Cleaner usually does this',
  deeper: 'Deeper than this session',
  noPlants: 'No plants need water',
}

/** Total minutes of the jobs that are on, in the rooms that are included. */
export const setupMinutes = (rooms: readonly SetupRoom[]): number => rooms.filter((r) => r.included).reduce((t, r) => t + r.jobs.filter((j) => j.on).reduce((s, j) => s + j.job.minutes, 0), 0)

/** Coins a child earns for a job: the job's own amount, or a small one by length. */
export function houseCoins(job: Pick<HouseJobEvent, 'minutes' | 'coins'>): number {
  if (job.coins != null) return Math.max(0, Math.round(job.coins))
  const m = job.minutes
  return m < 5 ? 1 : m < 10 ? 2 : m < 20 ? 3 : 5
}

/** The people who can take part: parents and children (never babies or pets). */
export const houseHelpers = (f: FamilyState): Member[] =>
  Object.values(f.members)
    .filter((m) => m.active && (m.role === 'parent' || m.role === 'child'))
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'parent' ? -1 : 1))

/** Whether this person is a child (for coins). */
export const isHouseChild = (f: FamilyState, id: MemberId | undefined): boolean => !!id && f.members[id]?.role === 'child'
