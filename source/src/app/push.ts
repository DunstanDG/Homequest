/**
 * Phase 1 web push: client-side registration. Requires the family's own Supabase project to already be set up
 * (same prerequisite as multi-device sync, see SyncManager) - a subscription is meaningless without somewhere to
 * store it and an Edge Function + pg_cron job able to read it back. See docs/PUSH_NOTIFICATIONS.md.
 *
 * Talks to the push_subscriptions table with plain fetch to PostgREST, same style as storage/supabase.ts - no
 * @supabase/supabase-js SDK.
 */
import { DEFAULT_MORNING_AT, validTz, type NotifyPrefs } from '../../supabase/functions/_shared/notifyPlan'
import type { SyncManager } from './syncManager'

/** What this device's person chose about how notifications arrive. Device-local (like the other notification
 * settings) and copied to push_subscriptions so the send function can follow it. See docs/calm/D-notify.md. */
export interface CalmNotifyChoices {
  /** One summary in the morning instead of separate reminders. */
  morning?: boolean
  morningAt?: string
  /** Most messages a day, not counting urgent medicine and baby ones. Missing = the default (6 children, 10 adults). */
  cap?: number
  /** Parents only: let children get a second reminder about the same thing. Applies to the whole family. */
  repeatKids?: boolean
}

const CHOICES_KEY = 'hq-notify-choices'

export function loadNotifyChoices(): CalmNotifyChoices {
  try {
    const v = JSON.parse(localStorage.getItem(CHOICES_KEY) ?? '{}') as CalmNotifyChoices
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function saveNotifyChoices(c: CalmNotifyChoices): void {
  try {
    localStorage.setItem(CHOICES_KEY, JSON.stringify(c))
  } catch {
    /* private mode: the choice just isn't remembered on this device */
  }
}

/** The per-device preferences the send function reads (push_subscriptions.prefs). */
export function prefsFor(role: string | undefined, c: CalmNotifyChoices = loadNotifyChoices()): NotifyPrefs {
  let tz = 'Europe/London'
  try {
    tz = validTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    /* keep the default */
  }
  const out: NotifyPrefs = { tz, child: role === 'child' }
  if (c.morning) {
    out.morning = true
    out.morningAt = c.morningAt || DEFAULT_MORNING_AT
  }
  if (c.cap) out.cap = c.cap
  return out
}

export const isPushSupported = (): boolean => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window

/** Converts a base64url VAPID public key into the Uint8Array shape `applicationServerKey` wants. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export type SubscribeResult = { ok: true } | { ok: false; error: string }

/**
 * Requests notification permission (must be called from a user gesture, e.g. a button tap - browsers refuse or
 * ignore this otherwise), subscribes this device with the push service, and saves the subscription to the
 * family's push_subscriptions table.
 */
export async function subscribeToPush(sync: SyncManager, memberId: string, vapidPublicKey: string, role?: string): Promise<SubscribeResult> {
  if (!isPushSupported()) return { ok: false, error: 'This browser does not support push notifications.' }
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anonKey) return { ok: false, error: 'Turn on sharing first - notifications need the family’s Supabase project, same as syncing between phones.' }
  if (!vapidPublicKey) return { ok: false, error: 'No VAPID public key configured for this app.' }

  // Every step below can throw (or, for serviceWorker.ready, never settle) rather than returning a tidy error:
  // pushManager.subscribe() rejects on iOS when the app isn't installed to the home screen, on a malformed VAPID
  // key, or when the push service is unreachable. Previously that rejection escaped, so the caller's "busy" state
  // was never cleared and the Enable button sat stuck with no message. Everything now comes back as a result.
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, error: permission === 'denied' ? 'Notifications were blocked for this browser/device.' : 'Notification permission was not granted.' }

    const registration = await withTimeout(navigator.serviceWorker.ready, 10_000)
    if (!registration) return { ok: false, error: 'The app’s background worker isn’t running yet. Close and reopen the app, then try again.' }
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })
    }
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return { ok: false, error: 'The browser returned an incomplete push subscription.' }

    const post = (extra: Record<string, unknown>) =>
      fetch(`${url.replace(/\/+$/, '')}/rest/v1/push_subscriptions?on_conflict=family_key,endpoint`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'x-family-key': cfg.familyKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify([{ family_key: cfg.familyKey, member_id: memberId, endpoint: json.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth, ...extra }]),
      })
    // With the calm preferences; if the project hasn't had supabase/schema_v7.sql run yet there is no such column, so save without.
    let res = await post({ prefs: prefsFor(role) })
    if (res.status === 400) res = await post({})
    if (!res.ok) return { ok: false, error: `Could not save the subscription (${res.status}).` }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const ios = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
    return { ok: false, error: ios ? `Couldn’t turn on notifications (${msg}). On iPhone this only works from the app installed to your Home Screen.` : `Couldn’t turn on notifications: ${msg}` }
  }
}

