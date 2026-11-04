import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { _resetLayoutCache, defaultOrder, moveBlock, resolveLayout, saveLayout } from './todayLayout'

describe('Today layout', () => {
  it('uses the defaults until someone saves their own', () => {
    expect(resolveLayout(defaultOrder('adult')).order).toEqual(defaultOrder('adult'))
    expect(defaultOrder('child', true)[0]).toBe('needs')
    expect(defaultOrder('child')[0]).toBe('school')
  })

  it('keeps a saved order, drops unknown ids, and slots new blocks in at their default place', () => {
    const l = resolveLayout(defaultOrder('adult'), { order: ['todo', 'gone', 'timeline', 'needs', 'todo'], hidden: [] })
    // baby comes after needs by default; together, care, dump, extras after todo... but todo is first here, so they
    // follow the last default-earlier block that is present.
    expect(l.order.filter((b) => ['todo', 'timeline', 'needs'].includes(b))).toEqual(['todo', 'timeline', 'needs'])
    expect(new Set(l.order)).toEqual(new Set(defaultOrder('adult')))
    expect(l.order.indexOf('plan')).toBe(l.order.indexOf('needs') + 1)
    expect(l.order.indexOf('checkin')).toBe(l.order.indexOf('needs') + 2)
    expect(l.order.indexOf('baby')).toBe(l.order.indexOf('needs') + 3)
    expect(l.order.indexOf('braindump')).toBe(l.order.indexOf('todo') + 1)
    expect(l.order.indexOf('together')).toBe(l.order.indexOf('todo') + 2)
  })

  it('never hides Needs you', () => {
    const l = resolveLayout(defaultOrder('adult'), { order: [], hidden: ['needs', 'care', 'nope'] })
    expect([...l.hidden]).toEqual(['care'])
  })

  it('moves a block up or down, and not past the ends', () => {
    const o = defaultOrder('adult')
    expect(moveBlock(o, 'todo', -1).slice(2, 5)).toEqual(['checkin', 'baby', 'todo'])
    expect(moveBlock(o, 'needs', -1)).toEqual(o)
    expect(moveBlock(o, 'extras', 1)).toEqual(o)
  })

  describe('kept per person on this phone', () => {
    const store = new Map<string, string>()
    beforeEach(() => {
      store.clear()
      _resetLayoutCache()
      ;(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }
    })
    afterEach(() => {
      delete (globalThis as { localStorage?: unknown }).localStorage
    })
    it('saves and resets', () => {
      saveLayout('sam', 'adult', { order: ['todo'], hidden: ['care'] })
      expect(JSON.parse(store.get('hq.today.sam.adult')!)).toEqual({ order: ['todo'], hidden: ['care'] })
      saveLayout('sam', 'adult', undefined)
      expect(store.has('hq.today.sam.adult')).toBe(false)
    })
  })
})
