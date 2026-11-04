// Supabase Edge Function (Deno). Deploy with: supabase functions deploy breakdown
//
// Breaks a project goal (or one activity in it) down into smaller activities using Gemini's structured output,
// for the Projects part of the Plan tab. The app calls it with the family's code in the x-family-key header, the
// same secret that row-level security uses for everything else; the Gemini key never leaves Supabase.
//
// Required secrets (`supabase secrets set NAME=value`; never committed, never sent to the app):
//   GEMINI_API_KEY      - a key from Google AI Studio (https://aistudio.google.com/apikey)
//   ALLOWED_FAMILY_KEYS - the family key(s) allowed to use it, comma-separated: your family code without the
//                         leading "hq1." (Parent > Data shows the code). Anyone can create rows in the events table
//                         with the public anon key, so "this family exists" is not proof of anything; this list is.
//                         Without it the function refuses every request, so your Gemini key can't be spent by others.
// Optional:
//   GEMINI_MODEL        - defaults to the model in _shared/breakdown.ts (a current Flash model)
//   GEMINI_FALLBACK_MODEL - tried when the main model stays busy (503) or is out of quota (429); defaults to a
//                         smaller stable model (FALLBACK_MODEL). Set it to "none" to turn the fallback off.
//
// The prompt, schema and the checks on the answer live in ../_shared/breakdown.ts, shared with the app.
import { askGemini, cleanBreakdown, cleanInput, DEFAULT_MODEL, FALLBACK_MODEL, geminiErrorText, geminiRequestBody, geminiText, geminiUrl } from '../_shared/breakdown.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
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

/** A gentle per-family limit (per function instance): 30 breakdowns in 10 minutes is plenty for a person tapping,
 * and caps what a leaked family code could cost. */
const recent = new Map<string, number[]>()
function allow(key: string): boolean {
  const now = Date.now()
  const xs = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000)
  if (xs.length >= 30) return false
  xs.push(now)
  recent.set(key, xs)
  return true
}

async function callGemini(model: string, body: unknown): Promise<Response> {
  return await fetch(geminiUrl(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!GEMINI_API_KEY) return json({ error: 'The breakdown function has no GEMINI_API_KEY secret yet.' }, 500)

  if (!ALLOWED.size) return json({ error: 'The breakdown function has no ALLOWED_FAMILY_KEYS secret yet.' }, 500)
  const familyKey = req.headers.get('x-family-key') ?? ''
  if (!ALLOWED.has(familyKey)) return json({ error: 'This family isn’t allowed to use the breakdown function. Add its key to ALLOWED_FAMILY_KEYS.' }, 403)
  if (!allow(familyKey)) return json({ error: 'That is a lot of breakdowns in a short time. Try again in a few minutes.' }, 429)

  let input
  try {
    input = cleanInput((await req.json())?.input)
  } catch {
    input = undefined
  }
  if (!input) return json({ error: 'Nothing to break down.' }, 400)
  const asked = input

  // Retries Gemini's "busy" answers and falls back to a second model; see askGemini in _shared/breakdown.ts.
  const { res, model, tries } = await askGemini((m, withSchema) => callGemini(m, geminiRequestBody(asked, withSchema)), MODELS)
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    console.warn(`breakdown: ${model} answered ${res.status} after ${tries} tries: ${detail}`)
    return json({ error: geminiErrorText(res.status), status: res.status, busy: res.status >= 500 || res.status === 429, detail }, 502)
  }
  const result = cleanBreakdown(geminiText(await res.json()))
  if (!result) return json({ error: 'Gemini’s answer could not be read. Try again, or reword the goal.' }, 502)
  return json({ result, model, tries })
})
