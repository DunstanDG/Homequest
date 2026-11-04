import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { Registry } from '@/engine/registry'
import type { AppEvent, LearnerState } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import type { FamilyState, Member } from '@/family/types'
import { makeCalCtx, type CalCtx } from '@/family/calendar'
import { Repo } from '@/storage/repo'
import { openLocalStorage } from '@/storage/local'
import { createMemoryStorage } from '@/storage/local'
import { hashString } from '@/engine/rng'
import { PARENT_UNLOCK_MS } from './config'
import { SyncManager } from './syncManager'
import { CoparentSyncManager } from './coparentSyncManager'

export interface Settings {
  /** Hash of the parent PIN. A soft lock only - this is a child-proofing feature, not security. */
  pinHash?: string
  /** Sprint without the countdown. */
  relaxedSprint?: boolean
  /** ts of the latest What's New item she has seen. */
  newsSeenTs?: number
  subject?: string
  /** Version string of the last changelog entry seen. */
  changelogSeen?: string
  /** On a parent's own phone: don't ask for the PIN to open the parent area. */
  trustDevice?: boolean
  /** Timer sound and buzz. */
  quietTimers?: boolean
  /** They chose "skip for now" on the Getting Started multi-phone-sync step, rather than setting up sharing. */
  skipSyncSetup?: boolean
  /** They hid the Getting started card on Today (it comes back from Parent area > Data if they want it). */
  hideGettingStarted?: boolean
  /** Per-type on/off for push notifications, device-local like the rest of Settings. Missing key (or missing
   * `notifyTypes` altogether) means on - turning push on once should mean "on" for everything, with individual
   * types switched off from here rather than needing to opt in to each separately. See `notifyTypeOn` below. */
  notifyTypes?: Partial<Record<NotifyKind, boolean>>
}

export type NotifyKind = 'meds' | 'tasks' | 'sleep' | 'feeds' | 'events' | 'homework' | 'checkin'

/** Whether this notification type should fire, given the device's settings - all-on by default (see `notifyTypes` above). */
export const notifyTypeOn = (settings: Settings, key: NotifyKind): boolean => settings.notifyTypes?.[key] ?? true

export interface AppCtx {
  repo: Repo
  registry: Registry
  sync: SyncManager
  coparentSync: CoparentSyncManager
  settings: Settings
  updateSettings(patch: Partial<Settings>): void
  /** Parent area unlock state (in memory only). */
  parentUnlocked(): boolean
  unlockParent(): void
  lockParent(): void
  pinFor(pin: string): string
  /** Add events to the log as the person holding this phone. */
  act(events: AppEvent[]): void
  /** Stamp and add a learning-side event for a specific learner (used by the parent's progress tools). */
  emitFor(learnerId: string, body: EventBody): void
  toast(msg: string, opts?: { undo?: () => void }): void
  /** True when this build is the read-only-ish demo with fake data. */
  demo: boolean
}

const Ctx = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

const ViewCtx = createContext<string | undefined>(undefined)
/** Lets a parent look at (and file notes for) a child's StudyQuest progress without changing whose progress this phone records. */
export const ViewLearnerProvider = ViewCtx.Provider

/** Whose StudyQuest state the screen below is about: a viewed child if a parent picked one, otherwise whoever holds this phone. */
export function useViewedId(): string {
  const v = useContext(ViewCtx)
  const { repo } = useApp()
  return v ?? repo.learnerId
}

/** Current learner state (whoever's StudyQuest progress this phone records, or the child a parent is viewing); re-renders whenever an event is added or synced. */
export function useLearner(): LearnerState {
  const { repo } = useApp()
  useSyncExternalStore(repo.subscribe, repo.snapshot)
  const v = useContext(ViewCtx)
  return v && v !== repo.learnerId ? repo.learnerState(v) : repo.get()
}

/** The shared family state. */
export function useFamily(): FamilyState {
  const { repo } = useApp()
  useSyncExternalStore(repo.subscribe, repo.snapshot)
  return repo.family()
}

/** Calendar context (school layers built per child); recomputed only when the family changes. */
export function useCalCtx(): CalCtx {
  const f = useFamily()
  return useMemo(() => makeCalCtx(f), [f])
}

