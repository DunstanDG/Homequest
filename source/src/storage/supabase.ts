import type { AppEvent } from '@/engine/types'
import type { SyncAdapter } from './types'

export interface SupabaseConfig {
  /** https://<project>.supabase.co */
  url: string
  /** The project's public "anon" key. Safe to ship: on its own it can read nothing (see supabase/schema.sql). */
  anonKey: string
  /** The secret from the family code. Sent as the x-family-key header; row-level security checks it. */
  familyKey: string
  fetchImpl?: typeof fetch
  /** This phone's own private key, if it has one. Sent as x-member-key so the server also returns this person's private rows. */
  memberKey?: () => string | undefined
  /** The key to store a private event with: its owner's key, if this phone has it. */
  ownerKeyFor?: (memberId: string) => string | undefined
}

interface Row {
  seq: number
  body: AppEvent
}

const PAGE = 500

/**
 * Talks to a Supabase project's REST endpoint (PostgREST) directly with fetch, so we don't ship the
 * whole supabase-js client for two endpoints. See supabase/schema.sql for the table + policies.
 *
 * The whole family shares one log: pull returns every row for the family key (whoever wrote it), and each pushed
 * event carries its own learner_id column (the person who did it) for anyone who wants to query by person.
 */
export function createSupabaseAdapter(cfg: SupabaseConfig): SyncAdapter {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const base = `${cfg.url.replace(/\/+$/, '')}/rest/v1/events`
  const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    'x-family-key': cfg.familyKey,
    ...(cfg.memberKey?.() ? { 'x-member-key': cfg.memberKey()! } : {}),
    ...extra,
  })
  const fail = async (res: Response, what: string): Promise<never> => {
    let detail = ''
    try {
      detail = (await res.text()).slice(0, 200)
    } catch {
      /* ignore */
    }
    throw new Error(`${what} failed (${res.status}) ${detail}`.trim())
  }

  return {
    id: 'supabase-family',
    async pull(cursor) {
      const after = cursor ? Number(cursor) : 0
      const qs = `select=seq,body&seq=gt.${after}&order=seq.asc&limit=${PAGE}`
      const res = await f(`${base}?${qs}`, { headers: headers() })
      if (!res.ok) return fail(res, 'Pull')
      const rows = (await res.json()) as Row[]
      const last = rows.length ? (rows[rows.length - 1] as Row).seq : after
      return { events: rows.map((r) => r.body), cursor: String(last), more: rows.length === PAGE }
    },
    async push(events) {
      if (!events.length) return
      const row = (e: AppEvent, ownerKey?: string) => ({ id: e.id, family_key: cfg.familyKey, learner_id: e.learnerId, ts: e.ts, type: e.type, body: e, ...(ownerKey ? { owner_key: ownerKey } : {}) })
      const send = async (body: unknown[]) => {
        if (!body.length) return
        const res = await f(`${base}?on_conflict=id`, {
          method: 'POST',
          headers: headers({ 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }),
          body: JSON.stringify(body),
        })
        if (!res.ok) return fail(res, 'Push')
      }
      // A private event goes up with its owner's key (a separate request: the two kinds of row have different columns, and the
      // plain ones must still work on a database that has not had the private-events update). One whose owner's key is not on
      // this phone is never sent: sending it plainly would make it public.
      await send(events.filter((e) => !e.priv).map((e) => row(e)))
      await send(events.filter((e) => e.priv && cfg.ownerKeyFor?.(e.priv)).map((e) => row(e, cfg.ownerKeyFor!(e.priv!))))
    },
  }
}

/**
 * Has the project had supabase/schema_v3.sql run (does the events table have an owner_key column)? A plain GET of that column
 * answers yes, and a "no such column" error answers no. Anything else (offline, wrong key) is "don't know", reported as undefined.
 */
export async function probePrivateReady(cfg: Pick<SupabaseConfig, 'url' | 'anonKey' | 'familyKey' | 'fetchImpl'>): Promise<boolean | undefined> {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  try {
    const res = await f(`${cfg.url.replace(/\/+$/, '')}/rest/v1/events?select=owner_key&limit=1`, { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'x-family-key': cfg.familyKey } })
    if (res.ok) return true
    const text = (await res.text()).toLowerCase()
    return res.status === 400 && (text.includes('owner_key') || text.includes('42703')) ? false : undefined
  } catch {
    return undefined
  }
}
