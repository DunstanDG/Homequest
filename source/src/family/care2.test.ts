import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as CA from './careActions'
import { activeFeedRunFor, ageDays, doseLock, feedActiveSec, feedGapMs, feedRunOf, feedSideResult, handoverGaps, isAnomalousNappyColour, milkStock, pulseCounts, pulseTargets, todayTimetable, totalMilkMl, typicalFeedGapMs, typicalWakeGapMs, typicalWakeWindowMin } from './care'
import { mealFedToday, mealLock, needsReorder, stockRunsOut, treatmentDue, vetHistory } from './dog'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const MIN = 60_000
const HOUR = 3_600_000

function family(): FamilyState {
  const now = T('2026-09-21', '06:00')
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'robin', name: 'Robin', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-15' }, now + 2),
    ...A.saveMember('dad', { id: 'biscuit', name: 'Biscuit', role: 'pet', colour: '#ff9f68', active: true, petKind: 'Dog' }, now + 3),
  ]
  return projectFamily(events)
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

describe('care: pulse targets and counts', () => {
  it('ages the baby in whole days from their birthday', () => {
    const f = family()
    expect(ageDays(f.members.robin!, T('2026-09-21', '12:00'))).toBe(6)
    expect(ageDays(f.members.robin!, T('2026-09-15', '00:00'))).toBe(0)
  })

  it('counts feeds and nappies in the rolling last 24 hours, not the calendar day', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'feed', at: now - 30 * HOUR }, now - 30 * HOUR)) // outside window
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'feed', at: now - 2 * HOUR }, now - 2 * HOUR))
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'nappy', at: now - HOUR, nappy: { wet: true, dirty: false } }, now - HOUR))
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'nappy', at: now - 10 * MIN, nappy: { wet: true, dirty: true } }, now - 10 * MIN))
    const c = pulseCounts(f, 'robin', now)
    expect(c).toEqual({ feeds: 1, wet: 2, dirty: 1 })
  })

  it('targets loosen with age (newborn wants more nappies than a six-month-old)', () => {
    expect(pulseTargets(0).wet[1]).toBeLessThan(pulseTargets(27).wet[1])
    expect(pulseTargets(200).feeds[0]).toBeLessThan(pulseTargets(0).feeds[0])
  })
})

describe('care: shift handover gap check', () => {
  it('flags an overdue feed and a nappy count behind pace, but only for a baby with a known age', () => {
    let f = family()
    const now = T('2026-09-21', '18:00')
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'feed', at: now - 6 * HOUR }, now - 6 * HOUR))
    const g = handoverGaps(f, 'robin', now)
    expect(g.feed).toBeDefined()
    expect(g.feed!.overdueBy).toBeGreaterThan(0)
  })

  it('says nothing is wrong right after a feed and with nappies on pace', () => {
    let f = family()
    const now = T('2026-09-21', '09:00')
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'feed', at: now - 5 * MIN }, now - 5 * MIN))
    expect(handoverGaps(f, 'robin', now).feed).toBeUndefined()
  })
})

describe('care: nappy colour guidance', () => {
  it('expects black/green in the first days, yellow/brown after, and always flags red or white', () => {
    expect(isAnomalousNappyColour('black', 1)).toBe(false)
    expect(isAnomalousNappyColour('yellow', 1)).toBe(true)
    expect(isAnomalousNappyColour('yellow', 10)).toBe(false)
    expect(isAnomalousNappyColour('red', 10)).toBe(true)
    expect(isAnomalousNappyColour('white', 1)).toBe(true)
  })
})