/** Resolves to undefined instead of hanging forever - `serviceWorker.ready` never rejects, it just waits. */
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([p, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))])

export interface ScheduledNotificationDraft {
  memberId?: string
  fireAt: number
  title: string
  body: string
  /** Dedupe key, e.g. `med:<babyId>:<ruleName>` - a later call with the same tag should replace, not duplicate. */
  tag: string
  /** Short wording for when this is bundled with others into one message ("Piano at 16:15"). Defaults to the body. */
  label?: string
}

/** Insert rows with the optional `label` column; if the project hasn't had schema_v7.sql run yet, retry without it. */
async function insertRows(base: string, headers: Record<string, string>, rows: Record<string, unknown>[]): Promise<void> {
  const post = (r: Record<string, unknown>[]) => fetch(base, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(r) })
  const res = await post(rows).catch(() => undefined)
  if (res && res.status === 400 && rows.some((r) => r.label !== undefined)) await post(rows.map(({ label: _l, ...r }) => r)).catch(() => {})
}

/**
 * Queue a reminder for the Edge Function/cron job to send later (see supabase/schema.sql,
 * supabase/functions/send-notifications). Replaces any pending (unsent) reminder with the same tag first, so
 * logging a new dose before an old reminder fires supersedes it instead of piling up duplicates. A no-op (not an
 * error) when sharing isn't configured yet - there is nowhere to store the reminder.
 */
export async function scheduleNotification(sync: SyncManager, draft: ScheduledNotificationDraft): Promise<void> {
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anonKey) return
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' }
  const base = `${url.replace(/\/+$/, '')}/rest/v1/scheduled_notifications`
  await fetch(`${base}?tag=eq.${encodeURIComponent(draft.tag)}&family_key=eq.${encodeURIComponent(cfg.familyKey)}&sent_at=is.null`, {
    method: 'DELETE',
    headers,
  }).catch(() => {})
  await insertRows(base, headers, [{ family_key: cfg.familyKey, member_id: draft.memberId ?? null, fire_at: new Date(draft.fireAt).toISOString(), title: draft.title, body: draft.body, tag: draft.tag, label: draft.label }])
}

/**
 * Cancel a pending (unsent) reminder by tag, without scheduling a replacement - the delete half of what
 * `scheduleNotification` does before it inserts. Used when the thing a reminder was about no longer needs one
 * (a task is done/deleted, a sleep timer stopped before the check-in threshold). Same no-op-if-unconfigured
 * behaviour as `scheduleNotification`.
 */
export async function cancelNotification(sync: SyncManager, tag: string): Promise<void> {
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anonKey) return
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey }
  const base = `${url.replace(/\/+$/, '')}/rest/v1/scheduled_notifications`
  await fetch(`${base}?tag=eq.${encodeURIComponent(tag)}&family_key=eq.${encodeURIComponent(cfg.familyKey)}&sent_at=is.null`, {
    method: 'DELETE',
    headers,
  }).catch(() => {})
}

