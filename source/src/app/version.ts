/**
 * Which release this phone is running. The version and build time are stamped in by the build (vite.config.ts), and the
 * build also publishes them as `version.json` next to the app so a phone can ask the server what is current without
 * trusting anything it has cached.
 */

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
export const BUILD_TIME: string = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

/** "5 Oct 2026, 14:32" in the phone's own time zone; empty when the time isn't known (the dev server). */
export function formatBuild(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date}, ${time}`
}

/** The server's version.json, or undefined when it isn't there (the dev server returns a page instead). */
export function parseVersionJson(text: string): { version: string; builtAt: string } | undefined {
  try {
    const v = JSON.parse(text) as { version?: unknown; builtAt?: unknown }
    if (typeof v.version === 'string' && typeof v.builtAt === 'string' && Number.isFinite(Date.parse(v.builtAt))) return { version: v.version, builtAt: v.builtAt }
  } catch {
    /* not JSON */
  }
  return undefined
}

/** Strictly newer: an older answer (a stale cache somewhere) never counts as an update. */
export const isNewerBuild = (remoteIso: string, localIso: string) => {
  const r = Date.parse(remoteIso)
  const l = Date.parse(localIso)
  return Number.isFinite(r) && Number.isFinite(l) && r > l
}

export type UpdateStatus = 'current' | 'ready' | 'newer' | 'unknown'

/**
 * What a check found. A waiting worker means the new version is already on this phone and only needs switching on.
 * Otherwise the server's version.json says whether something newer exists that this phone hasn't picked up yet
 * (the worker file or the page is being served from a cache). No answer from the server is "unknown", not "current".
 */
export function decideStatus(waiting: boolean, remote: { builtAt: string } | undefined, localBuiltAt = BUILD_TIME): UpdateStatus {
  if (waiting) return 'ready'
  if (!remote) return 'unknown'
  return isNewerBuild(remote.builtAt, localBuiltAt) ? 'newer' : 'current'
}
