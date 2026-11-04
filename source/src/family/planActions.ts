/**
 * Everything a person can do in the planning half of the app, as functions that return the events to append: sessions and
 * their runs, the brain dump, recipes and the meal plan, shopping lists. Same rules as actions.ts: no React here, so the
 * behaviour (what finishing a session ticks off, how a duplicate item is merged) is tested once.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import { completeTask, saveTask, deleteTask } from './actions'
import { suggestCoins } from './economy'
import type { DumpDraft } from './dump'
import { planIdFor, ingredientsFor, missingRecipes, type RecipeDraft, type Suggestion } from './meals'
import { runOf, runView, isLive, sessionStepsOn } from './routines'
import { addAmounts, itemsOf, MAIN_LIST, nameKey, parseLine, guessAisle, type Need } from './shopping'
import { fromMin, toMin, tsOf, ymdOf } from './dates'
import { occursOn } from './recur'
import { homeworkSessionSteps } from './homeworkCore'
import { projectSessionSteps } from './projects'
import { duePlantSteps } from './plants'
import { tickHabit } from './checkin/actions'
import { hasHabitSteps } from './checkin/routineHabits'
import type { Aisle, DumpEvent, FamilyState, Hm, MealPlanEvent, MealSlot, MemberId, RecipeEvent, RoutineEvent, RoutineStep, ShopItemEvent, ShopListEvent, Ymd } from './types'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

/** An event's own fields without its type or the bookkeeping the log adds (id, time, day, who, version), ready to be re-saved with changes. */
function bodyOf<T extends { type: string; id: string; ts: number; day: string; learnerId: string; v: number }>(e: T): Omit<T, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'> {
  const { type: _y, id: _i, ts: _t, day: _d, learnerId: _l, v: _v, ...rest } = e
  return rest
}

// ------------------------------------------------------------------ sessions

export type RoutineDraft = Omit<RoutineEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'routineId'> & { routineId?: string }

export const newRoutineId = (): string => uid('rt')
export const newStepId = (): string => uid('st')

export function saveRoutine(actor: MemberId, r: RoutineDraft, now = Date.now()): AppEvent[] {
  const { routineId, title, steps, ...rest } = r
  return [ev(actor, { type: 'routine', routineId: routineId ?? newRoutineId(), title: title.trim() || 'Session', steps: steps.filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim() })), ...rest }, now)]
}

export function deleteRoutine(actor: MemberId, existing: RoutineEvent, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'routine', ...bodyOf(existing), deleted: true }, now)]
}

export interface RunSource {
  routine?: RoutineEvent
  /** A saved session that is not passed in whole (its steps are). */
  routineId?: string
  title?: string
  emoji?: string
  steps?: RoutineStep[]
  finishBy?: Hm
}

/** Begin a session. The steps are copied into the start event, so editing the plan later never rewrites what was done. */
export function startRun(actor: MemberId, memberId: MemberId, src: RunSource, now = Date.now()): { runId: string; events: AppEvent[] } {
  const steps = (src.steps ?? src.routine?.steps ?? []).map((s) => ({ ...s }))
  const runId = uid('run')
  if (!steps.length) return { runId, events: [] }
  const body = { type: 'run' as const, runId, action: 'start' as const, routineId: src.routine?.routineId ?? src.routineId, title: src.title ?? src.routine?.title ?? 'Session', emoji: src.emoji ?? src.routine?.emoji, memberId, steps, finishBy: src.finishBy ?? src.routine?.finishBy, date: ymdOf(now) }
  return { runId, events: [ev(actor, body, now)] }
}

export const pauseRun = (actor: MemberId, runId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'run', runId, action: 'pause' }, now)]
export const resumeRun = (actor: MemberId, runId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'run', runId, action: 'resume' }, now)]
export const extendRun = (actor: MemberId, runId: string, sec = 60, now = Date.now()): AppEvent[] => [ev(actor, { type: 'run', runId, action: 'extend', sec }, now)]
export const abandonRun = (actor: MemberId, runId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'run', runId, action: 'end', outcome: 'abandoned' }, now)]

/**
 * Finish steps (done or skipped). If that was the last one and at least one step was really done, the session's linked task is
 * ticked off too (with the minutes it took), so a "Morning routine" session can pay its coins. Returns nothing if the run is
 * not open or the steps are already finished, so a double tap or a second phone never double-counts.
 */
