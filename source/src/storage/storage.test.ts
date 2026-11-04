import { describe, expect, it } from 'vitest'
import { Session } from '@/engine/session'
import { solutionFor } from '@/engine/judge'
import { fixtureRegistry } from '@/engine/testing/fixture'
import { progressSummary } from '@/engine/report'
import { uid } from '@/engine/rng'
import type { AppEvent, TaughtEvent } from '@/engine/types'
import { Repo } from './repo'
import { createMemoryStorage } from './local'
import { createFakeRemote } from './sync'
import { createSupabaseAdapter } from './supabase'
import { makeBackup, parseBackup } from './backup'
import { newFamilyCode, parseFamilyCode } from './pairing'

const reg = fixtureRegistry()
let clock = 1_700_000_000_000

function play(repo: Repo, questions = 5) {
  const s = new Session({ registry: reg, store: repo, learnerId: repo.learnerId, subject: 'test', gameId: 'g', mode: 'practice', length: questions, seed: 9, now: () => (clock += 5000) })
  let q
  while ((q = s.next())) s.submit(solutionFor(q.item))
  return s.finish()
}

const taught = (learnerId: string, skillId: string): TaughtEvent => ({ id: uid('e'), ts: (clock += 1000), day: '2026-09-20', learnerId, v: 1, type: 'taught', skillId, taught: true })

describe('repo: local persistence', () => {
  it('survives a restart: reopening from the same storage gives the same state', async () => {
    const storage = createMemoryStorage()
    const a = await Repo.open(reg, storage)
    const sum = play(a)
    await a.flush()
    const b = await Repo.open(reg, storage)
    expect(b.learnerId).toBe(a.learnerId)
    expect(b.get().xp).toBe(sum.xp)
    expect(b.get().skills).toEqual(a.get().skills)
  })

  it('notifies subscribers when events are applied', async () => {
    const repo = await Repo.open(reg, createMemoryStorage())
    let calls = 0
    repo.subscribe(() => calls++)
    play(repo, 2)
    expect(calls).toBeGreaterThan(0)
  })
})

describe('sync', () => {
  it('requeueAll re-sends history to a brand-new remote (e.g. after switching family key)', async () => {
    const first = createFakeRemote('first')
    const repo = await Repo.open(reg, createMemoryStorage())
    play(repo)
    await repo.sync(first)
    expect(repo.pendingCount()).toBe(0)

    const second = createFakeRemote('second')
    await repo.requeueAll()
    expect(repo.pendingCount()).toBe(repo.allEvents().length)
    const report = await repo.sync(second)
    expect(report.ok).toBe(true)
    expect(second.rows.length).toBe(repo.allEvents().length)
  })

  it('child and parent devices converge through a remote, in either order', async () => {
    const remote = createFakeRemote()
    const child = await Repo.open(reg, createMemoryStorage())
    const parent = await Repo.open(reg, createMemoryStorage(), { forceLearnerId: child.learnerId })

    const sum = play(child)
    expect((await child.sync(remote)).ok).toBe(true)
    expect((await parent.sync(remote)).pulled).toBeGreaterThan(0)
    expect(parent.get().xp).toBe(sum.xp)

    // Parent acts; child sees it after its next sync.
    parent.apply([taught(child.learnerId, 't.c')])
    await parent.sync(remote)
    await child.sync(remote)
    expect(child.allEvents().map((e) => e.id).sort()).toEqual(parent.allEvents().map((e) => e.id).sort())
    expect(child.get().xp).toBe(parent.get().xp)
    // Syncing again changes nothing.
    const again = await child.sync(remote)
    expect(again).toMatchObject({ ok: true, pulled: 0, pushed: 0 })
  })

  it('an offline failure loses nothing: events stay queued and go out on the next sync', async () => {
    const remote = createFakeRemote()
    const child = await Repo.open(reg, createMemoryStorage())
    play(child, 3)
    remote.failNext()
    const bad = await child.sync(remote)
    expect(bad.ok).toBe(false)
    expect(child.pendingCount()).toBeGreaterThan(0)
    const good = await child.sync(remote)
    expect(good.ok).toBe(true)
    expect(remote.rows.length).toBe(child.allEvents().length)
    expect(child.pendingCount()).toBe(0)
  })

  it('events created while a sync is in flight are still queued afterwards', async () => {
    const child = await Repo.open(reg, createMemoryStorage())
    play(child, 2)
    const remote = createFakeRemote()
    const realPush = remote.push.bind(remote)
    let injected = false
    remote.push = async (evs: AppEvent[]) => {
      if (!injected) {
        injected = true
        child.apply([taught(child.learnerId, 't.d')]) // user acts mid-sync
      }
      await realPush(evs)
    }
    await child.sync(remote)
    expect(child.pendingCount()).toBe(1)
    await child.sync(remote)
    expect(remote.rows.some((e) => e.type === 'taught')).toBe(true)
  })

  it('holds other learners\' events without mixing them into this learner\'s progress', async () => {
    const remote = createFakeRemote()
    const other = await Repo.open(reg, createMemoryStorage())
    const sum = play(other, 2)
    await other.sync(remote)
    const me = await Repo.open(reg, createMemoryStorage())
    await me.sync(remote)
    expect(me.get().xp).toBe(0)
    expect(me.learnerState(other.learnerId).xp).toBe(sum.xp) // ...but a parent can look at it
    expect(me.allEvents().length).toBe(other.allEvents().length)
  })
})

