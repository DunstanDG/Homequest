/** Builders for the travel and alarm events the app writes. Each returns the event(s) to append via `act()`. */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import type { MemberId } from '../types'
import type { AlarmEvent, DailyPrefsEvent, RoundTableNoteEvent, RoundTableSettingsEvent, HomeSettingsEvent, NudgeAnswer, PlaceEvent, TravelPrefsEvent, TripEvent } from './types'

const ev = (actor: MemberId, body: EventBody, now: number): AppEvent => makeEvent(actor, body, now)

type Draft<T> = Omit<T, 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'type' | 'priv'>

export const savePlace = (actor: MemberId, p: Omit<Draft<PlaceEvent>, 'placeId'> & { placeId?: string }, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'place', ...p, placeId: p.placeId ?? uid('pl') }, now),
]
export const deletePlace = (actor: MemberId, p: PlaceEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'place', placeId: p.placeId, name: p.name, kind: p.kind, station: p.station, stationName: p.stationName, walkMin: p.walkMin, deleted: true }, now),
]

export const saveTrip = (actor: MemberId, t: Omit<Draft<TripEvent>, 'tripId'> & { tripId?: string }, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'trip', ...t, tripId: t.tripId ?? uid('tr') }, now),
]
export const deleteTrip = (actor: MemberId, t: TripEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'trip', tripId: t.tripId, title: t.title, members: t.members, date: t.date, recur: t.recur, exdates: t.exdates, spec: t.spec, leaveAt: t.leaveAt, deleted: true }, now),
]

export const savePrefs = (actor: MemberId, p: Draft<TravelPrefsEvent>, now = Date.now()): AppEvent[] => [ev(actor, { type: 'travel-prefs', ...p }, now)]

export const saveAlarm = (actor: MemberId, a: Omit<Draft<AlarmEvent>, 'alarmId'> & { alarmId?: string }, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'alarm', ...a, alarmId: a.alarmId ?? uid('al') }, now),
]
export const deleteAlarm = (actor: MemberId, a: AlarmEvent, now = Date.now()): AppEvent[] => [
  ev(
    actor,
    {
      type: 'alarm',
      alarmId: a.alarmId,
      memberId: a.memberId,
      title: a.title,
      date: a.date,
      time: a.time,
      recur: a.recur,
      exdates: a.exdates,
      speakers: a.speakers,
      stopWhenLeave: a.stopWhenLeave,
      deleted: true,
    },
    now,
  ),
]

export const stopRing = (actor: MemberId, ringId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'alarm-stop', ringId }, now)]

export const saveHomeSettings = (actor: MemberId, s: Draft<HomeSettingsEvent>, now = Date.now()): AppEvent[] => [ev(actor, { type: 'home-settings', ...s }, now)]

export const pingServer = (actor: MemberId, now = Date.now()): AppEvent[] => [ev(actor, { type: 'server-ping', pingId: uid('pg') }, now)]

/** Accept or turn down an assistant suggestion. The home server carries out an accepted one, written as `actor`. */
export const decideProposal = (actor: MemberId, proposalId: string, accept: boolean, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'proposal-decision', proposalId, decision: accept ? 'accept' : 'reject', by: actor }, now),
]

/** Answer an "on track?" question. */
export const replyNudge = (actor: MemberId, nudgeId: string, answer: NudgeAnswer, minutes?: number, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'nudge-reply', nudgeId, answer, ...(minutes ? { minutes } : {}) }, now),
]

/** One person's morning overview and "on track?" settings. */
export const saveDailyPrefs = (actor: MemberId, p: Draft<DailyPrefsEvent>, now = Date.now()): AppEvent[] => [ev(actor, { type: 'daily-prefs', ...p }, now)]

/** Raise something for the round table. */
export const addRoundTableNote = (actor: MemberId, weekOf: string, text: string, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'round-table-note', noteId: uid('rn'), weekOf, text: text.trim().slice(0, 200) }, now),
]
export const deleteRoundTableNote = (actor: MemberId, n: RoundTableNoteEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'round-table-note', noteId: n.noteId, weekOf: n.weekOf, text: n.text, deleted: true }, now),
]
export const saveRoundTableSettings = (actor: MemberId, s: Draft<RoundTableSettingsEvent>, now = Date.now()): AppEvent[] => [ev(actor, { type: 'round-table-settings', ...s }, now)]
