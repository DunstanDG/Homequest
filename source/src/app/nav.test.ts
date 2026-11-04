import { describe, expect, it } from 'vitest'
import { looksAfterOf } from '@/family/care'
import { projectFamily } from '@/family/project'
import type { Member } from '@/family/types'
import { activeTab, FEATURES, GROUPS, groupOf, hubFor, isUnder, searchFeatures, settingsFor, tabsFor } from './nav'

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
  const x = (role: Member['role'], extra: Partial<Member> = {}) => ({ f, me: member(role, extra), now: Date.now(), news: 0 })
  const ids = (gs: { items: { id: string }[] }[]) => gs.flatMap((g) => g.items.map((i) => i.id))

  it('every feature has a label, a description, somewhere to go and a group for each of its roles', () => {
    for (const it of FEATURES) {
      expect(it.label.length).toBeGreaterThan(0)
      expect(it.desc.length).toBeGreaterThan(0)
      expect(it.to.startsWith('/')).toBe(true)
      for (const r of it.roles) expect(groupOf(it, r), `${it.id} for ${r}`).toBeDefined()
      if (it.roles.some((r) => GROUPS[groupOf(it, r)!].hub === 'search')) expect(it.where, it.id).toBeTruthy()
    }
    expect(new Set(FEATURES.map((x) => x.id)).size).toBe(FEATURES.length)
  })

  it('keeps More short: about eight entries, in clear groups, with Settings last', () => {
    const p = hubFor(x('parent'))
    expect(p.map((g) => g.group)).toEqual(['kids', 'week', 'help'])
    expect(ids(p)).toEqual(['approvals', 'school', 'learn', 'shop', 'week', 'ideas', 'settings'])
    const c = hubFor(x('child'))
    expect(c.map((g) => g.group)).toEqual(['week', 'home', 'care', 'help'])
    expect(ids(c)).toEqual(['calendar', 'week', 'ideas', 'shopping', 'plan', 'plants', 'settings'])
    for (const hub of [p, c]) expect(ids(hub).length).toBeLessThanOrEqual(10)
  })

  it('puts setup and admin in Settings, with comfort first', () => {
    const p = settingsFor(x('parent'))
    expect(p[0]!.group).toBe('comfort')
    const all = ids(p)
    for (const id of ['calm', 'people', 'coins', 'coparent', 'sync', 'private', 'homeserver', 'start', 'news', 'parent']) expect(all).toContain(id)
    const c = ids(settingsFor(x('child')))
    expect(c).toEqual(['calm', 'news'])
  })

  it('shows what is waiting in Settings on its entry in More', () => {
    const s = hubFor({ ...x('parent'), news: 3 }).flatMap((g) => g.items).find((i) => i.id === 'settings')!
    expect(s.count).toBe(3)
  })

  it('never lets data change the order, only the counts', () => {
    const a = ids(hubFor(x('parent')))
    const b = ids(hubFor({ ...x('parent'), news: 7, now: Date.now() + 3 * 86_400_000 }))
    expect(b).toEqual(a)
  })

  it('leaves out what a child cannot use, and care they do not help with', () => {
    const c = ids([...hubFor(x('child')), ...settingsFor(x('child'))])
    expect(c).not.toContain('vault')
    expect(c).not.toContain('approvals')
    expect(ids(hubFor(x('child', { looksAfter: [] })))).not.toContain('plants')
  })
})

describe('search in More', () => {
  const f = projectFamily([])
  const x = (role: Member['role']) => ({ f, me: member(role), now: Date.now(), news: 0 })
  const find = (role: Member['role'], q: string) => searchFeatures(x(role), q).map((h) => h.id)

  it('finds anything, including what moved to Settings or is on a tab', () => {
    expect(find('parent', 'coin rates')[0]).toBe('coins')
    expect(find('parent', 'coin')).toEqual(expect.arrayContaining(['shop', 'coins']))
    expect(find('parent', 'private')).toContain('private')
    expect(find('parent', 'rooms')).toContain('rooms')
    expect(find('parent', 'summit')).toEqual(['week'])
    expect(find('parent', 'accessib')).toEqual(['calm'])
    expect(searchFeatures(x('parent'), 'backup')[0]).toMatchObject({ id: 'sync', where: 'Settings' })
    expect(searchFeatures(x('parent'), 'rooms')[0]!.where).toBe('Plan › Routines › Clean-ups')
  })

  it('matches every word, ignores case and curly quotes, and is the same every time', () => {
    expect(find('parent', 'WHAT’S NEW')[0]).toBe('news')
    expect(find('parent', "what's new")).toEqual(find('parent', 'what’s new'))
    expect(find('parent', 'meals dinner')).toEqual(['meals'])
    expect(find('parent', '   ')).toEqual([])
    expect(find('parent', 'shop')).toEqual(find('parent', 'shop'))
  })

  it('only finds what this person can open', () => {
    expect(find('child', 'vault')).toEqual([])
    expect(find('child', 'coin rates')).toEqual([])
    expect(find('child', 'skill')).toEqual(['skills'])
  })
})

describe('looksAfterOf', () => {
  it('defaults a child to the pets and plants, never the baby', () => {
    expect([...looksAfterOf(member('child'))].sort()).toEqual(['pets', 'plants'])
    expect(looksAfterOf(member('child', { looksAfter: ['baby'] })).has('pets')).toBe(false)
    expect(looksAfterOf(member('parent')).has('baby')).toBe(true)
  })
})
