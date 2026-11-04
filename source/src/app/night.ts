/**
 * Night mode for the whole app: a dim, warm palette for the small hours. Automatic from 22:00 to 06:00, or forced
 * on/off on this phone (a per-phone preference, so it isn't synced). One shared setting, so the toggle on Today and
 * the one on Care always agree.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { useNow } from './context'

export type NightSetting = 'auto' | 'on' | 'off'
const NIGHT_KEY = 'hq.care.night'

const read = (): NightSetting => {
  try {
    const v = localStorage.getItem(NIGHT_KEY)
    return v === 'on' || v === 'off' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

let current: NightSetting = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

function setNight(next: NightSetting) {
  current = next
  try {
    if (next === 'auto') localStorage.removeItem(NIGHT_KEY)
    else localStorage.setItem(NIGHT_KEY, next)
  } catch {
    /* private mode: just this visit */
  }
  listeners.forEach((l) => l())
}

export const isNightHour = (now: number) => {
  const h = new Date(now).getHours()
  return h >= 22 || h < 6
}

export function useNightMode(now: number) {
  const setting = useSyncExternalStore(subscribe, () => current)
  const night = setting === 'on' || (setting === 'auto' && isNightHour(now))
  // auto -> the opposite of what it is now (pinned) -> back to auto
  const cycle = () => setNight(setting === 'auto' ? (night ? 'off' : 'on') : 'auto')
  return { night, setting, cycle }
}

/** Puts `night` on <html> so the palette applies to every screen. Used once, in the app shell. */
export function useAppNightMode() {
  const now = useNow(60_000)
  const { night } = useNightMode(now)
  useEffect(() => {
    document.documentElement.classList.toggle('night', night)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#070605' : '#141a3a')
  }, [night])
}
