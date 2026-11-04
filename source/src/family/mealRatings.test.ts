import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeRng } from '@/engine/rng'
import * as A from './actions'
import { tsOf } from './dates'
import { isUnpopular, mealsToRate, rateMeal, ratingOf, tasteOf } from './mealRatings'
import { STARTER_RECIPES, mealAt, suggestMeals } from './meals'
import * as P from './planActions'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const TODAY = '2026-10-12' // a Monday

function family(): FamilyState {
  let f = projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, T('2026-09-01')),
    ...A.saveMember('mum', { id: 'sam', name: 'Sam', role: 'child', colour: '#ffd166', active: true, birthday: '2014-01-01' }, T('2026-09-01', '12:01')),
    ...A.saveMember('mum', { id: 'ivy', name: 'Ivy', role: 'child', colour: '#f72585', active: true, birthday: '2016-01-01' }, T('2026-09-01', '12:02')),
  ])
  f = apply(f, P.seedRecipes('mum', f, STARTER_RECIPES))
  return f
}
const dinner = (f: FamilyState, date: string, recipeId?: string, title = 'Takeaway') =>
  apply(f, P.planMeal('mum', { date, slot: 'dinner', recipe: recipeId ? f.recipes[recipeId] : undefined, title: recipeId ? undefined : title }, T(date, '08:00')))
const pid = (date: string) => `mp-${date}-dinner`

describe('rating meals', () => {
  it('each person rates for themselves, tapping the same one again takes it back, and nobody has to vote', () => {
    let f = dinner(family(), '2026-10-10', 'starter-pizza')
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 3 }, T('2026-10-10', '20:00')))
    f = apply(f, rateMeal('mum', f, { planId: pid('2026-10-10'), memberId: 'ivy', rating: 1 }, T('2026-10-10', '20:01'))) // a parent rating for Ivy
    expect(ratingOf(f, 'sam', pid('2026-10-10'))).toBe(3)
    expect(ratingOf(f, 'ivy', pid('2026-10-10'))).toBe(1)
    expect(ratingOf(f, 'mum', pid('2026-10-10'))).toBeUndefined()
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 3 }, T('2026-10-10', '20:05')))
    expect(ratingOf(f, 'sam', pid('2026-10-10'))).toBeUndefined()
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 2 }, T('2026-10-10', '20:06')))
    expect(ratingOf(f, 'sam', pid('2026-10-10'))).toBe(2)
    expect(rateMeal('sam', f, { planId: 'mp-nothing', memberId: 'sam', rating: 3 })).toEqual([])
  })

  it('counts only the people who voted, and recognises the same meal again next week', () => {
    let f = dinner(family(), '2026-10-03', undefined, 'Fish and chips')
    f = dinner(f, '2026-10-10', undefined, 'fish and  chips')
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-03'), memberId: 'sam', rating: 3 }, T('2026-10-03', '20:00')))
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 3 }, T('2026-10-10', '20:00')))
    const key = f.meals[pid('2026-10-10')]!.recipeId ?? 't:fish and chips'
    expect(tasteOf(f, key)).toMatchObject({ votes: 2, mean: 3, loved: ['sam'], disliked: [] })
    expect(isUnpopular(tasteOf(f, key))).toBe(false)
  })

  it('is unpopular when two people said no, or most of those who voted did', () => {
    let f = dinner(family(), '2026-10-10', 'starter-chilli')
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 1 }, T('2026-10-10', '20:00')))
    expect(isUnpopular(tasteOf(f, 'starter-chilli'))).toBe(false) // one no is not enough
    f = apply(f, rateMeal('ivy', f, { planId: pid('2026-10-10'), memberId: 'ivy', rating: 1 }, T('2026-10-10', '20:01')))
    expect(isUnpopular(tasteOf(f, 'starter-chilli'))).toBe(true)
  })

  it('asks about meals that should have been eaten by now, and not snacks or ones still to come', () => {
    let f = dinner(family(), TODAY, undefined, 'Pasta')
    f = apply(f, P.planMeal('mum', { date: TODAY, slot: 'lunch', title: 'Soup' }, T(TODAY, '08:00')))
    f = apply(f, P.planMeal('mum', { date: TODAY, slot: 'snack', title: 'Apple' }, T(TODAY, '08:00')))
    expect(mealsToRate(f, TODAY, T(TODAY, '13:00'), TODAY).map((m) => m.title)).toEqual(['Soup'])
    expect(mealsToRate(f, TODAY, T(TODAY, '19:00'), TODAY).map((m) => m.title)).toEqual(['Soup', 'Pasta'])
    expect(mealsToRate(f, '2026-10-13', T(TODAY, '19:00'), TODAY)).toEqual([])
  })
})