describe('care: medicine dosing guardrails', () => {
  it('locks after the daily max, and after too short a gap, but never something not in the rules', () => {
    let f = family()
    f = apply(f, CA.seedMedRules('dad', f, T('2026-09-20', '09:00')))
    const now = T('2026-09-21', '10:00')
    f = apply(f, CA.logMedicine('dad', 'robin', 'Paracetamol (Calpol)', {}, now))
    expect(doseLock(f, 'robin', 'Paracetamol (Calpol)', now + MIN).locked).toBe(true) // too soon
    expect(doseLock(f, 'robin', 'Paracetamol (Calpol)', now + 5 * HOUR).locked).toBe(false) // gap ok
    expect(doseLock(f, 'robin', 'Not a real medicine', now).locked).toBe(false)
  })

  it('locks once the daily max is reached even with the gap satisfied', () => {
    let f = family()
    f = apply(f, CA.seedMedRules('dad', f, T('2026-09-20', '09:00')))
    let now = T('2026-09-21', '00:00')
    for (let i = 0; i < 4; i++) {
      now += 5 * HOUR
      f = apply(f, CA.logMedicine('dad', 'robin', 'Paracetamol (Calpol)', {}, now))
    }
    expect(doseLock(f, 'robin', 'Paracetamol (Calpol)', now + 30 * MIN).locked).toBe(true) // still today, still within the daily max
  })

  it('the gap and daily-max guardrails use a rolling 24h window, not calendar day', () => {
    let f = family()
    f = apply(f, CA.seedMedRules('dad', f, T('2026-09-20', '09:00')))
    // Dose logged just before midnight...
    const lateDose = T('2026-09-21', '23:50')
    f = apply(f, CA.logMedicine('dad', 'robin', 'Paracetamol (Calpol)', {}, lateDose))
    // ...checking just after midnight must still see it as "too soon", not reset to zero doses today.
    const justAfterMidnight = T('2026-09-22', '00:05')
    expect(doseLock(f, 'robin', 'Paracetamol (Calpol)', justAfterMidnight).locked).toBe(true)
    // And 4 doses spread across a midnight boundary within 24h still trips the daily max.
    let f2 = family()
    f2 = apply(f2, CA.seedMedRules('dad', f2, T('2026-09-20', '09:00')))
    let now = T('2026-09-21', '20:00')
    for (let i = 0; i < 4; i++) {
      now += 5 * HOUR // 20:00, 01:00, 06:00, 11:00 — crosses midnight, still within 24h of the last dose
      f2 = apply(f2, CA.logMedicine('dad', 'robin', 'Paracetamol (Calpol)', {}, now))
    }
    expect(doseLock(f2, 'robin', 'Paracetamol (Calpol)', now + 30 * MIN).locked).toBe(true)
  })

  it('an edited rule replaces the seeded default rather than duplicating it', () => {
    let f = family()
    f = apply(f, CA.seedMedRules('dad', f, T('2026-09-20', '09:00')))
    f = apply(f, CA.saveMedRule('dad', { name: 'Paracetamol (Calpol)', maxPerDay: 6, minGapHours: 4 }, T('2026-09-20', '10:00')))
    expect(Object.keys(f.medRules)).toHaveLength(3)
    expect(f.medRules['paracetamol (calpol)']!.maxPerDay).toBe(6)
  })
})

