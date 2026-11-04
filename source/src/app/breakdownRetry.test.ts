import { describe, expect, it } from 'vitest'
import { askGemini, geminiErrorText } from '../../supabase/functions/_shared/breakdown'

const r = (status: number) => new Response(status === 200 ? '{}' : 'busy', { status })
const noSleep = async () => {}

/** A fake Gemini: answers from a script per model, and records every call. */
function fake(script: Record<string, number[]>) {
  const calls: string[] = []
  const call = async (model: string, schema: boolean) => {
    calls.push(`${model}${schema ? '' : '(plain)'}`)
    const next = script[model]!.shift()
    return r(next ?? 503)
  }
  return { calls, call }
}

describe('askGemini rides out a busy Gemini', () => {
  it('tries again after a 503 and returns the answer that worked', async () => {
    const g = fake({ main: [503, 200] })
    const out = await askGemini(g.call, ['main', 'lite'], noSleep)
    expect(out.res.ok).toBe(true)
    expect(out.model).toBe('main')
    expect(g.calls).toEqual(['main', 'main'])
  })

  it('moves on to the fallback model when the main one stays busy (three goes)', async () => {
    const g = fake({ main: [503, 503, 503], lite: [200] })
    const out = await askGemini(g.call, ['main', 'lite'], noSleep)
    expect(out).toMatchObject({ model: 'lite', tries: 4 })
    expect(out.res.ok).toBe(true)
  })

  it('a main model out of quota (429) goes straight to the fallback', async () => {
    const g = fake({ main: [429], lite: [200] })
    expect((await askGemini(g.call, ['main', 'lite'], noSleep)).model).toBe('lite')
    expect(g.calls).toEqual(['main', 'lite'])
  })

  it('keeps the first error if the fallback model does not exist', async () => {
    const g = fake({ main: [503, 503, 503], lite: [404] })
    const out = await askGemini(g.call, ['main', 'lite'], noSleep)
    expect(out.res.status).toBe(503)
    expect(out.model).toBe('main')
  })

  it('asks for plain JSON after a 400, and does not retry a bad key', async () => {
    const a = fake({ main: [400, 200] })
    expect((await askGemini(a.call, ['main', 'lite'], noSleep)).res.ok).toBe(true)
    expect(a.calls).toEqual(['main', 'main(plain)'])
    const b = fake({ main: [403], lite: [200] })
    expect((await askGemini(b.call, ['main', 'lite'], noSleep)).res.status).toBe(403)
    expect(b.calls).toEqual(['main'])
  })

  it('says something useful for a 503', () => {
    expect(geminiErrorText(503)).toMatch(/busy right now/)
  })
})
