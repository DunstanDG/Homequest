import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { byArea, dayWord, historyByWeek, notesFor, unseenRecent, whatsNew, type Viewer } from './notes'
import { RELEASES, type ReleaseNote } from './releases'
import { _resetOnboardCache, ensureOnboard, markSeen, onboardOf, snooze } from './store'
import { CHILD_TOUR, PARENT_TOUR, setupComplete, setupSteps, tourFor } from './tour'
import type { FamilyState } from '@/family/types'
import { decideStatus, formatBuild, isNewerBuild, parseVersionJson } from '../version'

const parent: Viewer = { role: 'parent', has: { care: true, baby: true, children: true, school: true } }
const child: Viewer = { role: 'child', has: { children: true } }
const n = (id: string, date: string, extra: Partial<ReleaseNote> = {}): ReleaseNote => ({ id, date, audience: 'all', area: 'plan', emoji: '•', title: id, ...extra })

describe('release notes', () => {
  it('are well formed: unique ids, real dates, newest first, short titles', () => {
    const ids = RELEASES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of RELEASES) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.id.startsWith(r.date)).toBe(true)
      expect(r.title.length).toBeLessThanOrEqual(60)
      if (r.short) expect(r.short.length).toBeLessThanOrEqual(32)
    }
    expect([...RELEASES].sort((a, b) => b.date.localeCompare(a.date)).map((r) => r.id)).toEqual(ids)
  })

  it('only link to screens that exist', () => {
    const routes = ['/', '/calendar', '/plan', '/care', '/learn', '/shop', '/school', '/welcome', '/news', '/parent', '/summit', '/vault', '/baby', '/more', '/travel', '/assistant', '/round-table', '/week', '/settings', '/settings/calm']
    for (const r of [...RELEASES, ...PARENT_TOUR, ...CHILD_TOUR]) if (r.to) expect(routes).toContain(r.to.split('?')[0])
  })

  it('never name real people or schools (this file is public)', () => {
    const text = JSON.stringify([RELEASES, PARENT_TOUR, CHILD_TOUR]).toLowerCase()
    for (const word of ['oathall', 'willow']) expect(text).not.toContain(word)
  })

  it('children and parents each see what is for them, and only for what the family has', () => {
    const notes = [n('a', '2026-10-04', { audience: 'parent' }), n('b', '2026-10-04', { audience: 'child' }), n('c', '2026-10-04'), n('d', '2026-10-04', { needs: 'baby' })]
    expect(notesFor(parent, '2026-10-04', notes).map((x) => x.id)).toEqual(['a', 'c', 'd'])
    expect(notesFor(child, '2026-10-04', notes).map((x) => x.id)).toEqual(['b', 'c'])
    expect(notesFor({ role: 'parent', has: {} }, '2026-10-04', notes).map((x) => x.id)).toEqual(['a', 'c'])
  })

  it('a note written ahead of its date waits until then', () => {
    expect(notesFor(parent, '2026-10-04', [n('later', '2026-10-05')])).toEqual([])
  })
})

describe('what’s new: a day in detail, the week in brief', () => {
  const notes = [
    n('2026-10-04-a', '2026-10-04', { area: 'care', short: 'Care redesign' }),
    n('2026-10-04-b', '2026-10-04', { area: 'plan' }),
    n('2026-10-04-fix', '2026-10-04', { fix: true }),
    n('2026-10-02-c', '2026-10-02', { area: 'learn', short: 'Science' }),
    n('2026-10-01-d', '2026-10-01', { area: 'learn', short: 'German' }),
    n('2026-10-01-fix', '2026-10-01', { fix: true }),
    n('2026-09-20-old', '2026-09-20', { area: 'learn' }),
  ]

  it('several deploys on one day are one day of notes; the rest of the week is one line per area', () => {
    const w = whatsNew(parent, '2026-10-04', new Set(), notes)
    expect(w.day).toBe('2026-10-04')
    expect(w.features.map((x) => x.id)).toEqual(['2026-10-04-a', '2026-10-04-b'])
    expect(w.fixes).toHaveLength(1)
    expect(w.week).toEqual([{ area: 'learn', label: 'Learn', emoji: '⚡', items: ['Science', 'German'] }])
    expect(w.weekFixes).toBe(1)
  })

  it('the banner counts unseen notes from the last week only', () => {
    expect(unseenRecent(parent, '2026-10-04', new Set(), notes)).toHaveLength(6)
    expect(unseenRecent(parent, '2026-10-04', new Set(notes.map((x) => x.id)), notes)).toHaveLength(0)
  })

  it('someone who has seen today’s notes but missed an earlier day gets that day in detail', () => {
    const seen = new Set(['2026-10-04-a', '2026-10-04-b', '2026-10-04-fix'])
    const w = whatsNew(parent, '2026-10-04', seen, notes)
    expect(w.day).toBe('2026-10-02')
    expect(w.week.map((l) => l.area)).toEqual(['care', 'plan', 'learn'])
  })

  it('history groups by week and day words read naturally', () => {
    expect(historyByWeek(parent, '2026-10-04', notes).map((h) => h.weekOf)).toEqual(['2026-09-28', '2026-09-14'])
    expect(byArea([n('x', '2026-10-04', { short: 'Same' }), n('y', '2026-10-04', { short: 'Same' })])[0]!.items).toEqual(['Same'])
    expect(dayWord('2026-10-04', '2026-10-04')).toBe('today')
    expect(dayWord('2026-10-03', '2026-10-04')).toBe('yesterday')
    expect(dayWord('2026-10-02', '2026-10-04')).toBe('on Friday')
  })
})

