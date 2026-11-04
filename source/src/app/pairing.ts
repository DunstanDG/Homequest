import type { Repo } from '@/storage/repo'
import { familyCodeFor, newFamilyCode, parseFamilyCode } from '@/storage/pairing'
import { familyStatus, inviteErrorText, normaliseInvite, redeemInvite } from '@/storage/invites'
import type { SyncManager } from './syncManager'

/** Cursor key used by the Supabase adapter (see storage/sync.ts): 'sync.cursor.<adapter id>'. */
const CURSOR_KEY = 'sync.cursor.supabase-family'

export type EnableResult = { ok: true; code: string } | { ok: false; needInvite?: boolean; error: string }

/**
 * Turn on sharing from the first device: creates a family code and saves the connection details.
 * Everything already on this device is queued to go up to the family space.
 *
 * Every family shares one project, and a new family needs an invite (supabase/schema_v5.sql, storage/invites.ts):
 * with `invite`, it is used for the new family key first; without one, the project is asked whether the key is already
 * approved (it never is for a fresh key, unless the project has no invite system yet, in which case this works as before).
 * Nothing is saved unless the family can actually sync.
 */
export async function enableSharing(
  repo: Repo,
  sync: SyncManager,
  opts: { url?: string; anonKey?: string; invite?: string; fetchImpl?: typeof fetch },
): Promise<EnableResult> {
  const code = newFamilyCode()
  const parsed = parseFamilyCode(code)
  if (!parsed) return { ok: false, error: 'Could not create a family code.' }
  const url = opts.url?.trim() || sync.effectiveUrl()
  const anonKey = opts.anonKey?.trim() || sync.effectiveAnonKey()
  if (!url || !anonKey) return { ok: false, error: 'The project URL or key is missing.' }
  const cfg = { url, anonKey, familyKey: parsed.familyKey, fetchImpl: opts.fetchImpl }
  if (opts.invite?.trim()) {
    const invite = normaliseInvite(opts.invite)
    if (!invite) return { ok: false, error: inviteErrorText('invalid') }
    const r = await redeemInvite(cfg, invite)
    if (!r.ok) return { ok: false, error: inviteErrorText(r.error) }
  } else {
    const st = await familyStatus(cfg)
    if (!st.ok) return { ok: false, error: inviteErrorText(st.error) }
    if (!st.notSetUp && !st.approved) return { ok: false, needInvite: true, error: 'You need an invite code to turn on sharing. Ask a family that already uses HomeQuest to make one (Parent area › Data › Invite another family).' }
  }
  await sync.setConfig({ familyKey: parsed.familyKey, url: opts.url?.trim() || undefined, anonKey: opts.anonKey?.trim() || undefined })
  // A new key means a new conversation with the server: pull from the start and send everything we have.
  await repo.storage.kv.del(CURSOR_KEY)
  await repo.requeueAll()
  return { ok: true, code }
}

export function currentFamilyCode(sync: SyncManager): string | undefined {
  const cfg = sync.config()
  return cfg ? familyCodeFor(cfg.familyKey) : undefined
}

/**
 * Join an existing family from another device: save the connection details and reload so the app starts by pulling
 * everything the family has already logged. Accepts new (hq1.) and old StudyQuest (sq1.) codes.
 */
export async function joinFamily(repo: Repo, code: string, opts: { url?: string; anonKey?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseFamilyCode(code)
  if (!parsed) return { ok: false, error: 'That does not look like a family code. It starts with "hq1." (or "sq1." from StudyQuest).' }
  await repo.storage.kv.del(CURSOR_KEY)
  await repo.storage.kv.set('sync.config', { familyKey: parsed.familyKey, url: opts.url?.trim() || undefined, anonKey: opts.anonKey?.trim() || undefined })
  return { ok: true }
}

/** Wipe everything stored on this device. */
export async function eraseDevice(repo: Repo): Promise<void> {
  await repo.storage.events.clear()
  for (const k of ['learnerId', 'me', 'sync.config', 'sync.pending', 'settings', CURSOR_KEY]) await repo.storage.kv.del(k)
}
