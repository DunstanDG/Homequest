/**
 * Shared, pure content for the "feed in progress" local notification (see docs/PUSH_NOTIFICATIONS.md). This is a
 * LOCAL notification - created directly on this device via `registration.showNotification`, not a server push -
 * so it updates the instant the feed's state changes here, with no cron tick or Edge Function involved.
 *
 * Every platform gets the same `actions` array. A browser that doesn't support notification action buttons (iOS
 * Safari, as of writing) silently ignores `actions` per spec and just shows a plain, tap-to-open notification -
 * no feature-detection needed here or anywhere else.
 *
 * Kept here, not duplicated in src/app or src/sw.ts, so the wording used by the running app
 * (src/app/feedRunNotify.ts, which shows/updates it) and by the service worker (src/sw.ts, which refreshes it
 * after handling a button tap with no app open) can never drift apart.
 */
import { feedActiveSec, type FeedRunState } from './care'

export type FeedNotifyAction = 'switch' | 'pause' | 'resume' | 'end'

export interface FeedNotifyContent {
  title: string
  body: string
  actions: { action: FeedNotifyAction; title: string }[]
}

export const feedNotifyTag = (feedRunId: string): string => `feedrun:${feedRunId}`

const sideWord = (s: FeedRunState['side']): string => (s === 'L' ? 'left' : 'right')

export function feedNotifyContent(r: FeedRunState, now = Date.now()): FeedNotifyContent {
  const mins = Math.max(0, Math.round(feedActiveSec(r, now) / 60))
  const paused = r.status === 'paused'
  return {
    title: `${paused ? 'Feed paused' : 'Feeding'} — ${sideWord(r.side)} side`,
    body: `${mins} min so far.`,
    actions: [
      { action: 'switch', title: `Switch to ${sideWord(r.side === 'L' ? 'R' : 'L')}` },
      paused ? { action: 'resume', title: 'Resume' } : { action: 'pause', title: 'Pause' },
      { action: 'end', title: 'End feed' },
    ],
  }
}
