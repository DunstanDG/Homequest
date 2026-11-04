/**
 * Keeps each active co-parent link's busy-block snapshot in step: republishes our own computed blocks for that
 * child whenever local state changes (debounced), and polls to pull the co-parent's published blocks. Pulled
 * snapshots are foreign, derived data — never appended to our event log — so they live in local KV storage,
 * one entry per link, and are read back through `snapshotFor`.
 *
 * Modelled on SyncManager (src/app/syncManager.ts), but this is a second, independent, much lighter mechanism:
 * it never touches the `events` table or the family event log, only the small `shared_busy` snapshot table
 * (see supabase/schema.sql and storage/coparentSync.ts).
 */
import type { Repo } from '@/storage/repo'
import { pullBusyBlocks, pushBusyBlocks } from '@/storage/coparentSync'
import type { BusyBlock } from '@/family/coparent'
import { busyBlocksFor } from '@/family/coparent'
import { makeCalCtx } from '@/family/calendar'
import { addDays, ymdOf } from '@/family/dates'

const REMOTE_KEY = (linkId: string) => `coparent.remote.${linkId}`
export const COPARENT_POLL_MS = 60_000
/** How far ahead (and behind, for context) we publish/pull. */
const WINDOW_DAYS_BACK = 3
const WINDOW_DAYS_FWD = 60

export interface CoparentRemoteSnapshot {
  blocks: BusyBlock[]
  updatedAt: string
  fetchedAt: number
}

export class CoparentSyncManager {
  private listeners = new Set<() => void>()
  private version = 0
  private timer?: ReturnType<typeof setTimeout>
  private snapshots = new Map<string, CoparentRemoteSnapshot>()
  private running = false

  constructor(private readonly repo: Repo) {}

  /** What we currently know about the co-parent's side of a link (undefined until first successful pull). */
  remoteFor = (linkId: string): CoparentRemoteSnapshot | undefined => this.snapshots.get(linkId)

  async load(): Promise<void> {
    for (const link of Object.values(this.repo.family().coparentLinks)) {
      if (link.deleted) continue
      const saved = await this.repo.storage.kv.get<CoparentRemoteSnapshot>(REMOTE_KEY(link.linkId))
      if (saved) this.snapshots.set(link.linkId, saved)
    }
    this.emit()
  }

  /** Push our snapshot for every active, fully-paired link, then pull theirs. Safe to call any time. */
  async syncNow(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      const f = this.repo.family()
      const ctx = makeCalCtx(f)
      const today = ymdOf(Date.now())
      const from = addDays(today, -WINDOW_DAYS_BACK)
      const to = addDays(today, WINDOW_DAYS_FWD)
      for (const link of Object.values(f.coparentLinks)) {
        if (link.deleted || !f.members[link.childId]) continue
        if (!link.sharedUrl || !link.sharedAnonKey) continue // not yet configured with a shared project
        const cfg = { url: link.sharedUrl, anonKey: link.sharedAnonKey, linkKey: link.linkKey, householdSlot: link.householdSlot }
        const blocks = busyBlocksFor(ctx, link.childId, from, to)
        try {
          await pushBusyBlocks(cfg, blocks)
        } catch {
          // Best-effort: publishing failure for one link never blocks the rest, and is retried next poll.
        }
        try {
          const pulled = await pullBusyBlocks(cfg)
          if (pulled) {
            const snap: CoparentRemoteSnapshot = { blocks: pulled.blocks, updatedAt: pulled.updatedAt, fetchedAt: Date.now() }
            this.snapshots.set(link.linkId, snap)
            await this.repo.storage.kv.set(REMOTE_KEY(link.linkId), snap)
          }
        } catch {
          // The other household may be offline or not yet published; try again next poll.
        }
      }
    } finally {
      this.running = false
      this.emit()
    }
  }

  /** Republish a moment after the last change, so a burst of edits goes out as one batch. */
  syncSoon(ms = 3000): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.syncNow(), ms)
  }

  /** Wire up automatic syncing. Returns a cleanup function. */
  start(): () => void {
    const unsub = this.repo.subscribe(() => this.syncSoon())
    const interval = setInterval(() => document.visibilityState === 'visible' && void this.syncNow(), COPARENT_POLL_MS)
    void this.syncNow()
    return () => {
      unsub()
      clearInterval(interval)
      clearTimeout(this.timer)
    }
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  snapshot = (): number => this.version
  private emit() {
    this.version++
    for (const l of this.listeners) l()
  }
}
