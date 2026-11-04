import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { babyLogs, loggedBy } from './care'
import { applyFamilyEvent, projectFamily } from './project'
import { activeFeedRunFor } from './care'
import type { BabyEvent, FamilyState } from './types'
import {
  COMMAND_PHRASES,
  CARE_COMMANDS,
  cleanVoiceSettings,
  dayInZone,
  DEFAULT_VOICE,
  DUPLICATE_WINDOW_MS,
  foldRun,
  planCare,
  type CareContext,
  type RunEv,
} from '../../supabase/functions/_shared/careCommand'

const NOW = Date.UTC(2026, 9, 15, 23, 30) // 00:30 on the 16th in London (BST)
const settings = cleanVoiceSettings({ bottleMl: 150, milk: 'expressed', tz: 'Europe/London' })
const ctx = (over: Partial<CareContext> = {}): CareContext => ({ babyId: 'bub', runEvents: [], voided: new Set(), recentVoice: [], ...over })
const apply = (f: FamilyState, evs: unknown[]): FamilyState => (evs as AppEvent[]).reduce(applyFamilyEvent, f)
const family = () =>
  projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, NOW - 5000),
    ...A.saveMember('mum', { id: 'bub', name: 'Bub', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-01' }, NOW - 4999),
  ])

describe('voice commands', () => {
  it('has a phrase for every command', () => {
    expect(Object.keys(COMMAND_PHRASES).sort()).toEqual([...CARE_COMMANDS].sort())
  })

  it('logs a side feed, a bottle with the default amount, and the three nappies', () => {
    const left = planCare('feed-left', ctx(), settings, NOW)
    expect(left.events[0]).toMatchObject({ type: 'baby', babyId: 'bub', kind: 'feed', at: NOW, feed: { method: 'breast', side: 'L' }, learnerId: 'home', voice: 'feed-left' })
    expect(planCare('feed-right', ctx(), settings, NOW).events[0]).toMatchObject({ feed: { side: 'R' } })
    expect(planCare('bottle', ctx(), settings, NOW).events[0]).toMatchObject({ feed: { method: 'bottle', ml: 150, milk: 'expressed' } })
    expect(planCare('nappy-wet', ctx(), settings, NOW).events[0]).toMatchObject({ nappy: { wet: true, dirty: false } })
    expect(planCare('nappy-dirty', ctx(), settings, NOW).events[0]).toMatchObject({ nappy: { wet: false, dirty: true } })
    expect(planCare('nappy-both', ctx(), settings, NOW).events[0]).toMatchObject({ nappy: { wet: true, dirty: true } })
  })

  it('files the entry on the family’s day, not UTC’s', () => {
    expect(dayInZone(NOW, 'Europe/London')).toBe('2026-10-16')
    expect(dayInZone(NOW, 'UTC')).toBe('2026-10-15')
    expect(planCare('nappy-wet', ctx(), settings, NOW).events[0]).toMatchObject({ day: '2026-10-16' })
  })

  it('ignores the same command twice inside two minutes, but not a different one or a later one', () => {
    const recent = [{ voice: 'nappy-wet', ts: NOW - 30_000 }]
    const dup = planCare('nappy-wet', ctx({ recentVoice: recent }), settings, NOW)
    expect(dup).toMatchObject({ duplicate: true, events: [] })
    expect(planCare('nappy-dirty', ctx({ recentVoice: recent }), settings, NOW).events).toHaveLength(1)
    expect(planCare('nappy-wet', ctx({ recentVoice: [{ voice: 'nappy-wet', ts: NOW - DUPLICATE_WINDOW_MS - 1 }] }), settings, NOW).events).toHaveLength(1)
  })

  it('starts a timer, refuses to start a second, and stops it into one feed with the time and side', () => {
    const start = planCare('feed-start-left', ctx(), settings, NOW - 10 * 60_000)
    expect(start.events[0]).toMatchObject({ type: 'feedrun', action: 'start', side: 'L', method: 'breast' })
    const runEvents = start.events as unknown as RunEv[]
    expect(planCare('feed-start-right', ctx({ runEvents }), settings, NOW - 5 * 60_000)).toMatchObject({ refused: true, events: [] })
    const stop = planCare('feed-stop', ctx({ runEvents }), settings, NOW)
    expect(stop.say).toBe('Stopped, 10 minutes.')
    expect(stop.events).toHaveLength(2)
    expect(stop.events[1]).toMatchObject({ type: 'baby', kind: 'feed', at: NOW - 10 * 60_000, feed: { method: 'breast', side: 'L', minutes: 10 } })
  })

  it('stops a feed started elsewhere (any phone), and says so when none is running', () => {
    const app: RunEv[] = [
      { id: 'a', ts: NOW - 20 * 60_000, feedRunId: 'fr1', babyId: 'bub', action: 'start', method: 'breast', side: 'L' },
      { id: 'b', ts: NOW - 10 * 60_000, feedRunId: 'fr1', babyId: 'bub', action: 'switch', side: 'R' },
    ]
    const stop = planCare('feed-stop', ctx({ runEvents: app }), settings, NOW)
    expect(stop.events[1]).toMatchObject({ feed: { side: 'both', minutes: 20 } })
    expect(planCare('feed-stop', ctx(), settings, NOW)).toMatchObject({ say: 'No feed running.', refused: true })
    // already stopped, forgotten (over 4 hours quiet) and voided runs are not "running"
    const done = [...app, { id: 'c', ts: NOW - 5 * 60_000, feedRunId: 'fr1', babyId: 'bub', action: 'stop' as const }]
    expect(planCare('feed-stop', ctx({ runEvents: done }), settings, NOW).refused).toBe(true)
    const old = app.map((e) => ({ ...e, ts: e.ts - 6 * 3600_000 }))
    expect(planCare('feed-stop', ctx({ runEvents: old }), settings, NOW).refused).toBe(true)
    expect(planCare('feed-stop', ctx({ runEvents: app, voided: new Set(['a']) }), settings, NOW).refused).toBe(true)
  })

  it('folds a paused run the same way the app does', () => {
    const evs: RunEv[] = [
      { id: 'a', ts: 0, feedRunId: 'r', babyId: 'bub', action: 'start', side: 'L' },
      { id: 'b', ts: 5 * 60_000, feedRunId: 'r', babyId: 'bub', action: 'pause' },
      { id: 'c', ts: 15 * 60_000, feedRunId: 'r', babyId: 'bub', action: 'resume' },
    ]
    const s = foldRun(evs)!
    expect(s.status).toBe('running')
    expect(s.ms.L).toBe(5 * 60_000)
  })

  it('cleans bad settings back to defaults', () => {
    expect(cleanVoiceSettings({ bottleMl: 9999, milk: 'x' as never, tz: 'Not/AZone' })).toEqual(DEFAULT_VOICE)
  })
})