/** Who holds this phone. */
export function useMe(): Member | undefined {
  const { repo } = useApp()
  const f = useFamily()
  const id = repo.me()
  return id ? f.members[id] : undefined
}

export const useIsParent = (): boolean => useMe()?.role === 'parent'

/** Someone else's StudyQuest state (parents look at their children this way). */
export function useLearnerOf(id: string | undefined): LearnerState | undefined {
  const { repo } = useApp()
  useSyncExternalStore(repo.subscribe, repo.snapshot)
  return id ? repo.learnerState(id) : undefined
}

export function useSyncStatus() {
  const { sync } = useApp()
  useSyncExternalStore(sync.subscribe, sync.snapshot)
  return sync
}

export function useCoparentSync(): CoparentSyncManager {
  const { coparentSync } = useApp()
  useSyncExternalStore(coparentSync.subscribe, coparentSync.snapshot)
  return coparentSync
}

/** A clock that ticks once a minute so "due for revision" and "today" stay fresh. */
export function useNow(everyMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs)
    // Catch up straight away when the phone wakes up or the app comes back to the front.
    const onVis = () => document.visibilityState === 'visible' && setNow(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [everyMs])
  return now
}

interface ToastState {
  id: number
  msg: string
  undo?: () => void
}

function ToastHost({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, toast.undo ? 6000 : 2600)
    return () => clearTimeout(t)
  }, [toast, onClose])
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <span>{toast.msg}</span>
      {toast.undo && (
        <button
          type="button"
          className="toast-undo"
          onClick={() => {
            toast.undo?.()
            onClose()
          }}
        >
          Undo
        </button>
      )}
    </div>
  )
}

export function AppProvider({ registry, children, demo = false }: { registry: Registry; children: ReactNode; demo?: boolean }) {
  const [ready, setReady] = useState<{ repo: Repo; sync: SyncManager; coparentSync: CoparentSyncManager; settings: Settings } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>({})
  const [toast, setToast] = useState<ToastState | null>(null)
  const unlockedUntil = useRef(0)

  useEffect(() => {
    let stop = () => {}
    let cancelled = false
    ;(async () => {
      try {
        const storage = demo ? createMemoryStorage() : await openLocalStorage()
        const repo = await Repo.open(registry, storage)
        if (demo) await (await import('./demo')).seedDemo(repo)
        const sync = new SyncManager(repo)
        await sync.load()
        const coparentSync = new CoparentSyncManager(repo)
        await coparentSync.load()
        const s = demo ? { trustDevice: true } : ((await storage.kv.get<Settings>('settings')) ?? {})
        if (cancelled) return
        setSettings(s)
        setReady({ repo, sync, coparentSync, settings: s })
        if (!demo) {
          const stopSync = sync.start()
          const stopCoparent = coparentSync.start()
          stop = () => {
            stopSync()
            stopCoparent()
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
      stop()
    }
  }, [registry, demo])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        void ready?.repo.storage.kv.set('settings', next)
        return next
      })
    },
    [ready],
  )

  const closeToast = useCallback(() => setToast(null), [])
  const showToast = useCallback((msg: string, opts?: { undo?: () => void }) => setToast({ id: Date.now(), msg, undo: opts?.undo }), [])

  const value = useMemo<AppCtx | null>(() => {
    if (!ready) return null
    const { repo } = ready
    return {
      repo,
      registry,
      sync: ready.sync,
      coparentSync: ready.coparentSync,
      settings,
      updateSettings,
      parentUnlocked: () => Date.now() < unlockedUntil.current,
      unlockParent: () => void (unlockedUntil.current = Date.now() + PARENT_UNLOCK_MS),
      lockParent: () => void (unlockedUntil.current = 0),
      pinFor: (pin: string) => String(hashString(`studyquest-pin:${pin}`)),
      act: (events) => repo.apply(events),
      emitFor: (learnerId, body) => repo.apply([makeEvent(learnerId, body)]),
      toast: showToast,
      demo,
    }
  }, [ready, registry, settings, updateSettings, showToast, demo])

  if (error) return <div className="boot"><p>Sorry, HomeQuest could not start.</p><p className="note">{error}</p></div>
  if (!value) return <div className="boot"><div className="spinner" aria-label="Loading" /></div>
  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastHost toast={toast} onClose={closeToast} />
    </Ctx.Provider>
  )
}