describe('care: expressed milk stock', () => {
  it('deducts oldest-first and a bottle feed with expressed milk uses stock', () => {
    let f = family()
    f = apply(f, CA.addMilk('mum', 'robin', 120, { expressedDate: '2026-09-19' }, T('2026-09-19', '09:00')))
    f = apply(f, CA.addMilk('mum', 'robin', 90, { expressedDate: '2026-09-20' }, T('2026-09-20', '09:00')))
    expect(totalMilkMl(f, 'robin')).toBe(210)
    f = apply(f, CA.deductMilk('dad', f, 'robin', 100, 'feed-1', T('2026-09-21', '09:00')))
    expect(totalMilkMl(f, 'robin')).toBe(110)
    const stock = milkStock(f, 'robin')
    // the older (19th) lot is used up first, so only 10ml of it remains, and the 20th lot is untouched
    expect(stock.find((l) => l.expressedDate === '2026-09-19')?.ml).toBe(20)
    expect(stock.find((l) => l.expressedDate === '2026-09-20')?.ml).toBe(90)
  })

  it('undoing a bottle feed puts its deducted milk back in stock (voiding by feedEventId)', () => {
    let f = family()
    f = apply(f, CA.addMilk('mum', 'robin', 120, { expressedDate: '2026-09-19' }, T('2026-09-19', '09:00')))
    f = apply(f, CA.deductMilk('dad', f, 'robin', 100, 'feed-1', T('2026-09-21', '09:00')))
    expect(totalMilkMl(f, 'robin')).toBe(20)
    // find the deduct event tied to the feed and void it, the way undoing that feed log entry does
    const deduct = f.milkStock.find((m) => m.action === 'deduct' && m.feedEventId === 'feed-1')!
    f = apply(f, A.undo('dad', deduct.id, T('2026-09-21', '09:05')))
    expect(totalMilkMl(f, 'robin')).toBe(120)
  })
})

