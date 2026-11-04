/**
 * Asking Gemini to break a goal (or one activity) down. Three ways in, tried in this order:
 *
 *  1. The demo build: a made-up sample, no network, so the preview works anywhere.
 *  2. A Gemini key saved on THIS phone (Plan > Projects > AI settings): calls Gemini directly. Handy for trying it out;
 *     the key stays in this browser's storage and is never synced or written to the family's log.
 *  3. The family's `breakdown` Edge Function (supabase/functions/breakdown), which holds the key as a Supabase
 *     secret. The normal set-up, and the only one that works for everyone (children included) without a key on
 *     every phone. Needs sharing turned on, like push notifications.
 *
 * Whatever comes back goes through the same checks (cleanBreakdown) before anything is saved.
 */
import { askGemini, cleanBreakdown, DEFAULT_MODEL, FALLBACK_MODEL, geminiErrorText, isBusy, geminiRequestBody, geminiText, geminiUrl, type BreakdownInput, type BreakdownResult } from '../../supabase/functions/_shared/breakdown'
import type { SyncManager } from './syncManager'
import { ENV_SUPABASE_PUBLISHABLE_KEY } from './config'

export type { BreakdownInput, BreakdownResult }

export type BreakdownOutcome = { ok: true; result: BreakdownResult; via: 'function' | 'device' | 'sample' } | { ok: false; error: string; setup?: boolean; /** Worth trying again in a moment (Gemini busy, a timeout). */ retry?: boolean }

const KEY = 'hq.gemini.key'
const MODEL = 'hq.gemini.model'

const read = (k: string): string => {
  try {
    return localStorage.getItem(k) ?? ''
  } catch {
    return ''
  }
}
const write = (k: string, v: string) => {
  try {
    if (v) localStorage.setItem(k, v)
    else localStorage.removeItem(k)
  } catch {
    /* private mode: nothing to keep */
  }
}

export const deviceKey = (): string => read(KEY)
export const deviceModel = (): string => read(MODEL) || DEFAULT_MODEL
export const setDeviceKey = (k: string) => write(KEY, k.trim())
export const setDeviceModel = (m: string) => write(MODEL, m.trim() === DEFAULT_MODEL ? '' : m.trim())

/** Is there any way to reach Gemini from this phone? (For showing set-up help instead of a button that can't work.) */
export function breakdownAvailable(sync: SyncManager, demo: boolean): boolean {
  if (demo || deviceKey()) return true
  return !!(sync.config()?.familyKey && sync.effectiveUrl() && sync.effectiveAnonKey())
}

async function withTimeout(p: (signal: AbortSignal) => Promise<Response>, ms: number): Promise<Response> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    return await p(ctl.signal)
  } finally {
    clearTimeout(t)
  }
}

const reason = (e: unknown): string => (e instanceof DOMException && e.name === 'AbortError' ? 'It took too long to answer. Try again in a moment.' : 'Couldn’t reach it. Are you online?')

