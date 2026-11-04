import { describe, expect, it } from 'vitest'
import { buildRtPrompt, cleanAgenda, pseudonymise, rtRequestBody, unmaskAgenda, type RtFacts } from '../../../supabase/functions/_shared/roundTable'
import { askGeminiForRoundTable } from '@/app/roundTableGemini'
import type { SyncManager } from '@/app/syncManager'

const facts: RtFacts = {
  weekOf: '2026-11-09',
  days: [
    { date: '2026-11-09', label: 'Monday', people: [{ name: 'Sam', fixed: ['Work 09:00-17:30', 'Maya swimming 18:00'], mustdo: 90, free: 30, school: false }, { name: 'Maya', fixed: ['School'], mustdo: 45, free: 120, school: true }], warnings: ['Sam has to leave work early for Maya swimming'] },
    { date: '2026-11-10', label: 'Tuesday', people: [{ name: 'Annabel', fixed: [], mustdo: 0, free: 300, school: false }], warnings: [] },
  ],
  issues: ['Monday: Sam is double-booked at 18:00'],
  learned: ['Maya’s maths homework takes about 50 min, not 30'],
  review: { from: '2026-11-02', to: '2026-11-08', people: [{ name: 'Maya', asked: 4, ok: 2, done: 1, later: 1, late: 0, skip: 0, swap: 0, none: 0, tasksDone: 6 }] },
}

describe('round table with Gemini: names never leave', () => {
  it('swaps every family name for Person N everywhere, including inside titles, warnings and notes', () => {
    const m = pseudonymise(facts, [{ who: 'Maya', text: 'Can Ann take me to swimming?' }], ['Sam', 'Maya', 'Annabel', 'Ann'])
    const prompt = buildRtPrompt(m.facts, m.notes)
    for (const name of ['Sam', 'Maya', 'Annabel', 'Ann']) expect(prompt).not.toMatch(new RegExp(`\\b${name}\\b`))
    expect(prompt).toContain('Person')
    // Longer names first: "Annabel" isn't turned into "Person N" + "bel".
    expect(prompt).not.toMatch(/Person \d+bel/)
    // ...and back again in the answer.
    const sam = m.facts.days[0]!.people[0]!.name
    expect(m.back(`${sam} could swap with someone`)).toBe('Sam could swap with someone')
  })

  it('also keeps names out of the whole request sent to Google', () => {
    const m = pseudonymise(facts, [], ['Sam', 'Maya', 'Annabel'])
    const body = JSON.stringify(rtRequestBody(m.facts, m.notes))
    expect(body).not.toMatch(/Sam|Maya|Annabel/)
  })
})

describe('round table with Gemini: checking the answer', () => {
  it('accepts a good answer (as text, even in a code fence) and caps it to what the app shows', () => {
    const a = cleanAgenda('```json\n' + JSON.stringify({ summary: '  A busy Monday,\n calm after. ', points: Array.from({ length: 12 }, (_, i) => ({ text: `Point ${i}` })) }) + '\n```')
    expect(a?.summary).toBe('A busy Monday, calm after.')
    expect(a?.points).toHaveLength(8)
  })

  it('refuses answers with nothing useful in them', () => {
    expect(cleanAgenda('not json')).toBeUndefined()
    expect(cleanAgenda({ summary: 'Hi', points: [] })).toBeUndefined()
    expect(cleanAgenda({ points: [{ text: 'x' }] })).toBeUndefined()
  })

  it('puts real names back into the agenda', () => {
    const m = pseudonymise(facts, [], ['Sam', 'Maya'])
    const p1 = m.facts.days[0]!.people[0]!.name
    const p2 = m.facts.days[0]!.people[1]!.name
    const out = unmaskAgenda({ summary: `${p1} has a long Monday.`, points: [{ text: `${p2} could get a lift.` }] }, m.back)
    expect(out).toEqual({ summary: 'Sam has a long Monday.', points: [{ text: 'Maya could get a lift.' }] })
  })
})

describe('Ask Gemini now', () => {
  const sync = { config: () => ({ familyKey: 'familykey0000000001' }), effectiveUrl: () => 'https://abc.supabase.co', effectiveAnonKey: () => 'anon', syncNow: async () => undefined } as unknown as SyncManager

  it('sends the family key and week, and reports success', async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | undefined
    const fetchImpl = (async (u: string, init: RequestInit) => {
      seen = { url: u, headers: init.headers as Record<string, string>, body: String(init.body) }
      return new Response(JSON.stringify({ ok: true, points: 4 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as unknown as typeof fetch
    expect(await askGeminiForRoundTable(sync, '2026-11-09', { fetchImpl, publishableKey: '' })).toEqual({ ok: true })
    expect(seen?.url).toBe('https://abc.supabase.co/functions/v1/round-table')
    expect(seen?.headers['x-family-key']).toBe('familykey0000000001')
    expect(JSON.parse(seen!.body)).toEqual({ weekOf: '2026-11-09' })
  })

  it('explains when the family is on the home assistant, or the function is missing', async () => {
    const skipped = (async () => new Response(JSON.stringify({ ok: false, skipped: 'This family’s round table is set to the home assistant.' }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch
    expect(await askGeminiForRoundTable(sync, '2026-11-09', { fetchImpl: skipped, publishableKey: '' })).toMatchObject({ ok: false, error: expect.stringContaining('home assistant') })
    const missing = (async () => new Response('Not found', { status: 404 })) as unknown as typeof fetch
    expect(await askGeminiForRoundTable(sync, '2026-11-09', { fetchImpl: missing, publishableKey: '' })).toMatchObject({ ok: false, setup: true })
  })
})
