/**
 * Plants: a list of the family's plants, when each was last watered, and which are due a water.
 *
 * A plant counts as watered by
 *   - a `plant-water` event (the 💧 button, or "last watered" when adding it), unless undone, or
 *   - finishing a "Water <plant>" step in a session (undoing the step undoes the watering), the same way brain-dump
 *     items are ticked off by sessions.
 *
 * The rule for "due" is one place, `waterEveryDays`: 7 days for every plant for now. Variety-based rules (a cactus
 * every 3 weeks, a fern twice a week) slot in there later, keyed on `PlantEvent.variety`.
 */
import { addDays, daysBetween, ymdOf } from './dates'
import type { FamilyState, MemberId, PlantEvent, RoutineStep } from './types'

export const DEFAULT_WATER_EVERY_DAYS = 7

/** How often this plant wants water, in days. One rule for now; varieties later. */
export function waterEveryDays(_p: PlantEvent): number {
  return DEFAULT_WATER_EVERY_DAYS
}

export const livePlants = (f: FamilyState): PlantEvent[] =>
  Object.values(f.plants)
    .filter((p) => !p.deleted)
    .sort((a, b) => a.name.localeCompare(b.name))

export interface Watering {
  at: number
  by: MemberId
  /** The event to void to undo it (a plant-water event, or the session step). */
  eventId: string
  via: 'button' | 'session'
}

const sessionCache = new WeakMap<object, { voided: object; houseRuns: object; map: Map<string, Watering[]> }>()

/** Waterings done as session steps, by plant. Cached per runs/voided object, like the brain dump's. */
function sessionWaterings(f: FamilyState): Map<string, Watering[]> {
  const hit = sessionCache.get(f.runs)
  if (hit && hit.voided === f.voided && hit.houseRuns === f.houseRuns) return hit.map
  const map = new Map<string, Watering[]>()
  for (const evs of Object.values(f.runs)) {
    const start = evs.find((e) => e.action === 'start' && !f.voided[e.id])
    if (!start?.steps) continue
    const byStep = new Map(start.steps.filter((s) => s.plantId).map((s) => [s.id, s.plantId!]))
    if (!byStep.size) continue
    for (const e of evs) {
      if (e.action !== 'step' || e.status !== 'done' || !e.stepId || f.voided[e.id]) continue
      const plantId = byStep.get(e.stepId)
      if (plantId) map.set(plantId, [...(map.get(plantId) ?? []), { at: e.ts, by: e.learnerId, eventId: e.id, via: 'session' }])
    }
  }
  // A family session's "Water plants" job waters the plants that were due in that room when it started.
  for (const evs of Object.values(f.houseRuns)) {
    const start = evs.find((e) => e.action === 'start' && !f.voided[e.id])
    if (!start?.jobs) continue
    const byJob = new Map(start.jobs.filter((j) => j.plantIds?.length).map((j) => [j.jobId, j.plantIds!]))
    if (!byJob.size) continue
    for (const e of evs) {
      if (e.action !== 'job' || e.status !== 'done' || !e.jobId || f.voided[e.id]) continue
      for (const plantId of byJob.get(e.jobId) ?? []) map.set(plantId, [...(map.get(plantId) ?? []), { at: e.ts, by: e.by ?? e.learnerId, eventId: e.id, via: 'session' }])
    }
  }
  sessionCache.set(f.runs, { voided: f.voided, houseRuns: f.houseRuns, map })
  return map
}

/** Every watering of this plant, newest first. */
export function wateringsOf(f: FamilyState, plantId: string): Watering[] {
  const direct = (f.plantWaters[plantId] ?? []).filter((e) => !f.voided[e.id]).map((e): Watering => ({ at: e.at, by: e.learnerId, eventId: e.id, via: 'button' }))
  return [...direct, ...(sessionWaterings(f).get(plantId) ?? [])].sort((a, b) => b.at - a.at)
}

export const lastWatered = (f: FamilyState, plantId: string): Watering | undefined => wateringsOf(f, plantId)[0]

export interface PlantStatus {
  plant: PlantEvent
  last?: Watering
  /** Whole days since the last watering (by calendar day), undefined if never watered. */
  daysSince?: number
  /** The day it's next due (today or earlier when due). */
  dueOn: string
  due: boolean
}

export function plantStatus(f: FamilyState, p: PlantEvent, now = Date.now()): PlantStatus {
  const today = ymdOf(now)
  const last = lastWatered(f, p.plantId)
  const every = waterEveryDays(p)
  if (!last) return { plant: p, dueOn: today, due: true }
  const daysSince = daysBetween(ymdOf(last.at), today)
  const dueOn = addDays(ymdOf(last.at), every)
  return { plant: p, last, daysSince, dueOn, due: dueOn <= today }
}

/** All plants with their status: due ones first (longest without water first), then the rest by when they're due. */
export function plantsByNeed(f: FamilyState, now = Date.now()): PlantStatus[] {
  return livePlants(f)
    .map((p) => plantStatus(f, p, now))
    .sort((a, b) => Number(b.due) - Number(a.due) || a.dueOn.localeCompare(b.dueOn) || a.plant.name.localeCompare(b.plant.name))
}

export const duePlants = (f: FamilyState, now = Date.now()): PlantStatus[] => plantsByNeed(f, now).filter((s) => s.due)

/** A session step that waters this plant. */
export const waterStep = (p: PlantEvent): RoutineStep => ({ id: `water-${p.plantId}`, title: `Water ${p.name}`, emoji: p.emoji ?? '🪴', minutes: 1, notes: p.room, plantId: p.plantId })

/** The steps of a watering session right now: every plant that's due, most overdue first. */
export const duePlantSteps = (f: FamilyState, now = Date.now()): RoutineStep[] => duePlants(f, now).map((s) => waterStep(s.plant))

/** "today", "yesterday", "3 days ago", "never". */
export function wateredText(s: PlantStatus): string {
  if (s.daysSince === undefined) return 'Not watered yet'
  if (s.daysSince <= 0) return 'Watered today'
  if (s.daysSince === 1) return 'Watered yesterday'
  return `Watered ${s.daysSince} days ago`
}
