import { isLearningEvent, type AppEvent, type LearnerState } from '@/engine/types'
import type { Registry } from '@/engine/registry'
import type { SessionStore } from '@/engine/session'
import { applyEvent, emptyState, mergeEvents, project } from '@/engine/events'
import { uid } from '@/engine/rng'
import { applyFamilyEvent, projectFamily } from '@/family/project'
import { inheritPriv, visibleTo } from '@/family/privacy'
import type { FamilyState, MemberId } from '@/family/types'
import { PENDING_KEY, syncOnce } from './sync'
import type { Storage, SyncAdapter, SyncReport } from './types'

const LEARNER_KEY = 'learnerId'
const ME_KEY = 'me'

/**
 * The app's single writable object. Holds the WHOLE family's event log in memory and projects it two ways:
 *   - the active learner's StudyQuest state (`get()`), which the games read and write through, and
 *   - the shared family state (`family()`): calendar, tasks, trackers, coins, shop.
 * New events are persisted to local storage, queued for sync, and announced to the UI.
 * Implements SessionStore so games can write through it.
 */
export class Repo implements SessionStore {
  private events: AppEvent[]
  private state: LearnerState
  private fam: FamilyState
  private others = new Map<string, { v: number; state: LearnerState }>()
  private listeners = new Set<() => void>()
  private writeChain: Promise<void> = Promise.resolve()
  private pending: string[] = []
  lastSync?: SyncReport
  writeError?: string
  /** Set by the app once private storage is ready and this person has a key: their own check-ins (adults) are then private. */
  privateAdultCheckins = false
  /** `run:<id>` / `timer:<id>` -> the owner, for runs and timers that are private. */
  private refPriv = new Map<string, string>()
  private privById = new Map<string, string>()

  private constructor(
    readonly registry: Registry,
    readonly storage: Storage,
    /** Whose StudyQuest progress the games on this device write to. */
    public learnerId: string,
    private meId: MemberId | undefined,
    events: AppEvent[],
    pending: string[],
  ) {
    this.events = mergeEvents(events, [])
    this.pending = pending
    this.state = project(learnerId, this.events, registry.graph)
    this.indexPriv(this.events)
    this.fam = projectFamily(this.shown())
  }

  /** Load (or create) this device's log. `forceLearnerId` is used when pairing with a legacy family code. */
  static async open(registry: Registry, storage: Storage, opts: { forceLearnerId?: string } = {}): Promise<Repo> {
    let learnerId = await storage.kv.get<string>(LEARNER_KEY)
    if (opts.forceLearnerId && opts.forceLearnerId !== learnerId) {
      learnerId = opts.forceLearnerId
      await storage.kv.set(LEARNER_KEY, learnerId)
    }
    const me = await storage.kv.get<string>(ME_KEY)
    if (me && !opts.forceLearnerId) learnerId = me
    if (!learnerId) {
      learnerId = uid('l')
      await storage.kv.set(LEARNER_KEY, learnerId)
    }
    const all = await storage.events.loadAll()
    const pending = (await storage.kv.get<string[]>(PENDING_KEY)) ?? []
    return new Repo(registry, storage, learnerId, me, all, pending)
  }

  // ---- SessionStore
  get = (): LearnerState => this.state

  apply = (events: AppEvent[]): void => {
    if (!events.length) return
    const have = new Set(this.events.map((e) => e.id))
    const fresh = inheritPriv(
      this.fam,
      events.filter((e) => !have.has(e.id)),
      { adultCheckins: (m) => this.privateAdultCheckins && m === this.meId, refPriv: (k) => this.refPriv.get(k), eventPriv: (id) => this.privById.get(id) },
    )
    if (!fresh.length) return
    this.indexPriv(fresh)
    const lastTs = this.events[this.events.length - 1]?.ts ?? 0
    const inOrder = fresh.every((e) => e.ts >= lastTs)
    this.events = [...this.events, ...fresh]
    if (inOrder) {
      for (const e of fresh) {
        if (isLearningEvent(e)) {
          if (e.learnerId === this.learnerId) this.state = applyEvent(this.state, e, this.registry.graph)
        } else if (visibleTo(e, this.meId)) this.fam = applyFamilyEvent(this.fam, e)
      }
    } else this.rebuild()
    this.pending = [...this.pending, ...fresh.map((e) => e.id)]
    this.persist(fresh)
    this.emit()
  }