export function finishSteps(actor: MemberId, f: FamilyState, runId: string, stepIds: readonly string[], status: 'done' | 'skipped', now = Date.now()): AppEvent[] {
  const run = runOf(f, runId)
  if (!run || !isLive(run)) return []
  const todo = new Set(run.steps.filter((s) => s.status === 'todo').map((s) => s.step.id))
  const ids = stepIds.filter((id) => todo.has(id))
  if (!ids.length) return []
  const out = ids.map((stepId, i) => ev(actor, { type: 'run', runId, action: 'step', stepId, status }, now + i))
  // A step that IS a task (a piece of homework in a homework session) ticks that task off when done, like ticking
  // it on the list - same coins and the same parent check. Skipping it leaves the task open.
  if (status === 'done') {
    for (const id of ids) {
      const step = run.steps.find((s) => s.step.id === id)?.step
      // A step that IS a habit ticks it for the day the run is for (nothing happens if it is already ticked).
      if (step?.habitId) out.push(...tickHabit(actor, f, step.habitId, run.date, now + ids.length + out.length))
      const task = step?.taskId ? f.tasks[step.taskId] : undefined
      if (!task || task.deleted || task.recur) continue
      const date: Ymd | 'any' = task.date ?? 'any'
      const have = f.done[`${task.taskId}|${date}`]
      if (have && have.status !== 'rejected') continue
      out.push(...completeTask(actor, f, task, date, { minutes: Math.max(1, Math.round(step!.minutes)) }, now + ids.length + out.length))
    }
  }
  const leftAfter = [...todo].filter((id) => !ids.includes(id))
  const anyDone = status === 'done' || run.steps.some((s) => s.status === 'done')
  if (!leftAfter.length && anyDone) {
    const routine = run.routineId ? f.routines[run.routineId] : undefined
    const task = routine?.taskId ? f.tasks[routine.taskId] : undefined
    // Coins go to the task's own person, and only on a day it is really due: someone else running the session, or running it
    // on a day it does not fall, is not a reason to pay out.
    const due = !!task && (!task.recur || (!!task.date && occursOn(task.recur, task.date, run.date)))
    if (task && !task.deleted && due && (!task.assignee || task.assignee === run.memberId)) {
      const date: Ymd | 'any' = task.recur ? run.date : task.date ?? 'any'
      const have = f.done[`${task.taskId}|${date}`]
      if (!have || have.status === 'rejected') {
        const minutes = Math.max(1, Math.round(runView(run, now).elapsedSec / 60))
        out.push(...completeTask(actor, f, task, date, { minutes }, now + ids.length))
      }
    }
  }
  return out
}

export const finishStep = (actor: MemberId, f: FamilyState, runId: string, stepId: string, status: 'done' | 'skipped', now = Date.now()): AppEvent[] => finishSteps(actor, f, runId, [stepId], status, now)

/** "That's enough": skip whatever is left and finish. */
export function finishEarly(actor: MemberId, f: FamilyState, runId: string, now = Date.now()): AppEvent[] {
  const run = runOf(f, runId)
  if (!run) return []
  return finishSteps(actor, f, runId, run.steps.filter((s) => s.status === 'todo').map((s) => s.step.id), 'skipped', now)
}

/** Undo whatever `events` did (a step, and the task tick that came with it). */
export const undoEvents = (actor: MemberId, events: readonly AppEvent[], now = Date.now()): AppEvent[] => events.map((e, i) => ev(actor, { type: 'void', targetId: e.id }, now + i))

// ---------------------------------------------------------------- brain dump

/** Write several items down at once. Their times are a millisecond apart so the list keeps the order they were typed in. */
export function addDump(actor: MemberId, drafts: readonly DumpDraft[], now = Date.now()): AppEvent[] {
  return drafts
    .filter((d) => d.title.trim())
    .map((d, i) => ev(actor, { type: 'dump', itemId: uid('d'), title: d.title.trim(), notes: d.notes?.trim() || undefined, area: d.area?.trim() || undefined, ownerId: d.ownerId, minutes: d.minutes, priority: d.priority, status: 'open', created: now + i, ...(d.private ? { priv: actor } : {}) }, now + i))
}

