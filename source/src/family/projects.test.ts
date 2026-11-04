import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { buildUserPrompt, cleanBreakdown, cleanInput, geminiRequestBody, geminiText, type BreakdownResult } from '../../supabase/functions/_shared/breakdown'
import * as A from './actions'
import * as P from './planActions'
import * as PA from './projectActions'
import { tsOf, weekday } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import { linkClusters, packSessions, projectRoutines, projectSessionSteps, projectTree, readySteps, stepsToDo, waitingFor, wouldLoop } from './projects'
import { routinesOn, sessionStepsOn } from './routines'
import type { ActivityEvent, FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const find = (f: FamilyState, title: string): ActivityEvent => Object.values(f.activities).find((a) => a.title === title && !a.deleted)!

function family(): FamilyState {
  const now = T('2026-10-01', '06:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'maya', name: 'Maya', role: 'child', colour: '#ffc857', active: true }, now + 1),
  ])
}

/** What a model might send back: a room makeover with a dependency chain and one free-standing task. */
const ROOM: BreakdownResult = {
  project_title: 'Bedroom makeover',
  total_estimated_minutes: 0,
  tasks: [
    { task_id: 't1', title: 'Clear the room', description: 'Move everything to the landing.', estimated_minutes: 30, dependencies: [] },
    { task_id: 't2', title: 'Paint the walls', description: 'Two coats.', estimated_minutes: 120, dependencies: ['t1'] },
    { task_id: 't3', title: 'Choose a colour', description: 'Pick from three testers.', estimated_minutes: 20, dependencies: [] },
    { task_id: 't4', title: 'Put the furniture back', description: '', estimated_minutes: 30, dependencies: ['t2'] },
  ],
}

function withProject(f = family(), now = T('2026-10-01', '09:00')) {
  const { projectId, events } = PA.saveProject('dad', { title: '', goal: 'Redo Maya’s bedroom', ownerId: 'maya', grain: 30, emoji: '🎨' }, now)
  f = apply(f, events)
  const b = PA.applyBreakdown('dad', f, projectId, undefined, cleanBreakdown(ROOM)!, now + 10)
  f = apply(f, b.events)
  return { f, projectId, ids: b.ids }
}

describe('the prompt and the answer checks', () => {
  it('builds the agreed template with dynamic context, and never includes names', () => {
    const p = buildUserPrompt({ goal: 'Learn to bake bread', context: 'Only weekends', dailyMinutes: 45, skill: 'new', who: 'child', grain: 20 })
    expect(p).toMatch(/^Goal: Learn to bake bread\n\nAdditional Context\/Constraints: /)
    expect(p).toContain('about 45 minutes a day')
    expect(p).toContain('New to this')
    expect(p).toContain('secondary school')
    expect(p).toContain('steps of about 20 minutes')
    expect(p).toContain('Notes from the family: Only weekends')
    const body = geminiRequestBody({ goal: 'x' }) as { generationConfig: { responseMimeType: string; responseSchema?: unknown } }
    expect(body.generationConfig.responseMimeType).toBe('application/json')
    expect(body.generationConfig.responseSchema).toBeTruthy()
  })

  it('a deeper call says where the piece sits and what is already covered', () => {
    const p = buildUserPrompt({ goal: 'Paint the walls', projectGoal: 'Redo the bedroom', path: ['Paint the walls'], siblings: ['Clear the room'], minutes: 120 })
    expect(p).toContain('one part of a bigger project: "Redo the bedroom"')
    expect(p).toContain('do not repeat): Clear the room')
    expect(p).toContain('about 120 minutes in total')
  })

  it('tidies a messy answer: unknown and self links dropped, loops broken, minutes clamped, duplicate ids made unique', () => {
    const r = cleanBreakdown(
      JSON.stringify({
        project_title: 'X',
        tasks: [
          { task_id: 'a', title: '  Do A ', description: 'd', estimated_minutes: 0, dependencies: ['b', 'zz', 'a'] },
          { task_id: 'b', title: 'Do B', description: 'd', estimated_minutes: 9999, dependencies: ['a'] },
          { task_id: 'b', title: 'Do B again', description: 'd', estimated_minutes: '12', dependencies: [] },
          { task_id: 'c', title: '', description: 'no title', estimated_minutes: 5, dependencies: [] },
        ],
      }),
    )!
    expect(r.tasks.map((t) => t.task_id)).toEqual(['a', 'b', 'b_'])
    expect(r.tasks[0]!.title).toBe('Do A')
    expect(r.tasks[0]!.estimated_minutes).toBe(1)
    expect(r.tasks[1]!.estimated_minutes).toBe(600)
    expect(r.tasks[2]!.estimated_minutes).toBe(12)
    // a -> b was kept first, so b -> a (a loop) is dropped
    expect(r.tasks[0]!.dependencies).toEqual(['b'])
    expect(r.tasks[1]!.dependencies).toEqual([])
    expect(cleanBreakdown('not json')).toBeUndefined()
    expect(cleanBreakdown({ tasks: [] })).toBeUndefined()
    expect(cleanBreakdown('```json\n{"tasks":[{"title":"Go","estimated_minutes":5}]}\n```')!.tasks[0]!.title).toBe('Go')
  })

  it('reads the text out of a Gemini response, and caps what arrives at the function', () => {
    expect(geminiText({ candidates: [{ content: { parts: [{ text: '{"a":' }, { text: '1}' }] } }] })).toBe('{"a":1}')
    expect(geminiText({ promptFeedback: { blockReason: 'SAFETY' } })).toBeUndefined()
    expect(cleanInput({ goal: '' })).toBeUndefined()
    const i = cleanInput({ goal: 'x'.repeat(5000), skill: 'wizard', grain: 1, siblings: Array(100).fill('s') })!
    expect(i.goal.length).toBe(600)
    expect(i.skill).toBeUndefined()
    expect(i.grain).toBe(5)
    expect(i.siblings!.length).toBe(30)
  })
})

