import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { tsOf } from './dates'
import * as P from './planActions'
import { applyFamilyEvent, projectFamily } from './project'
import { routineKindOf, routinesTabOf, sortForKind } from './routineKind'
import type { FamilyState } from './types'
import { focusCandidates, focusItemDone, looseEnds, planWeekFor, planWeekOf, saveWeekFocus, shownWeekFocus, weekFocusFor, weekGlance } from './weekPlan'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]) => evs.reduce(applyFamilyEvent, f)

function family(): FamilyState {
  const now = T('2026-11-02', '06:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#f7b32b', active: true }, now + 1),
  ])
}

describe('the plan week', () => {
  it('is this week until Thursday, and the week ahead from Friday', () => {
    expect(planWeekOf('2026-11-02')).toBe('2026-11-02') // Monday
    expect(planWeekOf('2026-11-05')).toBe('2026-11-02') // Thursday
    expect(planWeekOf('2026-11-06')).toBe('2026-11-09') // Friday
    expect(planWeekOf('2026-11-08')).toBe('2026-11-09') // Sunday
  })
})

describe('this week’s 5 (week-focus)', () => {
  it('keeps at most five, drops blanks and repeats, and the latest save wins', () => {
    let f = family()
    const items = [
      { kind: 'task' as const, ref: 't1', title: 'Book the dentist' },
      { kind: 'task' as const, ref: 't1', title: 'Book the dentist' },
      { kind: 'note' as const, ref: 'x', title: '  Call Gran ' },
      { kind: 'note' as const, ref: '', title: 'call gran' },
      { kind: 'note' as const, ref: '', title: '   ' },
      { kind: 'event' as const, ref: 'cal:c1:2026-11-07', title: 'Swimming' },
      { kind: 'dump' as const, ref: 'd1', title: 'Sort the loft' },
      { kind: 'dump' as const, ref: 'd2', title: 'Fix the gate' },
      { kind: 'dump' as const, ref: 'd3', title: 'One too many' },
    ]
    f = apply(f, saveWeekFocus('dad', '2026-11-02', items, T('2026-11-02', '18:00')))
    const saved = f.weekFocus['2026-11-02']!.items
    expect(saved.map((i) => i.title)).toEqual(['Book the dentist', 'Call Gran', 'Swimming', 'Sort the loft', 'Fix the gate'])
    expect(saved[1]).toEqual({ kind: 'note', ref: '', title: 'Call Gran' })
    f = apply(f, saveWeekFocus('dad', '2026-11-02', [{ kind: 'note', ref: '', title: 'Rest' }], T('2026-11-02', '19:00')))
    expect(weekFocusFor(f, '2026-11-04').map((i) => i.title)).toEqual(['Rest'])
  })

  it('folds by time, so a late-arriving older save does not win', () => {
    const newer = saveWeekFocus('dad', '2026-11-02', [{ kind: 'note', ref: '', title: 'Newer' }], T('2026-11-03'))
    const older = saveWeekFocus('kid', '2026-11-02', [{ kind: 'note', ref: '', title: 'Older' }], T('2026-11-02'))
    const f = projectFamily([...newer, ...older])
    expect(f.weekFocus['2026-11-02']!.items[0]!.title).toBe('Newer')
  })

  it('shows the plan week’s five on /week, falling back to this week’s from Friday', () => {
    let f = family()
    f = apply(f, saveWeekFocus('dad', '2026-11-02', [{ kind: 'note', ref: '', title: 'This week' }], T('2026-11-02')))
    expect(shownWeekFocus(f, '2026-11-04')).toMatchObject({ weekOf: '2026-11-02', which: 'this' })
    expect(shownWeekFocus(f, '2026-11-06')).toMatchObject({ weekOf: '2026-11-02', which: 'this' })
    f = apply(f, saveWeekFocus('dad', '2026-11-09', [{ kind: 'note', ref: '', title: 'Next week' }], T('2026-11-06')))
    expect(shownWeekFocus(f, '2026-11-06')).toMatchObject({ weekOf: '2026-11-09', which: 'next' })
    // An empty save clears it.
    f = apply(f, saveWeekFocus('dad', '2026-11-09', [], T('2026-11-07')))
    expect(shownWeekFocus(f, '2026-11-07')?.weekOf).toBe('2026-11-02')
    expect(shownWeekFocus(family(), '2026-11-04')).toBeUndefined()
  })
})