/** The public "busy" block that stands in for a private item that has a time: it says someone is busy, never with what. */
const stubId = (taskId: string): string => `busy-${taskId}`

function busyStub(actor: MemberId, taskId: string, when: { date: Ymd; assignee: MemberId; time: Hm }, minutes: number | undefined, now: number): AppEvent {
  const mins = Math.max(10, Math.round(minutes ?? 30))
  return ev(actor, { type: 'cal', calId: stubId(taskId), title: 'Busy', date: when.date, allDay: false, start: when.time, end: fromMin(Math.min(23 * 60 + 59, toMin(when.time) + mins)), members: [when.assignee], category: 'other', busy: true }, now)
}

const removeStub = (actor: MemberId, f: FamilyState, taskId: string | undefined, now: number): AppEvent[] => {
  const stub = taskId ? f.cal[stubId(taskId)] : undefined
  return stub && !stub.deleted ? [ev(actor, { type: 'cal', ...bodyOf(stub), deleted: true }, now)] : []
}

/**
 * Turn a shared item into a private one: the shared copy comes off every list (and off the day, if it was scheduled) and a
 * private copy takes its place. The shared copy stays in the database history, so the caller says so before doing this.
 */
export function makeDumpPrivate(actor: MemberId, f: FamilyState, item: DumpEvent, now = Date.now()): AppEvent[] {
  const un = item.taskId ? unscheduleDump(actor, f, item, now) : []
  const gone = deleteDump(actor, { ...item, taskId: undefined }, now + 5)
  const copy = ev(actor, { type: 'dump', itemId: uid('d'), title: item.title, notes: item.notes, area: item.area, ownerId: item.ownerId, minutes: item.minutes, priority: item.priority, status: item.status, created: item.created ?? item.ts, priv: actor }, now + 6)
  return [...un, ...gone, copy]
}

/** The other way: a private item becomes a shared one (a new shared copy; the private one is removed). */
export function makeDumpShared(actor: MemberId, f: FamilyState, item: DumpEvent, now = Date.now()): AppEvent[] {
  const un = item.taskId ? unscheduleDump(actor, f, item, now) : []
  const gone = deleteDump(actor, { ...item, taskId: undefined }, now + 5)
  const { priv: _p, ...plain } = bodyOf(item)
  const copy = ev(actor, { ...plain, type: 'dump', itemId: uid('d'), taskId: undefined, deleted: undefined, created: item.created ?? item.ts }, now + 6)
  return [...un, ...gone, copy]
}

export type DumpPatch = Partial<Pick<DumpEvent, 'title' | 'notes' | 'area' | 'ownerId' | 'minutes' | 'priority' | 'status' | 'taskId'>>

export function saveDump(actor: MemberId, existing: DumpEvent, patch: DumpPatch, now = Date.now()): AppEvent[] {
  const next = { ...bodyOf(existing), ...patch, created: existing.created ?? existing.ts }
  if (patch.title !== undefined && !patch.title.trim()) next.title = existing.title
  return [ev(actor, { ...next, type: 'dump', title: next.title.trim() }, now)]
}

export const deleteDump = (actor: MemberId, existing: DumpEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'dump', ...bodyOf(existing), deleted: true }, now)]

/**
 * Put an item on a day: it becomes a task for `assignee` (coins only for children), and the item keeps a link to it, so
 * moving the day later just re-saves the same task, and ticking the task off ticks the item off.
 */
export function scheduleDump(actor: MemberId, f: FamilyState, item: DumpEvent, when: { date: Ymd; assignee: MemberId; time?: Hm; /** Edits made in the same breath (title, list, minutes...), saved with the item. */ patch?: DumpPatch }, now = Date.now()): AppEvent[] {
  const it: DumpEvent = { ...item, ...when.patch }
  const taskId = item.taskId ?? `dump-${item.itemId}`
  const child = f.members[when.assignee]?.role === 'child'
  const tasks = saveTask(actor, { taskId, title: it.title, assignee: when.assignee, kind: 'chore', part: 'any', date: when.date, time: when.time, minutes: it.minutes, coins: child ? suggestCoins('chore', it.minutes) : 0, check: child ? 'parent' : 'self', notes: it.notes, source: `dump:${item.itemId}` }, now)
  const ownerId = when.patch && 'ownerId' in when.patch ? when.patch.ownerId : when.assignee
  const stub = item.priv && when.time ? [busyStub(actor, taskId, { date: when.date, assignee: when.assignee, time: when.time }, it.minutes, now + 2)] : item.priv ? removeStub(actor, f, taskId, now + 2) : []
  return [...tasks, ...saveDump(actor, item, { ...when.patch, taskId, ownerId }, now + 1), ...stub]
}

