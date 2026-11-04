// Runs the real round-table Edge Function (supabase/functions/round-table/index.ts) against a small fake PostgREST
// table and a fake Gemini, with Deno's globals stubbed: who may call it, the family's setting, names kept from
// Google, and the "ready" event it writes being one the app folds and shows.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from '@/family/actions'
import * as T from './actions'
import { projectFamily } from '@/family/project'
import { makeEvent } from '@/engine/make'

const KEY = 'f'.repeat(24)
const OTHER = 'o'.repeat(24)
const HOOK = 'hook-' + 'h'.repeat(30)
const WEEK = '2026-11-09'
type Row = { seq: number; id: string; family_key: string; learner_id: string; ts: number; type: string; body: Record<string, any> }
let table: Row[] = []
let seq = 1
let handler: (req: Request) => Promise<Response>
let geminiAsked: string[] = []
let geminiAnswer: unknown = { summary: 'Person 1 has a long Monday.', points: [{ text: 'Person 2 could walk the dog on Monday.' }, { text: 'Swimming on Saturday: yes, after lunch.' }] }

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
    if (['order', 'limit', 'select', 'owner_key'].includes(k)) continue
    if (k === 'family_key') out = out.filter((r) => `eq.${r.family_key}` === v)
    else if (k === 'type') out = out.filter((r) => r.type === v.slice(3))
    else if (k === 'body->>weekOf') out = out.filter((r) => r.body.weekOf === v.slice(3))
    else throw new Error('unhandled filter ' + k)
  }
  const desc = u.searchParams.get('order') === 'ts.desc'
  out.sort((a, b) => (desc ? b.ts - a.ts : a.ts - b.ts))
  out = out.slice(0, Number(u.searchParams.get('limit') ?? 1000))
  return new Response(JSON.stringify(out.map((r) => ({ id: r.id, ts: r.ts, body: r.body }))), { status: 200 })
}

beforeAll(async () => {
  const env: Record<string, string> = { SUPABASE_URL: 'https://x.supabase.co', SERVICE_ROLE_KEY: 'svc', GEMINI_API_KEY: 'gk', ALLOWED_FAMILY_KEYS: `hq1.${KEY}`, ROUND_TABLE_HOOK_SECRET: HOOK }
  ;(globalThis as any).Deno = { env: { get: (k: string) => env[k] }, serve: (h: (req: Request) => Promise<Response>) => (handler = h) }
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (String(url).includes('generativelanguage.googleapis.com')) {
      geminiAsked.push(String(init?.body))
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(geminiAnswer) }] } }] }), { status: 200 })
    }
    return fakeRest(String(url), init)
  })
  await import('../../../supabase/functions/round-table/index.ts')
})
afterEach(() => {
  table = []
  seq = 1
  geminiAsked = []
})

const facts = {
  weekOf: WEEK,
  days: [{ date: WEEK, label: 'Monday', people: [{ name: 'Sam', fixed: ['Work'], mustdo: 60, free: 20, school: false }, { name: 'Maya', fixed: ['School', 'Swimming'], mustdo: 45, free: 90, school: true }], warnings: ['Sam is busy at dog-walk time'] }],
  issues: [],
  learned: [],
  review: { from: '2026-11-02', to: '2026-11-08', people: [] },
}

function seed(engine: 'local' | 'gemini' = 'gemini') {
  for (const e of A.saveMember('sam', { id: 'sam', name: 'Sam', role: 'parent', colour: '#4cc9f0', active: true }, 1000)) add(e)
  for (const e of A.saveMember('sam', { id: 'maya', name: 'Maya', role: 'child', colour: '#ffc857', active: true }, 1001)) add(e)
  for (const e of T.saveRoundTableSettings('sam', { on: true, weekday: 6, at: '17:00', engine }, 1002)) add(e)
  for (const e of T.addRoundTableNote('maya', WEEK, 'Can we go swimming on Saturday, Sam?', 1003)) add(e)
  add(makeEvent('server', { type: 'round-table', weekOf: WEEK, status: 'waiting', facts } as never, 2000))
}

const call = async (body: unknown, headers: Record<string, string>) => {
  const res = await handler(new Request('https://f/round-table', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }))
  return { status: res.status, body: (await res.json()) as any }
}

describe('round-table function', () => {
  it('from the database trigger: writes a ready agenda the app shows, and Google never sees a name', async () => {
    seed()
    const r = await call({ family_key: KEY, weekOf: WEEK }, { 'x-hook-secret': HOOK })
    expect(r.body).toMatchObject({ ok: true, points: 2 })
    expect(geminiAsked).toHaveLength(1)
    expect(geminiAsked[0]).not.toMatch(/Sam|Maya/)
    expect(geminiAsked[0]).toContain('swimming on Saturday')
    const f = projectFamily(table.sort((a, b) => a.seq - b.seq).map((x) => x.body as AppEvent))
    const rt = f.travel.roundTables[WEEK]!
    expect(rt.status).toBe('ready')
    expect(rt.source).toBe('gemini')
    // Person 1 / Person 2 came back as the two real names (which is which depends on the numbering).
    const text = [rt.agenda!.summary, ...rt.agenda!.points.map((p) => p.text)].join(' ')
    expect(text).not.toContain('Person')
    expect(rt.agenda?.summary).toMatch(/^(Sam|Maya) has a long Monday\.$/)
    expect(rt.agenda?.points[0]?.text).toMatch(/^(Sam|Maya) could walk the dog on Monday\.$/)
    expect(rt.agenda?.summary.split(' ')[0]).not.toBe(rt.agenda?.points[0]?.text.split(' ')[0])
    expect(rt.facts.days[0]?.people.map((p) => p.name)).toEqual(['Sam', 'Maya'])
  })

  it('does nothing for a family on the home assistant', async () => {
    seed('local')
    const r = await call({ family_key: KEY, weekOf: WEEK }, { 'x-hook-secret': HOOK })
    expect(r.body.skipped).toBeTruthy()
    expect(geminiAsked).toHaveLength(0)
  })

  it('refuses families not allowed to spend the Gemini key, and a wrong hook secret is just an unknown family', async () => {
    seed()
    expect((await call({ weekOf: WEEK }, { 'x-family-key': OTHER })).status).toBe(403)
    expect((await call({ family_key: KEY, weekOf: WEEK }, { 'x-hook-secret': 'wrong' })).status).toBe(403)
    expect(geminiAsked).toHaveLength(0)
  })

  it('from the app (Ask Gemini now) works the same, and a second ask once it is ready does not call Gemini again', async () => {
    seed()
    expect((await call({ weekOf: WEEK }, { 'x-family-key': KEY })).body).toMatchObject({ ok: true })
    expect((await call({ weekOf: WEEK }, { 'x-family-key': KEY })).body).toMatchObject({ ok: true, already: true })
    expect(geminiAsked).toHaveLength(1)
  })

  it('an unreadable Gemini answer writes nothing', async () => {
    seed()
    geminiAnswer = { nonsense: true }
    const before = table.length
    expect((await call({ weekOf: WEEK }, { 'x-family-key': KEY })).status).toBe(502)
    expect(table.length).toBe(before)
    geminiAnswer = { summary: 'ok', points: [{ text: 'ok' }] }
  })
})