describe('a project tree', () => {
  it('puts the activities in dependency order and works out what can be done now', () => {
    const { f, projectId } = withProject()
    const t = projectTree(f, projectId)!
    expect(t.project.title).toBe('Redo Maya’s bedroom')
    expect(t.order.map((a) => a.title)).toEqual(['Clear the room', 'Paint the walls', 'Choose a colour', 'Put the furniture back'])
    expect(t.minutesLeft).toBe(200)
    expect(readySteps(t, f).map((a) => a.title)).toEqual(['Clear the room', 'Choose a colour'])
    expect(waitingFor(t, f, find(f, 'Put the furniture back').activityId).map((a) => a.title)).toEqual(['Paint the walls'])
    const clusters = linkClusters(t.roots)
    expect(clusters.get(find(f, 'Clear the room').activityId)).toBe(clusters.get(find(f, 'Put the furniture back').activityId))
    expect(clusters.has(find(f, 'Choose a colour').activityId)).toBe(false)
  })

  it('a deeper breakdown turns a step into a group whose steps wait for what the group waited for', () => {
    let { f, projectId } = withProject()
    const paint = find(f, 'Paint the walls')
    const deeper = cleanBreakdown({
      tasks: [
        { task_id: '1', title: 'Fill the cracks', description: '', estimated_minutes: 20, dependencies: [] },
        { task_id: '2', title: 'First coat', description: '', estimated_minutes: 50, dependencies: ['1'] },
        { task_id: '3', title: 'Second coat', description: '', estimated_minutes: 50, dependencies: ['2'] },
      ],
    })!
    f = apply(f, PA.applyBreakdown('dad', f, projectId, paint.activityId, deeper, T('2026-10-01', '10:00')).events)
    const t = projectTree(f, projectId)!
    expect(t.info.get(paint.activityId)!.isGroup).toBe(true)
    expect(t.order.map((a) => a.title)).toEqual(['Clear the room', 'Fill the cracks', 'First coat', 'Second coat', 'Choose a colour', 'Put the furniture back'])
    expect(waitingFor(t, f, find(f, 'Fill the cracks').activityId).map((a) => a.title)).toEqual(['Clear the room'])
    expect(stepsToDo(t, paint.activityId).map((a) => a.title)).toEqual(['Fill the cracks', 'First coat', 'Second coat'])
    expect(t.minutesLeft).toBe(30 + 120 + 20 + 30)
    // ticking "Clear the room" frees the painting
    f = apply(f, PA.tickActivity('dad', f, find(f, 'Clear the room'), true, T('2026-10-01', '11:00')))
    const t2 = projectTree(f, projectId)!
    expect(readySteps(t2, f).map((a) => a.title)).toEqual(['Fill the cracks', 'Choose a colour'])
    expect(t2.stepsDone).toBe(1)
  })

  it('refuses a link that would make a loop', () => {
    const { f, projectId } = withProject()
    const t = projectTree(f, projectId)!
    expect(wouldLoop(t.roots, find(f, 'Clear the room').activityId, [find(f, 'Put the furniture back').activityId])).toBe(true)
    expect(wouldLoop(t.roots, find(f, 'Choose a colour').activityId, [find(f, 'Put the furniture back').activityId])).toBe(false)
  })

  it('deleting an activity keeps the chain: what came after it now comes after what it came after', () => {
    let { f, projectId } = withProject()
    f = apply(f, PA.deleteActivity('dad', f, find(f, 'Paint the walls'), T('2026-10-01', '10:00')))
    const t = projectTree(f, projectId)!
    expect(t.order.map((a) => a.title)).toEqual(['Clear the room', 'Choose a colour', 'Put the furniture back'])
    expect(find(f, 'Put the furniture back').after).toEqual([find(f, 'Clear the room').activityId])
  })

  it('groups siblings and ungroups them again without losing the order', () => {
    let { f, projectId } = withProject()
    const ids = [find(f, 'Clear the room').activityId, find(f, 'Paint the walls').activityId]
    const g = PA.groupActivities('dad', f, ids, 'Decorate', T('2026-10-01', '10:00'))
    f = apply(f, g.events)
    let t = projectTree(f, projectId)!
    expect(t.roots.map((a) => a.title)).toEqual(['Decorate', 'Choose a colour', 'Put the furniture back'])
    expect(find(f, 'Put the furniture back').after).toEqual([g.groupId])
    expect(t.order.map((a) => a.title)).toEqual(['Clear the room', 'Paint the walls', 'Choose a colour', 'Put the furniture back'])
    f = apply(f, PA.ungroupActivity('dad', f, f.activities[g.groupId]!, T('2026-10-01', '11:00')))
    t = projectTree(f, projectId)!
    expect(t.roots.map((a) => a.title)).toEqual(['Clear the room', 'Paint the walls', 'Choose a colour', 'Put the furniture back'])
    expect(find(f, 'Put the furniture back').after).toEqual([find(f, 'Paint the walls').activityId])
  })

  it('moving up and down only swaps things that are not linked', () => {
    let { f, projectId } = withProject()
    expect(PA.moveActivity('dad', f, find(f, 'Paint the walls'), -1, T('2026-10-01', '10:00'))).toEqual([])
    f = apply(f, PA.moveActivity('dad', f, find(f, 'Choose a colour'), -1, T('2026-10-01', '10:00')))
    expect(projectTree(f, projectId)!.order.map((a) => a.title)).toEqual(['Clear the room', 'Choose a colour', 'Paint the walls', 'Put the furniture back'])
  })
})

