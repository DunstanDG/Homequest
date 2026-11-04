/**
 * App updates without surprises. A new version installs in the background and waits; it is switched on
 *   - straight away when the app has only just been opened (within 45 s: nothing on screen to lose), or
 *   - silently when the app comes back after 5+ minutes in the background,
 * as long as nothing is running (a timer, a feed or pumping session, a Plan session). Otherwise Today shows
 * "Update ready · Restart". Deploys often come in bursts, so for half an hour after a restart further updates don't
 * ask again: they wait for the next quiet moment.
 *
 * Phones only look for a new version when the app is opened, so we also look every time it comes back to the front
 * (at most every 5 minutes) and every hour while it stays open. Parent area › Data has "Check for updates", which
 * looks right now and can force the switch (see forceUpdate).
 */
import { useEffect, useRef } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { bornBabies } from '@/family/arrival/arrival'
import { activeFeedRunFor } from '@/family/care'
import { inActiveHouseRun } from '@/family/house/run'
import { activeRunFor } from '@/family/routines'
import { activeTimers } from '@/family/timers'
import type { FamilyState, MemberId } from '@/family/types'
import { getUpdate, lastRestart, noteRestart, setUpdateReady, useUpdate } from './onboarding/store'
import { decideStatus, parseVersionJson, type UpdateStatus } from './version'

const STARTED = Date.now()
export const QUIET_RESTART_MINUTES = 30
const LAUNCH_WINDOW_MS = 45_000
const AWAY_MS = 5 * 60_000
const LOOK_EVERY_MS = 5 * 60_000

let registration: ServiceWorkerRegistration | undefined
let lastLook = 0

/** Ask the browser to fetch the worker file again (a new version shows up as a waiting worker). */
function look() {
  lastLook = Date.now()
  void registration?.update().catch(() => {})
}

export function startUpdates() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      setUpdateReady(() => {
        noteRestart()
        void updateSW(true)
      })
    },
    onRegisteredSW(_url: string, r: ServiceWorkerRegistration | undefined) {
      registration = r
      // An installed app can stay open for days: look for a new version every hour.
      if (r) setInterval(look, 60 * 60_000)
    },
  })
  // iOS only checks for a new version when the app is launched. Coming back from the home screen is not a launch.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastLook > LOOK_EVERY_MS) look()
  })
}

/** The newest version's build time according to the server, read past every cache. */
async function fetchRemote(): Promise<{ builtAt: string } | undefined> {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return undefined
    return parseVersionJson(await res.text())
  } catch {
    return undefined
  }
}

/** Resolves when a worker that is installing finishes (or after `ms`). */
function installed(w: ServiceWorker, ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (w.state === 'installed' || w.state === 'activated' || w.state === 'redundant') return resolve()
    const t = setTimeout(resolve, ms)
    w.addEventListener('statechange', () => {
      if (w.state !== 'installing') {
        clearTimeout(t)
        resolve()
      }
    })
  })
}

/** "Check for updates": look now, wait for a new version to finish downloading, and say what was found. */
export async function checkForUpdate(): Promise<UpdateStatus> {
  const reg = registration
  if (reg) {
    try {
      await Promise.race([reg.update(), new Promise((r) => setTimeout(r, 10_000))])
      if (reg.installing) await installed(reg.installing, 40_000)
    } catch {
      /* offline: the server check below says so */
    }
  }
  const waiting = !!reg?.waiting || getUpdate().ready
  return decideStatus(waiting, waiting ? undefined : await fetchRemote())
}

/**
 * "Update now". A new version already waiting on this phone is simply switched on. Otherwise the phone is being
 * served an old copy from a cache, so throw the app's cached files away and load it fresh from the server (the
 * family's data lives elsewhere on the phone and is not touched).
 */
export async function forceUpdate(): Promise<void> {
  const { ready, apply } = getUpdate()
  if (ready && apply) return apply()
  try {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister()
    for (const k of await caches.keys()) await caches.delete(k)
  } catch {
    /* reload anyway */
  }
  // A fresh address, so the page itself is read from the server and not from the browser's HTTP cache.
  const url = new URL(location.href)
  url.searchParams.set('fresh', String(Date.now()))
  location.replace(url.toString())
}

/** Something is running that a reload would interrupt. */
export function busyNow(f: FamilyState, me: MemberId, now = Date.now()): boolean {
  if (activeTimers(f).length) return true
  if (activeRunFor(f, me, now)) return true
  if (inActiveHouseRun(f, me, now)) return true
  return bornBabies(f).some((b) => !!activeFeedRunFor(f, b.id, now))
}

/** Whether Today should ask (the banner), rather than wait for a quiet moment. */
export const shouldAsk = (ready: boolean, now = Date.now()) => ready && now - lastRestart() > QUIET_RESTART_MINUTES * 60_000

/** Applies a waiting update at a quiet moment (see the top of this file). Used once, in the app shell. */
export function useQuietUpdate(f: FamilyState, me: MemberId) {
  const { ready, apply } = useUpdate()
  const hiddenAt = useRef<number | undefined>(undefined)
  const busy = busyNow(f, me)
  useEffect(() => {
    if (ready && apply && !busy && Date.now() - STARTED < LAUNCH_WINDOW_MS) apply()
  }, [ready, apply, busy])
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now()
      else if (hiddenAt.current && Date.now() - hiddenAt.current > AWAY_MS && ready && apply && !busy) apply()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [ready, apply, busy])
}
