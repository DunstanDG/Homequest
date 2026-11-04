/**
 * Everything a person can do to a project, as functions that return the events to append (no React here). See
 * projects.ts for how a project is read back.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import type { BreakdownResult } from '../../supabase/functions/_shared/breakdown'
import { addDays, weekday } from './dates'
import { packSessions, projectRoutines, sortSiblings, stepForActivity, stepsToDo, type ProjectTree } from './projects'
import type { RunSource } from './planActions'
import { allRuns } from './routines'
import type { ActivityEvent, FamilyState, Hm, MemberId, ProjectEvent, Ymd } from './types'

const ev = (actor: MemberId, body: EventBody, now: number): AppEvent => makeEvent(actor, body, now)

function bodyOf<T extends { type: string; id: string; ts: number; day: string; learnerId: string; v: number }>(e: T): Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = e
  return rest
}

export const newProjectId = (): string => uid('pj')
export const newActivityId = (): string => uid('ac')

// ------------------------------------------------------------------ projects

export type ProjectDraft = Omit<ProjectEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'projectId'> & { projectId?: string }

export function saveProject(actor: MemberId, p: ProjectDraft, now = Date.now()): { projectId: string; events: AppEvent[] } {
  const projectId = p.projectId ?? newProjectId()
  const goal = p.goal.trim()
  const title = p.title.trim() || goal.slice(0, 60) || 'Project'
  return { projectId, events: [ev(actor, { ...p, type: 'project', projectId, title, goal, context: p.context?.trim() || undefined, created: p.created ?? now }, now)] }
}

/** Delete a project, and any of its planned sessions that haven't been started (finished ones stay in the history). */
export function deleteProject(actor: MemberId, f: FamilyState, p: ProjectEvent, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'project', ...bodyOf(p), deleted: true }, now), ...dropUnstartedSessions(actor, f, p.projectId, now + 1)]
}

function dropUnstartedSessions(actor: MemberId, f: FamilyState, projectId: string, now: number): AppEvent[] {
  const started = new Set(allRuns(f).map((r) => r.routineId).filter(Boolean))
  return projectRoutines(f, projectId)
    .filter((r) => !started.has(r.routineId))
    .map((r, i) => ev(actor, { type: 'routine', ...bodyOf(r), deleted: true }, now + i))
}

// ---------------------------------------------------------------- activities

const siblingsOf = (f: FamilyState, projectId: string, parentId: string | undefined): ActivityEvent[] =>
  Object.values(f.activities).filter((a) => a.projectId === projectId && !a.deleted && (a.parentId ?? '') === (parentId ?? ''))

const nextOrder = (sibs: readonly ActivityEvent[]): number => (sibs.length ? Math.max(...sibs.map((s) => s.order)) + 1 : 0)

export interface ActivityDraft {
  title: string
  description?: string
  minutes: number
  /** Ids of existing siblings it comes after. */
  after?: string[]
}

/** Add activities at one level (the top of the project, or inside `parentId`, which makes that one a group). */
export function addActivities(actor: MemberId, f: FamilyState, projectId: string, parentId: string | undefined, drafts: readonly ActivityDraft[], now = Date.now(), opts: { chain?: boolean } = {}): AppEvent[] {
  let order = nextOrder(siblingsOf(f, projectId, parentId))
  let prev: string | undefined
  return drafts
    .filter((d) => d.title.trim())
    .map((d, i) => {
      const activityId = newActivityId()
      // `chain`: each one comes after the one before it (steps that have to be done in this order).
      const after = [...(d.after ?? []), ...(opts.chain && prev ? [prev] : [])]
      prev = activityId
      return ev(actor, { type: 'activity', activityId, projectId, parentId, title: d.title.trim(), description: d.description?.trim() || undefined, minutes: Math.max(1, Math.round(d.minutes)), after, order: order++, created: now + i }, now + i)
    })
}

/**
 * Save an AI breakdown as activities inside `parentId` (or at the top of the project). Its task ids are swapped for
 * real ids and its dependencies become `after` links between the new siblings. They go after anything already there.
 */
