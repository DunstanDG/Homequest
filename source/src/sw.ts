/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
/**
 * HomeQuest's custom service worker (Phase 1 web push, plus the Phase 2 live "feed in progress" notification).
 *
 * This file is the injectManifest source (see vite.config.ts): vite-plugin-pwa's own build step compiles it with
 * esbuild and injects the precache manifest at `self.__WB_MANIFEST`, so it is NOT part of the main app's `tsc`/vitest
 * build (excluded in tsconfig.json) and doesn't need any bundler config of its own beyond what vite-plugin-pwa does.
 *
 * Below the precache line: a `push` event shows a notification from the JSON payload the Edge Function sent, and
 * `notificationclick` focuses or opens the app for a plain tap. The one exception is a button tap on the live
 * feed notification (see src/family/feedNotify.ts, src/app/feedRunNotify.ts) - those never open a window; they're
 * forwarded to an open tab if there is one, or, if the app is fully closed, handled right here: read straight
 * from this device's IndexedDB (the same 'studyquest' store the app itself uses), build the same event(s) the
 * in-app buttons would, save them locally, and best-effort push them to the family's Supabase project immediately
 * so other phones see the change without waiting for the app to next be opened.
 */
import { precacheAndRoute } from 'workbox-precaching'
import { createStore, get as idbGet, set as idbSet, setMany as idbSetMany, values as idbValues } from 'idb-keyval'
import { ENV_SUPABASE_ANON_KEY, ENV_SUPABASE_URL } from '@/app/config'
import { makeEvent } from '@/engine/make'
import type { AppEvent } from '@/engine/types'
import { ageDays, feedActiveSec, feedRunOf, feedSideResult, isLiveFeedRun, nextFeedReminderAt } from '@/family/care'
import { pauseFeedRun, resumeFeedRun, switchFeedSide } from '@/family/careActions'
import { feedNotifyContent, feedNotifyTag, type FeedNotifyAction } from '@/family/feedNotify'
import { careRecipients, feedReminderTag, recipientTag } from '@/family/notify'
import { projectFamily } from '@/family/project'
import type { FamilyState, Member } from '@/family/types'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

// A new version installs and then waits; the app tells it to take over at a quiet moment or when someone taps
// Restart (src/app/update.ts). The message is the one workbox-window sends.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
  tag?: string
  url?: string
}

/** Where tapping a notification goes: the home server's journey alerts open Travel; its morning overview, "on track?"
 * questions and the notes they send the other parents open Today, where they can be answered; round table notes open
 * the round table. */
const pushUrl = (tag = ''): string =>
  /^hs:roundtable/.test(tag) ? './#/round-table' : /^hs:(morning|nudge|late|swap):/.test(tag) ? './' : tag.startsWith('hs:') ? './#/travel' : './'

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {}
  try {
    data = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    data = { body: event.data?.text() }
  }
  const title = data.title || 'HomeQuest'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? '',
      tag: data.tag,
      // Coalesce reminders for the same tag (e.g. a superseded medicine dose) into one visible notification.
      renotify: !!data.tag,
      data: { url: data.url ?? pushUrl(data.tag) },
      icon: 'icon-192.png',
      badge: 'icon-192.png',
    }),
  )
})

interface FeedRunNotifyData {
  kind: 'feedrun'
  feedRunId: string
  babyId: string
  url: string
}

// ---------------------------------------------------------------------------------------------------------
// Headless feed-run actions: only reached when a button on the live feed notification is tapped with no app
// tab open anywhere. Everything here reads/writes the SAME local storage the app's own Repo/SyncManager use
// (src/storage/local.ts, src/app/syncManager.ts) - 'studyquest' is that module's default namespace, and there
// is only one call site (src/app/context.tsx) and it never overrides it.
const NAMESPACE = 'studyquest'

async function loadLocalSyncConfig(): Promise<{ actor: string; url: string; anonKey: string; familyKey: string } | undefined> {
  const kv = createStore(`${NAMESPACE}-kv`, 'kv')
  const [actor, cfg] = await Promise.all([
    idbGet<string>('me', kv),
    idbGet<{ familyKey: string; url?: string; anonKey?: string }>('sync.config', kv),
  ])
  const url = cfg?.url ?? ENV_SUPABASE_URL
  const anonKey = cfg?.anonKey ?? ENV_SUPABASE_ANON_KEY
  if (!actor || !cfg?.familyKey || !url || !anonKey) return undefined
  return { actor, url, anonKey, familyKey: cfg.familyKey }
}

async function loadAllLocalEvents(): Promise<AppEvent[]> {
  return (await idbValues(createStore(`${NAMESPACE}-events`, 'events'))) as AppEvent[]
}

/** Save new events locally and queue them for the next real sync - same as Repo.apply/Repo.sync's own
 * bookkeeping, so nothing is lost even if the immediate push below fails. */
async function appendLocalEvents(evs: AppEvent[]): Promise<void> {
  if (!evs.length) return
  const evStore = createStore(`${NAMESPACE}-events`, 'events')
  const kv = createStore(`${NAMESPACE}-kv`, 'kv')
  await idbSetMany(
    evs.map((e) => [e.id, e] as [string, AppEvent]),
    evStore,
  )
  const pending = (await idbGet<string[]>('sync.pending', kv)) ?? []
  await idbSet('sync.pending', [...pending, ...evs.map((e) => e.id)], kv)
}

/** Best-effort immediate push (see storage/supabase.ts's own push, mirrored here) so other devices see the
 * change right away. If this fails - offline, expired key, whatever - the events stay queued in sync.pending
 * (appendLocalEvents already took care of that) and the app's normal SyncManager sends them next time it runs. */
