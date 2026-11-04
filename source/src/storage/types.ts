import type { AppEvent } from '@/engine/types'

/** Durable, append-only event storage on this device. */
export interface EventStore {
  /** False when we had to fall back to memory (private browsing, storage blocked). */
  readonly persistent: boolean
  loadAll(): Promise<AppEvent[]>
  append(events: AppEvent[]): Promise<void>
  clear(): Promise<void>
}

/** Small key/value store for settings, sync cursors and the like. */
export interface KV {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  del(key: string): Promise<void>
}

export interface Storage {
  events: EventStore
  kv: KV
}

/**
 * A remote place the same event log can be copied to and from (a parent's Supabase project,
 * a shared folder, ...). The log is append-only and events are immutable, so sync is just
 * "copy the events the other side hasn't got".
 */
export interface SyncAdapter {
  readonly id: string
  /** Events the remote has that we may not, after `cursor`. `cursor` is opaque to callers. */
  pull(cursor: string | undefined): Promise<{ events: AppEvent[]; cursor: string | undefined; more: boolean }>
  /** Send events to the remote. Must be idempotent (sending an event twice is harmless). */
  push(events: AppEvent[]): Promise<void>
}

export interface SyncReport {
  ok: boolean
  pulled: number
  pushed: number
  error?: string
  at: number
}