describe('playing and scheduling a project', () => {
  it('plays in order, up to a time limit, and a finished session step ticks the activity off (undo un-ticks it)', () => {
    let { f, projectId } = withProject()
    const t = projectTree(f, projectId)!
    const src = PA.playSource(t, undefined, 60)
    expect(src.steps!.map((s) => s.title)).toEqual(['Clear the room'])
    expect(PA.playSource(t, undefined, 200).steps!.map((s) => s.title)).toEqual(['Clear the room', 'Paint the walls', 'Choose a colour', 'Put the furniture back'])
    const now = T('2026-10-02', '10:00')
    const run = P.startRun('maya', 'maya', src, now)
    f = apply(f, run.events)
    const step = P.finishSteps('maya', f, run.runId, [src.steps![0]!.id], 'done', now + 60_000)
    f = apply(f, step)
    expect(projectTree(f, projectId)!.info.get(find(f, 'Clear the room').activityId)!.complete).toBe(true)
    // renaming it afterwards keeps it done
    f = apply(f, PA.saveActivity('dad', f, find(f, 'Clear the room'), { title: 'Empty the room' }, now + 120_000))
    expect(projectTree(f, projectId)!.info.get(find(f, 'Empty the room').activityId)!.complete).toBe(true)
    // unticking by hand reopens it
    f = apply(f, PA.tickActivity('dad', f, find(f, 'Empty the room'), false, now + 180_000))
    expect(projectTree(f, projectId)!.info.get(find(f, 'Empty the room').activityId)!.complete).toBe(false)
  })

  it('packs steps into sessions without splitting one', () => {
    const mk = (m: number) => ({ minutes: m }) as ActivityEvent
    expect(packSessions([mk(20), mk(20), mk(30), mk(90), mk(10)], 45).map((p) => p.map((a) => a.minutes))).toEqual([[20, 20], [30], [90], [10]])
  })

  it('plans dated sessions on the chosen days, which run with the activities as they are on the day, and re-plans cleanly', () => {
    let { f, projectId } = withProject()
    const now = T('2026-10-01', '12:00')
    const plan = PA.planSessions('dad', f, projectTree(f, projectId)!, { minutes: 60, ownerId: 'maya', from: '2026-10-01', days: [5, 6], startAt: '10:00' }, now)
    f = apply(f, plan.events)
    // 2026-10-01 is a Thursday: the first Saturday is the 3rd
    expect(plan.sessions.map((s) => s.date)).toEqual(['2026-10-03', '2026-10-04', '2026-10-10'])
    expect(plan.sessions.map((s) => s.date).every((d) => weekday(d) >= 5)).toBe(true)
    const rs = projectRoutines(f, projectId)
    expect(rs).toHaveLength(3)
    expect(rs[0]!.title).toBe('Redo Maya’s bedroom (1 of 3)')
    expect(routinesOn(f, '2026-10-03', { memberId: 'maya' }).map((r) => r.routineId)).toEqual([rs[0]!.routineId])
    // edited after planning: the session shows the new name
    f = apply(f, PA.saveActivity('dad', f, find(f, 'Clear the room'), { title: 'Empty the room', minutes: 25 }, now + 1000))
    expect(sessionStepsOn(f, rs[0]!, '2026-10-03').map((s) => [s.title, s.minutes])).toEqual([['Empty the room', 25]])
    expect(P.runSourceFor(f, rs[0]!, '2026-10-03').steps!.map((s) => s.activityId)).toEqual([find(f, 'Empty the room').activityId])
    // done already: the session has nothing left
    f = apply(f, PA.tickActivity('dad', f, find(f, 'Empty the room'), true, now + 2000))
    expect(projectSessionSteps(f, rs[0]!)).toEqual([])
    // planning again replaces sessions that were never started
    const again = PA.planSessions('dad', f, projectTree(f, projectId)!, { minutes: 300, from: '2026-10-01', days: [0, 1, 2, 3, 4, 5, 6] }, now + 3000)
    f = apply(f, again.events)
    expect(projectRoutines(f, projectId)).toHaveLength(1)
    expect(again.sessions).toEqual([{ date: '2026-10-01', minutes: 170, steps: 3 }])
  })

  it('deleting a project removes its sessions that were never started', () => {
    let { f, projectId } = withProject()
    f = apply(f, PA.planSessions('dad', f, projectTree(f, projectId)!, { minutes: 60, from: '2026-10-01', days: [0, 1, 2, 3, 4, 5, 6] }, T('2026-10-01', '12:00')).events)
    f = apply(f, PA.deleteProject('dad', f, f.projects[projectId]!, T('2026-10-01', '13:00')))
    expect(projectRoutines(f, projectId)).toHaveLength(0)
    expect(projectTree(f, projectId)).toBeUndefined()
  })

  it('a session always runs in the current dependency order and brings in anything it now waits for', () => {
    let { f, projectId } = withProject()
    const now = T('2026-10-01', '12:00')
    f = apply(f, PA.planSessions('dad', f, projectTree(f, projectId)!, { minutes: 60, from: '2026-10-01', days: [0, 1, 2, 3, 4, 5, 6] }, now).events)
    const second = projectRoutines(f, projectId)[1]!
    // planned as just "Paint the walls"; it waits for "Clear the room", which wasn't done in the first session
    expect(projectSessionSteps(f, second).map((s) => s.title)).toEqual(['Clear the room', 'Paint the walls'])
    // a link added after planning: painting now also waits for choosing the colour
    f = apply(f, PA.saveActivity('dad', f, find(f, 'Paint the walls'), { after: [find(f, 'Clear the room').activityId, find(f, 'Choose a colour').activityId] }, now + 1000))
    expect(projectSessionSteps(f, second).map((s) => s.title)).toEqual(['Clear the room', 'Choose a colour', 'Paint the walls'])
  })
})

