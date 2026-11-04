import { describe, expect, it } from 'vitest'
import type { Repo } from '@/storage/repo'
import type { SyncReport } from '@/storage/types'
import { SyncManager } from './syncManager'

/** A repo whose sync() we control, to check how SyncManager sequences overlapping sync requests. */
function stubRepo() {
  const kv = new Map<string, unknown>()
  const calls: { resolve: (r: SyncReport) => void }[] = []
  const repo = {
    storage: { kv: { get: async (k: string) => kv.get(k), set: async (k: string, v: unknown) => void kv.set(k, v), del: async (k: string) => void kv.delete(k) } },
    sync: () => new Promise<SyncReport>((resolve) => calls.push({ resolve })),
    subscribe: () => () => {},
    pendingCount: () => 0,
  }
  return { repo: repo as unknown as Repo, calls }
}

const ok = (pushed = 0): SyncReport => ({ ok: true, pulled: 0, pushed, at: Date.now() })
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('SyncManager', () => {
  it('a sync asked for while one is already running (e.g. a poke from another phone) runs once more afterwards', async () => {
    const { repo, calls } = stubRepo()
    const sm = new SyncManager(repo)
    await sm.setConfig({ familyKey: 'family-key-abcdef-123456', url: 'https://abc.supabase.co', anonKey: 'anon-key-xxxxxxxxxxxxxxxxxxxx' })
    void sm.syncNow()
    expect(calls).toHaveLength(1)
    // Two more requests land mid-flight - the running fetch may have missed what prompted them.
    void sm.syncNow()
    void sm.syncNow()
    expect(calls).toHaveLength(1)
    calls[0]!.resolve(ok())
    await flush()
    expect(calls).toHaveLength(2) // exactly one follow-up, not one per request
    calls[1]!.resolve(ok())
    await flush()
    expect(calls).toHaveLength(2)
  })

  it('without overlap, does not sync again on its own', async () => {
    const { repo, calls } = stubRepo()
    const sm = new SyncManager(repo)
    await sm.setConfig({ familyKey: 'family-key-abcdef-123456', url: 'https://abc.supabase.co', anonKey: 'anon-key-xxxxxxxxxxxxxxxxxxxx' })
    void sm.syncNow()
    calls[0]!.resolve(ok(3))
    await flush()
    expect(calls).toHaveLength(1)
    expect(sm.status).toBe('idle')
  })
})
