// Runs the real log-care Edge Function (supabase/functions/log-care/index.ts) against a small fake PostgREST table,
// with Deno's globals stubbed, so token checks, reading what it needs and inserting the events are all exercised.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from '@/family/actions'
import { projectFamily } from '@/family/project'
import { babyLogs, loggedBy } from '@/family/care'

const KEY = 'a'.repeat(32)
const TOKEN = 'tok-' + 'x'.repeat(30)
type Row = { seq: number; id: string; family_key: string; learner_id: string; ts: number; type: string; body: Record<string, any> }
let table: Row[] = []
let seq = 1
let handler: (req: Request) => Promise<Response>

const add = (e: AppEvent, family_key = KEY) => table.push({ seq: seq++, id: e.id, family_key, learner_id: e.learnerId, ts: e.ts, type: e.type, body: e as never })

function fakeRest(url: string, init: RequestInit = {}): Response {
  const u = new URL(url)
  if (init.method === 'POST') {
    const rows = JSON.parse(String(init.body)) as Omit<Row, 'seq'>[]
    for (const r of rows) if (!table.some((t) => t.id === r.id)) table.push({ ...r, seq: seq++ })
    return new Response(null, { status: 201 })
  }
  let out = table.slice()
  for (const [k, v] of u.searchParams) {
    if (k === 'order' || k === 'limit') continue
    if (k === 'family_key') out = out.filter((r) => `eq.${r.family_key}` === v)
    else if (k === 'type') out = out.filter((r) => (v.startsWith('eq.') ? r.type === v.slice(3) : v.slice(4, -1).split(',').includes(r.type)))
    else if (k === 'ts') out = out.filter((r) => r.ts >= Number(v.slice(4)))
    else if (k === 'body->>babyId') out = out.filter((r) => r.body.babyId === v.slice(3))
    else if (k === 'body->>voice') out = out.filter((r) => r.body.voice != null)
    else throw new Error('unhandled filter ' + k)
  }
  const desc = u.searchParams.get('order') === 'seq.desc'
  out.sort((a, b) => (desc ? b.seq - a.seq : a.seq - b.seq))
  out = out.slice(0, Number(u.searchParams.get('limit') ?? 1000))
  return new Response(JSON.stringify(out), { status: 200 })
}

beforeAll(async () => {
  const env: Record<string, string> = { SUPABASE_URL: 'https://x.supabase.co', SERVICE_ROLE_KEY: 'svc', HOME_LOG_TOKEN: TOKEN, HOME_FAMILY_KEY: 'hq1.' + KEY }
  ;(globalThis as any).Deno = { env: { get: (k: string) => env[k] }, serve: (h: (req: Request) => Promise<Response>) => (handler = h) }
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => fakeRest(String(url), init))
  await import('../../supabase/functions/log-care/index.ts')
})
afterEach(() => {
  table = []
  seq = 1
})

const seed = () => {
  for (const e of A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, 1000)) add(e)
  for (const e of A.saveMember('mum', { id: 'bub', name: 'Bub', role: 'baby', colour: '#b388ff', active: true }, 1001)) add(e)
}
const call = async (command: unknown, token: string | null = TOKEN, extra: Record<string, unknown> = {}) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers['x-care-token'] = token
  const res = await handler(new Request('https://f/log-care', { method: 'POST', headers, body: JSON.stringify({ command, ...extra }) }))
  return { status: res.status, body: (await res.json()) as any }
}
const folded = () => projectFamily(table.sort((a, b) => a.seq - b.seq).map((r) => r.body as AppEvent))

describe('log-care', () => {
  it('refuses a missing or wrong token and writes nothing', async () => {
    seed()
    const before = table.length
    expect((await call('nappy-wet', null)).status).toBe(401)
    expect((await call('nappy-wet', 'nope')).status).toBe(401)
    expect(table.length).toBe(before)
  })

  it('rejects commands it does not know, and kinds other than the baby', async () => {
    seed()
    expect((await call('delete-everything')).status).toBe(400)
    expect((await call('nappy-wet', TOKEN, { kind: 'dog' })).status).toBe(400)
  })

  it('logs a nappy that the app then shows as logged by voice', async () => {
    seed()
    const r = await call('nappy-wet')
    expect(r).toMatchObject({ status: 200, body: { ok: true, say: 'Logged, wet nappy.', logged: 1 } })
    const f = folded()
    const logs = babyLogs(f, 'bub')
    expect(logs).toHaveLength(1)
    expect(loggedBy(f, logs[0]!)).toEqual({ voice: true })
  })

  it('ignores an identical command a moment later, but not a different one', async () => {
    seed()
    await call('bottle')
    const again = await call('bottle')
    expect(again.body).toMatchObject({ duplicate: true, logged: 0, say: 'Already logged.' })
    await call('nappy-dirty')
    expect(babyLogs(folded(), 'bub')).toHaveLength(2)
  })

  it('uses the family’s saved bottle amount', async () => {
    seed()
    add({ id: 'vc', ts: 2000, day: '2026-10-15', learnerId: 'mum', v: 1, type: 'voice-config', bottleMl: 90, milk: 'expressed', tz: 'Europe/London' } as never)
    await call('bottle')
    expect(babyLogs(folded(), 'bub')[0]!.feed).toMatchObject({ ml: 90, milk: 'expressed' })
  })

  it('starts and stops a breast feed, and says so when none is running', async () => {
    seed()
    expect((await call('feed-stop')).body).toMatchObject({ ok: false, say: 'No feed running.' })
    expect((await call('feed-start-left')).body.say).toBe('Started, left side.')
    expect((await call('feed-start-right')).body.say).toBe('A feed is already running.')
    expect((await call('feed-stop')).body).toMatchObject({ ok: true, logged: 2 })
    const logs = babyLogs(folded(), 'bub')
    expect(logs).toHaveLength(1)
    expect(logs[0]!.feed).toMatchObject({ method: 'breast', side: 'L' })
  })

  it('only ever writes into its own family, and refuses when there is no baby or two', async () => {
    expect((await call('nappy-wet')).status).toBe(409)
    seed()
    add(A.saveMember('mum', { id: 'twin', name: 'Twin', role: 'baby', colour: '#b388ff', active: true }, 1002)[0]!)
    expect((await call('nappy-wet')).status).toBe(409)
    expect((await call('nappy-wet', TOKEN, { babyId: 'twin' })).status).toBe(200)
    expect(table.filter((r) => r.type === 'baby').every((r) => r.family_key === KEY && r.body.babyId === 'twin')).toBe(true)
  })
})
