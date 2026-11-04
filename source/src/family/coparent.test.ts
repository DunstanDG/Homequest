import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { makeCalCtx } from './calendar'
import { busyBlocksFor, isHereWeek, linkCodeFor, nextHandoff, otherSlot, parseLinkCode } from './coparent'
import { applyFamilyEvent, projectFamily } from './project'
import { tsOf } from './dates'
import type { CoparentLinkEvent, FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

function baseFamily(): FamilyState {
  const now = T('2026-09-21', '06:00') // a Monday
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#f7b32b', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'sib', name: 'Sib', role: 'child', colour: '#3ddc97', active: true }, now + 2),
  ]
  return projectFamily(events)
}

describe('coparent: rotation math', () => {
  const link = { rotationAnchorMonday: '2026-09-21', anchorHere: true } // Monday, here week

  it('is here on the anchor week and every second week after', () => {
    expect(isHereWeek(link, '2026-09-21')).toBe(true)
    expect(isHereWeek(link, '2026-09-25')).toBe(true) // same week, Friday
    expect(isHereWeek(link, '2026-10-05')).toBe(true) // +2 weeks
  })

  it('is away on the alternating week', () => {
    expect(isHereWeek(link, '2026-09-28')).toBe(false) // +1 week
    expect(isHereWeek(link, '2026-10-12')).toBe(false) // +3 weeks
  })

  it('flips when anchorHere is false', () => {
    const away = { ...link, anchorHere: false }
    expect(isHereWeek(away, '2026-09-21')).toBe(false)
    expect(isHereWeek(away, '2026-09-28')).toBe(true)
  })

  it('handles a date before the anchor the same way (rotation runs both directions)', () => {
    expect(isHereWeek(link, '2026-09-14')).toBe(false) // -1 week
    expect(isHereWeek(link, '2026-09-07')).toBe(true) // -2 weeks
  })

  it('next handoff is always the following Monday', () => {
    expect(nextHandoff(link, '2026-09-21')).toBe('2026-09-28') // from the Monday itself
    expect(nextHandoff(link, '2026-09-23')).toBe('2026-09-28') // mid-week
    expect(nextHandoff(link, '2026-09-27')).toBe('2026-09-28') // Sunday, next day
  })
})

describe('coparent: link codes', () => {
  it('round-trips a link code', () => {
    const code = { url: 'https://abcd.supabase.co', anonKey: 'eyJabc.def', linkKey: 'a1b2c3d4e5f6g7h8', householdSlot: 'b' as const }
    const c = linkCodeFor(code)
    expect(c.startsWith('hqc2.')).toBe(true)
    expect(parseLinkCode(c)).toEqual(code)
  })

  it('otherSlot flips a and b', () => {
    expect(otherSlot('a')).toBe('b')
    expect(otherSlot('b')).toBe('a')
  })

  it('rejects garbage and mistyped codes', () => {
    expect(parseLinkCode('not a code')).toBeNull()
    expect(parseLinkCode('hqc2.not-valid-base64-json!!!')).toBeNull()
    expect(parseLinkCode('hq1.someoldfamilycode1234567890')).toBeNull()
    expect(parseLinkCode('hqc1.oldformatcodefromtheseparateprojectera')).toBeNull()
  })

  it('rejects a code whose payload is missing a field, too short a key, or an invalid slot', () => {
    const bad = `hqc2.${Buffer.from(JSON.stringify({ u: 'https://x.supabase.co', a: 'k' })).toString('base64url')}`
    expect(parseLinkCode(bad)).toBeNull()
    const badSlot = `hqc2.${Buffer.from(JSON.stringify({ u: 'https://x.supabase.co', a: 'key', k: 'a1b2c3d4e5f6g7h8', s: 'c' })).toString('base64url')}`
    expect(parseLinkCode(badSlot)).toBeNull()
  })
})

