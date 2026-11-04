import type { Repo } from '@/storage/repo'
import type { SyncAdapter, SyncReport } from '@/storage/types'
import { createSupabaseAdapter, probePrivateReady } from '@/storage/supabase'
import { emptyKeys, fingerprint, loadKeys, newKey, saveKeys, type KeyStore } from '@/storage/privateKeys'
import { openPokeChannel, type PokeChannel } from '@/storage/realtimePoke'
import { ENV_SUPABASE_ANON_KEY, ENV_SUPABASE_URL } from './config'

export interface SyncConfig {
  /** Secret half of the family code. */
  familyKey: string
  /** Overrides for the build-time defaults. */
  url?: string
  anonKey?: string
}

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error'

const KEY = 'sync.config'
export const POLL_MS = 25_000

/** Keeps this device's event log in step with the family's Supabase project (if one is configured). */
export class SyncManager {
  status: SyncStatus = 'off'
  last?: SyncReport
  private cfg?: SyncConfig
  private listeners = new Set<() => void>()
  private version = 0
  private timer?: ReturnType<typeof setTimeout>
  private running?: Promise<SyncReport | undefined>
  /** A poke arrived (or was asked for) while a sync was already in flight - that sync may have fetched before the
   * new events landed, so run one more straight after it rather than waiting for the next poll. */
  private again = false
  private pokeChannel?: PokeChannel
  private pokeKey?: string
  /** True while the instant-update channel is joined (see storage/realtimePoke.ts). Polling continues either way. */
  realtime = false

  constructor(private readonly repo: Repo) {}

  async load(): Promise<void> {
    this.cfg = await this.repo.storage.kv.get<SyncConfig>(KEY)
    this.keys = await loadKeys(this.repo.storage.kv)
    this.status = this.adapter() ? 'idle' : 'off'
    this.applyPrivacyFlags()
    this.repo.subscribe(() => this.applyPrivacyFlags())
    this.emit()
    void this.checkPrivateReady()
  }

  // ---- private events: personal keys and whether the database is ready for them
  keys: KeyStore = emptyKeys()
  /** Has the database had schema_v3.sql run? Undefined = not checked yet or could not tell. Always true when nothing is shared. */
  privateReady?: boolean

  /** Check (again) whether private events can be stored. With no sharing set up there is nothing to leak, so yes. */
  async checkPrivateReady(): Promise<boolean | undefined> {
    const url = this.effectiveUrl()
    const anonKey = this.effectiveAnonKey()
    if (!this.cfg?.familyKey || !url || !anonKey) this.privateReady = true
    else this.privateReady = (await probePrivateReady({ url, anonKey, familyKey: this.cfg.familyKey })) ?? this.privateReady
    this.applyPrivacyFlags()
    this.emit()
    return this.privateReady
  }

  /** Adults' own check-ins become private once the database is ready and they have a key. */
  private applyPrivacyFlags(): void {
    const me = this.repo.me()
    this.repo.privateAdultCheckins = !!this.privateReady && !!me && this.keys.own?.memberId === me
  }

  ownKey = (): string | undefined => (this.keys.own && this.keys.own.memberId === this.repo.me() ? this.keys.own.key : undefined)

  /** Make this person's key (does nothing if they already have one). Returns it. */
  async createOwnKey(): Promise<string | undefined> {
    const me = this.repo.me()
    if (!me) return undefined
    if (this.ownKey()) return this.ownKey()
    const key = newKey()
    await this.setOwnKey(me, key)
    return key
  }

  /** Use this key as the phone holder's own (a second phone, or a restore). Pulls again so earlier private rows arrive. */
  async setOwnKey(memberId: string, key: string): Promise<void> {
    this.keys = { ...this.keys, own: { memberId, key } }
    await saveKeys(this.repo.storage.kv, this.keys)
    await this.repo.storage.kv.del('sync.cursor.supabase-family')
    this.applyPrivacyFlags()
    this.emit()
    this.syncSoon(200)
  }

  /** Hold a copy of someone else's key so it can be restored for them. */
  async addCopy(memberId: string, key: string): Promise<string> {
    this.keys = { ...this.keys, copies: { ...this.keys.copies, [memberId]: key } }
    await saveKeys(this.repo.storage.kv, this.keys)
    this.emit()
    return fingerprint(key)
  }