/** Take an item off its day again (the task is removed, the item goes back to the list). */
export function unscheduleDump(actor: MemberId, f: FamilyState, item: DumpEvent, now = Date.now()): AppEvent[] {
  const t = item.taskId ? f.tasks[item.taskId] : undefined
  return [...(t && !t.deleted ? deleteTask(actor, t, now) : []), ...saveDump(actor, item, { taskId: undefined }, now + 1), ...removeStub(actor, f, item.taskId, now + 2)]
}

/** Steps for a session from brain-dump items: each keeps a link back, so finishing the step ticks the item off. */
export const stepsFromDump = (items: readonly DumpEvent[]): RoutineStep[] => items.map((d) => ({ id: newStepId(), title: d.title, minutes: d.minutes ?? 5, dumpId: d.itemId, notes: d.notes }))

/** Turn selected items into a new session (not scheduled: start it whenever). */
export function sessionFromDump(actor: MemberId, items: readonly DumpEvent[], o: { title: string; emoji?: string; ownerId?: MemberId }, now = Date.now()): { routineId: string; events: AppEvent[] } {
  const routineId = newRoutineId()
  return { routineId, events: saveRoutine(actor, { routineId, title: o.title, emoji: o.emoji ?? '📝', ownerId: o.ownerId, steps: stepsFromDump(items) }, now) }
}

export function addDumpToRoutine(actor: MemberId, routine: RoutineEvent, items: readonly DumpEvent[], now = Date.now()): AppEvent[] {
  const have = new Set(routine.steps.map((s) => s.dumpId).filter(Boolean))
  const add = stepsFromDump(items.filter((d) => !have.has(d.itemId)))
  return saveRoutine(actor, { ...bodyOf(routine), steps: [...routine.steps, ...add] }, now)
}

// ---------------------------------------------------------------- recipes and meals

export function saveRecipe(actor: MemberId, r: Omit<RecipeDraft, 'recipeId'> & { recipeId?: string }, now = Date.now(), id?: string): AppEvent[] {
  const { recipeId, title, ...rest } = r
  return [ev(actor, { type: 'recipe', recipeId: recipeId ?? uid('rc'), title: title.trim() || 'Recipe', ...rest }, now, id)]
}

export const deleteRecipe = (actor: MemberId, existing: RecipeEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'recipe', ...bodyOf(existing), deleted: true }, now)]

/** Add a pack of ready-made recipes (the starter ones, or the new-baby ones). Ids come from the recipe, so adding twice or from two phones makes one copy. */
/**
 * Seeded things get a fixed id AND a fixed time, so two phones seeding at different moments write the very same event (whichever
 * arrives second is dropped as a duplicate) and any edit made afterwards, on either phone, wins.
 */
export const SEED_TS = Date.UTC(2025, 0, 1)

export function seedRecipes(actor: MemberId, f: FamilyState, pack: readonly RecipeDraft[]): AppEvent[] {
  return missingRecipes(f, pack).flatMap((r) => saveRecipe(actor, r, SEED_TS, `seed-${r.recipeId}`))
}

export interface PlanInput {
  date: Ymd
  slot: MealSlot
  recipe?: RecipeEvent
  title?: string
  servings?: number
  cookId?: MemberId
  notes?: string
  /** The meal being changed. If it is the same food for the same number of people it stays "shopped for". */
  existing?: MealPlanEvent
  /** This meal's own time on the calendar (otherwise it follows the family's meal times). */
  start?: Hm
  end?: Hm
}