describe('voice entries in the app', () => {
  it('show up as normal entries, credited to voice, and a started timer is live on the phone', () => {
    let f = family()
    f = apply(f, planCare('nappy-both', ctx(), settings, NOW).events)
    f = apply(f, planCare('bottle', ctx(), settings, NOW + 1000).events)
    const logs = babyLogs(f, 'bub')
    expect(logs).toHaveLength(2)
    expect(logs.every((l) => loggedBy(f, l).voice)).toBe(true)
    const start = planCare('feed-start-right', ctx(), settings, NOW + 2000)
    f = apply(f, start.events)
    expect(activeFeedRunFor(f, 'bub', NOW + 3000)).toMatchObject({ side: 'R', method: 'breast' })
    const stop = planCare('feed-stop', ctx({ runEvents: start.events as unknown as RunEv[] }), settings, NOW + 5 * 60_000 + 2000)
    f = apply(f, stop.events)
    expect(activeFeedRunFor(f, 'bub', NOW + 6 * 60_000)).toBeUndefined()
    expect(babyLogs(f, 'bub')).toHaveLength(3)
  })

  it('can be assigned afterwards: Who sets it, an unassigned edit keeps it unclaimed, and a normal edit keeps the original person', () => {
    let f = family()
    f = apply(f, planCare('nappy-wet', ctx(), settings, NOW).events)
    const entry = babyLogs(f, 'bub')[0] as BabyEvent
    // edit the time only: still "voice"
    f = apply(f, A.editBaby('mum', entry, { at: NOW - 60_000 }, NOW + 10))
    let now = babyLogs(f, 'bub')[0] as BabyEvent
    expect(loggedBy(f, now)).toEqual({ voice: true })
    // say who
    f = apply(f, A.editBaby('mum', now, { by: 'mum' }, NOW + 20))
    now = babyLogs(f, 'bub')[0] as BabyEvent
    expect(loggedBy(f, now)).toEqual({ name: 'Mum' })
    // a normal phone entry edited by someone else keeps crediting the person who logged it
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'nappy', at: NOW, nappy: { wet: true, dirty: false } }, NOW + 30))
    const mine = babyLogs(f, 'bub').find((l) => !l.voice) as BabyEvent
    const evs = A.editBaby('other', mine, { at: NOW - 1000 }, NOW + 40)
    expect(evs[1]).toMatchObject({ by: 'mum' })
  })
})