export async function requestBreakdown(sync: SyncManager, demo: boolean, input: BreakdownInput, opts: { fetchImpl?: typeof fetch; timeoutMs?: number; publishableKey?: string; sleep?: (ms: number) => Promise<void> } = {}): Promise<BreakdownOutcome> {
  const f = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  // Per request. The family's function may retry Gemini a few times (and try a second model) before it answers.
  const ms = opts.timeoutMs ?? 90_000
  if (demo) {
    await new Promise((r) => setTimeout(r, 600))
    return { ok: true, result: sampleBreakdown(input), via: 'sample' }
  }

  const key = deviceKey()
  if (key) {
    try {
      const call = (model: string, schema: boolean) => withTimeout((signal) => f(geminiUrl(model), { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(geminiRequestBody(input, schema)) }), ms)
      // Same retries and fallback model as the family's function: Gemini's 503 "overloaded" usually clears in seconds.
      const { res } = await askGemini(call, [...new Set([deviceModel(), FALLBACK_MODEL])], opts.sleep)
      if (!res.ok) {
        const error = res.status === 401 || res.status === 403 ? 'Gemini didn’t accept the key saved on this phone.' : res.status === 404 ? `Gemini doesn’t know the model “${deviceModel()}”.` : geminiErrorText(res.status)
        return { ok: false, error, retry: isBusy(res.status) || res.status === 429 }
      }
      const result = cleanBreakdown(geminiText(await res.json()))
      return result ? { ok: true, result, via: 'device' } : { ok: false, error: 'Gemini’s answer couldn’t be read. Try again, or reword it.' }
    } catch (e) {
      return { ok: false, error: reason(e), retry: true }
    }
  }

  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anon = sync.effectiveAnonKey()
  const publishable = opts.publishableKey !== undefined ? opts.publishableKey : ENV_SUPABASE_PUBLISHABLE_KEY
  if (!cfg?.familyKey || !url || !anon) return { ok: false, setup: true, error: 'AI breakdowns aren’t set up on this phone yet.' }
  try {
    const res = await withTimeout(
      (signal) =>
        f(`${url.replace(/\/+$/, '')}/functions/v1/breakdown`, {
          method: 'POST',
          signal,
          // With a publishable key, send only that: a legacy JWT alongside it would be checked and rejected.
          headers: publishable ? { apikey: publishable, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' } : { apikey: anon, Authorization: `Bearer ${anon}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        }),
      ms,
    )
    if (res.status === 404) return { ok: false, setup: true, error: 'The family’s breakdown function isn’t deployed yet.' }
    const body = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string; message?: string; busy?: boolean; status?: number }
    // 401 comes from Supabase's gateway, before the function runs: it didn't accept the key the app sent.
    if (res.status === 401) return { ok: false, setup: true, error: `Supabase turned the request away before it reached the function (401${body.message ? `: ${body.message.replace(/^\[[^\]]*\]\s*/, '')}` : ''}). ${publishable ? 'Check the publishable key this app was built with.' : 'This app needs to be built with the project’s publishable key (sb_publishable_…, Settings > API Keys).'}` }
    if (!res.ok) return { ok: false, error: body.error ?? `The breakdown function said no (${res.status}).`, setup: res.status === 500, retry: !!body.busy || res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504 }
    const result = cleanBreakdown(body.result)
    return result ? { ok: true, result, via: 'function' } : { ok: false, error: 'The answer couldn’t be read. Try again.' }
  } catch (e) {
    // A function that isn't deployed answers 404 without the CORS headers the browser needs, so it shows up here
    // as a failed request, the same as being offline.
    if (e instanceof DOMException && e.name === 'AbortError') return { ok: false, error: reason(e), retry: true }
    return { ok: false, setup: true, error: 'Couldn’t reach the family’s breakdown function. Either it isn’t deployed to Supabase yet, or this phone is offline.' }
  }
}

/** The demo's stand-in for Gemini: a plausible, generic breakdown of whatever it is given, sized to fit. */
export function sampleBreakdown(input: BreakdownInput): BreakdownResult {
  const what = (input.path?.[input.path.length - 1] ?? input.goal).replace(/\s+/g, ' ').trim().replace(/[.!]+$/, '')
  const short = what.length > 40 ? `${what.slice(0, 38).trim()}…` : what
  const grain = input.grain ?? 20
  const deep = (input.path?.length ?? 0) > 0
  const raw: [string, string, number][] = deep
    ? [
        [`Get set up for “${short}”`, 'Get out what you need and clear a space to work.', 0.5],
        [`Do the first half of “${short}”`, 'Work through the first part; stop at a natural break.', 1],
        [`Finish “${short}”`, 'Complete the rest.', 1],
        ['Check it and tidy up', 'Look it over against what “done” means, then put things away.', 0.5],
      ]
    : [
        ['Decide what “finished” looks like', `Write two or three lines on what will be true when “${short}” is done.`, 0.5],
        ['List what you need', 'Make a list of the things, information and help you need.', 0.75],
        ['Get anything that’s missing', 'Buy, borrow or find the things on the list.', 1.5],
        ['Make a start', `Do the first real piece of work towards “${short}”.`, 1.5],
        ['Keep going with the main part', 'Carry on from where the last step stopped.', 1.5],
        ['Check it over and finish off', 'Go back to what “finished” looks like and close any gaps.', 0.75],
      ]
  let mins = raw.map(([, , w]) => Math.max(5, Math.round((w * grain) / 5) * 5))
  if (input.minutes) {
    const total = mins.reduce((s, m) => s + m, 0)
    mins = mins.map((m) => Math.max(5, Math.round((m * input.minutes!) / total / 5) * 5))
  }
  const tasks = raw.map(([title, description], i) => ({ task_id: `t${i + 1}`, title, description, estimated_minutes: mins[i]!, dependencies: i === 0 ? [] : [`t${i}`] }))
  // A real breakdown has some things that can happen in any order: let the list-making start straight away.
  if (!deep && tasks[1]) tasks[1].dependencies = []
  return { project_title: short, total_estimated_minutes: mins.reduce((s, m) => s + m, 0), tasks }
}
