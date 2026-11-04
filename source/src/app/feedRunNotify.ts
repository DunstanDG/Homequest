/**
 * Phase 2 web push: a live, actionable "feed in progress" notification (see docs/PUSH_NOTIFICATIONS.md). Unlike
 * every other trigger in the app, this one is not a server push through scheduled_notifications/pg_cron - it's a
 * LOCAL notification this device shows itself the moment a breastfeeding session (the only kind of feed with a
 * "side") starts, and updates/closes itself as the session changes. See src/family/feedNotify.ts for the shared
 * content builder and why the buttons need no per-platform feature-detection.
 *
 * The button taps (switch/pause/resume/end) are handled in two places, and must always agree:
 *  - here, via the 'message' the service worker posts when this tab is open (see src/sw.ts's notificationclick) -
 *    the normal path, and it reuses the exact same careActions calls the in-app buttons use (FeedRunBanner in
 *    careWidgets.tsx).
 *  - directly inside src/sw.ts, headlessly, for when no tab is open to receive that message.
 * Reuses the existing "Feed due soon" notification toggle rather than adding a new one.
 */
import { useEffect, useRef } from 'react'
import * as CA from '@/family/careActions'
import { ABANDONED_FEED_RUN_MS, ageDays, feedActiveSec, feedRunOf, feedSideResult, isLiveFeedRun, nextFeedReminderAt, type FeedRunState } from '@/family/care'
import { careRecipients, feedReminderTag } from '@/family/notify'
import { feedNotifyContent, feedNotifyTag, type FeedNotifyAction } from '@/family/feedNotify'
import type { FamilyState, Member } from '@/family/types'
import { notifyTypeOn, useApp, useFamily, type Settings } from './context'
import { cancelNotificationFor, currentPushSubscription, isPushSupported, scheduleNotificationFor } from './push'
import type { SyncManager } from './syncManager'

/** This project's DOM lib is missing a few `showNotification` fields that every target browser actually
 * supports (renotify, actions, requireInteraction) - widen locally rather than fighting the lib type. */
type ShowNotificationOptions = NotificationOptions & { renotify?: boolean; requireInteraction?: boolean; actions?: { action: string; title: string }[] }

/** Live breast-feed runs currently worth a notification - bottle feeds have no "side", so nothing to show. Also
 * excludes anything abandoned more than 4 hours ago (see ABANDONED_FEED_RUN_MS), same as the in-app "pick back
 * up mid-feed" banner already does - otherwise a run that was started but never properly ended (app closed
 * mid-test, crash, etc.) would sit there forever and resurface as a notification claiming a feed that's been
 * "running" for days. */
function liveBreastRuns(f: FamilyState, now = Date.now()): FeedRunState[] {
  return Object.keys(f.feedRuns)
    .map((id) => feedRunOf(f, id))
    .filter((r): r is FeedRunState => !!r && isLiveFeedRun(r) && r.method === 'breast' && now - r.lastTs < ABANDONED_FEED_RUN_MS)
}

/** Re-arm (or cancel) the "next feed due" reminder after a feed ends. Mirrors Care.tsx's own
 * `scheduleFeedReminder`, which does the same thing when a feed is stopped from inside the app - keep the two in
 * sync if that logic ever changes. */
async function rearmFeedDueReminder(sync: SyncManager, settings: Settings, f: FamilyState, baby: Member, feedAt: number): Promise<void> {
  const tag = feedReminderTag(baby.id)
  if (!notifyTypeOn(settings, 'feeds')) return void cancelNotificationFor(sync, tag)
  const fireAt = nextFeedReminderAt(ageDays(baby, feedAt), feedAt)
  if (!fireAt) return void cancelNotificationFor(sync, tag)
  await scheduleNotificationFor(sync, careRecipients(f), { fireAt, title: `${baby.name}: feed due soon`, body: `It's been about the usual gap since the last feed.`, tag })
}

/**
 * Mounted once near the top of the app (see Shell in App.tsx, alongside useCalendarReminders). Shows/updates/
 * closes the live feed notification as breastfeeding sessions start, change and end, and performs the button
 * actions the service worker forwards here while this tab is open.
 */
