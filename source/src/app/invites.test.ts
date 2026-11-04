import { describe, expect, it } from 'vitest'
import type { Repo } from '@/storage/repo'
import { createInvite, familyStatus, normaliseInvite, redeemInvite } from '@/storage/invites'
import { enableSharing } from './pairing'
import { SyncManager } from './syncManager'

const URL_ = 'https://abc.supabase.co'
const ANON = 'anon-key-xxxxxxxxxxxxxxxxxxxx'

/**
 * A fake of supabase/schema_v5.sql's three functions (the SQL itself is checked against real Postgres separately).
 * `setUp: false` behaves like a project that hasn't had the file run: PostgREST's 404 "no such function".
 */
function fakeServer({ setUp = true, approved = ['approvedfamilykey0001'] } = {}) {
  const families = new Set(approved)
  const invites = new Map<string, { by: string; used?: string; expired?: boolean }>()
  const calls: string[] = []
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const fn = url.split('/rpc/')[1] ?? ''
    calls.push(fn)
    const key = (init?.headers as Record<string, string>)['x-family-key'] ?? ''
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (!setUp) return reply(404, { code: 'PGRST202', message: `Could not find the function public.${fn} without parameters` })
    if (fn === 'family_status') return reply(200, { approved: families.has(key), open_invites: [...invites.values()].filter((i) => i.by === key && !i.used).length })
    if (fn === 'create_family_invite') {
      if (!families.has(key)) return reply(200, { ok: false, error: 'not_approved' })
      const code = `hqi.${'abcdefghjkmn'.slice(0, 11)}${invites.size + 2}`
      invites.set(code, { by: key })
      return reply(200, { ok: true, code, expires_at: '2026-11-18T12:00:00Z' })
    }
    if (fn === 'redeem_family_invite') {
      const code = String((JSON.parse(String(init?.body)) as { invite: string }).invite)
      const inv = invites.get(code)
      if (families.has(key)) return reply(200, { ok: true, already: true })
      if (!inv) return reply(200, { ok: false, error: 'unknown' })
      if (inv.used) return reply(200, { ok: false, error: 'used' })
      inv.used = key
      families.add(key)
      return reply(200, { ok: true })
    }
    return reply(404, {})
  }) as typeof fetch
  return { fetchImpl, families, invites, calls }
}

function stubRepo() {
  const kv = new Map<string, unknown>()
  let requeued = 0
  const repo = {
    storage: { kv: { get: async (k: string) => kv.get(k), set: async (k: string, v: unknown) => void kv.set(k, v), del: async (k: string) => void kv.delete(k) } },
    sync: async () => ({ ok: true, pulled: 0, pushed: 0, at: Date.now() }),
    subscribe: () => () => {},
    pendingCount: () => 0,
    requeueAll: async () => void requeued++,
  }
  return { repo: repo as unknown as Repo, kv, requeued: () => requeued }
}

