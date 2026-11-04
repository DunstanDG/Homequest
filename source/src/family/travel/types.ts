/**
 * Travel and alarms (0.10). These events are written by the app (places, trips, alarms, settings, stop taps) and
 * by the family's optional home server (travel plans, status, features), which reads the same event log, plans
 * journeys with live train data and rings alarms on the home speakers. See docs/TRAVEL_AND_ALARMS.md.
 *
 * Nothing here is needed for HomeQuest to work: with no home server, the travel and alarm controls stay hidden.
 */
import type { EventBase } from '@/engine/types'
import type { Hm, MemberId, Recurrence, Ymd } from '../types'

export type TravelMode = 'train' | 'bus' | 'car' | 'walk' | 'none'
export type PlaceKind = 'home' | 'work' | 'school' | 'other'

/** A saved place: where an event or trip happens, and how to get there by train. Upsert by placeId. */
export interface PlaceEvent extends EventBase {
  type: 'place'
  placeId: string
  name: string
  kind: PlaceKind
  /** Nearest station, as a 3-letter CRS code (e.g. 'HHE'). */
  station?: string
  stationName?: string
  /** Minutes on foot between that station and the place, each way. */
  walkMin?: number
  deleted?: boolean
}

/** A change on a train route: get off at `station` and catch the next train on. */
export interface ViaStop {
  station: string
  stationName?: string
  /** Minutes allowed to make the connection. */
  changeMin: number
}

/** How someone gets to a place. Carried by a calendar event (`CalEvent.trip`) or a standalone `TripEvent`. */
export interface TripSpec {
  placeId: string
  mode: TravelMode
  /** Train only: changes on the way, in order. The return journey uses them reversed. */
  via?: ViaStop[]
  /** Arrive by this time (default: the event's start). */
  arriveBy?: Hm
  /** Plan the journey home afterwards (default true). */
  returnHome?: boolean
  /** Car/walk, or a train route that can't be planned: door-to-door minutes typed in by hand. */
  minutes?: number
  /** Announce on the home speakers before leave time while their phone is at home (default true). */
  announce?: boolean
}

/**
 * A regular journey that is not a calendar event of its own (the school run, the commute). Upsert by tripId.
 * `leaveAt` is when they head home (for the school run: the end of the school day).
 */
export interface TripEvent extends EventBase {
  type: 'trip'
  tripId: string
  title: string
  members: MemberId[]
  date: Ymd
  recur?: Recurrence
  exdates?: Ymd[]
  spec: TripSpec
  leaveAt?: Hm
  deleted?: boolean
}

/** Each person's travel habits. Upsert by memberId. */
export interface TravelPrefsEvent extends EventBase {
  type: 'travel-prefs'
  memberId: MemberId
  homePlaceId?: string
  /** Minutes before the train to leave home (covers the walk to the station). */
  leadMin?: number
  mode?: TravelMode
}

export type AlarmKind = 'wake' | 'leave'

/** An alarm on the home speakers. Upsert by alarmId. */
export interface AlarmEvent extends EventBase {
  type: 'alarm'
  alarmId: string
  memberId: MemberId
  title: string
  date: Ymd
  time: Hm
  recur?: Recurrence
  exdates?: Ymd[]
  /** Home Assistant speaker ids (from the server's features record). Empty = that person's default speakers. */
  speakers?: string[]
  /** Stop ringing as soon as their phone leaves home. */
  stopWhenLeave: boolean
  deleted?: boolean
}

/** Somebody tapped Stop. `ringId` is `${alarmId or calId or tripId}:${date}`. Append-only. */
export interface AlarmStopEvent extends EventBase {
  type: 'alarm-stop'
  ringId: string
}

/** Family-wide home server settings. Latest wins. */
export interface HomeSettingsEvent extends EventBase {
  type: 'home-settings'
  quietFrom: Hm
  quietTo: Hm
  leadMin: number
  changeMin: number
  walkMin: number
  /** Early-alert threshold: tell them when leave-by moves at least this much earlier. */
  alertMin: number
  /** How long before leave-by to start watching for disruption. */
  watchHours: number
  /** memberId -> speaker ids used for their alarms and announcements. */
  speakers?: Record<MemberId, string[]>
}

// ------------------------------------------------------------------ written by the home server

export interface TrainHop {
  from: string
  to: string
  dep: Hm
  arr?: Hm
  platform?: string
  /** Bus number (0.15: buses from the family's OpenTripPlanner). */
  line?: string
  /** Live state when last checked. */
  late?: number
  cancelled?: boolean
}

export type LegStatus = 'planned' | 'disrupted' | 'unknown'