/**
 * Same as `cancelNotification`, but for every pending reminder whose tag starts with `prefix` - used to cancel a
 * whole calendar event/series in one call (see `eventReminderPrefix`, family/notify.ts) without needing to know
 * every future date it would otherwise have a reminder queued for. PostgREST's `like` filter takes `*` as its
 * wildcard (translated to SQL's `%`), so `prefix*` matches anything starting with `prefix`.
 */
export async function cancelNotificationsByPrefix(sync: SyncManager, prefix: string): Promise<void> {
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anonKey) return
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey }
  const base = `${url.replace(/\/+$/, '')}/rest/v1/scheduled_notifications`
  await fetch(`${base}?tag=like.${encodeURIComponent(prefix + '*')}&family_key=eq.${encodeURIComponent(cfg.familyKey)}&sent_at=is.null`, {
    method: 'DELETE',
    headers,
  }).catch(() => {})
}

/**
 * Queue one copy of a reminder per person in `memberIds`, each targeted at that person's own devices (the send
 * function filters by member_id) and tagged `<tag>:<memberId>`. Clears every earlier copy first - including one
 * queued before reminders were targeted, under the bare `tag`, which went to every device in the family - so
 * re-scheduling supersedes, and someone no longer in the list doesn't keep a stale copy. With nobody to send to,
 * it only clears.
 */
export async function scheduleNotificationFor(sync: SyncManager, memberIds: readonly string[], draft: Omit<ScheduledNotificationDraft, 'memberId'>): Promise<void> {
  await cancelNotificationFor(sync, draft.tag)
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!cfg?.familyKey || !url || !anonKey || !memberIds.length) return
  await insertRows(
    `${url.replace(/\/+$/, '')}/rest/v1/scheduled_notifications`,
    { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' },
    memberIds.map((m) => ({ family_key: cfg.familyKey, member_id: m, fire_at: new Date(draft.fireAt).toISOString(), title: draft.title, body: draft.body, tag: `${draft.tag}:${m}`, label: draft.label })),
  )
}

/** Cancel every copy of a reminder queued with `scheduleNotificationFor` (and any older untargeted one). */
export async function cancelNotificationFor(sync: SyncManager, tag: string): Promise<void> {
  await cancelNotification(sync, tag)
  await cancelNotificationsByPrefix(sync, `${tag}:`)
}

/** Current subscription state for this device, without prompting for anything. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready.catch(() => undefined)
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

/** Unsubscribe this device and remove its row from the family's push_subscriptions table. */
export async function unsubscribeFromPush(sync: SyncManager): Promise<void> {
  const sub = await currentPushSubscription()
  if (!sub) return
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  if (!cfg?.familyKey || !url || !anonKey) return
  await fetch(`${url.replace(/\/+$/, '')}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey },
  }).catch(() => {})
}

/**
 * Save the current calm choices to this device's subscription row (and, for a parent, the family-wide "repeat
 * reminders for children" switch to every device in the family). Quietly does nothing if there is no subscription
 * or the project hasn't had supabase/schema_v7.sql run yet.
 */
export async function savePushPrefs(sync: SyncManager, role: string | undefined, choices: CalmNotifyChoices): Promise<boolean> {
  saveNotifyChoices(choices)
  const sub = await currentPushSubscription()
  const cfg = sync.config()
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  if (!sub || !cfg?.familyKey || !url || !anonKey) return false
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
  const base = `${url.replace(/\/+$/, '')}/rest/v1/push_subscriptions`
  const mine = await fetch(`${base}?family_key=eq.${encodeURIComponent(cfg.familyKey)}&endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'PATCH', headers, body: JSON.stringify({ prefs: prefsFor(role, choices) }) }).catch(() => undefined)
  if (role === 'parent') {
    await fetch(`${base}?family_key=eq.${encodeURIComponent(cfg.familyKey)}`, { method: 'PATCH', headers, body: JSON.stringify({ repeat_kids: !!choices.repeatKids }) }).catch(() => {})
  }
  return !!mine?.ok
}
