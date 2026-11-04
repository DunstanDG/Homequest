import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import { MAIN_LIST, dupKey, itemsOf, mergeDuplicates, nearDuplicates } from './shopping'
import type { Aisle, FamilyState, ShopItemEvent } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)

function family(): FamilyState {
  const now = T('2026-09-21', '06:00')
  return projectFamily([
    ...A.saveMember('sam', { id: 'sam', name: 'Sam', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('sam', { id: 'alex', name: 'Alex', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('sam', { id: 'maya', name: 'Maya', role: 'child', colour: '#ffc857', active: true }, now + 2),
  ])
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

/** The same composition the Shopping screen uses for its Merge button. */
function mergeEvents(actor: string, group: readonly ShopItemEvent[], now: number): AppEvent[] {
  const plan = mergeDuplicates(group)
  if (!plan) return []
  return [...P.editItem(actor, plan.keep, plan.patch, now), ...plan.remove.flatMap((r, n) => P.removeItem(actor, r, now + 1 + n))]
}

let seq = 0
function item(name: string, more: Partial<ShopItemEvent> = {}): ShopItemEvent {
  seq++
  return { type: 'shop-item', id: `e${seq}`, ts: 1000 + seq, day: '2026-09-21', learnerId: 'sam', v: 1, itemId: `si${seq}`, listId: MAIN_LIST, name, aisle: 'other' as Aisle, done: false, ...more }
}

describe('shopping: near-duplicates', () => {
  it('normalises names: case, spaces, plurals and a leading count', () => {
    expect(dupKey('Milk')).toBe('milk')
    expect(dupKey('  MILK  ')).toBe('milk')
    expect(dupKey('2 x Milk')).toBe('milk')
    expect(dupKey('2x milk')).toBe('milk')
    expect(dupKey('2 milk')).toBe('milk')
    expect(dupKey('milk x2')).toBe('milk')
    expect(dupKey('Eggs')).toBe('egg')
    expect(dupKey('tomatoes')).toBe('tomato')
    expect(dupKey('Peaches')).toBe('peach')
    expect(dupKey('Chopped   tomatoes')).toBe('chopped tomato')
    expect(dupKey('Xylitol gum')).toBe('xylitol gum') // a leading x that is not "x 2" stays
    expect(dupKey('2 xylitol gum')).toBe('xylitol gum')
  })

  it('groups un-ticked items with the same name on the same list, oldest first', () => {
    const a = item('Milk')
    const b = item('2 x milk')
    const c = item('Bread')
    const d = item('Eggs')
    const e = item('egg')
    const groups = nearDuplicates([b, c, a, e, d])
    expect(groups.map((g) => g.name)).toEqual(['Eggs', 'Milk'])
    expect(groups[1]!.items.map((i) => i.itemId)).toEqual([a.itemId, b.itemId])
  })

  it('ignores ticked and deleted items, other lists, and things that only look a bit alike', () => {
    expect(nearDuplicates([item('Milk'), item('Milk', { done: true })])).toEqual([])
    expect(nearDuplicates([item('Milk'), item('Milk', { deleted: true })])).toEqual([])
    expect(nearDuplicates([item('Milk'), item('Milk', { listId: 'sl-party' })])).toEqual([])
    expect(nearDuplicates([item('Milk'), item('Oat milk'), item('Milk chocolate')])).toEqual([])
  })

  it('plans a merge: amounts added where units allow, notes joined, the rest removed', () => {
    const a = item('Mince', { qty: 500, unit: 'g', note: 'lean' })
    const b = item('mince', { qty: 1, unit: 'kg', note: 'Lean' })
    const plan = mergeDuplicates([a, b])!
    expect(plan.keep.itemId).toBe(a.itemId)
    expect(plan.patch).toEqual({ qty: 1.5, unit: 'kg', note: 'lean' })
    expect(plan.remove.map((r) => r.itemId)).toEqual([b.itemId])
  })

  it('an amount that cannot be added goes into the note instead of being lost', () => {
    const plan = mergeDuplicates([item('Milk', { qty: 2, unit: 'pint' }), item('Milk', { qty: 1, unit: 'l', note: 'semi-skimmed' })])!
    expect(plan.patch).toEqual({ qty: 2, unit: 'pint', note: 'semi-skimmed; also 1l' })
  })

  it('plain counts add up, and one item alone is nothing to merge', () => {
    expect(mergeDuplicates([item('Eggs', { qty: 6 }), item('eggs', { qty: 6 }), item('2 x eggs')])!.patch).toEqual({ qty: 13, unit: undefined, note: undefined })
    expect(mergeDuplicates([item('Milk')])).toBeUndefined()
  })

  it('merging with the existing edit/remove events leaves one item on the list', () => {
    let f = family()
    // Two phones adding milk at the same moment: neither sees the other's, so it ends up on the list twice.
    const fromSam = P.addTextToList('sam', f, MAIN_LIST, 'milk', T('2026-09-21', '09:00'))
    const fromAlex = P.addTextToList('alex', f, MAIN_LIST, '2 milk (semi-skimmed)', T('2026-09-21', '09:00') + 5)
    f = apply(f, [...fromSam, ...fromAlex])
    f = apply(f, P.addTextToList('sam', f, MAIN_LIST, 'bread', T('2026-09-21', '09:01')))
    expect(itemsOf(f, MAIN_LIST)).toHaveLength(3)

    const groups = nearDuplicates(itemsOf(f, MAIN_LIST))
    expect(groups).toHaveLength(1)
    const evs = mergeEvents('maya', groups[0]!.items, T('2026-09-21', '09:10'))
    expect(evs.every((e) => e.type === 'shop-item')).toBe(true)
    f = apply(f, evs)

    const left = itemsOf(f, MAIN_LIST)
    expect(left.map((i) => i.name).sort()).toEqual(['Bread', 'Milk'])
    expect(left.find((i) => i.name === 'Milk')).toMatchObject({ qty: 3, note: 'semi-skimmed', done: false })
    expect(nearDuplicates(left)).toEqual([])
  })

  it('a merge does not inflate the "usuals" count', () => {
    let f = family()
    const a = P.addTextToList('sam', f, MAIN_LIST, 'milk', T('2026-09-21', '09:00'))
    const b = P.addTextToList('alex', f, MAIN_LIST, 'milk', T('2026-09-21', '09:00') + 5)
    f = apply(f, [...a, ...b])
    const before = f.shopHistory['milk']?.count
    f = apply(f, mergeEvents('sam', nearDuplicates(itemsOf(f, MAIN_LIST))[0]!.items, T('2026-09-21', '09:10')))
    expect(f.shopHistory['milk']?.count).toBe(before)
  })
})
