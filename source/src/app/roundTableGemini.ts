/**
 * "Ask Gemini now" on the Round table screen: asks the family's `round-table` Edge Function to write this week's
 * agenda. Normally the database does this by itself the moment the home server posts the week's facts
 * (supabase/schema_v6.sql); this is the manual way, and the fallback when that isn't set up.
 */
import { ENV_SUPABASE_PUBLISHABLE_KEY } from './config'
import type { SyncManager } from './syncManager'

export type AskOutcome = { ok: true; already?: boolean } | { ok: false; error: string; setup?: boolean; retry?: boolean }

export async function askGeminiForRoundTable(sync: SyncManager, weekOf: string, opts: { fetchImpl?: typeof fetch; publishableKey?: string } = {}): Promise<AskOutcome> {
  const f = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anon = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anon) return { ok: false, setup: true, error: 'Turn on sharing first: Gemini works from the family’s server.' }
  const publishable = opts.publishableKey !== undefined ? opts.publishableKey : ENV_SUPABASE_PUBLISHABLE_KEY
  try {
    const res = await f(`${url.replace(/\/+$/, '')}/functions/v1/round-table`, {
      method: 'POST',
      headers: publishable ? { apikey: publishable, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' } : { apikey: anon, Authorization: `Bearer ${anon}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekOf }),
    })
    if (res.status === 404 && !(res.headers.get('content-type') ?? '').includes('json')) return { ok: false, setup: true, error: 'The family’s round-table function isn’t deployed yet.' }
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; already?: boolean; skipped?: string; error?: string; busy?: boolean }
    if (res.ok && body.ok) {
      void sync.syncNow()
      return { ok: true, already: body.already }
    }
    if (body.skipped) return { ok: false, error: body.skipped }
    return { ok: false, error: body.error ?? `The round-table function said no (${res.status}).`, setup: res.status === 500 || res.status === 403, retry: !!body.busy || res.status === 429 || res.status >= 502 }
  } catch {
    return { ok: false, setup: true, error: 'Couldn’t reach the family’s round-table function. Either it isn’t deployed yet, or this phone is offline.' }
  }
}
