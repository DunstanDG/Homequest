/**
 * Optional "time for your check-in" push reminders. One per person per check-in (tag `checkin:<part>:<member>`), queued for the
 * next time that check-in opens and cancelled once it has been done. Like the homework alerts this is a rolling resync: it
 * runs when the app is open and the relevant settings or check-ins change, so a phone that is never opened stops getting them.
 */
import { useEffect, useMemo, useRef } from 'react'
import { configOf, hasCheckin, nextOpenAt } from '@/family/checkin/checkin'
import { dayTypeOf } from '@/family/checkin/dayType'
import { makeCalCtx } from '@/family/calendar'
import { ymdOf } from '@/family/dates'
import type { CheckinPart, FamilyState, MemberId } from '@/family/types'
import { notifyTypeOn, useApp, useFamily, type Settings } from './context'
import { cancelNotification, scheduleNotification } from './push'
import type { SyncManager } from './syncManager'

const PARTS: CheckinPart[] = ['morning', 'evening']

export const checkinTag = (part: CheckinPart, memberId: MemberId): string => `checkin:${part}:${memberId}`

export async function resyncCheckinReminders(f: FamilyState, sync: SyncManager, settings: Settings, now = Date.now()): Promise<void> {
  if (!sync.effectiveUrl() || !sync.effectiveAnonKey()) return
  const on = notifyTypeOn(settings, 'checkin')
  const ctx = makeCalCtx(f)
  for (const m of Object.values(f.members)) {
    if (!hasCheckin(m)) continue
    for (const part of PARTS) {
      const fireAt = on && configOf(f, m.id).remind ? nextOpenAt(f, m.id, part, now, (d) => dayTypeOf(ctx, m.id, d)) : undefined
      const tag = checkinTag(part, m.id)
      if (!fireAt) {
        await cancelNotification(sync, tag)
        continue
      }
      await scheduleNotification(sync, {
        memberId: m.id,
        fireAt,
        title: part === 'morning' ? 'Morning check-in' : 'Evening check-in',
        body: part === 'morning' ? 'A minute to look at the day ahead and start well.' : 'A minute to look back at the day and wind down.',
        label: part === 'morning' ? 'Morning check-in' : 'Evening check-in',
        tag,
      })
    }
  }
}

/** What the reminders depend on, so the resync only runs when it matters. */
function signature(f: FamilyState, today: string): string {
  const people = Object.values(f.members)
    .filter(hasCheckin)
    .map((m) => {
      const c = configOf(f, m.id)
      const done = PARTS.map((p) => (f.checkins[`${m.id}|${today}|${p}`] ? 1 : 0)).join('')
      const w = f.checkinConfig[m.id]?.weekend
      return `${m.id}:${c.enabled ? 1 : 0}${c.remind ? 1 : 0}:${c.morningFrom}:${c.eveningFrom}:${w ? `${w.morningFrom}:${w.eveningFrom}` : '-'}:${done}`
    })
    .sort()
  return `${today}|${people.join(',')}`
}

/** Mounted once in App.tsx's Shell, next to the homework alerts. */
export function useCheckinReminders(): void {
  const { sync, settings, demo } = useApp()
  const f = useFamily()
  const sig = useMemo(() => signature(f, ymdOf(Date.now())), [f])
  const latest = useRef(f)
  latest.current = f
  useEffect(() => {
    if (demo) return
    let cancelled = false
    const run = () => {
      if (!cancelled) void resyncCheckinReminders(latest.current, sync, settings)
    }
    run()
    const id = window.setInterval(run, 60 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sig, sync, settings, demo])
}
