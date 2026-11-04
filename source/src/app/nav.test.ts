import { describe, expect, it } from 'vitest'
import { looksAfterOf } from '@/family/care'
import { projectFamily } from '@/family/project'
import type { Member } from '@/family/types'
import { activeTab, FEATURES, hubFor, isUnder, tabsFor } from './nav'

const member = (role: Member['role'], extra: Partial<Member> = {}): Member => ({ id: `${role}1`, name: role, role, colour: '#fff', active: true, createdTs: 0, ...extra })

describe('tabs', () => {
  it('gives parents and children different tab bars, both ending in More', () => {
    expect(tabsFor('parent').map((t) => t.label)).toEqual(['Today', 'Calendar', 'Plan', 'Care', 'More'])
    expect(tabsFor('child').map((t) => t.label)).toEqual(['Today', 'Homework', 'Learn', 'Shop', 'More'])
  })

  it('matches paths on segment boundaries', () => {
    expect(isUnder('/house/rooms', '/house')).toBe(true)
    expect(isUnder('/housework', '/house')).toBe(false)
    expect(isUnder('/calendar', '/')).toBe(false)
    expect(isUnder('/', '/')).toBe(true)
  })

  it('lights up the owning tab, or More for anything reached from the hub', () => {
    const parent = tabsFor('parent')
    expect(activeTab(parent, '/')).toBe('/')
    expect(activeTab(parent, '/project/p1')).toBe('/plan')
    expect(activeTab(parent, '/baby')).toBe('/care')
    expect(activeTab(parent, '/school')).toBe('/more')
    expect(activeTab(parent, '/learn')).toBe('/more')
    const child = tabsFor('child')
    expect(activeTab(child, '/spelling')).toBe('/learn')
    expect(activeTab(child, '/care')).toBe('/more')
  })
})

describe('the More hub', () => {
  const f = projectFamily([])

  it('every feature has a label, a description and somewhere to go', () => {
    for (const it of FEATURES) {
      expect(it.label.length).toBeGreaterThan(0)
      expect(it.desc.length).toBeGreaterThan(0)
      expect(it.to.startsWith('/')).toBe(true)
    }
    expect(new Set(FEATURES.map((x) => x.id)).size).toBe(FEATURES.length)
  })

  it('shows parents the children and settings groups, and children their own', () => {
    const p = hubFor({ f, me: member('parent'), now: Date.now(), news: 0 }).map((g) => g.group)
    expect(p[0]).toBe('kids')
    expect(p).toContain('settings')
    const c = hubFor({ f, me: member('child'), now: Date.now(), news: 0 })
    expect(c[0]!.group).toBe('me')
    const ids = c.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).not.toContain('vault')
    expect(ids).not.toContain('approvals')
    expect(ids).toContain('plants')
  })

  it('leaves out care a child does not help with', () => {
    const c = hubFor({ f, me: member('child', { looksAfter: [] }), now: Date.now(), news: 0 })
    expect(c.flatMap((g) => g.items.map((i) => i.id))).not.toContain('plants')
  })
})

describe('looksAfterOf', () => {
  it('defaults a child to the pets and plants, never the baby', () => {
    expect([...looksAfterOf(member('child'))].sort()).toEqual(['pets', 'plants'])
    expect(looksAfterOf(member('child', { looksAfter: ['baby'] })).has('pets')).toBe(false)
    expect(looksAfterOf(member('parent')).has('baby')).toBe(true)
  })
})
