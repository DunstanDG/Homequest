// Supabase Edge Function (Deno). Deploy with: supabase functions deploy log-care --no-verify-jwt
//
// Voice logging for feeds and nappies. A Google Home routine (through Home Assistant, see docs/VOICE_LOGGING.md)
// calls this with one fixed command per phrase: "left feed", "wet nappy", "stop the feed" and so on. The function
// works out what the app would have written and inserts exactly that into the family's events table.
//
// It can ONLY log a feed or a nappy, start or stop a breast-feed timer, for the one baby in the family. It cannot
// read the family's data back to the caller, edit or delete anything, or touch any other kind of entry. Its own
// token is a separate secret from the family code, so a leak of one speaker setup never opens the family.
//
// Required secrets (`supabase secrets set NAME=value`; never committed, never sent to the app):
//   HOME_LOG_TOKEN   - a long random string (at least 24 characters). Home Assistant sends it in x-care-token.
//   HOME_FAMILY_KEY  - the family code without the leading "hq1." (Parent > Data shows the code): which family to log into.
//   SERVICE_ROLE_KEY - the project's service_role key (used to insert past row-level security). Same secret the
//                      send-notifications function uses. (SUPABASE_URL is provided by the platform.)
//
// Defaults for "bottle" (amount, milk type) and the family's time zone come from Parent > Data > Voice logging in
// the app; if never set, 120 ml formula and Europe/London.
//
// The logic (what each command writes, the two-minute duplicate guard) lives in ../_shared/careCommand.ts so the
// app's tests run the very same code.
import { CARE_COMMANDS, cleanVoiceSettings, DEFAULT_VOICE, DUPLICATE_WINDOW_MS, isCareCommand, planCare, type RunEv } from '../_shared/careCommand.ts'

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '')
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
const TOKEN = Deno.env.get('HOME_LOG_TOKEN') ?? ''
const FAMILY_KEY = (Deno.env.get('HOME_FAMILY_KEY') ?? '').trim().replace(/^hq1\./, '')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-care-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', ...init.headers } })

const enc = encodeURIComponent
const fam = `family_key=eq.${enc(FAMILY_KEY)}`
const rows = async (query: string): Promise<{ body: Record<string, any>; ts: number; id: string }[]> => {
  const r = await rest(`events?${fam}&${query}`)
  if (!r.ok) throw new Error(`read ${r.status}`)
  return r.json()
}

/** Constant-time comparison, so the token can't be guessed a character at a time. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

/** A gentle limit per function instance: a person talking to a speaker never needs more than this. */
const hits: number[] = []
const limited = (now: number): boolean => {
  while (hits.length && now - hits[0]! > 10 * 60_000) hits.shift()
  if (hits.length >= 60) return true
  hits.push(now)
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (!TOKEN || TOKEN.length < 24 || FAMILY_KEY.length < 16 || !SERVICE_ROLE_KEY || !SUPABASE_URL) return json({ ok: false, say: 'Voice logging is not set up yet.', error: 'not_configured' }, 503)
  const given = req.headers.get('x-care-token') ?? ''
  if (!same(given, TOKEN)) return json({ ok: false, error: 'unauthorised' }, 401)
  const now = Date.now()
  if (limited(now)) return json({ ok: false, say: 'Too many requests.', error: 'rate_limited' }, 429)

  let input: { command?: unknown; kind?: unknown; babyId?: unknown } = {}
  try {
    input = req.method === 'POST' ? await req.json() : Object.fromEntries(new URL(req.url).searchParams)
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400)
  }
  if (!isCareCommand(input.command)) return json({ ok: false, say: 'I did not understand that.', error: 'bad_command', commands: CARE_COMMANDS }, 400)
  const kind = input.kind ?? 'baby'
  if (kind !== 'baby') return json({ ok: false, say: 'Only the baby for now.', error: 'bad_kind' }, 400)

  try {
    // The one baby: the active member with the baby role (latest version of each member wins).
    const members = new Map<string, Record<string, any>>()
    for (const r of await rows('type=eq.member&order=seq.asc&limit=1000')) members.set(r.body.memberId, r.body)
    const babies = [...members.values()].filter((m) => m.role === 'baby' && m.active !== false)
    const wanted = typeof input.babyId === 'string' ? input.babyId : undefined
    const baby = wanted ? babies.find((b) => b.memberId === wanted) : babies.length === 1 ? babies[0] : undefined
    if (!baby) return json({ ok: false, say: babies.length ? 'There is more than one baby set up.' : 'There is no baby set up.', error: babies.length ? 'many_babies' : 'no_baby' }, 409)

    const babyId: string = baby.memberId
    const voidedRows = await rows('type=eq.void&order=seq.desc&limit=400')
    const voided = new Set<string>(voidedRows.map((r) => r.body.targetId))
    const runEvents = (await rows(`type=eq.feedrun&body->>babyId=eq.${enc(babyId)}&order=seq.desc&limit=300`)).map((r) => ({ ...r.body, id: r.body.id ?? r.id, ts: r.body.ts ?? r.ts }) as RunEv)
    const recent = await rows(`type=in.(baby,feedrun)&ts=gte.${now - DUPLICATE_WINDOW_MS}&body->>voice=not.is.null&order=seq.desc&limit=20`)
    const recentVoice = recent.filter((r) => !voided.has(r.id)).map((r) => ({ voice: String(r.body.voice), ts: Number(r.body.ts ?? r.ts) }))
    const cfg = (await rows('type=eq.voice-config&order=seq.desc&limit=1'))[0]?.body
    const settings = cleanVoiceSettings(cfg ?? DEFAULT_VOICE)

    const plan = planCare(input.command, { babyId, runEvents, voided, recentVoice }, settings, now)
    if (plan.events.length) {
      const body = plan.events.map((e) => ({ id: e.id, family_key: FAMILY_KEY, learner_id: e.learnerId, ts: e.ts, type: e.type, body: e }))
      const r = await rest('events?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(body) })
      if (!r.ok) return json({ ok: false, say: 'I could not save that.', error: `insert_${r.status}` }, 502)
    }
    return json({ ok: !plan.refused, say: plan.say, logged: plan.events.length, duplicate: plan.duplicate ?? false })
  } catch (e) {
    return json({ ok: false, say: 'I could not reach the family data.', error: String(e instanceof Error ? e.message : e) }, 502)
  }
})