export function applyBreakdown(actor: MemberId, f: FamilyState, projectId: string, parentId: string | undefined, result: BreakdownResult, now = Date.now()): { events: AppEvent[]; ids: string[] } {
  let order = nextOrder(siblingsOf(f, projectId, parentId))
  const idFor = new Map(result.tasks.map((t) => [t.task_id, newActivityId()]))
  const events = result.tasks.map((t, i) =>
    ev(
      actor,
      {
        type: 'activity',
        activityId: idFor.get(t.task_id)!,
        projectId,
        parentId,
        title: t.title,
        description: t.description || undefined,
        minutes: t.estimated_minutes,
        after: t.dependencies.map((d) => idFor.get(d)).filter((x): x is string => !!x),
        order: order++,
        ai: true,
        created: now + i,
      },
      now + i,
    ),
  )
  return { events, ids: [...idFor.values()] }
}

export type ActivityPatch = Partial<Pick<ActivityEvent, 'title' | 'description' | 'minutes' | 'after' | 'order' | 'parentId'>>

/** Re-save an activity with changes. (Whether it is done is separate: see tickActivity.) */
export function saveActivity(actor: MemberId, _f: FamilyState, a: ActivityEvent, patch: ActivityPatch, now = Date.now()): AppEvent[] {
  const next = { ...bodyOf(a), ...patch }
  const title = next.title.trim() || a.title
  const description = next.description?.trim() || undefined
  const minutes = Math.max(1, Math.round(next.minutes))
  // The AI sparkle stays until the words or the time are really changed.
  const edited = title !== a.title || description !== (a.description || undefined) || minutes !== a.minutes
  return [ev(actor, { ...next, type: 'activity', title, description, minutes, ai: edited ? undefined : a.ai }, now)]
}

/** Tick an activity off by hand, or un-tick it. Undo is a void of this event. */
export const tickActivity = (actor: MemberId, _f: FamilyState, a: ActivityEvent, done: boolean, now = Date.now()): AppEvent[] => [ev(actor, { type: 'activity-tick', activityId: a.activityId, projectId: a.projectId, done }, now)]

/**
 * Undo a change to activities (a delete, a group, an ungroup, a breakdown): every activity those events wrote goes back
 * to how it was in `before`, and any it created is deleted. Ticks aren't touched.
 */
export function revertActivities(actor: MemberId, before: FamilyState, events: readonly AppEvent[], now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  const seen = new Set<string>()
  for (const e of events) {
    if (e.type !== 'activity' || seen.has(e.activityId)) continue
    seen.add(e.activityId)
    const was = before.activities[e.activityId]
    out.push(ev(actor, was ? { type: 'activity', ...bodyOf(was) } : { type: 'activity', ...bodyOf(e), deleted: true }, now + out.length))
  }
  return out
}

/** Delete an activity and everything inside it. Anything that came after it now comes after what it came after. */
export function deleteActivity(actor: MemberId, f: FamilyState, a: ActivityEvent, now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  const gone = (x: ActivityEvent) => {
    out.push(ev(actor, { type: 'activity', ...bodyOf(x), deleted: true }, now + out.length))
    for (const k of Object.values(f.activities)) if (!k.deleted && k.parentId === x.activityId) gone(k)
  }
  gone(a)
  for (const s of siblingsOf(f, a.projectId, a.parentId)) {
    if (s.activityId === a.activityId || !s.after.includes(a.activityId)) continue
    const after = [...new Set([...s.after.filter((x) => x !== a.activityId), ...a.after])].filter((x) => x !== s.activityId)
    out.push(...saveActivity(actor, f, s, { after }, now + out.length))
  }
  return out
}

/**
 * Would putting these siblings in a group make a loop? It does when something outside the selection sits between two
 * of them in a chain (A, then X, then B: grouping A and B would make the group wait for X and X wait for the group).
 */