export interface TravelLeg {
  key: string
  /** The calendar event or trip this leg serves. */
  refId: string
  direction: 'out' | 'back' | 'between'
  fromName: string
  toName: string
  mode: TravelMode
  leaveBy?: Hm
  arrive?: Hm
  hops?: TrainHop[]
  status: LegStatus
  note?: string
}

/** One person's journeys for one day, as planned (and re-planned) by the home server. Latest wins per memberId|date. */
export interface TravelDayEvent extends EventBase {
  type: 'travel-day'
  memberId: MemberId
  date: Ymd
  legs: TravelLeg[]
}

export type SchedState = 'scheduled' | 'ringing' | 'stopped' | 'done' | 'failed'

/** The home server's status for an alarm, trip or event on a day. Latest wins per refId|date. */
export interface SchedStatusEvent extends EventBase {
  type: 'sched-status'
  refId: string
  date: Ymd
  memberId?: MemberId
  state: SchedState
  note?: string
}

/** What the home server can do, written at setup and whenever its setup changes. Latest wins. */
export interface ServerFeaturesEvent extends EventBase {
  type: 'server-features'
  alarms: boolean
  trains: boolean
  car: boolean
  /** 0.15: bus journeys from the family's OpenTripPlanner. */
  bus?: boolean
  speakers: { id: string; name: string }[]
  /** People whose phone is linked for "stop when I leave home". */
  linked: MemberId[]
  version: string
  /** 0.11+: the family assistant's address on the tailnet (Hermes), if one is set up. */
  assistantUrl?: string
}

/** "Check connection": the app asks, the server answers with the same pingId. */
export interface ServerPingEvent extends EventBase {
  type: 'server-ping'
  pingId: string
}
export interface ServerPongEvent extends EventBase {
  type: 'server-pong'
  pingId: string
  version?: string
}

// ------------------------------------------------------------------ assistant suggestions (0.11)

/** A change the family assistant suggests. Nothing happens until a person accepts it; the home server then makes the
 * change, written as that person. The app only shows `summary`/`reason` and records the decision. */
export interface ProposalEvent extends EventBase {
  type: 'proposal'
  proposalId: string
  kind: 'event' | 'task' | 'change'
  summary: string
  reason?: string
  forMembers?: MemberId[]
  from?: string
}

/** Someone tapped Accept or Not now. The first decision counts. */
export interface ProposalDecisionEvent extends EventBase {
  type: 'proposal-decision'
  proposalId: string
  decision: 'accept' | 'reject'
  by: MemberId
}

/** Written by the home server once it has carried out (or closed) a suggestion. */
export interface ProposalDoneEvent extends EventBase {
  type: 'proposal-done'
  proposalId: string
  outcome: 'accepted' | 'rejected' | 'expired' | 'failed'
  by?: MemberId
  refs?: string[]
  note?: string
}

// ------------------------------------------------------------------ the day as it happens (0.13)

export type PlanKind = 'event' | 'school' | 'club' | 'travel' | 'meal' | 'homework' | 'task' | 'care' | 'walk' | 'cook' | 'free'

export interface PlanBlock {
  start: Hm
  end: Hm
  kind: PlanKind
  title: string
  /** The task or calendar event it comes from. */
  ref?: string
  /** The length is the planner's starting guess, not learned yet. */
  guess?: boolean
  disrupted?: boolean
}

/** The home server's suggested plan for one person's day. Latest wins per memberId|date. */
export interface DayPlanEvent extends EventBase {
  type: 'day-plan'
  memberId: MemberId
  date: Ymd
  blocks: PlanBlock[]
  spareMin: number
  warnings: string[]
}

/** One person's choice of morning overview and "on track?" questions. Latest wins per memberId. */
export interface DailyPrefsEvent extends EventBase {
  type: 'daily-prefs'
  memberId: MemberId
  morning?: boolean
  morningAt?: Hm
  nudges?: boolean
}

export type NudgeKind = 'homework' | 'task' | 'cook' | 'walk' | 'travel'

/** An "on track?" question the home server asked (and sent to the person's phone). */
export interface NudgeEvent extends EventBase {
  type: 'nudge'
  nudgeId: string
  memberId: MemberId
  date: Ymd
  kind: NudgeKind
  title: string
  start: Hm
  end: Hm
  minutes?: number
  ref?: string
  /** 1 the first time, 2+ when asked again after "later". */
  n?: number
}

export type NudgeAnswer = 'ok' | 'done' | 'later' | 'late' | 'skip' | 'swap'

/** Someone's answer. `late` and `swap` tell the other parents; `later` asks again after `minutes`. */
export interface NudgeReplyEvent extends EventBase {
  type: 'nudge-reply'
  nudgeId: string
  answer: NudgeAnswer
  minutes?: number
}

