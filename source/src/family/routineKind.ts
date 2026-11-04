/**
 * Plan › Routines has three kinds, always in the same order: routines (the same steps at the same time of day:
 * morning, bedtime, before you leave), clean-ups (the whole house pitching in: family sessions with rooms and jobs,
 * see house/) and focus sessions (a block of work against the clock: an admin hour, a tidy, homework).
 *
 * Saved sessions made before 0.18 don't say which they are, so the kind is worked out from what they look like. Once
 * someone picks a kind in the editor it is saved on the session and wins.
 */
import type { RoutineEvent } from './types'

export type RoutineKind = 'routine' | 'focus'
export type RoutinesTab = 'routines' | 'cleanups' | 'focus'

/** The sub-tabs of Plan › Routines, in their fixed order. */
export const ROUTINES_TABS: { id: RoutinesTab; label: string }[] = [
  { id: 'routines', label: 'Routines' },
  { id: 'cleanups', label: 'Clean-ups' },
  { id: 'focus', label: 'Focus' },
]

const ROUTINE_WORDS = /\b(morning|mornings|bed|bedtime|bed-time|evening|evenings|night|nightly|wake|wake-up|waking|leave|leaving|getting ready|get ready|school run|after school|routine|reset|wind down|wind-down)\b/i

type KindOf = Pick<RoutineEvent, 'title'> & Partial<Pick<RoutineEvent, 'kind' | 'part' | 'homework' | 'plants' | 'project'>> & { steps?: readonly { habitsSlot?: string }[] }

/** Which sub-tab a saved session lives on. */
export function routineKindOf(r: KindOf): RoutineKind {
  if (r.kind) return r.kind
  if (r.part) return 'routine'
  if (r.homework || r.project) return 'focus'
  if (r.plants) return 'routine'
  if ((r.steps ?? []).some((s) => s.habitsSlot)) return 'routine'
  return ROUTINE_WORDS.test(r.title) ? 'routine' : 'focus'
}

/** Routines in the order of the day (by start time, then name); focus sessions by name. Never by when last used, so
 * nothing moves about. */
export function sortForKind<T extends Pick<RoutineEvent, 'title' | 'startAt'>>(list: T[], kind: RoutineKind): T[] {
  const byName = (a: T, b: T) => a.title.localeCompare(b.title)
  if (kind === 'focus') return [...list].sort(byName)
  return [...list].sort((a, b) => (a.startAt ?? '99:99').localeCompare(b.startAt ?? '99:99') || byName(a, b))
}

/** The Plan tab's old `?t=sessions` (and anything unknown) lands on Routines; `k` picks the sub-tab. */
export function routinesTabOf(k: string | null | undefined, remembered?: string | null): RoutinesTab {
  const ok = (x: string | null | undefined): x is RoutinesTab => !!x && ROUTINES_TABS.some((t) => t.id === x)
  if (ok(k)) return k
  if (ok(remembered)) return remembered
  return 'routines'
}