export function planMeal(actor: MemberId, p: PlanInput, now = Date.now()): AppEvent[] {
  const title = p.recipe?.title ?? p.title?.trim()
  if (!title) return []
  const servings = p.servings ?? p.recipe?.servings
  const e = p.existing
  const same = !!e && !e.deleted && e.shopped && e.recipeId === p.recipe?.recipeId && e.title === title && e.servings === servings
  return [ev(actor, { type: 'meal', planId: planIdFor(p.date, p.slot), date: p.date, slot: p.slot, recipeId: p.recipe?.recipeId, title, servings, cookId: p.cookId, notes: p.notes?.trim() || undefined, start: p.start || undefined, end: p.start ? p.end || undefined : undefined, ...(same ? { shopped: true } : {}) }, now)]
}

/**
 * Move a planned meal to another day (and/or slot). If something is already planned there the two swap places, so nothing is lost.
 * The meal keeps its recipe, servings, cook, notes and "shopped for" tick; its own time is kept on the same slot and dropped if the
 * slot changes (a lunch time means nothing for a dinner). Written as one batch so no phone ever sees half of it.
 */
export function moveMeal(actor: MemberId, f: FamilyState, existing: MealPlanEvent, to: { date: Ymd; slot?: MealSlot }, now = Date.now()): AppEvent[] {
  const slot = to.slot ?? existing.slot
  if (existing.date === to.date && existing.slot === slot) return []
  const target = f.meals[planIdFor(to.date, slot)]
  const there = target && !target.deleted ? target : undefined
  const place = (m: MealPlanEvent, date: Ymd, s: MealSlot, at: number): AppEvent => {
    const keepTime = m.slot === s
    return ev(actor, { type: 'meal', ...bodyOf(m), planId: planIdFor(date, s), date, slot: s, start: keepTime ? m.start : undefined, end: keepTime ? m.end : undefined, deleted: undefined }, at)
  }
  const out: AppEvent[] = [place(existing, to.date, slot, now)]
  if (there) out.push(place(there, existing.date, existing.slot, now + 1))
  else out.push(ev(actor, { type: 'meal', ...bodyOf(existing), deleted: true }, now + 1))
  return out
}

export function saveMealTimes(actor: MemberId, t: { breakfast: { start: Hm; end: Hm }; lunch: { start: Hm; end: Hm }; dinner: { start: Hm; end: Hm } }, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'meal-times', ...t }, now)]
}

export const clearMeal = (actor: MemberId, existing: MealPlanEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'meal', ...bodyOf(existing), deleted: true }, now)]

export function planSuggestions(actor: MemberId, f: FamilyState, suggestions: readonly Suggestion[], slot: MealSlot = 'dinner', now = Date.now()): AppEvent[] {
  return suggestions.flatMap((s, i) => {
    if (s.recipeId) {
      const recipe = f.recipes[s.recipeId]
      return recipe ? planMeal(actor, { date: s.date, slot, recipe }, now + i) : []
    }
    return planMeal(actor, { date: s.date, slot, title: s.title }, now + i)
  })
}

// ------------------------------------------------------------------ shopping

export function saveList(actor: MemberId, l: { listId?: string; name: string; emoji?: string }, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'shop-list', listId: l.listId ?? uid('sl'), name: l.name.trim() || 'List', emoji: l.emoji }, now)]
}

export const deleteList = (actor: MemberId, existing: ShopListEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'shop-list', ...bodyOf(existing), deleted: true }, now)]

export interface ShopInput {
  name: string
  qty?: number
  unit?: string
  aisle?: Aisle
  note?: string
  /** Meal-plan entries this came from. */
  from?: string[]
}

/**
 * Put things on a list. If the same thing is already on it (and not ticked), the amounts are added together instead of listing
 * it twice: "200 g mince" + "300 g mince" becomes "500 g mince". A ticked item does not count (you bought it; you need more).
 */