describe('family invites', () => {
  it('tidies typed codes and rejects ones that cannot be invites', () => {
    expect(normaliseInvite('  HQI.ABCD EFGH JK23 ')).toBe('hqi.abcdefghjk23')
    expect(normaliseInvite('abcdefghjk23')).toBe('hqi.abcdefghjk23')
    expect(normaliseInvite('hqi.short')).toBeUndefined()
    expect(normaliseInvite('hq1.abcdefghjk23abcd')).toBeUndefined()
  })

  it('an approved family makes a code another family can use once', async () => {
    const s = fakeServer()
    const made = await createInvite({ url: URL_, anonKey: ANON, familyKey: 'approvedfamilykey0001', fetchImpl: s.fetchImpl })
    expect(made.ok).toBe(true)
    const code = made.ok ? made.code : ''
    expect(await redeemInvite({ url: URL_, anonKey: ANON, familyKey: 'newfamilykey00000002', fetchImpl: s.fetchImpl }, code)).toEqual({ ok: true })
    expect(await redeemInvite({ url: URL_, anonKey: ANON, familyKey: 'otherfamilykey000003', fetchImpl: s.fetchImpl }, code)).toEqual({ ok: false, error: 'used' })
    expect(await familyStatus({ url: URL_, anonKey: ANON, familyKey: 'newfamilykey00000002', fetchImpl: s.fetchImpl })).toEqual({ ok: true, approved: true, openInvites: 0 })
  })

  it('a project without invites set up is reported as such, not as an error', async () => {
    const s = fakeServer({ setUp: false })
    expect(await familyStatus({ url: URL_, anonKey: ANON, familyKey: 'x'.repeat(20), fetchImpl: s.fetchImpl })).toEqual({ ok: true, notSetUp: true })
    expect(await createInvite({ url: URL_, anonKey: ANON, familyKey: 'x'.repeat(20), fetchImpl: s.fetchImpl })).toEqual({ ok: false, error: 'not_set_up' })
  })

  it('being offline is reported, not thrown', async () => {
    const offline = (async () => {
      throw new TypeError('Failed to fetch')
    }) as typeof fetch
    expect(await familyStatus({ url: URL_, anonKey: ANON, familyKey: 'x'.repeat(20), fetchImpl: offline })).toMatchObject({ ok: false, error: 'offline' })
  })
})

describe('turning on sharing on the shared server', () => {
  it('without an invite, a new family is told it needs one and nothing is saved', async () => {
    const s = fakeServer()
    const { repo, kv, requeued } = stubRepo()
    const sync = new SyncManager(repo)
    const r = await enableSharing(repo, sync, { url: URL_, anonKey: ANON, fetchImpl: s.fetchImpl })
    expect(r).toMatchObject({ ok: false, needInvite: true })
    expect(kv.get('sync.config')).toBeUndefined()
    expect(sync.config()).toBeUndefined()
    expect(requeued()).toBe(0)
  })

  it('with a good invite, the new family key is approved and sharing comes on', async () => {
    const s = fakeServer()
    const made = await createInvite({ url: URL_, anonKey: ANON, familyKey: 'approvedfamilykey0001', fetchImpl: s.fetchImpl })
    const { repo, requeued } = stubRepo()
    const sync = new SyncManager(repo)
    const r = await enableSharing(repo, sync, { url: URL_, anonKey: ANON, invite: made.ok ? made.code.toUpperCase() : '', fetchImpl: s.fetchImpl })
    expect(r.ok).toBe(true)
    const key = sync.config()!.familyKey
    expect(r.ok && r.code).toBe(`hq1.${key}`)
    expect(s.families.has(key)).toBe(true)
    expect(requeued()).toBe(1)
  })

  it('a used or mistyped invite leaves sharing off with a clear message', async () => {
    const s = fakeServer()
    const { repo } = stubRepo()
    const sync = new SyncManager(repo)
    expect(await enableSharing(repo, sync, { url: URL_, anonKey: ANON, invite: 'nonsense', fetchImpl: s.fetchImpl })).toMatchObject({ ok: false, error: expect.stringContaining('doesn’t look like an invite') })
    expect(await enableSharing(repo, sync, { url: URL_, anonKey: ANON, invite: 'hqi.zzzzzzzzzzzz', fetchImpl: s.fetchImpl })).toMatchObject({ ok: false, error: expect.stringContaining('isn’t one we know') })
    expect(sync.config()).toBeUndefined()
  })

  it('on a project that has not had schema_v5.sql run, sharing works as before (no invite needed)', async () => {
    const s = fakeServer({ setUp: false })
    const { repo } = stubRepo()
    const sync = new SyncManager(repo)
    expect((await enableSharing(repo, sync, { url: URL_, anonKey: ANON, fetchImpl: s.fetchImpl })).ok).toBe(true)
    expect(sync.config()?.familyKey).toBeTruthy()
  })
})