export function useFeedRunPushNotifications(): void {
  const { repo, sync, settings, act, demo, toast } = useApp()
  const f = useFamily()
  const shown = useRef<Set<string>>(new Set())
  const warned = useRef(false)

  // Baby care is for parents: a child's phone with notifications on never shows the live feed notification.
  const isParentPhone = f.members[repo.me() ?? '']?.role === 'parent'

  // A child's phone may still be showing one from before this rule existed - close it.
  useEffect(() => {
    if (demo || isParentPhone || !isPushSupported()) return
    void navigator.serviceWorker.ready
      .then((reg) => reg.getNotifications())
      .then((ns) => ns.filter((n) => (n.data as { kind?: string } | null)?.kind === 'feedrun').forEach((n) => n.close()))
      .catch(() => {})
  }, [demo, isParentPhone])

  // ---- show / update / close the notification as live runs change
  useEffect(() => {
    if (demo || !isPushSupported() || !notifyTypeOn(settings, 'feeds') || !isParentPhone) return
    let cancelled = false
    void (async () => {
      try {
        const sub = await currentPushSubscription()
        if (cancelled || !sub) return
        const registration = await navigator.serviceWorker.ready
        const live = liveBreastRuns(f)
        const liveTags = new Set(live.map((r) => feedNotifyTag(r.id)))
        for (const r of live) {
          const tag = feedNotifyTag(r.id)
          const content = feedNotifyContent(r)
          const opts: ShowNotificationOptions = {
            tag,
            renotify: false,
            body: content.body,
            actions: content.actions,
            requireInteraction: true,
            data: { kind: 'feedrun', feedRunId: r.id, babyId: r.babyId, url: './#/care' },
            icon: 'icon-192.png',
            badge: 'icon-192.png',
          }
          await registration.showNotification(content.title, opts)
          shown.current.add(tag)
        }
        for (const tag of [...shown.current]) {
          if (liveTags.has(tag)) continue
          const olds = await registration.getNotifications({ tag })
          for (const n of olds) n.close()
          shown.current.delete(tag)
        }
      } catch (e) {
        // showNotification/getNotifications can throw (revoked permission, an OS-level notification block for
        // this installed app, an unsupported option) and there's no console to check on a phone - surface it
        // once rather than failing silently, same spirit as the rest of the app's toast() usage.
        console.error('[feedRunNotify] failed to show/update the live feed notification:', e)
        if (!warned.current) {
          warned.current = true
          toast(`Couldn't show the feed notification: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [f, demo, settings, isParentPhone])

  // ---- perform a button action the service worker forwards here (only reached while this tab is open - see
  // src/sw.ts for the headless fallback when it isn't)
  useEffect(() => {
    if (!isPushSupported()) return
    const onMessage = (event: MessageEvent) => {
      const msg = event.data as { type?: string; action?: FeedNotifyAction; feedRunId?: string; babyId?: string } | undefined
      if (msg?.type !== 'feedrun-action' || !msg.action || !msg.feedRunId || !msg.babyId) return
      const actor = repo.me()
      const state = feedRunOf(repo.family(), msg.feedRunId)
      if (!actor || !state || !isLiveFeedRun(state)) return
      if (msg.action === 'switch') act(CA.switchFeedSide(actor, msg.babyId, msg.feedRunId, state.side === 'L' ? 'R' : 'L'))
      else if (msg.action === 'pause') act(CA.pauseFeedRun(actor, msg.babyId, msg.feedRunId))
      else if (msg.action === 'resume') act(CA.resumeFeedRun(actor, msg.babyId, msg.feedRunId))
      else if (msg.action === 'end') {
        const minutes = Math.max(0, Math.round(feedActiveSec(state) / 60))
        const side = feedSideResult(state)
        act(CA.stopFeedRun(actor, repo.family(), msg.feedRunId, { minutes, side, babyId: msg.babyId, method: 'breast', startedTs: state.startedTs }))
        const baby = repo.family().members[msg.babyId]
        if (baby) void rearmFeedDueReminder(sync, settings, repo.family(), baby, state.startedTs)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, sync, settings])
}