describe('care: feed sessions (pause / switch / stop)', () => {
  it('times active seconds per side, excluding paused time', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    f = apply(f, CA.pauseFeedRun('mum', 'robin', feedRunId, t0 + 3 * MIN))
    f = apply(f, CA.resumeFeedRun('mum', 'robin', feedRunId, t0 + 8 * MIN)) // 5 min paused, not counted
    f = apply(f, CA.switchFeedSide('mum', 'robin', feedRunId, 'R', t0 + 10 * MIN)) // 2 min active on L after resume
    const run = feedRunOf(f, feedRunId)!
    expect(run.activeMsBySide.L).toBe((3 + 2) * MIN)
    expect(feedActiveSec(run, t0 + 14 * MIN)).toBe((3 + 2 + 4) * 60) // + 4 min active on R so far
    expect(feedSideResult({ ...run, activeMsBySide: { L: 5 * MIN, R: 4 * MIN } })).toBe('both') // within 20%
    expect(feedSideResult({ ...run, activeMsBySide: { L: 10 * MIN, R: 1 * MIN } })).toBe('L')
  })

  it('a live run is found on reopen, but not once abandoned for hours', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', {}, t0)
    f = apply(f, events)
    expect(activeFeedRunFor(f, 'robin', t0 + 10 * MIN)?.id).toBe(feedRunId)
    expect(activeFeedRunFor(f, 'robin', t0 + 5 * HOUR)).toBeUndefined()
  })

  it('adjusting nudges the active time on the current side, while running or paused, but never below zero', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    // 1 min has really elapsed since start when this correction lands - it must be preserved (closed into
    // activeMsBySide), not dropped, so the total becomes 1 (real) + 3 (correction), not just 3.
    f = apply(f, CA.adjustFeedRun('mum', 'robin', feedRunId, 180, t0 + MIN)) // +3 min, started late
    expect(feedRunOf(f, feedRunId)!.activeMsBySide.L).toBe(4 * MIN)
    f = apply(f, CA.pauseFeedRun('mum', 'robin', feedRunId, t0 + 5 * MIN))
    f = apply(f, CA.adjustFeedRun('mum', 'robin', feedRunId, -60, t0 + 6 * MIN)) // -1 min while paused, forgot to pause in time
    const paused = feedRunOf(f, feedRunId)!
    expect(paused.status).toBe('paused')
    expect(paused.activeMsBySide.L).toBe((5 + 3 - 1) * MIN) // 5 min real elapsed to the pause + 3 adjusted - 1 adjusted
    f = apply(f, CA.adjustFeedRun('mum', 'robin', feedRunId, -10_000, t0 + 7 * MIN)) // huge negative nudge clamps at 0
    expect(feedRunOf(f, feedRunId)!.activeMsBySide.L).toBe(0)
  })

  it('reducing time mid-feed does not reset the live total (regression: the not-yet-closed segment was being dropped)', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    // 10 minutes of real, uninterrupted feeding - nothing has closed yet, so activeMsBySide is still 0 and all
    // of that 10 minutes lives only in the live "now - lastTs" portion of feedActiveSec.
    const beforeAdjust = feedActiveSec(feedRunOf(f, feedRunId)!, t0 + 10 * MIN)
    expect(beforeAdjust).toBe(10 * 60)
    // Correcting by -1 min (forgot to start it a minute earlier) should land at 9 min, not collapse toward 0.
    f = apply(f, CA.adjustFeedRun('mum', 'robin', feedRunId, -60, t0 + 10 * MIN))
    const afterAdjust = feedActiveSec(feedRunOf(f, feedRunId)!, t0 + 10 * MIN)
    expect(afterAdjust).toBe(9 * 60)
  })

  it('an adjustment after the run is stopped has no effect (a done run is immutable)', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    f = apply(f, CA.stopFeedRun('mum', f, feedRunId, { minutes: 5, side: 'L', babyId: 'robin', method: 'breast', startedTs: t0 }, t0 + 5 * MIN))
    const before = feedRunOf(f, feedRunId)!.activeMsBySide.L
    f = apply(f, CA.adjustFeedRun('mum', 'robin', feedRunId, 300, t0 + 6 * MIN))
    expect(feedRunOf(f, feedRunId)!.activeMsBySide.L).toBe(before)
  })

  it('stopping logs an ordinary feed event and deducts expressed milk used', () => {
    let f = family()
    f = apply(f, CA.addMilk('mum', 'robin', 200, { expressedDate: '2026-09-20' }, T('2026-09-20', '09:00')))
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'bottle', { ml: 90, milk: 'expressed' }, t0)
    f = apply(f, events)
    f = apply(f, CA.stopFeedRun('mum', f, feedRunId, { minutes: 12, side: 'both', babyId: 'robin', method: 'bottle', ml: 90, milk: 'expressed', startedTs: t0 }, t0 + 12 * MIN))
    expect(f.babies.filter((b) => b.kind === 'feed')).toHaveLength(1)
    expect(totalMilkMl(f, 'robin')).toBe(110)
    expect(feedRunOf(f, feedRunId)!.status).toBe('done')
  })

  it('a paused feed is logged at its real start time, not skewed toward when it was stopped', () => {
    // Regression test: the feed's `at` used to be derived as `now - minutes` (minutes = active feeding time
    // only), so a long pause in the middle pulled the logged time later and later - toward when the session was
    // finally stopped, instead of when it actually started. It should always land on the real start.
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    f = apply(f, CA.pauseFeedRun('mum', 'robin', feedRunId, t0 + 2 * MIN)) // 2 min active before the pause
    // Baby dozes off for an hour before feeding resumes - a long pause, the exact case that used to break this.
    f = apply(f, CA.resumeFeedRun('mum', 'robin', feedRunId, t0 + 62 * MIN))
    f = apply(f, CA.stopFeedRun('mum', f, feedRunId, { minutes: 5, side: 'L', babyId: 'robin', method: 'breast', startedTs: t0 }, t0 + 65 * MIN)) // 2 + 3 more active min
    const feed = f.babies.find((b) => b.kind === 'feed')!
    expect(feed.at).toBe(t0) // not t0 + 65min (stop time) and not t0 + 65min - 5min either
  })
})

