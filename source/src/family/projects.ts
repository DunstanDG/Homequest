/**
 * Projects: a high-level goal broken down into activities, level by level, and worked through in sessions.
 *
 * The activities form a tree. One with children is a GROUP (its own minutes are just the estimate it had before it
 * was broken down); one without is a STEP, the thing you actually do. Siblings can say they come `after` other
 * siblings, and that ordering also holds for everything inside them: if "Paint the walls" comes after "Prepare the
 * room", every step inside "Paint the walls" waits for every step inside "Prepare the room". So a single walk of the
 * tree, putting each set of siblings in dependency order, gives an order for the whole project that respects every
 * link ("play order"), and any group can be played on its own in the same way.
 *
 * A step is done when it is ticked by hand (an `activity-tick` event), or when it is finished as a step of a session
 * (worked out from the run events, like brain-dump items); whichever happened last wins, and undoing either brings
 * back the one before.
 *
 * Nothing in here writes; see projectActions.ts.
 */
import type { ActivityEvent, FamilyState, ProjectEvent, RoutineEvent, RoutineStep } from './types'

// ------------------------------------------------------------------- reading

export const liveProjects = (f: FamilyState): ProjectEvent[] =>
  Object.values(f.projects)
    .filter((p) => !p.deleted)
    .sort((a, b) => rankStatus(a) - rankStatus(b) || (b.created ?? b.ts) - (a.created ?? a.ts))

const rankStatus = (p: ProjectEvent): number => (p.status === 'archived' ? 2 : p.status === 'done' ? 1 : 0)

const doneCache = new WeakMap<object, { voided: object; ids: Map<string, number> }>()

/** Activities finished by ticking off a session step made from them (undone steps don't count), with when. */
export function activitiesDoneBySessions(f: FamilyState): Map<string, number> {
  const hit = doneCache.get(f.runs)
  if (hit && hit.voided === f.voided) return hit.ids
  const ids = new Map<string, number>()
  for (const evs of Object.values(f.runs)) {
    const start = evs.find((e) => e.action === 'start' && !f.voided[e.id])
    if (!start?.steps) continue
    const byStep = new Map(start.steps.filter((s) => s.activityId).map((s) => [s.id, s.activityId!]))
    if (!byStep.size) continue
    for (const e of evs) {
      if (e.action !== 'step' || e.status !== 'done' || !e.stepId || f.voided[e.id]) continue
      const a = byStep.get(e.stepId)
      if (a) ids.set(a, Math.max(e.ts, ids.get(a) ?? 0))
    }
  }
  doneCache.set(f.runs, { voided: f.voided, ids })
  return ids
}

/**
 * Is this one activity done? Whichever happened last counts: ticking (or un-ticking) it by hand, or finishing it as a
 * step in a session. Undoing either (a void) takes it out, so the one before counts again.
 */
export function activityTicked(f: FamilyState, a: Pick<ActivityEvent, 'activityId'>): boolean {
  let last: { ts: number; done: boolean } | undefined
  for (const e of f.activityTicks[a.activityId] ?? []) if (!f.voided[e.id] && (!last || e.ts >= last.ts)) last = { ts: e.ts, done: e.done }
  const inSession = activitiesDoneBySessions(f).get(a.activityId) ?? 0
  if (inSession && inSession > (last?.ts ?? 0)) return true
  // A "Plan a thing" step also lives as a task on someone's day: ticking that counts too (see planThing.ts).
  const task = f.tasks[`plan-${a.activityId}`]
  const td = task && !task.deleted ? f.done[`${task.taskId}|${task.date ?? 'any'}`] : undefined
  if (td && td.status !== 'rejected' && td.ts > (last?.ts ?? 0)) return true
  return last?.done ?? false
}

/** Siblings in the order they should be done: dependencies first, otherwise by `order`. A loop (two phones linking
 * things both ways at once) can't stall it: whatever is left is added by `order`. */
export function sortSiblings(list: readonly ActivityEvent[]): ActivityEvent[] {
  const ids = new Set(list.map((a) => a.activityId))
  const rank = (a: ActivityEvent, b: ActivityEvent) => a.order - b.order || (a.created ?? a.ts) - (b.created ?? b.ts) || (a.activityId < b.activityId ? -1 : 1)
  const waiting = new Map(list.map((a) => [a.activityId, new Set(a.after.filter((x) => ids.has(x) && x !== a.activityId))]))
  const left = [...list].sort(rank)
  const out: ActivityEvent[] = []
  while (left.length) {
    const i = left.findIndex((a) => waiting.get(a.activityId)!.size === 0)
    const next = left.splice(i < 0 ? 0 : i, 1)[0]!
    out.push(next)
    for (const w of waiting.values()) w.delete(next.activityId)
  }
  return out
}

