import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { fixtureRegistry } from '@/engine/testing/fixture'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { tsOf } from '@/family/dates'
import { inheritPriv } from '@/family/privacy'
import { emptyFamily, projectFamily } from '@/family/project'
import { createMemoryStorage } from './local'
import { fingerprint, keyCode, newKey, parseKeyCode } from './privateKeys'
import { Repo } from './repo'
import { createSupabaseAdapter, probePrivateReady } from './supabase'

const reg = fixtureRegistry()
const day = '2026-10-14'
let clock = tsOf(day, '08:00')

/** A tiny stand-in for the PostgREST events table and its row-level-security rule (schema_v3.sql). */
function fakeServer(migrated = true) {
  const rows: { seq: number; id: string; owner_key?: string; body: AppEvent }[] = []
  const calls: { method: string; headers: Record<string, string>; body?: unknown[] }[] = []
  const fetchImpl = (async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET'
    const headers = (init.headers ?? {}) as Record<string, string>
    const body = init.body ? (JSON.parse(String(init.body)) as { id: string; owner_key?: string; body: AppEvent }[]) : undefined
    calls.push({ method, headers, body })
    if (method === 'POST') {
      for (const r of body!) {
        if (r.owner_key && !migrated) return new Response('{"message":"Could not find the \'owner_key\' column"}', { status: 400 })
        if (!rows.some((x) => x.id === r.id)) rows.push({ seq: rows.length + 1, id: r.id, owner_key: r.owner_key, body: r.body })
      }
      return new Response(null, { status: 201 })
    }
    if (url.includes('select=owner_key')) return migrated ? new Response('[]', { status: 200 }) : new Response('{"code":"42703","message":"column events.owner_key does not exist"}', { status: 400 })
    const after = Number(/seq=gt\.(\d+)/.exec(url)?.[1] ?? 0)
    const mk = headers['x-member-key']
    const out = rows.filter((r) => r.seq > after && (!r.owner_key || r.owner_key === mk)).map((r) => ({ seq: r.seq, body: r.body }))
    return new Response(JSON.stringify(out), { status: 200 })
  }) as unknown as typeof fetch
  return { rows, calls, fetchImpl }
}

async function phone(server: ReturnType<typeof fakeServer>, me: string, key?: string) {
  const repo = await Repo.open(reg, createMemoryStorage())
  await repo.setMe(me)
  const adapter = createSupabaseAdapter({
    url: 'https://x.supabase.co',
    anonKey: 'anon',
    familyKey: 'family-key-0123456789abcdef',
    fetchImpl: server.fetchImpl,
    memberKey: () => key,
    ownerKeyFor: (m) => (m === me ? key : undefined),
  })
  return { repo, adapter }
}

const members = (actor: string): AppEvent[] => [
  ...A.saveMember(actor, { id: 'sam', name: 'Sam', role: 'parent', colour: '#4cc9f0', active: true }, clock++),
  ...A.saveMember(actor, { id: 'alex', name: 'Alex', role: 'parent', colour: '#ffc857', active: true }, clock++),
]

describe('private events across phones', () => {
  it('a private item never reaches another phone, but reaches the owner on a second phone with the same key', async () => {
    const server = fakeServer()
    const key = newKey()
    const sam1 = await phone(server, 'sam', key)
    const alex = await phone(server, 'alex', newKey())
    sam1.repo.apply(members('sam'))
    sam1.repo.apply(P.addDump('sam', [{ title: 'Ask about the thing', private: true }, { title: 'Buy bin bags' }], clock++))
    await sam1.repo.sync(sam1.adapter)
    await alex.repo.sync(alex.adapter)
    expect(Object.values(alex.repo.family().dump).map((d) => d.title)).toEqual(['Buy bin bags'])
    expect(JSON.stringify(alex.repo.allEvents())).not.toContain('Ask about the thing')
    // the owner's second phone, with the same key
    const sam2 = await phone(server, 'sam', key)
    await sam2.repo.sync(sam2.adapter)
    expect(
      Object.values(sam2.repo.family().dump)
        .map((d) => d.title)
        .sort(),
    ).toEqual(['Ask about the thing', 'Buy bin bags'])
    // and the private row was stored with the key, the shared one without
    expect(server.rows.filter((r) => r.owner_key).length).toBe(1)
  })

  it('does not send a private event whose owner key this phone does not hold (it would otherwise go up public)', async () => {
    const server = fakeServer()
    const sam = await phone(server, 'sam', undefined)
    sam.repo.apply(members('sam'))
    sam.repo.apply(P.addDump('sam', [{ title: 'Secret', private: true }], clock++))
    await sam.repo.sync(sam.adapter)
    expect(JSON.stringify(server.rows)).not.toContain('Secret')
  })

  it('a phone whose holder is someone else leaves an event private to a third person out of what it shows, even if it is in the log', async () => {
    const server = fakeServer()
    const alex = await phone(server, 'alex', newKey())
    const private1: AppEvent = { ...P.addDump('sam', [{ title: 'Not for Alex', private: true }], clock++)[0]! }
    await alex.repo.importEvents([...members('sam'), private1])
    expect(Object.keys(alex.repo.family().dump)).toHaveLength(0)
    // holding the phone as Sam shows it
    await alex.repo.setMe('sam')
    expect(Object.values(alex.repo.family().dump).map((d) => d.title)).toEqual(['Not for Alex'])
  })

  it('plain rows still go up on a database that has not had the update; private ones are refused by it', async () => {
    const server = fakeServer(false)
    const sam = await phone(server, 'sam', newKey())
    sam.repo.apply(members('sam'))
    sam.repo.apply(P.addDump('sam', [{ title: 'Plain' }], clock++))
    const r = await sam.repo.sync(sam.adapter)
    expect(r.ok).toBe(true)
    expect(await probePrivateReady({ url: 'https://x.supabase.co', anonKey: 'a', familyKey: 'family-key-0123456789abcdef', fetchImpl: server.fetchImpl })).toBe(false)
    expect(await probePrivateReady({ url: 'https://x.supabase.co', anonKey: 'a', familyKey: 'family-key-0123456789abcdef', fetchImpl: fakeServer(true).fetchImpl })).toBe(true)
  })
})