  async removeCopy(memberId: string): Promise<void> {
    const { [memberId]: _gone, ...rest } = this.keys.copies
    this.keys = { ...this.keys, copies: rest }
    await saveKeys(this.repo.storage.kv, this.keys)
    this.emit()
  }

  config = (): SyncConfig | undefined => this.cfg
  effectiveUrl = (): string | undefined => this.cfg?.url ?? ENV_SUPABASE_URL
  effectiveAnonKey = (): string | undefined => this.cfg?.anonKey ?? ENV_SUPABASE_ANON_KEY

  async setConfig(cfg: SyncConfig | undefined): Promise<void> {
    this.cfg = cfg
    if (cfg) await this.repo.storage.kv.set(KEY, cfg)
    else await this.repo.storage.kv.del(KEY)
    this.status = this.adapter() ? 'idle' : 'off'
    if (this.started) this.openRealtime()
    this.emit()
  }

  adapter(): SyncAdapter | undefined {
    const url = this.effectiveUrl()
    const anonKey = this.effectiveAnonKey()
    if (!this.cfg?.familyKey || !url || !anonKey) return undefined
    return createSupabaseAdapter({ url, anonKey, familyKey: this.cfg.familyKey, memberKey: this.ownKey, ownerKeyFor: (m) => (this.keys.own?.memberId === m && this.repo.me() === m ? this.keys.own.key : undefined) })
  }

  async syncNow(): Promise<SyncReport | undefined> {
    const adapter = this.adapter()
    if (!adapter) return undefined
    if (this.running) {
      this.again = true
      return this.running
    }
    this.status = 'syncing'
    this.emit()
    this.running = this.repo
      .sync(adapter)
      .then((r) => {
        this.last = r
        this.status = r.ok ? 'idle' : 'error'
        // Tell the family's other phones there's something new, so they pull now instead of on their next poll.
        if (r.ok && r.pushed > 0) this.pokeChannel?.poke()
        return r
      })
      .catch((e: unknown): SyncReport => {
        const r = { ok: false, pulled: 0, pushed: 0, error: e instanceof Error ? e.message : String(e), at: Date.now() }
        this.last = r
        this.status = 'error'
        return r
      })
      .finally(() => {
        this.running = undefined
        this.emit()
        if (this.again) {
          this.again = false
          void this.syncNow()
        }
      })
    return this.running
  }

  /** Sync a moment after the last change, so a burst of taps goes up as one batch but the family sees it quickly. */
  syncSoon(ms = 1200): void {
    if (!this.adapter()) return
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.syncNow(), ms)
  }

  private started = false

  /** (Re)open the instant-update channel for the current family, or close it if sharing is off. */
  private openRealtime(): void {
    const url = this.effectiveUrl()
    const anonKey = this.effectiveAnonKey()
    const familyKey = this.cfg?.familyKey
    const key = url && anonKey && familyKey ? `${url}|${anonKey}|${familyKey}` : undefined
    if (key === this.pokeKey) return
    this.pokeChannel?.close()
    this.pokeChannel = undefined
    this.pokeKey = key
    this.realtime = false
    if (!key || !url || !anonKey || !familyKey) return
    this.pokeChannel = openPokeChannel({
      url,
      anonKey,
      familyKey,
      onPoke: () => void this.syncNow(),
      onStatus: (connected) => {
        this.realtime = connected
        this.emit()
      },
    })
  }

  /** Wire up automatic syncing. Returns a cleanup function. */
  start(): () => void {
    this.started = true
    this.openRealtime()
    const onVisible = () => document.visibilityState === 'visible' && void this.syncNow()
    const onOnline = () => void this.syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const unsub = this.repo.subscribe(() => {
      if (this.repo.pendingCount() > 0) this.syncSoon()
    })
    // While the app is on screen, check for the family's changes every 25 seconds (one small request) - the
    // backstop for when the instant-update channel isn't connected or a poke is missed.
    const interval = setInterval(() => document.visibilityState === 'visible' && void this.syncNow(), POLL_MS)
    void this.syncNow()
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      unsub()
      clearInterval(interval)
      clearTimeout(this.timer)
      this.started = false
      this.pokeChannel?.close()
      this.pokeChannel = undefined
      this.pokeKey = undefined
      this.realtime = false
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