export function groupWouldLoop(f: FamilyState, ids: readonly string[]): boolean {
  const items = ids.map((id) => f.activities[id]).filter((a): a is ActivityEvent => !!a && !a.deleted)
  const first = items[0]
  if (!first) return false
  const inside = new Set(items.map((a) => a.activityId))
  const G = '\u0000group'
  const deps = new Map<string, string[]>()
  const swap = (xs: readonly string[]) => [...new Set(xs.map((x) => (inside.has(x) ? G : x)))]
  for (const s of siblingsOf(f, first.projectId, first.parentId)) if (!inside.has(s.activityId)) deps.set(s.activityId, swap(s.after))
  deps.set(G, swap(items.flatMap((a) => a.after.filter((x) => !inside.has(x)))))
  const state = new Map<string, 1 | 2>()
  const visit = (x: string): boolean => {
    if (state.get(x) === 1) return true
    if (state.get(x) === 2) return false
    state.set(x, 1)
    for (const d of deps.get(x) ?? []) if (d !== x && visit(d)) return true
    state.set(x, 2)
    return false
  }
  return [...deps.keys()].some(visit)
}

/**
 * Put several siblings into a new group, in the same place. Links between them stay; links to things outside move up
 * to the group (so the group waits for what any of them waited for, and whatever waited for any of them waits for the group).
 */
export function groupActivities(actor: MemberId, f: FamilyState, ids: readonly string[], title: string, now = Date.now()): { groupId: string; events: AppEvent[] } {
  const items = ids.map((id) => f.activities[id]).filter((a): a is ActivityEvent => !!a && !a.deleted)
  const first = items[0]
  const groupId = newActivityId()
  if (!first || items.some((a) => (a.parentId ?? '') !== (first.parentId ?? '') || a.projectId !== first.projectId) || groupWouldLoop(f, ids)) return { groupId, events: [] }
  const inside = new Set(items.map((a) => a.activityId))
  const sibs = siblingsOf(f, first.projectId, first.parentId)
  const ordered = sortSiblings(sibs).filter((a) => inside.has(a.activityId))
  const out: AppEvent[] = []
  const groupAfter = [...new Set(items.flatMap((a) => a.after.filter((x) => !inside.has(x))))]
  out.push(
    ev(
      actor,
      { type: 'activity', activityId: groupId, projectId: first.projectId, parentId: first.parentId, title: title.trim() || 'Group', minutes: items.reduce((s, a) => s + a.minutes, 0), after: groupAfter, order: Math.min(...items.map((a) => a.order)), created: now },
      now,
    ),
  )
  ordered.forEach((a, i) => out.push(...saveActivity(actor, f, a, { parentId: groupId, after: a.after.filter((x) => inside.has(x)), order: i }, now + 1 + i)))
  for (const s of sibs) {
    if (inside.has(s.activityId) || !s.after.some((x) => inside.has(x))) continue
    out.push(...saveActivity(actor, f, s, { after: [...new Set([...s.after.filter((x) => !inside.has(x)), groupId])] }, now + 1 + out.length))
  }
  return { groupId, events: out }
}

/** Take a group apart: what was inside moves up a level, in its place, keeping the group's links. */
export function ungroupActivity(actor: MemberId, f: FamilyState, g: ActivityEvent, now = Date.now()): AppEvent[] {
  const kids = sortSiblings(siblingsOf(f, g.projectId, g.activityId))
  if (!kids.length) return []
  const kidIds = new Set(kids.map((k) => k.activityId))
  // The last ones inside (that nothing else inside waits for) stand in for the group in other siblings' links.
  const ends = kids.filter((k) => !kids.some((o) => o.after.includes(k.activityId))).map((k) => k.activityId)
  const out: AppEvent[] = [ev(actor, { type: 'activity', ...bodyOf(g), deleted: true }, now)]
  kids.forEach((k, i) => {
    const starts = !k.after.some((x) => kidIds.has(x))
    out.push(...saveActivity(actor, f, k, { parentId: g.parentId, order: g.order + (i + 1) / (kids.length + 1), after: starts ? [...new Set([...k.after, ...g.after])] : k.after }, now + 1 + i))
  })
  for (const s of siblingsOf(f, g.projectId, g.parentId)) {
    if (s.activityId === g.activityId || !s.after.includes(g.activityId)) continue
    out.push(...saveActivity(actor, f, s, { after: [...new Set([...s.after.filter((x) => x !== g.activityId), ...ends])] }, now + 1 + out.length))
  }
  return out
}