describe('candidates and loose ends', () => {
  const setup = () => {
    let f = family()
    const now = T('2026-11-02', '07:00')
    f = apply(f, A.saveTask('dad', { taskId: 'old', title: 'Return the library book', assignee: 'dad', kind: 'other', date: '2026-10-28', part: 'any', minutes: 10 }, now))
    f = apply(f, A.saveTask('dad', { taskId: 'wed', title: 'Post the parcel', assignee: 'dad', kind: 'other', date: '2026-11-04', part: 'any', minutes: 10 }, now + 1))
    f = apply(f, A.saveTask('dad', { taskId: 'any', title: 'Fix the shelf', assignee: 'dad', kind: 'chore', part: 'any', minutes: 20 }, now + 2))
    f = apply(f, A.saveTask('dad', { taskId: 'later', title: 'Far away', assignee: 'dad', kind: 'other', date: '2026-12-01', part: 'any', minutes: 10 }, now + 3))
    f = apply(f, A.saveTask('dad', { taskId: 'rep', title: 'Bins', assignee: 'dad', kind: 'chore', date: '2026-10-01', part: 'any', minutes: 5, recur: { freq: 'weekly', interval: 1 } }, now + 4))
    f = apply(f, A.saveTask('dad', { taskId: 'done', title: 'Already done', assignee: 'dad', kind: 'other', date: '2026-10-30', part: 'any', minutes: 5 }, now + 5))
    f = apply(f, A.completeTask('dad', f, f.tasks['done']!, '2026-10-30', {}, now + 6))
    f = apply(f, A.saveCal('dad', { title: 'Swimming', date: '2026-11-07', allDay: false, start: '10:00', members: ['kid'], category: 'activity', busy: true }, now + 7))
    f = apply(f, P.addDump('dad', [{ title: 'Sort the loft' }, { title: 'Learn the banjo', priority: 'someday' }, { title: 'Secret', private: true }], now + 8))
    return f
  }

  it('offers the week’s events, open one-off tasks and the brain dump, in a fixed order', () => {
    const f = setup()
    const c = focusCandidates(f, '2026-11-02', '2026-11-02')
    expect(c.events.map((e) => [e.title, e.sub])).toEqual([['Swimming', 'Sat']])
    expect(c.tasks.map((t) => [t.title, t.sub])).toEqual([
      ['Return the library book', 'From before'],
      ['Post the parcel', 'Wed'],
      ['Fix the shelf', 'Any time'],
    ])
    expect(c.dump.map((d) => d.title)).toEqual(['Sort the loft'])
    // Same data, same order.
    expect(focusCandidates(f, '2026-11-02', '2026-11-02')).toEqual(c)
  })

  it('glances at the week in seven rows, with only what makes a day different', () => {
    const f = setup()
    const g = weekGlance(f, '2026-11-02')
    expect(g.map((d) => d.date)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(g[5]!.titles).toEqual(['Swimming'])
    expect(g[2]!.titles).toEqual([]) // the parcel task is a task, not an event
    // Without a round table, the plan week is the plain rule.
    expect(planWeekFor(f, '2026-11-04')).toBe('2026-11-02')
  })

  it('counts loose ends kindly: open one-off tasks from before today, not repeating or finished ones', () => {
    const f = setup()
    expect(looseEnds(f, '2026-11-02').map((t) => t.taskId)).toEqual(['old'])
    expect(looseEnds(f, '2026-11-05').map((t) => t.taskId)).toEqual(['old', 'wed'])
  })

  it('knows when a picked task is done', () => {
    let f = setup()
    const pick = { kind: 'task' as const, ref: 'wed', title: 'Post the parcel' }
    expect(focusItemDone(f, pick)).toBe(false)
    f = apply(f, A.completeTask('dad', f, f.tasks['wed']!, '2026-11-04', {}, T('2026-11-04')))
    expect(focusItemDone(f, pick)).toBe(true)
    expect(focusItemDone(f, { kind: 'note', ref: '', title: 'x' })).toBe(false)
  })
})

describe('routine kinds', () => {
  it('sorts saved sessions into routines and focus sessions', () => {
    expect(routineKindOf({ title: 'Morning routine' })).toBe('routine')
    expect(routineKindOf({ title: 'Bedtime' })).toBe('routine')
    expect(routineKindOf({ title: 'Before we leave' })).toBe('routine')
    expect(routineKindOf({ title: 'Admin hour' })).toBe('focus')
    expect(routineKindOf({ title: '20-minute tidy' })).toBe('focus')
    expect(routineKindOf({ title: 'Homework', homework: true })).toBe('focus')
    expect(routineKindOf({ title: 'Anything', part: 'morning' })).toBe('routine')
    // A choice made in the editor wins.
    expect(routineKindOf({ title: 'Morning pages', kind: 'focus' })).toBe('focus')
  })

  it('keeps routines in the order of the day, and never by use', () => {
    const list = [
      { title: 'Bedtime', startAt: '19:00' },
      { title: 'Before we leave' },
      { title: 'Morning routine', startAt: '07:00' },
    ]
    expect(sortForKind(list, 'routine').map((r) => r.title)).toEqual(['Morning routine', 'Bedtime', 'Before we leave'])
    expect(sortForKind(list, 'focus').map((r) => r.title)).toEqual(['Bedtime', 'Before we leave', 'Morning routine'])
  })

  it('maps old and unknown sub-tabs to Routines', () => {
    expect(routinesTabOf(null)).toBe('routines')
    expect(routinesTabOf('cleanups')).toBe('cleanups')
    expect(routinesTabOf('nonsense', 'focus')).toBe('focus')
  })
})