describe('undo and two phones', () => {
  it('undoing a tick (a void) brings back the state before it', () => {
    let { f, projectId } = withProject()
    const tick = PA.tickActivity('dad', f, find(f, 'Choose a colour'), true, T('2026-10-02'))
    f = apply(f, tick)
    expect(projectTree(f, projectId)!.stepsDone).toBe(1)
    f = apply(f, P.undoEvents('dad', tick, T('2026-10-02', '12:01')))
    expect(projectTree(f, projectId)!.stepsDone).toBe(0)
  })

  it('undoing a delete puts the activity and its links back', () => {
    let { f, projectId } = withProject()
    const before = f
    const del = PA.deleteActivity('dad', f, find(f, 'Paint the walls'), T('2026-10-02'))
    f = apply(f, del)
    f = apply(f, PA.revertActivities('dad', before, del, T('2026-10-02', '12:01')))
    expect(projectTree(f, projectId)!.order.map((a) => a.title)).toEqual(['Clear the room', 'Paint the walls', 'Choose a colour', 'Put the furniture back'])
    expect(find(f, 'Put the furniture back').after).toEqual([find(f, 'Paint the walls').activityId])
  })

  it('undoing a breakdown removes what it added', () => {
    let { f, projectId } = withProject()
    const before = f
    const b = PA.applyBreakdown('dad', f, projectId, find(f, 'Paint the walls').activityId, cleanBreakdown({ tasks: [{ title: 'Sand', estimated_minutes: 20 }, { title: 'Paint', estimated_minutes: 60 }] })!, T('2026-10-02'))
    f = apply(f, b.events)
    expect(projectTree(f, projectId)!.stepsTotal).toBe(5)
    f = apply(f, PA.revertActivities('dad', before, b.events, T('2026-10-02', '12:01')))
    expect(projectTree(f, projectId)!.stepsTotal).toBe(4)
  })

  it('refuses to group across a link that something unselected sits in the middle of', () => {
    const { f } = withProject()
    // Clear -> Paint -> Furniture: grouping Clear and Furniture would loop through Paint
    const ids = [find(f, 'Clear the room').activityId, find(f, 'Put the furniture back').activityId]
    expect(PA.groupWouldLoop(f, ids)).toBe(true)
    expect(PA.groupActivities('dad', f, ids, 'X', T('2026-10-02')).events).toEqual([])
    expect(PA.groupWouldLoop(f, [find(f, 'Clear the room').activityId, find(f, 'Paint the walls').activityId])).toBe(false)
  })

  it('a step done in a session stays done when another phone re-saves the activity, and undoing the step un-does it even after a rename', () => {
    let { f, projectId } = withProject()
    const stale = f // a phone that hasn't seen the session yet
    const now = T('2026-10-02', '10:00')
    const src = PA.playSource(projectTree(f, projectId)!, undefined, 30)
    const run = P.startRun('maya', 'maya', src, now)
    f = apply(f, run.events)
    const step = P.finishSteps('maya', f, run.runId, [src.steps![0]!.id], 'done', now + 60_000)
    f = apply(f, step)
    const id = find(f, 'Clear the room').activityId
    // the other phone renames it later, from its old state
    f = apply(f, PA.saveActivity('dad', stale, find(stale, 'Clear the room'), { title: 'Empty the room' }, now + 120_000))
    expect(projectTree(f, projectId)!.info.get(id)!.complete).toBe(true)
    f = apply(f, P.undoEvents('maya', step, now + 180_000))
    expect(projectTree(f, projectId)!.info.get(id)!.complete).toBe(false)
  })
})
