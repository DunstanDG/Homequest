import type { AppEvent } from '@/engine/types'
import type { EventStore, KV, SyncAdapter, SyncReport } from './types'

const CURSOR_KEY = (adapterId: string) => `sync.cursor.${adapterId}`
export const PENDING_KEY = 'sync.pending'

/**
 * Two-way copy of the event log. Safe to call any time, any number of times:
 *  1. pull everything the remote has after our cursor and add what we don't have
 *  2. push events we created (or imported) that the remote hasn't confirmed yet
 * Because events are immutable and de-duplicated by id, there is nothing to conflict.
 */
export async function syncOnce(deps: { events: EventStore; kv: KV; adapter: SyncAdapter; now?: () => number }): Promise<{ report: SyncReport; newEvents: AppEvent[] }> {
  const now = deps.now ?? Date.now
  const { events, kv, adapter } = deps
  let pulled = 0
  let pushed = 0
  const fresh: AppEvent[] = []
  try {
    // ---- pull
    const known = new Set((await events.loadAll()).map((e) => e.id))
    let cursor = await kv.get<string>(CURSOR_KEY(adapter.id))
    for (let page = 0; page < 200; page++) {
      const res = await adapter.pull(cursor)
      const toAdd = res.events.filter((e) => !known.has(e.id))
      if (toAdd.length) {
        await events.append(toAdd)
        for (const e of toAdd) known.add(e.id)
        fresh.push(...toAdd)
        pulled += toAdd.length
      }
      cursor = res.cursor ?? cursor
      if (cursor !== undefined) await kv.set(CURSOR_KEY(adapter.id), cursor)
      if (!res.more) break
    }

    // ---- push
    const pending = (await kv.get<string[]>(PENDING_KEY)) ?? []
    if (pending.length) {
      const all = await events.loadAll()
      const byId = new Map(all.map((e) => [e.id, e]))
      const toSend = pending.map((id) => byId.get(id)).filter((e): e is AppEvent => !!e)
      for (let i = 0; i < toSend.length; i += 200) await adapter.push(toSend.slice(i, i + 200))
      pushed = toSend.length
      await kv.set(PENDING_KEY, [])
    }
    return { report: { ok: true, pulled, pushed, at: now() }, newEvents: fresh }
  } catch (e) {
    return { report: { ok: false, pulled, pushed, error: e instanceof Error ? e.message : String(e), at: now() }, newEvents: fresh }
  }
}

/** In-memory remote for tests and demos. */
export function createFakeRemote(id = 'fake'): SyncAdapter & { rows: AppEvent[]; failNext(): void } {
  const rows: AppEvent[] = []
  let fail = false
  return {
    id,
    rows,
    failNext: () => {
      fail = true
    },
    async pull(cursor) {
      if (fail) {
        fail = false
        throw new Error('offline')
      }
      const from = cursor ? Number(cursor) : 0
      const page = rows.slice(from, from + 50)
      return { events: page, cursor: String(from + page.length), more: from + page.length < rows.length }
    },
    async push(events) {
      if (fail) {
        fail = false
        throw new Error('offline')
      }
      for (const e of events) if (!rows.some((r) => r.id === e.id)) rows.push(e)
    },
  }
}