describe('suggestions learn from past weeks', () => {
  const week = ['2026-10-13', '2026-10-14', '2026-10-15']
  const seeds = Array.from({ length: 60 }, (_, i) => i + 1)

  it('never suggests a meal two people said no to, while there is anything else to suggest', () => {
    let f = dinner(family(), '2026-10-10', 'starter-chilli')
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-10-10'), memberId: 'sam', rating: 1 }, T('2026-10-10', '20:00')))
    f = apply(f, rateMeal('ivy', f, { planId: pid('2026-10-10'), memberId: 'ivy', rating: 1 }, T('2026-10-10', '20:01')))
    for (const seed of seeds) expect(suggestMeals(f, week, makeRng(seed), { today: TODAY }).map((s) => s.recipeId)).not.toContain('starter-chilli')
  })

  it('suggests a loved meal more often than an unrated one, and says why', () => {
    let f = dinner(family(), '2026-08-29', 'starter-pizza')
    f = apply(f, rateMeal('sam', f, { planId: pid('2026-08-29'), memberId: 'sam', rating: 3 }, T('2026-08-29', '20:00')))
    f = apply(f, rateMeal('ivy', f, { planId: pid('2026-08-29'), memberId: 'ivy', rating: 3 }, T('2026-08-29', '20:01')))
    const count = (id: string) => seeds.filter((s) => suggestMeals(f, week, makeRng(s), { today: TODAY }).some((x) => x.recipeId === id)).length
    expect(count('starter-pizza')).toBeGreaterThan(count('starter-fajitas') + 5)
    const why = seeds.flatMap((s) => suggestMeals(f, week, makeRng(s), { today: TODAY })).find((x) => x.recipeId === 'starter-pizza')?.why
    expect(why).toContain('Everyone who voted liked it')
  })

  it('leans towards what was had on the same day of the week lately', () => {
    let f = family()
    for (const d of ['2026-09-18', '2026-09-25', '2026-10-02', '2026-10-09']) f = dinner(f, d, undefined, 'Fish and chips') // Fridays
    f = dinner(f, '2026-10-05', 'starter-pizza')
    f = dinner(f, '2026-10-06', 'starter-chilli')
    f = dinner(f, '2026-10-07', 'starter-fajitas')
    const fri = ['2026-10-16']
    const picks = seeds.map((s) => suggestMeals(f, fri, makeRng(s), { today: TODAY })[0]!)
    const fish = picks.filter((p) => p.title === 'Fish and chips')
    expect(fish.length).toBeGreaterThan(seeds.length / 8)
    expect(fish[0]!.why.join()).toContain('Fridays')
    expect(fish[0]!.recipeId).toBeUndefined()
  })

  it('only suggests meals that were typed in once there is some history, so a new family sees only recipes', () => {
    const f = dinner(family(), '2026-10-10', undefined, 'Fish and chips')
    for (const seed of seeds) {
      for (const s of suggestMeals(f, week, makeRng(seed), { today: TODAY })) expect(s.recipeId).toBeDefined()
    }
  })

  it('still fills the nights, planning typed-in meals as they were typed', () => {
    let f = family()
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']) f = dinner(f, d, undefined, 'Takeaway')
    const s = suggestMeals(f, ['2026-10-13'], makeRng(3), { today: TODAY })
    expect(s).toHaveLength(1)
    f = apply(f, P.planSuggestions('mum', f, [{ date: '2026-10-13', title: 'Takeaway', why: [] }], 'dinner', T(TODAY)))
    expect(mealAt(f, '2026-10-13', 'dinner')!.title).toBe('Takeaway')
  })
})