describe('what a private item turns into stays private', () => {
  const base = () => {
    const f0 = projectFamily([...members('sam')])
    return f0
  }

  it('the task, its tick, a session and its run all inherit the marker; the public busy block carries no title', () => {
    let evs: AppEvent[] = [...members('sam'), ...P.addDump('sam', [{ title: 'Call the clinic', private: true, minutes: 15 }], clock++)]
    let f = projectFamily(evs)
    const item = Object.values(f.dump)[0]!
    expect(item.priv).toBe('sam')
    const sched = inheritPriv(f, P.scheduleDump('sam', f, item, { date: day, assignee: 'sam', time: '14:00' }, clock++))
    evs = [...evs, ...sched]
    f = projectFamily(evs)
    const task = Object.values(f.tasks)[0]!
    expect(task.priv).toBe('sam')
    const stub = Object.values(f.cal).find((c) => c.title === 'Busy')!
    expect(stub.priv).toBeUndefined()
    expect(stub.start).toBe('14:00')
    expect(stub.end).toBe('14:15'.replace('14:15', '14:15'))
    expect(JSON.stringify(stub)).not.toContain('clinic')
    const done = inheritPriv(f, A.completeTask('sam', f, task, day, {}, clock++))
    expect(done.every((e) => e.priv === 'sam')).toBe(true)
    const made = P.sessionFromDump('sam', [item], { title: 'Admin' }, clock++)
    const routine = inheritPriv(f, made.events)
    expect(routine[0]!.priv).toBe('sam')
    f = projectFamily([...evs, ...routine])
    const r = f.routines[made.routineId]!
    const run = inheritPriv(f, P.startRun('sam', 'sam', { routine: r }, clock++).events)
    expect(run[0]!.priv).toBe('sam')
  })

  it('unscheduling removes the busy block', () => {
    let evs: AppEvent[] = [...members('sam'), ...P.addDump('sam', [{ title: 'Private thing', private: true }], clock++)]
    let f = projectFamily(evs)
    const item = Object.values(f.dump)[0]!
    evs = [...evs, ...inheritPriv(f, P.scheduleDump('sam', f, item, { date: day, assignee: 'sam', time: '09:00' }, clock++))]
    f = projectFamily(evs)
    const scheduled = Object.values(f.dump)[0]!
    evs = [...evs, ...inheritPriv(f, P.unscheduleDump('sam', f, scheduled, clock++))]
    f = projectFamily(evs)
    expect(Object.values(f.cal).filter((c) => !c.deleted)).toHaveLength(0)
  })

  it('converting a shared item swaps it for a private copy, and back', () => {
    let evs: AppEvent[] = [...members('sam'), ...P.addDump('sam', [{ title: 'Was shared' }], clock++)]
    let f = projectFamily(evs)
    const shared = Object.values(f.dump)[0]!
    evs = [...evs, ...inheritPriv(f, P.makeDumpPrivate('sam', f, shared, clock++))]
    f = projectFamily(evs)
    let live = Object.values(f.dump).filter((d) => !d.deleted)
    expect(live).toHaveLength(1)
    expect(live[0]!.priv).toBe('sam')
    // the shared copy's deletion event is public, the private copy is not
    expect(evs.filter((e) => e.type === 'dump' && !e.priv && (e as { deleted?: boolean }).deleted)).toHaveLength(1)
    evs = [...evs, ...inheritPriv(f, P.makeDumpShared('sam', f, live[0]!, clock++))]
    f = projectFamily(evs)
    live = Object.values(f.dump).filter((d) => !d.deleted)
    expect(live).toHaveLength(1)
    expect(live[0]!.priv).toBeUndefined()
    void base
    void emptyFamily
  })

  it("an adult's own check-in is private when asked, a child's never is", () => {
    const f = projectFamily([...members('sam'), ...A.saveMember('sam', { id: 'kid', name: 'Maya', role: 'child', colour: '#fff', active: true }, clock++)])
    const mk = (m: string): AppEvent => ({ type: 'checkin', memberId: m, date: day, part: 'evening', mood: 2, why: 'Long day', id: `c-${m}`, ts: clock++, day, learnerId: m, v: 1 }) as AppEvent
    const out = inheritPriv(f, [mk('sam'), mk('kid')], { adultCheckins: (m) => m === 'sam' })
    expect(out[0]!.priv).toBe('sam')
    expect(out[1]!.priv).toBeUndefined()
  })
})

describe('key codes', () => {
  it('round-trips, rejects rubbish, and fingerprints do not reveal the key', async () => {
    const k = newKey()
    expect(k).toMatch(/^[0-9a-f]{32}$/)
    expect(parseKeyCode(keyCode('sam', k))).toEqual({ memberId: 'sam', key: k })
    expect(parseKeyCode('hqk1.sam.nothex')).toBeUndefined()
    const fp = await fingerprint(k)
    expect(fp).toHaveLength(12)
    expect(k.includes(fp)).toBe(false)
  })
})
