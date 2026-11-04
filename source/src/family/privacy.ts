/**
 * Private events. An event with `priv: <memberId>` belongs to that person alone. Two layers keep it so:
 *   1. The server: it is stored with the owner's key, and the database only returns such rows to a phone presenting that
 *      key (supabase/schema_v3.sql). Nobody else's phone ever downloads it.
 *   2. The app: whatever is in the local log, an event private to someone else is left out of what this phone shows.
 * Everything made from a private item inherits the marker (the task it becomes, its ticks, a session built from it, the runs
 * and timers of those), so a private thought cannot leak out through the thing it turned into.
 */
import type { AppEvent } from '@/engine/types'
import type { FamilyState, MemberId } from './types'

/** Is this event for this viewer's eyes? Shared events are for everyone. */
export const visibleTo = (e: { priv?: string }, me: MemberId | undefined): boolean => !e.priv || e.priv === me

export interface InheritOpts {
  /** An adult's own check-ins (mood, why, note) are private to them. */
  adultCheckins?: (memberId: MemberId) => boolean
  /** The owner of the run or timer that a later event belongs to (`run:<id>`, `timer:<id>`), if it is private. */
  refPriv?: (key: string) => MemberId | undefined
  /** The owner of an earlier event, by id (for a void, which must go the same way as what it undoes). */
  eventPriv?: (id: string) => MemberId | undefined
}

/**
 * Mark the events that follow from private things as private too. `f` is the current state; events earlier in the same batch are
 * taken into account, so a private item and the task made from it can be written together.
 */
export function inheritPriv(f: FamilyState, events: readonly AppEvent[], o: InheritOpts = {}): AppEvent[] {
  const dumps = new Map<string, string | undefined>()
  const tasks = new Map<string, string | undefined>()
  const routines = new Map<string, string | undefined>()
  const refs = new Map<string, string | undefined>()
  const dumpPriv = (id: string) => (dumps.has(id) ? dumps.get(id) : f.dump[id]?.priv)
  const taskPriv = (id: string) => (tasks.has(id) ? tasks.get(id) : f.tasks[id]?.priv)
  const routinePriv = (id: string) => (routines.has(id) ? routines.get(id) : f.routines[id]?.priv)
  const out: AppEvent[] = []
  for (const e of events) {
    let priv: string | undefined = e.priv
    if (!priv) {
      const x = e as AppEvent & Record<string, unknown>
      switch (e.type) {
        case 'task': {
          const src = typeof x.source === 'string' && x.source.startsWith('dump:') ? x.source.slice(5) : undefined
          priv = src ? dumpPriv(src) : undefined
          break
        }
        case 'routine': {
          const steps = (x.steps as { dumpId?: string }[] | undefined) ?? []
          priv = steps.map((s) => (s.dumpId ? dumpPriv(s.dumpId) : undefined)).find(Boolean)
          break
        }
        case 'run': {
          priv = (typeof x.routineId === 'string' ? routinePriv(x.routineId) : undefined) ?? (typeof x.runId === 'string' ? (refs.get(`run:${x.runId}`) ?? o.refPriv?.(`run:${x.runId}`)) : undefined)
          break
        }
        case 'timer': {
          priv = (typeof x.taskId === 'string' ? taskPriv(x.taskId) : undefined) ?? (typeof x.timerId === 'string' ? (refs.get(`timer:${x.timerId}`) ?? o.refPriv?.(`timer:${x.timerId}`)) : undefined)
          break
        }
        case 'void':
          priv = o.eventPriv?.(String(x.targetId)) ?? out.find((p) => p.id === x.targetId)?.priv
          break
        case 'checkin': {
          const m = String(x.memberId)
          if (f.members[m]?.role === 'parent' && o.adultCheckins?.(m)) priv = m
          break
        }
        default:
          if (typeof x.taskId === 'string' && e.type !== 'dump') priv = taskPriv(x.taskId)
      }
    }
    const marked = priv && !e.priv ? ({ ...e, priv } as AppEvent) : e
    if (marked.priv) {
      const m = marked as AppEvent & Record<string, unknown>
      if (m.type === 'dump') dumps.set(String(m.itemId), marked.priv)
      if (m.type === 'task') tasks.set(String(m.taskId), marked.priv)
      if (m.type === 'routine') routines.set(String(m.routineId), marked.priv)
      if (m.type === 'run') refs.set(`run:${m.runId}`, marked.priv)
      if (m.type === 'timer') refs.set(`timer:${m.timerId}`, marked.priv)
    }
    out.push(marked)
  }
  return out
}
