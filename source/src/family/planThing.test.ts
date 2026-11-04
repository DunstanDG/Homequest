import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import { addDays, daysBetween, tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import { projectTree } from './projects'
import { createPlan } from './planThing'
import { PEEK, PICK_LIMIT, isSomeday, pickToWeek, pickView, pickWindow } from './planDump'
import { TEMPLATES, defaultSteps, generateSteps, previewLine, templateById, MAX_PER_DAY } from './templates'
import type { FamilyState } from './types'

const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const NOW = tsOf('2026-11-04', '09:00')
const family = (): FamilyState =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, NOW),
    ...A.saveMember('dad', { id: 'maya', name: 'Maya', role: 'child', colour: '#ffc857', active: true }, NOW + 1),
  ])

const perDay = (steps: { due: string }[]) => steps.reduce<Record<string, number>>((m, s) => ((m[s.due] = (m[s.due] ?? 0) + 1), m), {})

describe('generateSteps', () => {
  const birthday = templateById('birthday')!
  it('places steps by their offsets when there is plenty of time', () => {
    const out = generateSteps({ steps: defaultSteps(birthday), date: '2026-12-31', today: '2026-11-04' })
    expect(out.find((s) => s.id === 'b3')!.due).toBe('2026-12-10')
    expect(out.every((s) => s.due >= '2026-11-04')).toBe(true)
  })
  it('squeezes steps that would fall in the past into the time left, keeping their order', () => {
    const out = generateSteps({ steps: defaultSteps(birthday), date: '2026-11-11', today: '2026-11-04' })
    expect(out.every((s) => s.due >= '2026-11-04' && s.due <= '2026-11-11')).toBe(true)
    const order = defaultSteps(birthday).map((s) => s.id)
    const ids = out.map((s) => s.id)
    expect(ids).toEqual(order)
  })
  it('never puts more than 2 steps on a day', () => {
    for (const t of TEMPLATES)
      for (const days of [0, 2, 5, 12, 60]) {
        const out = generateSteps({ steps: defaultSteps(t), date: addDays('2026-11-04', days), today: '2026-11-04' })
        const most = Math.max(...Object.values(perDay(out)))
        // Only when there are more steps than the days can hold does a day take a third.
        if (out.length <= MAX_PER_DAY * (days + 1)) expect(most).toBeLessThanOrEqual(MAX_PER_DAY)
        expect(out).toHaveLength(defaultSteps(t).length)
      }
  })
  it('handles a date today and a date already past', () => {
    const one = generateSteps({ steps: defaultSteps(birthday).slice(0, 2), date: '2026-11-04', today: '2026-11-04' })
    expect(one.map((s) => s.due)).toEqual(['2026-11-04', '2026-11-04'])
    const past = generateSteps({ steps: defaultSteps(birthday).slice(0, 2), date: '2026-10-01', today: '2026-11-04' })
    expect(past.every((s) => s.due >= '2026-11-04')).toBe(true)
  })
  it('keeps "after the date" steps after it', () => {
    const out = generateSteps({ steps: birthday.steps, date: '2026-12-10', today: '2026-11-04' })
    expect(out.find((s) => s.id === 'b10')!.due > '2026-12-10').toBe(true)
  })
  it('describes the plan gently', () => {
    const out = generateSteps({ steps: defaultSteps(birthday), date: '2026-11-25', today: '2026-11-04' })
    expect(previewLine(out, '2026-11-04')).toMatch(/^9 small steps, spread over the next 3 weeks\. You'll only see the next one\.$/)
    expect(daysBetween('2026-11-04', '2026-11-25')).toBe(21)
  })
  it('leaves optional steps out by default', () => {
    expect(defaultSteps(birthday).some((s) => s.id === 'b10')).toBe(false)
  })
})

describe('createPlan', () => {
  it('makes a project, a task per step on the right person, and a calendar event', () => {
    let f = family()
    const t = templateById('birthday')!
    const steps = generateSteps({ steps: defaultSteps(t), date: '2026-12-01', today: '2026-11-04' })
    const { projectId, events } = createPlan(f, { template: t, name: 'Maya’s party', date: '2026-12-01', steps, planner: 'dad', child: 'maya' }, NOW)
    f = apply(f, events)
    const tasks = Object.values(f.tasks).filter((x) => x.source === `plan:${projectId}`)
    expect(tasks).toHaveLength(steps.length)
    expect(tasks.every((x) => x.date && x.coins === 0)).toBe(true)
    expect(Object.values(f.cal).some((c) => c.title === 'Maya’s party' && c.date === '2026-12-01')).toBe(true)
    const tree = projectTree(f, projectId)!
    expect(tree.stepsTotal).toBe(steps.length)
  })
  it('ticking a step task ticks the project step', () => {
    let f = family()
    const t = templateById('day-out')!
    const steps = generateSteps({ steps: defaultSteps(t), date: '2026-11-20', today: '2026-11-04' })
    const { projectId, events } = createPlan(f, { template: t, name: 'Zoo', date: '2026-11-20', steps, planner: 'dad' }, NOW)
    f = apply(f, events)
    expect(projectTree(f, projectId)!.stepsDone).toBe(0)
    const task = Object.values(f.tasks).find((x) => x.source === `plan:${projectId}`)!
    f = apply(f, A.completeTask('dad', f, task, task.date!, {}, NOW + 5000))
    expect(projectTree(f, projectId)!.stepsDone).toBe(1)
  })
})

describe('pick 3 and park', () => {
  const add = (f: FamilyState, titles: string[], at = NOW) => apply(f, P.addDump('dad', titles.map((title) => ({ title })), at))
  const live = (f: FamilyState) => Object.values(f.dump)
  it('window runs to the end of the week, and into next week from Saturday', () => {
    expect(pickWindow('2026-11-04').at(-1)).toBe('2026-11-08')
    expect(pickWindow('2026-11-07').at(-1)).toBe('2026-11-15')
  })
  it('shows about five choices, with the rest behind Show all', () => {
    const f = add(family(), ['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    const v = pickView(f, live(f), NOW, '2026-11-04')
    expect(v.choices).toHaveLength(PEEK)
    expect(v.moreChoices).toBe(2)
    expect(pickView(f, live(f), NOW, '2026-11-04', true).choices).toHaveLength(7)
  })
  it('parks things untouched for 30+ days as someday, and touching one brings it back', () => {
    let f = add(family(), ['old'], NOW - 40 * 86_400_000)
    f = add(f, ['new'])
    const old = live(f).find((d) => d.title === 'old')!
    expect(isSomeday(old, NOW)).toBe(true)
    let v = pickView(f, live(f), NOW, '2026-11-04')
    expect(v.later.map((d) => d.title)).toEqual(['old'])
    expect(v.choices.map((d) => d.title)).toEqual(['new'])
    f = apply(f, P.saveDump('dad', old, { notes: 'hello' }, NOW))
    v = pickView(f, live(f), NOW, '2026-11-04')
    expect(v.later).toHaveLength(0)
  })
  it('puts picks on days as tasks, allows only 3, and folds the rest into later', () => {
    let f = add(family(), ['a', 'b', 'c', 'd', 'e'])
    const items = live(f)
    const evs = pickToWeek('dad', f, items.slice(0, 4).map((item) => ({ item, date: '2026-11-05' })), { today: '2026-11-04', items, assignee: 'dad' }, NOW + 10)
    f = apply(f, evs)
    expect(Object.values(f.tasks).filter((t) => t.source?.startsWith('dump:'))).toHaveLength(PICK_LIMIT)
    const v = pickView(f, live(f), NOW + 20, '2026-11-04')
    expect(v.picked).toHaveLength(3)
    expect(v.slotsLeft).toBe(0)
    expect(v.choices).toHaveLength(0)
    expect(v.later).toHaveLength(2)
  })
  it('ignores days outside the window', () => {
    const f = add(family(), ['a'])
    const items = live(f)
    expect(pickToWeek('dad', f, [{ item: items[0]!, date: '2027-01-01' }], { today: '2026-11-04', items, assignee: 'dad' })).toHaveLength(0)
  })
})