/** A tiny stand-in for Supabase's PostgREST endpoint, including the row-level-security rule. */
function fakePostgrest(serverKey: string) {
  const rows: { seq: number; id: string; family_key: string; learner_id: string; body: AppEvent }[] = []
  const seen: { method: string; url: string; headers: Record<string, string> }[] = []
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const headers = (init?.headers ?? {}) as Record<string, string>
    seen.push({ method: init?.method ?? 'GET', url: String(input), headers })
    const keyOk = headers['x-family-key'] === serverKey
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
    if (init?.method === 'POST') {
      if (!keyOk) return json({ message: 'new row violates row-level security policy' }, 403)
      const incoming = JSON.parse(String(init.body)) as { id: string; family_key: string; learner_id: string; body: AppEvent }[]
      for (const r of incoming) if (!rows.some((x) => x.id === r.id)) rows.push({ ...r, seq: rows.length + 1 })
      return new Response(null, { status: 201 })
    }
    if (!keyOk) return json([]) // RLS hides everything from wrong keys
    const gt = Number((url.searchParams.get('seq') ?? 'gt.0').replace('gt.', ''))
    const limit = Number(url.searchParams.get('limit') ?? 1000)
    // RLS: a row is visible only with its own family key; pulls are family-wide (no learner filter).
    const out = rows.filter((r) => r.seq > gt && r.family_key === serverKey).slice(0, limit)
    return json(out.map((r) => ({ seq: r.seq, body: r.body })))
  }) as typeof fetch
  return { rows, seen, fetchImpl }
}

describe('supabase adapter', () => {
  const cfg = (fetchImpl: typeof fetch, key = 'k'.repeat(24)) => ({ url: 'https://x.supabase.co/', anonKey: 'anon', familyKey: key, fetchImpl })

  it('pushes idempotently with the family key header, and pulls in pages', async () => {
    const server = fakePostgrest('k'.repeat(24))
    const a = createSupabaseAdapter(cfg(server.fetchImpl))
    const evs: AppEvent[] = Array.from({ length: 1200 }, (_v, i) => ({ id: `e${i}`, ts: i, day: '2026-09-20', learnerId: 'lrn1', v: 1, type: 'taught', skillId: 's', taught: true }))
    await a.push(evs)
    await a.push(evs.slice(0, 10)) // duplicates are ignored by the server (on_conflict)
    expect(server.rows.length).toBe(1200)
    const post = server.seen.find((s) => s.method === 'POST')!
    expect(post.url).toContain('on_conflict=id')
    expect(post.headers['x-family-key']).toBe('k'.repeat(24))
    expect(post.headers.Prefer).toContain('ignore-duplicates')
    expect(post.headers.apikey).toBe('anon')

    let cursor: string | undefined
    let got = 0
    for (let i = 0; i < 5; i++) {
      const page = await a.pull(cursor)
      got += page.events.length
      cursor = page.cursor
      if (!page.more) break
    }
    expect(got).toBe(1200)
  })

  it('a wrong family key can neither read nor write', async () => {
    const server = fakePostgrest('k'.repeat(24))
    const intruder = createSupabaseAdapter(cfg(server.fetchImpl, 'z'.repeat(24)))
    expect((await intruder.pull(undefined)).events).toEqual([])
    await expect(intruder.push([{ id: 'x', ts: 1, day: 'd', learnerId: 'lrn1', v: 1, type: 'taught', skillId: 's', taught: true }])).rejects.toThrow(/403/)
  })

  it('works end to end through Repo.sync', async () => {
    const server = fakePostgrest('k'.repeat(24))
    const child = await Repo.open(reg, createMemoryStorage())
    const adapter = () => createSupabaseAdapter(cfg(server.fetchImpl))
    play(child)
    expect((await child.sync(adapter())).ok).toBe(true)
    const parent = await Repo.open(reg, createMemoryStorage(), { forceLearnerId: child.learnerId })
    await parent.sync(adapter())
    expect(parent.get().xp).toBe(child.get().xp)
  })
})

describe('backup, pairing and summary', () => {
  it('round-trips a backup and rejects damaged files', async () => {
    const repo = await Repo.open(reg, createMemoryStorage())
    play(repo, 3)
    const text = makeBackup(repo.learnerId, repo.allEvents())
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    const fresh = await Repo.open(reg, createMemoryStorage(), { forceLearnerId: repo.learnerId })
    if (parsed.ok) expect(await fresh.importEvents(parsed.backup.events)).toBe(repo.allEvents().length)
    expect(fresh.get().xp).toBe(repo.get().xp)
    expect(await fresh.importEvents(repo.allEvents())).toBe(0) // importing twice adds nothing
    expect(parseBackup('not json')).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ format: 'studyquest-backup', learnerId: 'x', events: [{ nope: 1 }] }))).toMatchObject({ ok: false })
  })

  it('family codes round-trip, old StudyQuest codes still work, junk is rejected', () => {
    const code = newFamilyCode()
    const parsed = parseFamilyCode(code)
    expect(parsed?.familyKey).toBe(code.split('.')[1])
    expect(parsed?.familyKey.length).toBeGreaterThanOrEqual(16)
    expect(parsed?.learnerId).toBeUndefined()
    expect(parseFamilyCode('sq1.lkid123.abcdefghijklmnop0123')).toEqual({ learnerId: 'lkid123', familyKey: 'abcdefghijklmnop0123' })
    expect(parseFamilyCode('hello')).toBeNull()
    expect(parseFamilyCode('hq1.short')).toBeNull()
    expect(newFamilyCode()).not.toBe(newFamilyCode())
  })

  it('progress summary is readable text with the essentials', async () => {
    const repo = await Repo.open(reg, createMemoryStorage())
    play(repo, 6)
    const text = progressSummary(repo.get(), reg, clock)
    expect(text).toMatch(/StudyQuest week/)
    expect(text).toMatch(/XP/)
    expect(text.split('\n').length).toBeGreaterThanOrEqual(3)
  })
})
