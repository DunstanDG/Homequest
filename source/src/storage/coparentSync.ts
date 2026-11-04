/**
 * Transport for one co-parent link's busy-block snapshot. Both households' rows for a link live in the SAME
 * Supabase project (see supabase/schema.sql `shared_busy`, primary key `(link_key, household_slot)`):
 *   - `push` publishes OUR computed blocks to OUR OWN slot's row
 *   - `pull` reads the OTHER household's blocks from THEIR slot's row
 * Plain fetch to PostgREST, no SDK — same style as storage/supabase.ts.
 */
import type { BusyBlock } from '@/family/coparent'
import { otherSlot } from '@/family/coparent'
import type { HouseholdSlot } from '@/family/types'

export interface CoparentProject {
  /** https://<project>.supabase.co — the ONE project this link's rows live in. */
  url: string
  anonKey: string
  /** The `link_key` shared by both rows for this link. */
  linkKey: string
  /** Which row is ours. */
  householdSlot: HouseholdSlot
  fetchImpl?: typeof fetch
}

const headers = (cfg: CoparentProject, extra: Record<string, string> = {}): Record<string, string> => ({
  apikey: cfg.anonKey,
  Authorization: `Bearer ${cfg.anonKey}`,
  'x-link-key': cfg.linkKey,
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

/** Publish our blocks, upserting our own slot's row for this link. */
export async function pushBusyBlocks(cfg: CoparentProject, blocks: BusyBlock[]): Promise<void> {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const base = `${cfg.url.replace(/\/+$/, '')}/rest/v1/shared_busy`
  const res = await f(`${base}?on_conflict=link_key,household_slot`, {
    method: 'POST',
    headers: headers(cfg, { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify([{ link_key: cfg.linkKey, household_slot: cfg.householdSlot, blocks, updated_at: new Date().toISOString() }]),
  })
  if (!res.ok) return fail(res, 'Publish')
}

/** Pull the co-parent's blocks from the OTHER slot's row in the same project. Returns undefined if they have
 * not published yet (no row), which is not an error. */
export async function pullBusyBlocks(cfg: CoparentProject): Promise<{ blocks: BusyBlock[]; updatedAt: string } | undefined> {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const base = `${cfg.url.replace(/\/+$/, '')}/rest/v1/shared_busy`
  const qs = `select=blocks,updated_at&link_key=eq.${encodeURIComponent(cfg.linkKey)}&household_slot=eq.${otherSlot(cfg.householdSlot)}&limit=1`
  const res = await f(`${base}?${qs}`, { headers: headers(cfg) })
  if (!res.ok) return fail(res, 'Pull')
  const rows = (await res.json()) as { blocks: BusyBlock[]; updated_at: string }[]
  const row = rows[0]
  return row ? { blocks: row.blocks, updatedAt: row.updated_at } : undefined
}