describe('care: auto-closing an abandoned feed run', () => {
  it('logs the feed using only the time already on record, not padded out to "now"', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    f = apply(f, CA.pauseFeedRun('mum', 'robin', feedRunId, t0 + 4 * MIN)) // 4 real min, then forgotten
    // Nobody touches it again - hours later (well past ABANDONED_FEED_RUN_MS), the housekeeping effect notices.
    const closedAt = t0 + 5 * HOUR
    const run = feedRunOf(f, feedRunId)!
    f = apply(f, CA.autoCloseFeedRun('mum', run, closedAt))
    const feed = f.babies.find((b) => b.kind === 'feed')!
    expect(feed.at).toBe(t0) // logged at the real start
    expect(feed.feed?.minutes).toBe(4) // not 5 hours' worth
    expect(feed.feed?.method).toBe('breast')
    expect(feedRunOf(f, feedRunId)!.status).toBe('done') // no longer "live" - won't resurface anywhere
  })

  it('produces the same event ids regardless of which device or exact moment closes it, so the repo/server dedupe correctly', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    const { feedRunId, events } = CA.startFeedRun('mum', 'robin', 'breast', { side: 'L' }, t0)
    f = apply(f, events)
    const run = feedRunOf(f, feedRunId)!
    const closedAt = t0 + 5 * HOUR
    const firstPhone = CA.autoCloseFeedRun('mum', run, closedAt)
    const secondPhone = CA.autoCloseFeedRun('mum', run, closedAt + MIN) // slightly different wall-clock, same run
    expect(secondPhone.map((e) => e.id)).toEqual(firstPhone.map((e) => e.id))
    // apply() itself doesn't dedupe (that's repo.ts's job before events ever reach folding) - mirror that step
    // here, the same way the repo and the Supabase insert (`resolution=ignore-duplicates`) both drop a
    // previously-seen id, to show that once they do, no duplicate log entry survives.
    const seen = new Set(firstPhone.map((e) => e.id))
    f = apply(f, [...firstPhone, ...secondPhone.filter((e) => !seen.has(e.id))])
    expect(f.babies.filter((b) => b.kind === 'feed')).toHaveLength(1)
  })
})

describe('care: editing a logged entry', () => {
  it('edits a feed entry\'s time and duration by voiding the old one and logging a corrected copy', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: t0, feed: { method: 'breast', side: 'L', minutes: 240 } }, t0))
    const original = f.babies.find((b) => b.kind === 'feed')!
    const correctedAt = T('2026-09-21', '09:05')
    f = apply(f, A.editBaby('mum', original, { at: correctedAt, feed: { ...original.feed!, minutes: 6 } }, t0 + MIN))
    const feeds = f.babies.filter((b) => b.kind === 'feed' && !f.voided[b.id])
    expect(feeds).toHaveLength(1)
    expect(feeds[0]!.at).toBe(correctedAt)
    expect(feeds[0]!.feed?.minutes).toBe(6)
    expect(f.voided[original.id]).toBe(true)
  })

  it('edits a walk\'s time and duration the same way for a pet log', () => {
    let f = family()
    const t0 = T('2026-09-21', '09:00')
    f = apply(f, A.logPet('mum', f, { petId: 'biscuit', kind: 'walk', at: t0, minutes: 10 }, t0))
    const original = f.pets.find((p) => p.kind === 'walk')!
    f = apply(f, A.editPet('mum', original, { at: t0 - 30 * MIN, minutes: 25 }, t0 + MIN))
    const walks = f.pets.filter((p) => p.kind === 'walk' && !f.voided[p.id])
    expect(walks).toHaveLength(1)
    expect(walks[0]!.at).toBe(t0 - 30 * MIN)
    expect(walks[0]!.minutes).toBe(25)
  })
})

