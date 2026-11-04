/** Writing plant events: add/edit/remove a plant, water it, and put the plants that are due into a session. */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import { newRoutineId, newStepId, saveRoutine } from './planActions'
import { waterStep } from './plants'
import type { MemberId, PlantEvent, RoutineEvent } from './types'

const ev = (actor: MemberId, body: EventBody, now: number): AppEvent => makeEvent(actor, body, now)

export interface PlantDraft {
  plantId?: string
  name: string
  emoji?: string
  room?: string
  notes?: string
  variety?: string
}

/** Add or edit a plant. `lastWateredAt` (when adding) records the watering that's already happened. */
export function savePlant(actor: MemberId, d: PlantDraft, now = Date.now(), lastWateredAt?: number): { plantId: string; events: AppEvent[] } {
  const plantId = d.plantId ?? uid('pl')
  const body = { type: 'plant' as const, plantId, name: d.name.trim() || 'Plant', emoji: d.emoji || undefined, room: d.room?.trim() || undefined, notes: d.notes?.trim() || undefined, variety: d.variety?.trim() || undefined }
  const events = [ev(actor, body, now)]
  if (lastWateredAt !== undefined) events.push(...waterPlants(actor, [plantId], now + 1, lastWateredAt))
  return { plantId, events }
}

export const deletePlant = (actor: MemberId, p: PlantEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'plant', plantId: p.plantId, name: p.name, emoji: p.emoji, room: p.room, notes: p.notes, variety: p.variety, deleted: true }, now),
]

/** Water one or more plants (now, or at an earlier time). */
export const waterPlants = (actor: MemberId, plantIds: readonly string[], now = Date.now(), at = now): AppEvent[] => plantIds.map((plantId, i) => ev(actor, { type: 'plant-water', plantId, at }, now + i))

/** Add watering steps for these plants to an existing session (skipping any it already waters). */
export function addPlantsToRoutine(actor: MemberId, routine: RoutineEvent, plants: readonly PlantEvent[], now = Date.now()): AppEvent[] {
  const have = new Set(routine.steps.map((s) => s.plantId).filter(Boolean))
  const add = plants.filter((p) => !have.has(p.plantId)).map((p) => ({ ...waterStep(p), id: newStepId() }))
  if (!add.length) return []
  const { type: _t, id: _i, ts: _ts, day: _d, learnerId: _l, v: _v, ...rest } = routine
  return saveRoutine(actor, { ...rest, steps: [...routine.steps, ...add] }, now)
}

/** A watering session: no saved steps, it waters whatever is due when it starts. Schedule it from Plan › Sessions. */
export function newWateringSession(actor: MemberId, o: { title?: string; ownerId?: MemberId } = {}, now = Date.now()): { routineId: string; events: AppEvent[] } {
  const routineId = newRoutineId()
  return { routineId, events: saveRoutine(actor, { routineId, title: o.title ?? 'Water the plants', emoji: '🪴', ownerId: o.ownerId, steps: [], plants: true }, now) }
}
