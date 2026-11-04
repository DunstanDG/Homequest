import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanBreakdown } from '../../supabase/functions/_shared/breakdown'
import { requestBreakdown, sampleBreakdown, setDeviceKey } from './breakdown'
import type { SyncManager } from './syncManager'

const store = new Map<string, string>()
beforeEach(() => {
  store.clear()
  ;(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }
})
afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
})

const sync = (on: boolean) => ({ config: () => (on ? { familyKey: 'k'.repeat(24) } : undefined), effectiveUrl: () => 'https://x.supabase.co/', effectiveAnonKey: () => 'anon' }) as unknown as SyncManager

const answer = { project_title: 'P', total_estimated_minutes: 30, tasks: [{ task_id: 't1', title: 'Do it', description: '', estimated_minutes: 30, dependencies: [] }] }
const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('asking for a breakdown', () => {
  it('goes through the family function with the family key, and checks the answer', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const out = await requestBreakdown(sync(true), false, { goal: 'Plant a herb garden' }, { fetchImpl: (async (url: string, init: RequestInit) => (calls.push({ url, init }), resp(200, { result: answer }))) as typeof fetch })
    expect(out).toEqual({ ok: true, via: 'function', result: { ...answer } })
    expect(calls[0]!.url).toBe('https://x.supabase.co/functions/v1/breakdown')
    expect((calls[0]!.init.headers as Record<string, string>)['x-family-key']).toBe('k'.repeat(24))
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ input: { goal: 'Plant a herb garden' } })
  })

  it('with a publishable key, sends only that (no legacy JWT) to the function', async () => {
    let h: Record<string, string> = {}
    await requestBreakdown(sync(true), false, { goal: 'x' }, { publishableKey: 'sb_publishable_abc', fetchImpl: (async (_u: string, init: RequestInit) => ((h = init.headers as Record<string, string>), resp(200, { result: answer }))) as typeof fetch })
    expect(h.apikey).toBe('sb_publishable_abc')
    expect(h.Authorization).toBeUndefined()
    expect(h['x-family-key']).toBe('k'.repeat(24))
  })

  it('a busy Gemini behind the function comes back as worth trying again', async () => {
    const out = await requestBreakdown(sync(true), false, { goal: 'x' }, { fetchImpl: (async () => resp(502, { error: 'Gemini is busy right now (503).', busy: true, status: 503 })) as typeof fetch })
    expect(out).toMatchObject({ ok: false, retry: true, error: 'Gemini is busy right now (503).' })
  })

  it('with a key on this phone, a 503 is retried and then handed to the fallback model', async () => {
    setDeviceKey('AIza-test')
    const urls: string[] = []
    const gem = { candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] }
    const fetchImpl = (async (url: string) => (urls.push(url), urls.length <= 3 ? resp(503, {}) : resp(200, gem))) as typeof fetch
    const out = await requestBreakdown(sync(false), false, { goal: 'x' }, { fetchImpl, sleep: async () => {} })
    expect(out).toMatchObject({ ok: true, via: 'device' })
    expect(urls[3]).toContain('gemini-3.1-flash-lite')
  })

  it('explains what is missing when nothing is set up or the function is not deployed', async () => {
    expect(await requestBreakdown(sync(false), false, { goal: 'x' })).toMatchObject({ ok: false, setup: true })
    expect(await requestBreakdown(sync(true), false, { goal: 'x' }, { fetchImpl: (async () => resp(404, {})) as typeof fetch })).toMatchObject({ ok: false, setup: true })
    expect(await requestBreakdown(sync(true), false, { goal: 'x' }, { fetchImpl: (async () => { throw new TypeError('offline') }) as typeof fetch })).toMatchObject({ ok: false, setup: true, error: expect.stringMatching(/isn’t deployed/) })
  })

  it('with a key on this phone, calls Gemini directly, retrying without the schema if it is refused', async () => {
    setDeviceKey('  my-key ')
    const calls: { url: string; init: RequestInit }[] = []
    let n = 0
    const out = await requestBreakdown(sync(false), false, { goal: 'x' }, {
      fetchImpl: (async (url: string, init: RequestInit) => {
        calls.push({ url, init })
        return n++ === 0 ? resp(400, { error: 'schema' }) : resp(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] })
      }) as typeof fetch,
    })
    expect(out.ok && out.via).toBe('device')
    expect(calls).toHaveLength(2)
    expect(calls[0]!.url).toMatch(/generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent$/)
    expect((calls[0]!.init.headers as Record<string, string>)['x-goog-api-key']).toBe('my-key')
    expect(JSON.parse(calls[0]!.init.body as string).generationConfig.responseSchema).toBeTruthy()
    expect(JSON.parse(calls[1]!.init.body as string).generationConfig.responseSchema).toBeUndefined()
  })

  it('the demo sample is a valid breakdown sized to fit', () => {
    const r = sampleBreakdown({ goal: 'Paint the fence', path: ['Paint the fence'], minutes: 120 })
    expect(cleanBreakdown(r)).toBeTruthy()
    expect(Math.abs(r.total_estimated_minutes - 120)).toBeLessThanOrEqual(15)
    expect(sampleBreakdown({ goal: 'Learn to juggle' }).tasks.length).toBe(6)
  })
})