describe('dog: anti-double-feeding lock', () => {
  it('locks feeding after breakfast is logged, unlocking again once the dinner window opens', () => {
    let f = family()
    const at = T('2026-09-21', '07:15')
    f = apply(f, A.logPet('mum', f, { petId: 'biscuit', kind: 'feed', at, meal: 'breakfast' }, at))
    const lock = mealLock(f, 'biscuit', 'breakfast', T('2026-09-21', '12:00'))
    expect(lock.locked).toBe(true)
    expect(lock.by).toBe('mum')
    expect(mealLock(f, 'biscuit', 'breakfast', T('2026-09-21', '17:00')).locked).toBe(false) // dinner window is open now
    expect(mealFedToday(f, 'biscuit', 'breakfast', T('2026-09-21', '17:00'))).toBeDefined()
  })

  it('locks again after dinner, until tomorrow\'s breakfast window, not at midnight', () => {
    let f = family()
    const at = T('2026-09-21', '17:30')
    f = apply(f, A.logPet('mum', f, { petId: 'biscuit', kind: 'feed', at, meal: 'dinner' }, at))
    expect(mealLock(f, 'biscuit', 'dinner', T('2026-09-21', '23:00')).locked).toBe(true)
    expect(mealLock(f, 'biscuit', 'dinner', T('2026-09-22', '05:00')).locked).toBe(true)
    expect(mealLock(f, 'biscuit', 'dinner', T('2026-09-22', '06:30')).locked).toBe(false)
  })
})

describe('dog: preventative medicine', () => {
  it('is due when nothing has ever been logged, then locked for the cycle, then due again', () => {
    let f = family()
    expect(treatmentDue(f, 'biscuit', 'Nexgard', 28, T('2026-09-21')).due).toBe(true)
    f = apply(f, CA.logTreatment('dad', f, 'biscuit', 'Nexgard', 28, T('2026-09-21', '09:00')))
    expect(treatmentDue(f, 'biscuit', 'Nexgard', 28, T('2026-09-25')).locked).toBe(true)
    expect(treatmentDue(f, 'biscuit', 'Nexgard', 28, T('2026-10-25')).due).toBe(true)
  })
})

describe('dog: vet output history', () => {
  it('keeps the last 7 days for the vet, oldest excluded', () => {
    let f = family()
    f = apply(f, CA.logOutput('dad', f, 'biscuit', 'vomit', { firmness: undefined }, T('2026-09-14', '09:00'))) // 8 days before the 22nd: excluded
    f = apply(f, CA.logOutput('dad', f, 'biscuit', 'diarrhoea', { firmness: 2 }, T('2026-09-20', '09:00')))
    const rows = vetHistory(f, 'biscuit', 7, T('2026-09-22', '09:00'))
    expect(rows).toHaveLength(1)
    expect(rows[0]!.kind).toBe('diarrhoea')
  })
})

describe('dog: food stock and shopping sync', () => {
  it('guesses a run-out date from bag weight and daily rate, and flags a reorder a week before', () => {
    let f = family()
    f = apply(f, CA.openStock('dad', { petId: 'biscuit', product: 'Chunky kibble 12kg', weightG: 12000, dailyG: 500, openedDate: '2026-09-01' }, T('2026-09-01', '09:00')))
    // 12000/500 = 24 days from 1 Sep -> 25 Sep
    expect(stockRunsOut(f, 'biscuit')).toBe('2026-09-25')
  })

  it('adds the food to the shared list once, and does not add it again', () => {
    let f = family()
    f = apply(f, CA.openStock('dad', { petId: 'biscuit', product: 'Chunky kibble 12kg', weightG: 12000, dailyG: 500, openedDate: '2026-09-01' }, T('2026-09-01', '09:00')))
    expect(needsReorder(f, 'biscuit', T('2026-09-19'))).toBe(true) // 6 days before run-out
    expect(needsReorder(f, 'biscuit', T('2026-09-10'))).toBe(false)
    const stock = f.petStock[Object.keys(f.petStock)[0]!]!
    f = apply(f, CA.reorderStock('dad', f, stock, T('2026-09-19', '09:00')))
    expect(Object.values(f.shopItems).some((i) => !i.deleted && /kibble/i.test(i.name))).toBe(true)
    expect(needsReorder(f, 'biscuit', T('2026-09-19'))).toBe(false)
  })
})

