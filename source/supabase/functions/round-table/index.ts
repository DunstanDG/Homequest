// Supabase Edge Function (Deno). Deploy with: supabase functions deploy round-table   (then turn OFF "Verify JWT")
//
// Writes the weekly round table's agenda with Gemini, for families whose Round table setting says "Gemini" instead of
// the family assistant on the home server (see ../_shared/roundTable.ts and docs/TRAVEL_AND_ALARMS.md).
//
// Two ways in, both answered the same way:
//   * The database (supabase/schema_v6.sql): a trigger posts { family_key, weekOf } here the moment the home server
//     writes a round table as "waiting", with the x-hook-secret header.
//   * The app: the Round table screen's "Ask Gemini now", with the family code in x-family-key and { weekOf }.
// Either way the function reads the facts and notes from the events table itself, so nothing the caller sends is
// trusted beyond which family and week to look at.
//
// Secrets (`supabase secrets set NAME=value`):
//   GEMINI_API_KEY, ALLOWED_FAMILY_KEYS   - the same two as the breakdown function (only these families can spend it)
//   SERVICE_ROLE_KEY                      - to read the family's events and write the agenda (same as log-care)
//   ROUND_TABLE_HOOK_SECRET               - a long random string, also stored in the database's vault (schema_v6.sql)
//   GEMINI_MODEL, GEMINI_FALLBACK_MODEL   - optional, as for breakdown
import { askGemini, DEFAULT_MODEL, FALLBACK_MODEL, geminiErrorText, geminiText, geminiUrl } from '../_shared/breakdown.ts'
import { cleanAgenda, pseudonymise, rtRequestBody, unmaskAgenda, type RtFacts, type RtNote } from '../_shared/roundTable.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const HOOK_SECRET = Deno.env.get('ROUND_TABLE_HOOK_SECRET') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL
const FALLBACK = Deno.env.get('GEMINI_FALLBACK_MODEL') || FALLBACK_MODEL
const MODELS = [...new Set([GEMINI_MODEL, ...(FALLBACK === 'none' ? [] : [FALLBACK])])]
const ALLOWED = new Set(
  (Deno.env.get('ALLOWED_FAMILY_KEYS') ?? '')
    .split(',')
    .map((k) => k.trim().replace(/^hq1\./, ''))
    .filter((k) => k.length >= 16),
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-family-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

function same(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

/** One run per family and week at a time, and at most 6 an hour per family (per function instance). */
const running = new Set<string>()
const recent = new Map<string, number[]>()
function allow(key: string): boolean {
  const now = Date.now()
  const xs = (recent.get(key) ?? []).filter((t) => now - t < 3_600_000)
  if (xs.length >= 6) return false
  xs.push(now)
  recent.set(key, xs)
  return true
}

type Row = { id: string; ts: number; body: Record<string, any> }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!GEMINI_API_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL || !ALLOWED.size) return json({ error: 'The round-table function isn’t set up yet (GEMINI_API_KEY, SERVICE_ROLE_KEY, ALLOWED_FAMILY_KEYS).' }, 500)

  let input: { family_key?: unknown; weekOf?: unknown } = {}
  try {
    input = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const fromHook = !!HOOK_SECRET && same(req.headers.get('x-hook-secret') ?? '', HOOK_SECRET)
  const familyKey = String(fromHook ? (input.family_key ?? '') : (req.headers.get('x-family-key') ?? ''))
  const weekOf = String(input.weekOf ?? '')
  if (!/^\d{4}-\d\d-\d\d$/.test(weekOf)) return json({ error: 'bad_week' }, 400)
  if (!ALLOWED.has(familyKey)) return json({ error: 'This family isn’t allowed to use Gemini. Add its key to ALLOWED_FAMILY_KEYS.' }, 403)

  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', ...init.headers } })
  const rows = async (q: string): Promise<Row[]> => {
    const r = await rest(`events?family_key=eq.${encodeURIComponent(familyKey)}&owner_key=is.null&select=id,ts,body&${q}`)
    if (!r.ok) throw new Error(`read ${r.status}`)
    return r.json()
  }

  const job = `${familyKey}|${weekOf}`
  if (running.has(job)) return json({ ok: true, busy: true })
  running.add(job)
  try {
    const settings = (await rows('type=eq.round-table-settings&order=ts.desc&limit=1'))[0]?.body
    if (settings?.engine !== 'gemini') return json({ ok: false, skipped: 'This family’s round table is set to the home assistant.' })
    const rt = (await rows(`type=eq.round-table&body->>weekOf=eq.${weekOf}&order=ts.desc&limit=1`))[0]?.body
    if (!rt) return json({ ok: false, error: 'There’s no round table for that week yet: the home server writes it first.' }, 404)
    if (rt.status !== 'waiting') return json({ ok: true, already: true })
    if (!allow(familyKey)) return json({ error: 'That’s a lot of round tables in an hour. Try again later.' }, 429)

    // Names: every member's latest name, for note authors and for keeping names away from Gemini.
    const members = new Map<string, string>()
    for (const m of await rows('type=eq.member&order=ts.asc&limit=500')) if (m.body.memberId && m.body.name) members.set(m.body.memberId, String(m.body.name))
    const notesById = new Map<string, Record<string, any>>()
    for (const n of await rows(`type=eq.round-table-note&body->>weekOf=eq.${weekOf}&order=ts.asc&limit=200`)) notesById.set(n.body.noteId, n.body)
    const notes: RtNote[] = [...notesById.values()].filter((n) => !n.deleted && n.text).map((n) => ({ who: members.get(n.learnerId) ?? 'Someone', text: String(n.text).slice(0, 200) }))

    const masked = pseudonymise(rt.facts as RtFacts, notes, [...members.values()])
    const call = (model: string, withSchema: boolean) =>
      fetch(geminiUrl(model), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, body: JSON.stringify(rtRequestBody(masked.facts, masked.notes, withSchema)) })
    const { res, model, tries } = await askGemini(call, MODELS)
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300)
      console.warn(`round-table: ${model} answered ${res.status} after ${tries} tries`)
      return json({ error: geminiErrorText(res.status), busy: res.status >= 500 || res.status === 429, detail }, 502)
    }
    const agenda = cleanAgenda(geminiText(await res.json()))
    if (!agenda) return json({ error: 'Gemini’s answer couldn’t be read. Try again.' }, 502)
    const real = unmaskAgenda(agenda, masked.back)

    // Still waiting? (The home assistant may have got there while Gemini was thinking.)
    const latest = (await rows(`type=eq.round-table&body->>weekOf=eq.${weekOf}&order=ts.desc&limit=1`))[0]?.body
    if (latest?.status !== 'waiting') return json({ ok: true, already: true })

    const now = Math.max(Date.now(), Number(rt.ts ?? 0) + 1)
    const id = `rtg-${weekOf}-${now.toString(36)}`
    const day = new Date(now).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
    const ev = { ...rt, id, ts: now, day, learnerId: 'gemini', v: 1, status: 'ready', source: 'gemini', agenda: { ...real, proposals: [] }, notes: notes.length }
    const w = await rest('events?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify([{ id, family_key: familyKey, learner_id: 'gemini', ts: now, type: 'round-table', body: ev }]),
    })
    if (!w.ok) return json({ error: `Couldn’t save the agenda (${w.status}).` }, 502)
    console.log(`round-table: posted ${real.points.length} points with ${model} (${tries} tries)`)
    return json({ ok: true, points: real.points.length, model })
  } catch (e) {
    return json({ error: `Couldn’t reach the family data: ${e instanceof Error ? e.message : String(e)}` }, 502)
  } finally {
    running.delete(job)
  }
})
