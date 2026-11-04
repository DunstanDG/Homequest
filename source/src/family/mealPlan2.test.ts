import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { itemsOn, makeCalCtx } from './calendar'
import { tsOf } from './dates'
import { DEFAULT_MEAL_TIMES, mealAt, mealItemsOn, mealTimesOf, mealWindow, quickPicks, recentMeals } from './meals'
import * as P from './planActions'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const family = (): FamilyState => projectFamily([...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('2026-10-01'))])
const plan = (f: FamilyState, date: string, slot: 'breakfast' | 'lunch' | 'dinner' | 'snack', title: string, extra: Partial<Parameters<typeof P.planMeal>[1]> = {}, at = T('2026-10-05')) =>
  apply(f, P.planMeal('dad', { date, slot, title, ...extra }, at))

describe('family meal times', () => {
  it('start with the defaults and follow the family setting, for every meal that has no time of its own', () => {
    let f = plan(family(), '2026-10-13', 'lunch', 'Soup')
    f = plan(f, '2026-10-13', 'dinner', 'Pasta')
    expect(mealTimesOf(f)).toEqual(DEFAULT_MEAL_TIMES)
    expect(mealItemsOn(f, '2026-10-13').map((i) => [i.sub, i.start, i.end])).toEqual([
      ['Lunch', '12:00', '13:00'],
      ['Dinner', '18:00', '19:00'],
    ])
    f = apply(f, P.saveMealTimes('dad', { ...DEFAULT_MEAL_TIMES, dinner: { start: '17:30', end: '18:30' }, lunch: { start: '12:30', end: '13:15' } }, T('2026-10-06')))
    expect(mealItemsOn(f, '2026-10-13').map((i) => [i.start, i.end])).toEqual([
      ['12:30', '13:15'],
      ['17:30', '18:30'],
    ])
  })

  it('a meal with its own time keeps it when the family times change, and a start with no end borrows the usual length', () => {
    let f = plan(family(), '2026-10-13', 'dinner', 'Late supper', { start: '20:00' })
    f = apply(f, P.saveMealTimes('dad', { ...DEFAULT_MEAL_TIMES, dinner: { start: '17:00', end: '17:45' } }, T('2026-10-06')))
    expect(mealWindow(f, mealAt(f, '2026-10-13', 'dinner')!)).toEqual({ start: '20:00', end: '20:45' })
    f = plan(f, '2026-10-14', 'dinner', 'Takeaway', { start: '19:00', end: '20:00' })
    expect(mealWindow(f, mealAt(f, '2026-10-14', 'dinner')!)).toEqual({ start: '19:00', end: '20:00' })
  })

  it('snacks have no time and never reach the calendar', () => {
    const f = plan(family(), '2026-10-13', 'snack', 'Apple', { start: '15:00' })
    expect(mealItemsOn(f, '2026-10-13')).toEqual([])
    expect(itemsOn(makeCalCtx(f), '2026-10-13').filter((i) => i.source === 'meal')).toEqual([])
  })

  it('an unknown meal-times event from a newer app does not break an older reader (unknown event types are ignored)', () => {
    const f = family()
    const odd = { id: 'x', ts: 1, day: '2026-10-05', learnerId: 'dad', v: 1, type: 'from-the-future' } as unknown as AppEvent
    expect(() => applyFamilyEvent(f, odd)).not.toThrow()
  })
})