export function addToList(actor: MemberId, f: FamilyState, listId: string, entries: readonly ShopInput[], now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  if (listId === MAIN_LIST && !f.shopLists[MAIN_LIST]) out.push(ev(actor, { type: 'shop-list', listId: MAIN_LIST, name: 'Shopping', emoji: '🛒' }, SEED_TS, 'seed-list-main'))
  const open: ShopItemEvent[] = itemsOf(f, listId).filter((i) => !i.done)
  let n = 0
  for (const e of entries) {
    const name = e.name.trim()
    if (!name) continue
    const key = nameKey(name)
    const hit = open.find((i) => nameKey(i.name) === key && addAmounts(i, e) !== undefined)
    if (hit) {
      const sum = addAmounts(hit, e)!
      const merged: ShopItemEvent = { ...hit, qty: sum.qty, unit: sum.unit, note: hit.note ?? e.note, fromPlans: [...new Set([...(hit.fromPlans ?? []), ...(e.from ?? [])])] }
      open[open.indexOf(hit)] = merged
      out.push(ev(actor, { ...bodyOf(merged), type: 'shop-item' }, now + n++))
    } else {
      const item: ShopItemEvent = { type: 'shop-item', id: '', ts: now, day: '', learnerId: actor, v: 1, itemId: uid('si'), listId, name, qty: e.qty, unit: e.unit, aisle: e.aisle ?? guessAisle(name), note: e.note?.trim() || undefined, done: false, fromPlans: e.from?.length ? e.from : undefined }
      open.push(item)
      out.push(ev(actor, { ...bodyOf(item), type: 'shop-item' }, now + n++))
    }
  }
  return out
}

/** Type or paste one item per line ("2 tins tomatoes", "milk x2", "500g mince") and add them. */
export function addTextToList(actor: MemberId, f: FamilyState, listId: string, text: string, now = Date.now()): AppEvent[] {
  const entries: ShopInput[] = text
    .split(/\r?\n/)
    .map((l) => parseLine(l))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ name: p.name, qty: p.qty, unit: p.unit, note: p.note }))
  return addToList(actor, f, listId, entries, now)
}

export const tickItem = (actor: MemberId, existing: ShopItemEvent, done: boolean, now = Date.now()): AppEvent[] => [ev(actor, { type: 'shop-item', ...bodyOf(existing), done }, now)]

export function editItem(actor: MemberId, existing: ShopItemEvent, patch: Partial<Pick<ShopItemEvent, 'name' | 'qty' | 'unit' | 'aisle' | 'note'>>, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'shop-item', ...bodyOf(existing), ...patch, name: (patch.name ?? existing.name).trim() || existing.name }, now)]
}

export const removeItem = (actor: MemberId, existing: ShopItemEvent, now = Date.now()): AppEvent[] => [ev(actor, { type: 'shop-item', ...bodyOf(existing), deleted: true }, now)]

/** Clear everything that has been ticked off (after the shop). */
export const clearTicked = (actor: MemberId, items: readonly ShopItemEvent[], now = Date.now()): AppEvent[] => items.filter((i) => i.done && !i.deleted).map((i, n) => ev(actor, { type: 'shop-item', ...bodyOf(i), deleted: true }, now + n))

/**
 * Work out what the meals planned from `from` to `to` need and add it to a list, then mark those meals as shopped for so the
 * next time does not add them again. Changing a meal afterwards makes it count as new.
 */
export function addPlanToList(actor: MemberId, f: FamilyState, listId: string, from: Ymd, to: Ymd, now = Date.now(), opts: { skip?: ReadonlySet<string> } = {}): { events: AppEvent[]; lines: number; meals: number } {
  const ps = ingredientsFor(f, from, to)
  // `skip` holds the name keys of lines the person unticked ("I already have this").
  const entries = ps.needs.filter((n) => !opts.skip?.has(nameKey(n.name))).map((n: Need) => ({ name: n.name, qty: n.qty, unit: n.unit, aisle: n.aisle, from: n.from }))
  const events = addToList(actor, f, listId, entries, now)
  ps.plans.forEach((m, i) => events.push(ev(actor, { type: 'meal', ...bodyOf(m), shopped: true }, now + entries.length + 1 + i)))
  return { events, lines: entries.length, meals: ps.plans.length }
}

/** What to start a saved session from. A daily homework session has no saved steps: they're taken, at the moment
 * it starts, from its owner's homework planned for that day (see family/homework.ts). */
export function runSourceFor(f: FamilyState, routine: RoutineEvent, today: Ymd): RunSource {
  if (routine.homework) return { routine, steps: homeworkSessionSteps(f, routine.ownerId ?? '', today) }
  if (routine.project) return { routine, steps: projectSessionSteps(f, routine) }
  if (routine.plants) return { routine, steps: duePlantSteps(f, tsOf(today, '12:00')) }
  if (hasHabitSteps(routine.steps)) return { routine, steps: sessionStepsOn(f, routine, today) }
  return { routine }
}