export interface NodeInfo {
  a: ActivityEvent
  depth: number
  /** Children in play order (empty for a step). */
  kids: ActivityEvent[]
  isGroup: boolean
  /** Steps inside it (itself, for a step), done and in all. */
  stepsDone: number
  stepsTotal: number
  /** Planned minutes of its steps, and of the ones still to do. */
  minutes: number
  minutesLeft: number
  complete: boolean
}

export interface ProjectTree {
  project: ProjectEvent
  /** Top-level activities in play order. */
  roots: ActivityEvent[]
  info: Map<string, NodeInfo>
  /** Every step still to do, in play order. */
  order: ActivityEvent[]
  stepsDone: number
  stepsTotal: number
  minutes: number
  minutesLeft: number
}

const treeCache = new WeakMap<object, Map<string, { runs: object; voided: object; ticks: object; tasks: object; taskDone: object; tree: ProjectTree }>>()

/** The project's activities, worked out once per change. Activities whose parent has gone are left out. */
export function projectTree(f: FamilyState, projectId: string): ProjectTree | undefined {
  const project = f.projects[projectId]
  if (!project || project.deleted) return undefined
  let per = treeCache.get(f.activities)
  const hit = per?.get(projectId)
  if (hit && hit.runs === f.runs && hit.voided === f.voided && hit.ticks === f.activityTicks && hit.tasks === f.tasks && hit.taskDone === f.done && hit.tree.project === project) return hit.tree

  const all = Object.values(f.activities).filter((a) => a.projectId === projectId && !a.deleted)
  const byParent = new Map<string, ActivityEvent[]>()
  for (const a of all) {
    const k = a.parentId ?? ''
    if (!byParent.has(k)) byParent.set(k, [])
    byParent.get(k)!.push(a)
  }
  const info = new Map<string, NodeInfo>()
  const order: ActivityEvent[] = []
  const walk = (list: ActivityEvent[], depth: number): ActivityEvent[] => {
    const sorted = sortSiblings(list)
    for (const a of sorted) {
      if (depth > 12) continue // a parent loop can't recurse for ever
      const kidsRaw = byParent.get(a.activityId) ?? []
      const node: NodeInfo = { a, depth, kids: [], isGroup: kidsRaw.length > 0, stepsDone: 0, stepsTotal: 0, minutes: 0, minutesLeft: 0, complete: false }
      info.set(a.activityId, node)
      if (node.isGroup) {
        node.kids = walk(kidsRaw, depth + 1)
        for (const k of node.kids) {
          const ki = info.get(k.activityId)
          if (!ki) continue
          node.stepsDone += ki.stepsDone
          node.stepsTotal += ki.stepsTotal
          node.minutes += ki.minutes
          node.minutesLeft += ki.minutesLeft
        }
        node.complete = node.stepsTotal > 0 && node.stepsDone === node.stepsTotal
      } else {
        const done = activityTicked(f, a)
        node.stepsTotal = 1
        node.stepsDone = done ? 1 : 0
        node.minutes = a.minutes
        node.minutesLeft = done ? 0 : a.minutes
        node.complete = done
        if (!done) order.push(a)
      }
    }
    return sorted
  }
  const roots = walk(byParent.get('') ?? [], 0)
  const tree: ProjectTree = {
    project,
    roots,
    info,
    order,
    stepsDone: roots.reduce((s, a) => s + (info.get(a.activityId)?.stepsDone ?? 0), 0),
    stepsTotal: roots.reduce((s, a) => s + (info.get(a.activityId)?.stepsTotal ?? 0), 0),
    minutes: roots.reduce((s, a) => s + (info.get(a.activityId)?.minutes ?? 0), 0),
    minutesLeft: roots.reduce((s, a) => s + (info.get(a.activityId)?.minutesLeft ?? 0), 0),
  }
  if (!per) treeCache.set(f.activities, (per = new Map()))
  per.set(projectId, { runs: f.runs, voided: f.voided, ticks: f.activityTicks, tasks: f.tasks, taskDone: f.done, tree })
  return tree
}

/** From the top of the project down to this activity (inclusive). */
export function pathTo(f: FamilyState, activityId: string): ActivityEvent[] {
  const out: ActivityEvent[] = []
  let a = f.activities[activityId]
  for (let i = 0; a && i < 20; i++) {
    out.unshift(a)
    a = a.parentId ? f.activities[a.parentId] : undefined
  }
  return out
}

/** The siblings it is waiting for: its own `after` links and those of every group it sits in, not yet complete. */
export function waitingFor(t: ProjectTree, f: FamilyState, activityId: string): ActivityEvent[] {
  const out: ActivityEvent[] = []
  for (const a of pathTo(f, activityId)) {
    for (const id of a.after) {
      const n = t.info.get(id)
      if (n && !n.complete && !out.includes(n.a)) out.push(n.a)
    }
  }
  return out
}