async function pushEventsNow(cfg: { url: string; anonKey: string; familyKey: string }, evs: AppEvent[]): Promise<void> {
  if (!evs.length) return
  const body = evs.map((e) => ({ id: e.id, family_key: cfg.familyKey, learner_id: e.learnerId, ts: e.ts, type: e.type, body: e }))
  await fetch(`${cfg.url.replace(/\/+$/, '')}/rest/v1/events?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'x-family-key': cfg.familyKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => {})
}

/** Mirrors Care.tsx's `scheduleFeedReminder` / app/feedRunNotify.ts's `rearmFeedDueReminder` for this headless
 * path - keep all three in sync if that logic ever changes. */
async function rearmFeedDueReminderHeadless(cfg: { url: string; anonKey: string; familyKey: string }, fam: FamilyState, baby: Member | undefined, feedAt: number): Promise<void> {
  if (!baby) return
  const tag = feedReminderTag(baby.id)
  const base = `${cfg.url.replace(/\/+$/, '')}/rest/v1/scheduled_notifications`
  const headers = { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' }
  const pending = `family_key=eq.${encodeURIComponent(cfg.familyKey)}&sent_at=is.null`
  // Same as the app's scheduleNotificationFor (app/push.ts): clear the old untargeted copy and every per-parent copy,
  // then queue one per parent - baby-care reminders never go to a child's phone.
  await fetch(`${base}?tag=eq.${encodeURIComponent(tag)}&${pending}`, { method: 'DELETE', headers }).catch(() => {})
  await fetch(`${base}?tag=like.${encodeURIComponent(`${tag}:*`)}&${pending}`, { method: 'DELETE', headers }).catch(() => {})
  const fireAt = nextFeedReminderAt(ageDays(baby, feedAt), feedAt)
  const parents = careRecipients(fam)
  if (!fireAt || !parents.length) return
  await fetch(base, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(parents.map((m) => ({ family_key: cfg.familyKey, member_id: m, fire_at: new Date(fireAt).toISOString(), title: `${baby.name}: feed due soon`, body: `It's been about the usual gap since the last feed.`, tag: recipientTag(tag, m) }))),
  }).catch(() => {})
}

async function handleFeedActionHeadless(action: FeedNotifyAction, feedRunId: string, babyId: string): Promise<void> {
  const cfg = await loadLocalSyncConfig()
  if (!cfg) return
  const allEvents = await loadAllLocalEvents()
  const state = feedRunOf(projectFamily(allEvents), feedRunId)
  if (!state || !isLiveFeedRun(state)) return

  const now = Date.now()
  let newEvents: AppEvent[]
  if (action === 'switch') newEvents = switchFeedSide(cfg.actor, babyId, feedRunId, state.side === 'L' ? 'R' : 'L', now)
  else if (action === 'pause') newEvents = pauseFeedRun(cfg.actor, babyId, feedRunId, now)
  else if (action === 'resume') newEvents = resumeFeedRun(cfg.actor, babyId, feedRunId, now)
  else {
    const minutes = Math.max(0, Math.round(feedActiveSec(state, now) / 60))
    const side = feedSideResult(state)
    newEvents = [
      makeEvent(cfg.actor, { type: 'feedrun', feedRunId, babyId, action: 'stop' }, now),
      makeEvent(cfg.actor, { type: 'baby', babyId, kind: 'feed', at: state.startedTs, feed: { method: 'breast', side, minutes } }, now + 1),
    ]
  }

  await appendLocalEvents(newEvents)
  await pushEventsNow(cfg, newEvents)

  if (action === 'end') {
    const fam = projectFamily(allEvents)
    await rearmFeedDueReminderHeadless(cfg, fam, fam.members[babyId], state.startedTs)
    for (const n of await self.registration.getNotifications({ tag: feedNotifyTag(feedRunId) })) n.close()
  } else {
    const updated = feedRunOf(projectFamily([...allEvents, ...newEvents]), feedRunId)
    if (updated) {
      const content = feedNotifyContent(updated, now)
      await self.registration.showNotification(content.title, {
        tag: feedNotifyTag(feedRunId),
        renotify: false,
        body: content.body,
        actions: content.actions,
        requireInteraction: true,
        data: { kind: 'feedrun', feedRunId, babyId, url: './#/care' } satisfies FeedRunNotifyData,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
      })
    }
  }
}

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  const data = event.notification.data as (FeedRunNotifyData & Partial<PushPayload>) | PushPayload | undefined
  const action = event.action as FeedNotifyAction | ''

  // A button tap on the live feed notification - handled in place, never opening/focusing a window (the whole
  // point of the buttons is to control the feed without switching to the app).
  if (data && 'kind' in data && data.kind === 'feedrun' && action) {
    const { feedRunId, babyId } = data
    event.waitUntil(
      (async () => {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        if (clientsList.length) {
          for (const c of clientsList) c.postMessage({ type: 'feedrun-action', action, feedRunId, babyId })
        } else {
          await handleFeedActionHeadless(action, feedRunId, babyId)
        }
      })(),
    )
    return
  }

  event.notification.close()
  // Home server alerts (leave times, disruption, alarms) are tagged `hs:...` and open Travel and alarms.
  const tag = event.notification.tag || (data as PushPayload | undefined)?.tag || ''
  const targetUrl = (data as PushPayload | undefined)?.url ?? pushUrl(tag)
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientsList) {
        if ('focus' in client) {
          if (tag.startsWith('hs:')) client.postMessage({ type: 'navigate', to: '/travel' })
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })(),
  )
})
