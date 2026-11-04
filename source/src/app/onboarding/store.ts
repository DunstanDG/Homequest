/**
 * Onboarding state, kept on this phone per family member (so a shared tablet works for everyone, and nothing new
 * has to sync): how far through the welcome tour they are, which release notes they've seen, and banners they've
 * put off until tomorrow. Plus the "an update is ready" flag the service worker sets.
 */
import { useSyncExternalStore } from 'react'

export type BannerKind = 'update' | 'tour' | 'setup' | 'news'

export interface OnboardState {
  /** Set when the tour should run (a new person on this phone); cleared when it is finished or skipped. */
  tourPending?: boolean
  tourStep?: number
  tourDone?: boolean
  /** Joined or set up on this phone after onboarding existed: gets the setup checklist banner for two weeks. */
  newcomer?: boolean
  seen: string[]
  firstSeen: number
  /** Banner kind -> the day (YYYY-MM-DD) until which it is put off ("Not now" hides it for the rest of today). */
  snooze?: Partial<Record<BannerKind, string>>
}

const key = (memberId: string) => `hq.onboard.${memberId}`
const listeners = new Set<() => void>()
const cache = new Map<string, OnboardState>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

/** Undefined when this person has never opened the app on this phone since onboarding was added. */
function load(memberId: string): OnboardState | undefined {
  if (cache.has(memberId)) return cache.get(memberId)
  try {
    const raw = localStorage.getItem(key(memberId))
    if (!raw) return undefined
    const v = JSON.parse(raw) as Partial<OnboardState>
    const s: OnboardState = { ...v, seen: Array.isArray(v.seen) ? v.seen.filter((x) => typeof x === 'string') : [], firstSeen: typeof v.firstSeen === 'number' ? v.firstSeen : Date.now() }
    cache.set(memberId, s)
    return s
  } catch {
    return undefined
  }
}

function save(memberId: string, s: OnboardState) {
  cache.set(memberId, s)
  try {
    localStorage.setItem(key(memberId), JSON.stringify({ ...s, seen: s.seen.slice(-300) }))
  } catch {
    /* private mode: remembered for this visit only */
  }
  emit()
}

const defaults = new Map<string, OnboardState>()
/** This person's state (a stable object, as React's external-store hook needs). */
export function onboardOf(memberId: string): OnboardState {
  const s = load(memberId)
  if (s) return s
  let d = defaults.get(memberId)
  if (!d) defaults.set(memberId, (d = { seen: [], firstSeen: Date.now() }))
  return d
}

export function updateOnboard(memberId: string, patch: Partial<OnboardState> | ((s: OnboardState) => Partial<OnboardState>)) {
  const cur = onboardOf(memberId)
  save(memberId, { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })
}

/**
 * First time this person is seen on this phone. A brand-new person (just set up or joined) gets the tour, and the
 * release notes so far count as seen: they're new to everything, not to the latest changes. Someone who already
 * used the app before onboarding existed gets no tour, but does get "What's new".
 */
export function ensureOnboard(memberId: string, isNewPerson: boolean, allNoteIds: readonly string[]) {
  if (load(memberId)) return
  save(memberId, isNewPerson ? { tourPending: true, tourStep: 0, newcomer: true, seen: [...allNoteIds], firstSeen: Date.now() } : { seen: [], firstSeen: Date.now(), tourDone: true })
}

export function markSeen(memberId: string, ids: readonly string[]) {
  updateOnboard(memberId, (s) => ({ seen: [...new Set([...s.seen, ...ids])] }))
}

export function snooze(memberId: string, kind: BannerKind, today: string) {
  updateOnboard(memberId, (s) => ({ snooze: { ...s.snooze, [kind]: today } }))
}

export function useOnboard(memberId: string): OnboardState {
  return useSyncExternalStore(subscribe, () => onboardOf(memberId))
}

// ------------------------------------------------------------------ a new version is waiting

interface UpdateState {
  ready: boolean
  apply?: () => void
}
let update: UpdateState = { ready: false }
const RESTARTED_KEY = 'hq.update.restartedAt'

export function setUpdateReady(apply: () => void) {
  update = { ready: true, apply }
  emit()
}

export const getUpdate = (): UpdateState => update

export const useUpdate = (): UpdateState => useSyncExternalStore(subscribe, () => update)

/** When someone last tapped Restart. Deploys often come in bursts: for a few hours after a restart, further
 * updates wait for a quiet moment (the app reopened) instead of asking again. */
export function lastRestart(): number {
  try {
    return Number(localStorage.getItem(RESTARTED_KEY)) || 0
  } catch {
    return 0
  }
}

export function noteRestart() {
  try {
    localStorage.setItem(RESTARTED_KEY, String(Date.now()))
  } catch {
    /* fine */
  }
}

/** For tests. */
export function _resetOnboardCache() {
  cache.clear()
  defaults.clear()
  update = { ready: false }
}
