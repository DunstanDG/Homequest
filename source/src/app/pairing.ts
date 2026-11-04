import type { Repo } from '@/storage/repo'
import { familyCodeFor, newFamilyCode, parseFamilyCode } from '@/storage/pairing'
import type { SyncManager } from './syncManager'

/** Cursor key used by the Supabase adapter (see storage/sync.ts): 'sync.cursor.<adapter id>'. */
const CURSOR_KEY = 'sync.cursor.supabase-family'

/**
 * Turn on sharing from the first device: creates a family code and saves the connection details.
 * Everything already on this device is queued to go up to the family space.
 */
export async function enableSharing(repo: Repo, sync: SyncManager, opts: { url?: string; anonKey?: string }): Promise<string> {
  const code = newFamilyCode()
  const parsed = parseFamilyCode(code)
  if (!parsed) throw new Error('Could not create a family code.')
  await sync.setConfig({ familyKey: parsed.familyKey, url: opts.url?.trim() || undefined, anonKey: opts.anonKey?.trim() || undefined })
  // A new key means a new conversation with the server: pull from the start and send everything we have.
  await repo.storage.kv.del(CURSOR_KEY)
  await repo.requeueAll()
  return code
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