// ------------------------------------------------------------------ the weekly round table (0.14)

export interface RoundTablePerson {
  name: string
  fixed: string[]
  mustdo: number
  free: number
  school: boolean
}

export interface RoundTableReview {
  name: string
  asked: number
  ok: number
  done: number
  later: number
  late: number
  skip: number
  swap: number
  none: number
  tasksDone: number
}

/** What the home server worked out for the round table: the coming week and how last week went. */
export interface RoundTableFacts {
  weekOf: Ymd
  days: { date: Ymd; label: string; people: RoundTablePerson[]; warnings: string[] }[]
  issues: string[]
  learned: string[]
  review: { from: Ymd; to: Ymd; people: RoundTableReview[] }
}

/** The week's round table. Written "waiting" by the home server, then "ready" once the assistant (or, if it can't, the
 * server) has posted the agenda. Latest wins per weekOf (the Monday of the week being planned). */
export interface RoundTableEvent extends EventBase {
  type: 'round-table'
  weekOf: Ymd
  status: 'waiting' | 'ready'
  facts: RoundTableFacts
  notes?: number
  startedAt?: number
  source?: 'assistant' | 'server'
  agenda?: { summary: string; points: { text: string }[]; proposals: string[] }
}

/** Something a person wants to raise at the round table. Upsert by noteId. */
export interface RoundTableNoteEvent extends EventBase {
  type: 'round-table-note'
  noteId: string
  weekOf: Ymd
  text: string
  deleted?: boolean
}

/** When the round table happens. Family-wide, latest wins. weekday: 0 = Monday ... 6 = Sunday. */
export interface RoundTableSettingsEvent extends EventBase {
  type: 'round-table-settings'
  on: boolean
  weekday: number
  at: Hm
}

export type TravelEvent =
  | PlaceEvent
  | TripEvent
  | TravelPrefsEvent
  | AlarmEvent
  | AlarmStopEvent
  | HomeSettingsEvent
  | TravelDayEvent
  | SchedStatusEvent
  | ServerFeaturesEvent
  | ServerPingEvent
  | ServerPongEvent
  | ProposalEvent
  | ProposalDecisionEvent
  | ProposalDoneEvent
  | DayPlanEvent
  | DailyPrefsEvent
  | NudgeEvent
  | NudgeReplyEvent
  | RoundTableEvent
  | RoundTableNoteEvent
  | RoundTableSettingsEvent

export interface TravelState {
  places: Record<string, PlaceEvent>
  trips: Record<string, TripEvent>
  prefs: Record<MemberId, TravelPrefsEvent>
  alarms: Record<string, AlarmEvent>
  /** ringId -> ts of the latest Stop tap. */
  stops: Record<string, number>
  settings?: HomeSettingsEvent
  /** `${memberId}|${date}` -> latest plan. */
  days: Record<string, TravelDayEvent>
  /** `${refId}|${date}` -> latest status. */
  status: Record<string, SchedStatusEvent>
  features?: ServerFeaturesEvent
  /** pingId -> the ping's ts, and the pong's ts once answered. */
  pings: Record<string, { sentTs: number; pongTs?: number; version?: string }>
  /** Assistant suggestions by proposalId, the first decision on each, and the server's outcome. */
  proposals: Record<string, ProposalEvent>
  decisions: Record<string, ProposalDecisionEvent>
  proposalsDone: Record<string, ProposalDoneEvent>
  /** `${memberId}|${date}` -> the server's suggested plan. */
  dayPlans: Record<string, DayPlanEvent>
  dailyPrefs: Record<MemberId, DailyPrefsEvent>
  nudges: Record<string, NudgeEvent>
  /** nudgeId -> the latest answer. */
  nudgeReplies: Record<string, NudgeReplyEvent>
  /** weekOf -> the latest round table. */
  roundTables: Record<Ymd, RoundTableEvent>
  rtNotes: Record<string, RoundTableNoteEvent>
  rtSettings?: RoundTableSettingsEvent
}

export const emptyTravel = (): TravelState => ({ places: {}, trips: {}, prefs: {}, alarms: {}, stops: {}, days: {}, status: {}, pings: {}, proposals: {}, decisions: {}, proposalsDone: {}, dayPlans: {}, dailyPrefs: {}, nudges: {}, nudgeReplies: {}, roundTables: {}, rtNotes: {} })

export const DEFAULT_SETTINGS = { quietFrom: '21:30', quietTo: '06:30', leadMin: 10, changeMin: 5, walkMin: 10, alertMin: 10, watchHours: 3 } as const
