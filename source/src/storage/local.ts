import { createStore, clear as idbClear, del as idbDel, get as idbGet, set as idbSet, setMany, values } from 'idb-keyval'
import type { AppEvent } from '@/engine/types'
import type { EventStore, KV, Storage } from './types'

/** Volatile storage: used in tests, and as the fallback when IndexedDB is unavailable. */
export function createMemoryStorage(): Storage {
  const events = new Map<string, AppEvent>()
  const kv = new Map<string, unknown>()
  return {
    events: {
      persistent: false,
      loadAll: async () => [...events.values()],
      append: async (evs) => {
        for (const e of evs) events.set(e.id, e)
      },
      clear: async () => events.clear(),
    },
    kv: {
      get: async <T,>(k: string) => kv.get(k) as T | undefined,
      set: async (k, v) => void kv.set(k, structuredCloneSafe(v)),
      del: async (k) => void kv.delete(k),
    },
  }
}

function structuredCloneSafe<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T)
}

/** IndexedDB-backed storage (idb-keyval). Falls back to memory if IndexedDB can't be used. */
export async function openLocalStorage(namespace = 'studyquest'): Promise<Storage> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no indexedDB')
    const evStore = createStore(`${namespace}-events`, 'events')
    const kvStore = createStore(`${namespace}-kv`, 'kv')
    // Probe: some browsers expose indexedDB but reject writes (private mode, blocked storage).
    await idbSet('__probe', 1, kvStore)
    await idbDel('__probe', kvStore)
    const events: EventStore = {
      persistent: true,
      loadAll: async () => (await values(evStore)) as AppEvent[],
      append: async (evs) => {
        if (evs.length) await setMany(evs.map((e) => [e.id, e] as [string, AppEvent]), evStore)
      },
      clear: () => idbClear(evStore),
    }
    const kv: KV = {
      get: async <T,>(k: string) => (await idbGet(k, kvStore)) as T | undefined,
      set: (k, v) => idbSet(k, v, kvStore),
      del: (k) => idbDel(k, kvStore),
    }
    return { events, kv }
  } catch {
    return createMemoryStorage()
  }
}