/** Swap with the neighbour above or below (as shown). Links still win: something can't move above what it waits for. */
export function moveActivity(actor: MemberId, f: FamilyState, a: ActivityEvent, by: -1 | 1, now = Date.now()): AppEvent[] {
  const sorted = sortSiblings(siblingsOf(f, a.projectId, a.parentId))
  const i = sorted.findIndex((x) => x.activityId === a.activityId)
  const other = sorted[i + by]
  if (i < 0 || !other) return []
  if (a.after.includes(other.activityId) || other.after.includes(a.activityId)) return []
  // Renumber the whole level so ties can't make the swap a no-op.
  const next = [...sorted]
  ;[next[i], next[i + by]] = [next[i + by]!, next[i]!]
  const out: AppEvent[] = []
  next.forEach((x, n) => {
    if (x.order !== n) out.push(...saveActivity(actor, f, x, { order: n }, now + out.length))
  })
  return out
}

// ------------------------------------------------------------------- playing

/** A session to run right now: the steps still to do inside `rootId` (or the whole project), in order, up to about `minutes`. */
export function playSource(t: ProjectTree, rootId?: string, minutes?: number): RunSource {
  const all = stepsToDo(t, rootId)
  const steps: ActivityEvent[] = []
  let used = 0
  for (const a of all) {
    if (minutes && steps.length && used + a.minutes > minutes) break
    steps.push(a)
    used += a.minutes
  }
  const group = rootId ? t.info.get(rootId)?.a : undefined
  return { title: group ? `${t.project.title}: ${group.title}` : t.project.title, emoji: t.project.emoji ?? '🎯', steps: steps.map(stepForActivity) }
}

// ----------------------------------------------------------------- scheduling

export interface SessionPlan {
  /** Minutes per session. */
  minutes: number
  ownerId?: MemberId
  /** First day to consider. */
  from: Ymd
  /** Weekdays to use, 0 = Monday. */
  days: number[]
  startAt?: Hm
}

/**
 * Plan the project's remaining steps into dated sessions: steps in play order, packed into sessions of about
 * `minutes`, one a day on the chosen weekdays from `from`. Sessions planned before that haven't been started are
 * replaced, so planning again after changes just re-flows the plan. Each session keeps the activity ids, not copies,
 * so it always runs with the activities as they are on the day.
 */
export function planSessions(actor: MemberId, f: FamilyState, t: ProjectTree, plan: SessionPlan, now = Date.now()): { events: AppEvent[]; sessions: { date: Ymd; minutes: number; steps: number }[] } {
  const days = [...new Set(plan.days)].filter((d) => d >= 0 && d <= 6)
  const packs = packSessions(t.order, Math.max(5, plan.minutes))
  const events: AppEvent[] = dropUnstartedSessions(actor, f, t.project.projectId, now)
  const sessions: { date: Ymd; minutes: number; steps: number }[] = []
  if (!days.length || !packs.length) return { events, sessions }
  let date = plan.from
  for (let n = 0; n < packs.length; n++) {
    for (let guard = 0; guard < 8 && !days.includes(weekday(date)); guard++) date = addDays(date, 1)
    const pack = packs[n]!
    const minutes = pack.reduce((s, a) => s + a.minutes, 0)
    events.push(
      ev(
        actor,
        {
          type: 'routine',
          routineId: uid('rt'),
          title: packs.length > 1 ? `${t.project.title} (${n + 1} of ${packs.length})` : t.project.title,
          emoji: t.project.emoji ?? '🎯',
          ownerId: plan.ownerId,
          steps: [],
          project: { projectId: t.project.projectId, activityIds: pack.map((a) => a.activityId) },
          date,
          startAt: plan.startAt,
        },
        now + events.length,
      ),
    )
    sessions.push({ date, minutes, steps: pack.length })
    date = addDays(date, 1)
  }
  return { events, sessions }
}
