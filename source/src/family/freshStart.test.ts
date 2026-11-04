import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import { makeCalCtx, tasksFor } from './calendar'
import { addDays, tsOf } from './dates'
import { dumpList } from './dump'
import { freshStartEvents, freshStartPlan, freshStartSummary, leftOver } from './freshStart'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const TODAY = '2026-11-04' // a Wednesday
const NOW = T(TODAY, '16:00')
const ago = (n: number) => addDays(TODAY, -n)

function family(): FamilyState {
  const long = T(ago(60), '08:00')
  const recent = T(ago(3), '08:00')
  return projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, long),
    ...A.saveMember('mum', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, long + 1),
    // homework past its due day (30 and 45 min), and one planned for a day that has gone but due on Friday
    ...A.saveTask('kid', { taskId: 'essay', title: 'Essay', assignee: 'kid', kind: 'homework', part: 'any', minutes: 45, date: ago(5), subject: 'English' }, recent),
    ...A.saveTask('kid', { taskId: 'maths', title: 'Maths sheet', assignee: 'kid', kind: 'homework', part: 'any', minutes: 30, date: ago(2) }, recent + 1),
    ...A.saveTask('kid', { taskId: 'spell', title: 'Spellings', assignee: 'kid', kind: 'homework', part: 'any', minutes: 10, date: addDays(TODAY, 2), doOn: ago(1) }, recent + 2),
    // chores: one recent, one untouched for weeks
    ...A.saveTask('mum', { taskId: 'tidy', title: 'Tidy room', assignee: 'kid', kind: 'chore', part: 'any', minutes: 20, date: ago(4) }, recent + 3),
    ...A.saveTask('mum', { taskId: 'shed', title: 'Clear the shed', assignee: 'kid', kind: 'chore', part: 'any', minutes: 60, date: ago(37) }, long + 2),
    // not left over: a repeating task, a "whenever" task, one done, one due today
    ...A.saveTask('mum', { taskId: 'feed', title: 'Feed the dog', assignee: 'kid', kind: 'chore', part: 'morning', date: ago(30), recur: { freq: 'daily' } }, long + 3),
    ...A.saveTask('mum', { taskId: 'any', title: 'Read a book', assignee: 'kid', kind: 'chore', part: 'any' }, long + 4),
    ...A.saveTask('mum', { taskId: 'today', title: 'Bins out', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY }, recent + 4),
    ...A.saveTask('mum', { taskId: 'old-done', title: 'Old done', assignee: 'kid', kind: 'chore', part: 'any', date: ago(6) }, recent + 5),
  ])
}

const withDone = (f: FamilyState) => apply(f, A.completeTask('mum', f, f.tasks['old-done']!, ago(6), {}, T(ago(6), '18:00')))

describe('fresh start', () => {
  it('finds what is left over: past its day, or homework whose planned day has gone', () => {
    const f = withDone(family())
    expect(leftOver(f, 'kid', TODAY).map((t) => t.taskId).sort()).toEqual(['essay', 'maths', 'shed', 'spell', 'tidy'])
  })

  it('spreads things from today, at most two a day, homework first and the shortest first', () => {
    const f = withDone(family())
    const plan = freshStartPlan(f, ['kid'], TODAY, { now: NOW })
    expect(plan.moves.map((m) => [m.task.taskId, m.to])).toEqual([
      ['spell', TODAY],
      ['maths', TODAY],
      ['essay', addDays(TODAY, 1)],
      ['tidy', addDays(TODAY, 1)],
      ['shed', addDays(TODAY, 2)],
    ])
  })

  it('lets long-untouched chores wait for Someday when a parent asks, never homework', () => {
    const f = withDone(family())
    const plan = freshStartPlan(f, ['kid'], TODAY, { now: NOW, allowSomeday: true })
    expect(plan.moves.find((m) => m.task.taskId === 'shed')!.to).toBe('someday')
    expect(plan.moves.filter((m) => m.to === 'someday').map((m) => m.task.taskId)).toEqual(['shed'])
  })

  it('writes ordinary task events, so nothing is late any more and each day gets at most two', () => {
    let f = withDone(family())
    const plan = freshStartPlan(f, ['kid'], TODAY, { now: NOW, allowSomeday: true })
    f = apply(f, freshStartEvents('mum', f, plan, NOW))
    expect(leftOver(f, 'kid', TODAY)).toEqual([])
    // homework past due is planned for a new day and handed in the day after; slipped homework keeps its due day
    expect(f.tasks.maths).toMatchObject({ date: addDays(TODAY, 1), doOn: TODAY })
    expect(f.tasks.spell).toMatchObject({ date: addDays(TODAY, 2), doOn: TODAY })
    expect(f.tasks.tidy).toMatchObject({ date: addDays(TODAY, 1) })
    // the shed is off the list and in the brain dump, marked someday, still for the child
    expect(f.tasks.shed!.deleted).toBe(true)
    const shed = dumpList(f).find((d) => d.title === 'Clear the shed')!
    expect(shed).toMatchObject({ priority: 'someday', ownerId: 'kid' })
    // today's list: nothing from before, two moved things plus what was already there
    const rows = tasksFor(makeCalCtx(f), 'kid', TODAY, NOW)
    expect(rows.some((r) => r.overdue)).toBe(false)
    const moved = new Set(plan.moves.filter((m) => m.to === TODAY).map((m) => m.task.taskId))
    expect(rows.filter((r) => moved.has(r.task.taskId))).toHaveLength(2)
    // tomorrow's moved homework doesn't show today
    expect(rows.find((r) => r.task.taskId === 'essay')).toBeUndefined()
  })

  it('puts a task that came from the brain dump back on its item, marked someday', () => {
    let f = family()
    const add = P.addDump('mum', [{ title: 'Sort the loft' }], T(ago(50)))
    f = apply(f, add)
    const item = Object.values(f.dump)[0]!
    f = apply(f, P.scheduleDump('mum', f, item, { date: ago(40), assignee: 'mum' }, T(ago(50), '13:00')))
    const plan = freshStartPlan(f, ['mum'], TODAY, { now: NOW, allowSomeday: true })
    expect(plan.moves.map((m) => m.to)).toEqual(['someday'])
    f = apply(f, freshStartEvents('mum', f, plan, NOW))
    expect(f.dump[item.itemId]).toMatchObject({ priority: 'someday', taskId: undefined })
    expect(f.tasks[`dump-${item.itemId}`]!.deleted).toBe(true)
  })

  it('says what it will do first', () => {
    const f = withDone(family())
    const plan = freshStartPlan(f, ['kid'], TODAY, { now: NOW, allowSomeday: true })
    const s = freshStartSummary(plan, TODAY)
    expect(s.title).toBe('Move 4 things to this week?')
    expect(s.lines).toEqual(['Today: Spellings, Maths sheet', 'Tomorrow: Essay, Tidy room'])
    expect(s.someday).toContain('Clear the shed')
    expect(freshStartSummary(freshStartPlan(family(), ['mum'], TODAY, { now: NOW }), TODAY).title).toBe('Nothing to move')
  })
})