/** Steps that can be done now (nothing they wait for is unfinished), in play order. */
export const readySteps = (t: ProjectTree, f: FamilyState): ActivityEvent[] => t.order.filter((a) => waitingFor(t, f, a.activityId).length === 0)

/** The steps still to do inside a group (or the whole project if no id), in play order. */
export function stepsToDo(t: ProjectTree, rootId?: string): ActivityEvent[] {
  if (!rootId) return t.order
  const inside = new Set<string>()
  const add = (id: string) => {
    inside.add(id)
    for (const k of t.info.get(id)?.kids ?? []) add(k.activityId)
  }
  add(rootId)
  return t.order.filter((a) => inside.has(a.activityId))
}

/**
 * Siblings joined by `after` links, as clusters: the "connected" activities that have to be played together in order.
 * Returns a cluster number for each sibling that is linked to at least one other (unlinked ones are left out).
 */
export function linkClusters(siblings: readonly ActivityEvent[]): Map<string, number> {
  const ids = new Set(siblings.map((s) => s.activityId))
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    let r = x
    while (parent.get(r) !== r) r = parent.get(r)!
    parent.set(x, r)
    return r
  }
  for (const s of siblings) parent.set(s.activityId, s.activityId)
  for (const s of siblings) for (const d of s.after) if (ids.has(d)) parent.set(find(s.activityId), find(d))
  const size = new Map<string, number>()
  for (const s of siblings) size.set(find(s.activityId), (size.get(find(s.activityId)) ?? 0) + 1)
  const num = new Map<string, number>()
  const out = new Map<string, number>()
  for (const s of siblings) {
    const r = find(s.activityId)
    if ((size.get(r) ?? 0) < 2) continue
    if (!num.has(r)) num.set(r, num.size)
    out.set(s.activityId, num.get(r)!)
  }
  return out
}

/** Would making `id` come after `after` create a loop among its siblings? */
export function wouldLoop(siblings: readonly ActivityEvent[], id: string, after: readonly string[]): boolean {
  const deps = new Map(siblings.map((s) => [s.activityId, s.activityId === id ? [...after] : s.after]))
  const stack = [...after]
  const seen = new Set<string>()
  while (stack.length) {
    const x = stack.pop()!
    if (x === id) return true
    if (seen.has(x)) continue
    seen.add(x)
    stack.push(...(deps.get(x) ?? []))
  }
  return false
}

// ------------------------------------------------------------------ sessions

/**
 * Pack steps, in order, into sessions of about `minutes` each. A step is never split; one longer than a session gets
 * a session to itself (and is worth breaking down further). Order is kept, so dependencies hold across sessions.
 */
export function packSessions(steps: readonly ActivityEvent[], minutes: number): ActivityEvent[][] {
  const out: ActivityEvent[][] = []
  let cur: ActivityEvent[] = []
  let used = 0
  for (const s of steps) {
    if (cur.length && used + s.minutes > minutes) {
      out.push(cur)
      cur = []
      used = 0
    }
    cur.push(s)
    used += s.minutes
  }
  if (cur.length) out.push(cur)
  return out
}

/** The session step for an activity. Its id is fixed per activity, so a run's steps stay recognisable. */
export const stepForActivity = (a: ActivityEvent): RoutineStep => ({ id: `pa-${a.activityId}`, title: a.title, minutes: Math.max(0.5, a.minutes), notes: a.description, activityId: a.activityId })

/**
 * The steps a project session runs with: the activities it was planned with that are still to do, as they are now
 * (renamed, re-timed; one that has since been broken down runs as the steps inside it). Anything they wait for that
 * isn't done yet (a missed earlier session, a link added since) is brought in too, and the lot is put in the project's
 * current play order, so a session never runs a step before the one it waits for.
 */
export function projectSessionSteps(f: FamilyState, r: Pick<RoutineEvent, 'project'>): RoutineStep[] {
  if (!r.project) return []
  const t = projectTree(f, r.project.projectId)
  if (!t) return []
  const want = new Set<string>()
  const add = (a: ActivityEvent) => {
    if (want.has(a.activityId)) return
    want.add(a.activityId)
    for (const w of waitingFor(t, f, a.activityId)) for (const s of stepsToDo(t, w.activityId)) add(s)
  }
  for (const id of r.project.activityIds) if (t.info.has(id)) for (const a of stepsToDo(t, id)) add(a)
  return t.order.filter((a) => want.has(a.activityId)).map(stepForActivity)
}

/** The project's planned sessions (not deleted), soonest first. */
export function projectRoutines(f: FamilyState, projectId: string): RoutineEvent[] {
  return Object.values(f.routines)
    .filter((r) => !r.deleted && r.project?.projectId === projectId)
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || (a.startAt ?? '').localeCompare(b.startAt ?? '') || a.title.localeCompare(b.title))
}