describe('coparent: busy-block projection', () => {
  it('never includes another child\'s events', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    f = apply(f, A.saveCal('dad', { title: 'Kid dentist', date: '2026-09-22', allDay: false, start: '10:00', end: '11:00', members: ['kid'], category: 'appointment', busy: true }, now))
    f = apply(f, A.saveCal('dad', { title: 'Sib swimming', date: '2026-09-22', allDay: false, start: '10:00', end: '11:00', members: ['sib'], category: 'activity', busy: true }, now + 1))
    const ctx = makeCalCtx(f)
    const blocks = busyBlocksFor(ctx, 'kid', '2026-09-22', '2026-09-22')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]!.start).toBe('10:00')
  })

  it('defaults to busy/free only, with no label or detail', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    f = apply(f, A.saveCal('dad', { title: 'Piano lesson', date: '2026-09-22', allDay: false, start: '16:00', end: '17:00', members: ['kid'], category: 'activity', busy: true }, now))
    const ctx = makeCalCtx(f)
    const [block] = busyBlocksFor(ctx, 'kid', '2026-09-22', '2026-09-22')
    expect(block).toBeDefined()
    expect(block!.label).toBeUndefined()
    expect(block!.detail).toBeUndefined()
  })

  it('shares full detail only when the event is flagged shareDetail', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    f = apply(f, A.saveCal('dad', { title: 'Piano lesson', date: '2026-09-22', allDay: false, start: '16:00', end: '17:00', members: ['kid'], category: 'activity', busy: true, notes: 'Bring music book', location: 'Church hall', shareDetail: true }, now))
    const ctx = makeCalCtx(f)
    const [block] = busyBlocksFor(ctx, 'kid', '2026-09-22', '2026-09-22')
    expect(block!.detail).toEqual({ title: 'Piano lesson', notes: 'Bring music book', location: 'Church hall' })
  })

  it('never shares a plain event\'s detail when shareDetail is not set, even with notes and location present', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    f = apply(f, A.saveCal('dad', { title: 'Therapy', date: '2026-09-22', allDay: false, start: '16:00', end: '17:00', members: ['kid'], category: 'appointment', busy: true, notes: 'private', location: 'Clinic' }, now))
    const ctx = makeCalCtx(f)
    const [block] = busyBlocksFor(ctx, 'kid', '2026-09-22', '2026-09-22')
    expect(block!.detail).toBeUndefined()
    expect(block!.label).toBeUndefined()
  })

  it('a non-busy event never becomes a busy block', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    f = apply(f, A.saveCal('dad', { title: 'Reminder', date: '2026-09-22', allDay: true, members: ['kid'], category: 'other', busy: false }, now))
    const ctx = makeCalCtx(f)
    expect(busyBlocksFor(ctx, 'kid', '2026-09-22', '2026-09-22')).toHaveLength(0)
  })
})

describe('coparent: fold and actions', () => {
  it('upserts a link by linkId and never hard-deletes it', () => {
    let f = baseFamily()
    const now = T('2026-09-21', '08:00')
    const evs = A.saveCoparentLink('dad', { childId: 'kid', label: "Mum's", rotationAnchorMonday: '2026-09-21', anchorHere: true, householdSlot: 'a' }, now)
    f = apply(f, evs)
    const linkId = (evs[0] as CoparentLinkEvent).linkId
    expect(f.coparentLinks[linkId]?.label).toBe("Mum's")

    f = apply(f, A.deleteCoparentLink('dad', f.coparentLinks[linkId]!, now + 1))
    expect(f.coparentLinks[linkId]?.deleted).toBe(true)
    // still present, not removed
    expect(Object.keys(f.coparentLinks)).toContain(linkId)
  })

  it('a saveCal with shareDetail toggled preserves the rest of the event', () => {
    let f = baseFamily()
    const now = T('2026-09-22', '09:00')
    const evs = A.saveCal('dad', { title: 'Football', date: '2026-09-22', allDay: false, start: '16:00', end: '17:00', members: ['kid'], category: 'activity', busy: true, location: 'Park' }, now)
    f = apply(f, evs)
    const calId = f.cal[Object.keys(f.cal)[0]!]!.calId
    f = apply(f, A.setCalShareDetail('dad', f.cal[calId]!, true, now + 1))
    expect(f.cal[calId]!.shareDetail).toBe(true)
    expect(f.cal[calId]!.location).toBe('Park')
    expect(f.cal[calId]!.title).toBe('Football')
  })
})