describe('moving a meal', () => {
  it('moves it to another day, keeping what it was and what it was shopped for, and leaves the old spot empty', () => {
    let f = plan(family(), '2026-10-13', 'dinner', 'Lasagne', { cookId: 'dad', notes: 'defrost' })
    f = apply(f, A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('2026-10-05', '12:01')))
    const m = mealAt(f, '2026-10-13', 'dinner')!
    f = apply(f, P.moveMeal('dad', f, { ...m, shopped: true }, { date: '2026-10-15' }, T('2026-10-06')))
    expect(mealAt(f, '2026-10-13', 'dinner')).toBeUndefined()
    expect(mealAt(f, '2026-10-15', 'dinner')).toMatchObject({ title: 'Lasagne', cookId: 'dad', notes: 'defrost', shopped: true, planId: 'mp-2026-10-15-dinner' })
  })

  it('swaps with a meal already there, so nothing is lost', () => {
    let f = plan(family(), '2026-10-13', 'dinner', 'Lasagne')
    f = plan(f, '2026-10-14', 'dinner', 'Curry')
    f = apply(f, P.moveMeal('dad', f, mealAt(f, '2026-10-13', 'dinner')!, { date: '2026-10-14' }, T('2026-10-06')))
    expect(mealAt(f, '2026-10-14', 'dinner')!.title).toBe('Lasagne')
    expect(mealAt(f, '2026-10-13', 'dinner')!.title).toBe('Curry')
  })

  it('can change meal as well as day, dropping a time that only made sense for the old meal', () => {
    let f = plan(family(), '2026-10-13', 'lunch', 'Pasta bake', { start: '12:30' })
    f = apply(f, P.moveMeal('dad', f, mealAt(f, '2026-10-13', 'lunch')!, { date: '2026-10-13', slot: 'dinner' }, T('2026-10-06')))
    expect(mealAt(f, '2026-10-13', 'lunch')).toBeUndefined()
    expect(mealAt(f, '2026-10-13', 'dinner')).toMatchObject({ title: 'Pasta bake', start: undefined })
    expect(P.moveMeal('dad', f, mealAt(f, '2026-10-13', 'dinner')!, { date: '2026-10-13' })).toEqual([])
  })

  it('two phones moving the same meal at once settle on one result', () => {
    const base = plan(family(), '2026-10-13', 'dinner', 'Lasagne')
    const m = mealAt(base, '2026-10-13', 'dinner')!
    const a = P.moveMeal('dad', base, m, { date: '2026-10-14' }, T('2026-10-06', '10:00'))
    const b = P.moveMeal('dad', base, m, { date: '2026-10-15' }, T('2026-10-06', '10:05'))
    const f = projectFamily([
      ...(Object.values({}) as AppEvent[]),
      ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('2026-10-01')),
      ...P.planMeal('dad', { date: '2026-10-13', slot: 'dinner', title: 'Lasagne' }, T('2026-10-05')),
      ...a,
      ...b,
    ])
    const live = Object.values(f.meals).filter((x) => !x.deleted)
    expect(live.map((x) => x.date).sort()).toEqual(['2026-10-14', '2026-10-15'])
  })
})

describe('quick picks', () => {
  it('offers what was used in that slot lately first, then the standbys, with no repeats', () => {
    let f = plan(family(), '2026-10-08', 'dinner', 'Fish pie')
    f = plan(f, '2026-10-10', 'dinner', 'fish  pie')
    f = plan(f, '2026-10-11', 'dinner', 'Takeaway')
    f = plan(f, '2026-10-20', 'dinner', 'Future thing') // not history yet
    expect(recentMeals(f, 'dinner', '2026-10-12').map((r) => [r.title, r.times])).toEqual([
      ['Takeaway', 1],
      ['fish  pie', 2],
    ])
    const picks = quickPicks(f, 'dinner', '2026-10-12').map((p) => p.title)
    expect(picks.slice(0, 2)).toEqual(['Takeaway', 'fish  pie'])
    expect(new Set(picks).size).toBe(picks.length)
    expect(picks).not.toContain('Future thing')
    expect(picks.length).toBeLessThanOrEqual(5)
  })

  it('on a fresh family gives plain standbys for each meal', () => {
    expect(quickPicks(family(), 'breakfast', '2026-10-12')[0]!.title).toBe('Cereal')
    expect(quickPicks(family(), 'lunch', '2026-10-12').map((p) => p.title)).toContain('Sandwiches')
  })
})