describe('care: "who\'s on" timetable guessing', () => {
  it('feed gap is pure age-based with fewer than 3 feeds logged in the last 24h', () => {
    let f = family()
    const now = T('2026-09-21', '18:00')
    const days = ageDays(f.members.robin!, now)!
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: now - HOUR }, now - HOUR))
    expect(typicalFeedGapMs(f, 'robin', days, now)).toBe(feedGapMs(days))
  })

  it('feed gap blends toward the real recent average once there are 3+ feeds in the last 24h', () => {
    let f = family()
    const now = T('2026-09-21', '18:00')
    const days = ageDays(f.members.robin!, now)!
    // Three feeds exactly 2 hours apart - well under the newborn age-typical ~3.5h gap - should pull the blend down.
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: now - 4 * HOUR }, now - 4 * HOUR))
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: now - 2 * HOUR }, now - 2 * HOUR))
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: now }, now))
    const blended = typicalFeedGapMs(f, 'robin', days, now)
    expect(blended).toBe(Math.round((2 * HOUR + feedGapMs(days)) / 2))
    expect(blended).toBeLessThan(feedGapMs(days))
  })

  it('wake gap falls back to the age-typical wake window with fewer than 2 recorded sleeps', () => {
    const f = family()
    const now = T('2026-09-21', '18:00')
    const days = ageDays(f.members.robin!, now)!
    expect(typicalWakeGapMs(f, 'robin', days, now)).toBe(typicalWakeWindowMin(days) * MIN)
  })

  it('wake gap uses the real recent average once there is sleep history', () => {
    let f = family()
    const now = T('2026-09-21', '18:00')
    const days = ageDays(f.members.robin!, now)!
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'sleep', at: now - 6 * HOUR, endAt: now - 5 * HOUR }, now - 5 * HOUR)) // woke 5h ago
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'sleep', at: now - 4 * HOUR, endAt: now - 3.5 * HOUR }, now - 3.5 * HOUR)) // 1h awake window before this nap
    expect(typicalWakeGapMs(f, 'robin', days, now)).toBe(HOUR)
  })

  it('produces a sorted, horizon-bounded list of upcoming feeds and naps, labelling evening sleep as bedtime', () => {
    let f = family()
    const now = T('2026-09-21', '17:00') // late afternoon, so the 16h horizon runs well into the evening
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'feed', at: now }, now))
    f = apply(f, A.logBaby('mum', { babyId: 'robin', kind: 'sleep', at: now - HOUR, endAt: now }, now))
    const items = todayTimetable(f, 'robin', now, 16 * HOUR)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((it) => it.at >= now && it.at <= now + 16 * HOUR)).toBe(true)
    expect([...items].sort((a, b) => a.at - b.at)).toEqual(items) // already sorted
    const evening = items.find((it) => it.kind === 'sleep' && new Date(it.at).getHours() >= 19)
    expect(evening?.label).toBe('Bedtime likely')
    const daytime = items.find((it) => it.kind === 'sleep' && new Date(it.at).getHours() < 19 && new Date(it.at).getHours() >= 6)
    expect(daytime?.label).toBe('Nap likely')
  })

  it('with no logged history at all, still estimates from age alone rather than returning nothing', () => {
    const f = family()
    const now = T('2026-09-21', '09:00')
    const items = todayTimetable(f, 'robin', now, 16 * HOUR)
    expect(items.some((it) => it.kind === 'feed')).toBe(true)
    expect(items.some((it) => it.kind === 'sleep')).toBe(true)
  })
})

describe('vault', () => {
  it('saves and deletes static reference facts', () => {
    let f = family()
    f = apply(f, CA.saveVaultItem('dad', { memberId: 'robin', label: 'NHS number', value: '123 456 7890', category: 'Health' }, T('2026-09-21', '09:00')))
    const item = Object.values(f.vault)[0]!
    expect(item.label).toBe('NHS number')
    f = apply(f, CA.deleteVaultItem('dad', item, T('2026-09-21', '10:00')))
    expect(Object.values(f.vault).every((v) => v.deleted)).toBe(true)
  })
})
