/**
 * Auto-close abandoned feed runs. A breastfeed timer left running with no activity for ABANDONED_FEED_RUN_MS (see
 * care.ts) is almost certainly forgotten, not still feeding - but until now that only made it invisible (hidden
 * from the "pick back up mid-feed" banner and the live push notification, see feedRunNotify.ts), while the run
 * itself sat in feedRuns forever, never actually logged as a feed anyone could see in the day's list.
 *
 * This closes it out itself the moment it crosses that threshold: logs it as a normal feed, ending it exactly
 * where its own events leave off (nothing is added for the hours of silence since - see careActions.ts's
 * autoCloseFeedRun). If the guess is wrong - the real feed was shorter, or started at a slightly different time -
 * use the pencil/edit button on that log entry in Care.tsx to fix it once you notice.
 */
import { useEffect } from 'react'
import * as CA from '@/family/careActions'
import { ABANDONED_FEED_RUN_MS, feedRunOf, isLiveFeedRun, type FeedRunState } from '@/family/care'
import type { FamilyState } from '@/family/types'
import { useApp, useFamily, useNow } from './context'

function abandonedBreastRuns(f: FamilyState, now: number): FeedRunState[] {
  return Object.keys(f.feedRuns)
    .map((id) => feedRunOf(f, id))
    .filter((r): r is FeedRunState => !!r && isLiveFeedRun(r) && r.method !== 'bottle' && now - r.lastTs >= ABANDONED_FEED_RUN_MS)
}

/** Mounted once near the top of the app (see Shell in App.tsx, alongside useFeedRunPushNotifications). Checks every
 * minute (useNow) so a run crosses the threshold on its own even if nothing else changes in the meantime. */
export function useAutoCloseAbandonedFeeds(): void {
  const { repo, act, demo } = useApp()
  const f = useFamily()
  const now = useNow(60_000)

  useEffect(() => {
    if (demo) return
    const actor = repo.me()
    if (!actor) return
    for (const r of abandonedBreastRuns(f, now)) act(CA.autoCloseFeedRun(actor, r))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, now, demo])
}