describe('per-person onboarding on this phone', () => {
  const store = new Map<string, string>()
  beforeEach(() => {
    store.clear()
    _resetOnboardCache()
    ;(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }
  })
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage
  })

  it('a new person gets the tour and starts with the notes so far seen; an existing person gets what’s new instead', () => {
    ensureOnboard('new', true, ['n1', 'n2'])
    expect(onboardOf('new')).toMatchObject({ tourPending: true, seen: ['n1', 'n2'] })
    ensureOnboard('old', false, ['n1', 'n2'])
    expect(onboardOf('old')).toMatchObject({ tourDone: true, seen: [] })
    // Only the first call counts.
    ensureOnboard('old', true, ['n1'])
    expect(onboardOf('old').tourPending).toBeUndefined()
  })

  it('remembers seen notes and snoozes, and the snapshot is stable between changes', () => {
    expect(onboardOf('x')).toBe(onboardOf('x'))
    markSeen('x', ['a'])
    markSeen('x', ['a', 'b'])
    snooze('x', 'news', '2026-10-04')
    expect(onboardOf('x')).toMatchObject({ seen: ['a', 'b'], snooze: { news: '2026-10-04' } })
    _resetOnboardCache()
    expect(onboardOf('x').seen).toEqual(['a', 'b'])
  })
})

describe('tour and setup', () => {
  const fam = (members: object, extra: Partial<FamilyState> = {}) => ({ members, economy: [], routines: {}, meals: {}, ...extra }) as unknown as FamilyState

  it('always shows Care to parents now it has plants too, and the child tour is the same either way', () => {
    expect(tourFor('parent', false).some((c) => c.id === 'care')).toBe(true)
    expect(tourFor('child', true)).toEqual(tourFor('child', false))
  })

  it('ticks itself off, skips child-only steps without children, and ignores optional ones for "complete"', () => {
    const alone = setupSteps({ f: fam({ p: { id: 'p', role: 'parent', active: true } }), schoolKids: 0, syncOn: false, syncSkipped: false, notificationsOn: false, aiReady: false })
    expect(alone.map((s) => s.id)).toEqual(['family', 'sync', 'notify', 'routines', 'ai', 'plan'])
    const all = setupSteps({
      f: fam({ p: { id: 'p', role: 'parent', active: true }, c: { id: 'c', role: 'child', active: true } }, { economy: [{}] as never }),
      schoolKids: 1,
      syncOn: true,
      syncSkipped: false,
      notificationsOn: true,
      aiReady: false,
    })
    expect(all.filter((s) => !s.done).map((s) => s.id)).toEqual(['routines', 'ai', 'plan'])
    expect(setupComplete(all)).toBe(true)
    expect(setupComplete(alone)).toBe(false)
  })
})

describe('version and update checks', () => {
  const local = '2026-10-05T12:00:00.000Z'
  it('reads the server’s version.json and ignores anything else (the dev server answers with a page)', () => {
    expect(parseVersionJson('{"version":"0.3.0","builtAt":"2026-10-05T12:00:00.000Z"}')).toEqual({ version: '0.3.0', builtAt: local })
    expect(parseVersionJson('<!doctype html><html>')).toBeUndefined()
    expect(parseVersionJson('{"version":"0.3.0","builtAt":"nope"}')).toBeUndefined()
  })

  it('only a strictly newer build counts as an update', () => {
    expect(isNewerBuild('2026-10-05T12:01:00.000Z', local)).toBe(true)
    expect(isNewerBuild(local, local)).toBe(false)
    expect(isNewerBuild('2026-10-05T11:00:00.000Z', local)).toBe(false)
    expect(isNewerBuild('', local)).toBe(false)
  })

  it('a waiting worker is ready; otherwise the server decides; no answer is unknown, never "up to date"', () => {
    expect(decideStatus(true, undefined, local)).toBe('ready')
    expect(decideStatus(false, { builtAt: '2026-10-05T13:00:00.000Z' }, local)).toBe('newer')
    expect(decideStatus(false, { builtAt: local }, local)).toBe('current')
    expect(decideStatus(false, undefined, local)).toBe('unknown')
  })

  it('shows the build time for people, and nothing when it is not known', () => {
    expect(formatBuild(local)).toMatch(/^5 Oct 2026, \d\d:\d\d$/)
    expect(formatBuild('')).toBe('')
  })
})