  // ---- reads
  /** The shared family state. */
  family = (): FamilyState => this.fam
  allEvents = (): AppEvent[] => this.events
  isPersistent = (): boolean => this.storage.events.persistent
  pendingCount = (): number => this.pending.length
  /** Which family member is holding this device (set once, on first launch). */
  me = (): MemberId | undefined => this.meId

  /** StudyQuest state for any learner in the family (parents look at their children's progress this way). */
  learnerState(id: string): LearnerState {
    if (id === this.learnerId) return this.state
    const hit = this.others.get(id)
    if (hit && hit.v === this.version) return hit.state
    const state = project(id, this.events, this.registry.graph)
    this.others.set(id, { v: this.version, state })
    return state
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  /** Version counter for useSyncExternalStore. */
  private version = 0
  snapshot = (): number => this.version

  // ---- who is holding this device
  /** Say who this device belongs to. For people (parent/child) the games then record progress under their id. */
  async setMe(id: MemberId | undefined, opts: { learner?: boolean } = { learner: true }): Promise<void> {
    this.meId = id
    this.rebuild()
    if (id) await this.storage.kv.set(ME_KEY, id)
    else await this.storage.kv.del(ME_KEY)
    if (id && opts.learner !== false) await this.setLearner(id)
    this.emit()
  }

  async setLearner(id: string): Promise<void> {
    if (id === this.learnerId) return
    this.learnerId = id
    await this.storage.kv.set(LEARNER_KEY, id)
    this.rebuild()
    this.emit()
  }

  // ---- import / sync
  /** Merge events from a backup file or another device. Returns how many were new. */
  async importEvents(events: AppEvent[]): Promise<number> {
    const have = new Set(this.events.map((e) => e.id))
    const fresh = events.filter((e) => !have.has(e.id))
    if (!fresh.length) return 0
    this.events = mergeEvents(this.events, fresh)
    this.rebuild()
    this.pending = [...this.pending, ...fresh.map((e) => e.id)]
    this.persist(fresh)
    this.emit()
    await this.flush()
    return fresh.length
  }

  async sync(adapter: SyncAdapter): Promise<SyncReport> {
    await this.flush()
    // Make sure queued ids are on disk before syncOnce reads them.
    await this.storage.kv.set(PENDING_KEY, this.pending)
    const sending = new Set(this.pending)
    const { report, newEvents } = await syncOnce({ events: this.storage.events, kv: this.storage.kv, adapter })
    if (report.ok) {
      // Events created while the sync was in flight stay queued for next time.
      this.pending = this.pending.filter((id) => !sending.has(id))
      await this.storage.kv.set(PENDING_KEY, this.pending)
    }
    // Even a failed sync may have pulled some pages before it failed.
    if (newEvents.length) {
      this.events = mergeEvents(this.events, newEvents)
      this.rebuild()
    }
    this.lastSync = report
    this.emit()
    return report
  }

  /** Queue every event for the next sync (used when sharing is switched on with a fresh family key). */
  async requeueAll(): Promise<void> {
    this.pending = this.events.map((e) => e.id)
    await this.flush()
    await this.storage.kv.set(PENDING_KEY, this.pending)
  }

  /** Wait until everything has been written to local storage (used before sync, export and in tests). */
  flush(): Promise<void> {
    return this.writeChain
  }

  // ---- internals
  private rebuild() {
    this.state = project(this.learnerId, this.events, this.registry.graph)
    this.indexPriv(this.events)
    this.fam = projectFamily(this.shown())
  }
  /** The events this person may see: shared ones and their own private ones. */
  private shown(): AppEvent[] {
    return this.events.filter((e) => visibleTo(e, this.meId))
  }
  private indexPriv(events: readonly AppEvent[]) {
    for (const e of events) {
      if (!e.priv) continue
      this.privById.set(e.id, e.priv)
      const x = e as AppEvent & Record<string, unknown>
      if (e.type === 'run') this.refPriv.set(`run:${x.runId}`, e.priv)
      if (e.type === 'timer') this.refPriv.set(`timer:${x.timerId}`, e.priv)
    }
  }
  private persist(events: AppEvent[]) {
    const pendingNow = [...this.pending]
    this.writeChain = this.writeChain
      .then(async () => {
        await this.storage.events.append(events)
        await this.storage.kv.set(PENDING_KEY, pendingNow)
        this.writeError = undefined
      })
      .catch((e: unknown) => {
        this.writeError = e instanceof Error ? e.message : String(e)
      })
  }
  private emit() {
    this.version++
    for (const l of this.listeners) l()
  }
}

export { emptyState }
