import type { AppEvent } from './types'
import { dayOf } from './events'
import { uid } from './rng'

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type EventBody = DistOmit<AppEvent, 'id' | 'ts' | 'day' | 'learnerId' | 'v'>

/** Stamp an action with id, time and actor so it can join the event log. `actor` is the learner or family member who did it. */
export function makeEvent(actor: string, body: EventBody, now = Date.now(), id?: string): AppEvent {
  return { ...body, id: id ?? uid('e'), ts: now, day: dayOf(now), learnerId: actor, v: 1 } as AppEvent
}
