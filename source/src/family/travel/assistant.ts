/**
 * The family assistant (Hermes, on the home server's tailnet): its address, and the suggestions it has made.
 * Suggestions arrive through the event log like everything else, so they show (and can be accepted) even when the
 * assistant itself can't be reached; only chatting needs the phone to be on Tailscale.
 */
import type { FamilyState, Hm, MemberId, Ymd } from '../types'
import type { ProposalEvent, TripSpec } from './types'

export const EXPIRE_MS = 7 * 86_400_000

export type ProposalStatus = 'pending' | 'deciding' | 'accepted' | 'rejected' | 'expired' | 'failed'

export const assistantUrl = (f: FamilyState): string | undefined => f.travel.features?.assistantUrl

export function proposalStatus(f: FamilyState, id: string, now: number): ProposalStatus {
  const done = f.travel.proposalsDone[id]
  if (done) return done.outcome
  if (f.travel.decisions[id]) return 'deciding'
  const p = f.travel.proposals[id]
  return p && now - p.ts > EXPIRE_MS ? 'expired' : 'pending'
}

/** Suggestions still waiting for someone, newest first. */
export const pendingProposals = (f: FamilyState, now: number): ProposalEvent[] =>
  Object.values(f.travel.proposals)
    .filter((p) => proposalStatus(f, p.proposalId, now) === 'pending')
    .sort((a, b) => b.ts - a.ts)

/** Recently decided ones (the last two days), so a tap shows what happened. */
export const recentProposals = (f: FamilyState, now: number): ProposalEvent[] =>
  Object.values(f.travel.proposals)
    .filter((p) => {
      const st = proposalStatus(f, p.proposalId, now)
      return st !== 'pending' && st !== 'expired' && now - p.ts < 2 * 86_400_000
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: 'Waiting',
  deciding: 'Working on it…',
  accepted: 'Added ✓',
  rejected: 'Turned down',
  expired: 'Expired',
  failed: 'Couldn’t be done',
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
  at: number
  error?: boolean
}

/** What to send: the question plus the last few turns, so "yes please" makes sense to the assistant. */
export function askBody(memberId: MemberId, name: string, message: string, history: readonly ChatTurn[]) {
  return {
    memberId,
    name,
    message: message.trim().slice(0, 1500),
    history: history
      .filter((t) => !t.error)
      .slice(-6)
      .map((t) => ({ role: t.role, text: t.text.slice(0, 600) })),
  }
}

/** A friendly reason for a failed request. */
export function askError(status: number | 'network' | 'timeout'): string {
  if (status === 'network') return 'Can’t reach the assistant. It only answers over the family’s Tailscale network, so check Tailscale is switched on on this phone.'
  if (status === 'timeout') return 'That took too long. Try a shorter question.'
  if (status === 401) return 'The assistant didn’t recognise this family. Check sharing is set up on this phone.'
  if (status === 503) return 'The assistant is busy with someone else’s question. Try again in a minute.'
  if (status === 504) return 'That took too long. Try a shorter question.'
  return 'The assistant hit a problem. Try again.'
}

// ------------------------------------------------------------------ quick planning help for the event form

export interface EventHelpSlot {
  from: Hm
  to: Hm
  suggest: Hm
  suggestEnd: Hm
}
export interface EventHelpClash {
  who: string
  title: string
  start: Hm
  end: Hm
  kind: string
  hard: boolean
}
export interface EventHelpLeg {
  leaveBy?: Hm
  arrive?: Hm
  status?: string
  trains?: string | null
  note?: string | null
}
export interface EventHelp {
  date: Ymd
  minutes: number
  slots: EventHelpSlot[]
  clashes: EventHelpClash[]
  travel: { who: string[]; out: EventHelpLeg | null; back: EventHelpLeg | null }[]
  warnings: string[]
}

export interface EventDraft {
  date: Ymd
  start?: Hm
  end?: Hm
  members: MemberId[]
  everyone: boolean
  trip?: TripSpec
  calId?: string
}

/** The request the event form sends (nothing personal beyond ids and times). */
export function helpBody(d: EventDraft) {
  const timed = !!d.start && !!d.end && d.end > d.start
  return {
    date: d.date,
    start: d.start,
    end: timed ? d.end : undefined,
    people: d.everyone ? [] : d.members,
    everyone: d.everyone || undefined,
    calId: d.calId,
    placeId: d.trip?.placeId,
    mode: d.trip?.mode,
    via: d.trip?.via?.map((v) => ({ station: v.station, changeMin: v.changeMin })),
    minutes_travel: d.trip?.minutes,
  }
}

/** Is the reply shaped like help? (It comes from the network, so check before showing it.) */
export function isEventHelp(x: unknown): x is EventHelp {
  const o = x as EventHelp
  return !!o && Array.isArray(o.slots) && Array.isArray(o.clashes) && Array.isArray(o.travel) && Array.isArray(o.warnings)
}

/** A question for the assistant about a draft event, for the "Ask the assistant" button. */
export function askAboutDraft(title: string, d: EventDraft, names: string[], placeName?: string): string {
  const when = d.start ? `${d.date} ${d.start}${d.end ? `-${d.end}` : ''}` : d.date
  const where = placeName ? ` at ${placeName}${d.trip?.mode ? ` (going by ${d.trip.mode})` : ''}` : ''
  return `I'm adding "${title || 'an event'}" for ${d.everyone ? 'everyone' : names.join(', ') || 'me'} on ${when}${where}. Does that time work, and is there anything I should plan around?`
}

// ------------------------------------------------------------------ journey times ("How long to get there?")

export type JourneyMode = 'train' | 'bus' | 'walk' | 'car' | 'bike'
export const JOURNEY_MODES: JourneyMode[] = ['walk', 'bus', 'train', 'car', 'bike']

export interface JourneyOption {
  mode: JourneyMode
  ok: boolean
  leaveBy?: Hm
  arrive?: Hm
  minutes?: number
  note?: string | null
  steps?: string[]
}
export interface JourneyAnswer {
  from: string
  to: string
  date: Ymd
  when: 'arrive' | 'leave'
  time: Hm
  options: JourneyOption[]
}

/** The question the Times tab sends: two saved places and a time (nothing else leaves the phone). */
export const journeyBody = (from: string, to: string, date: Ymd, time: Hm, when: 'arrive' | 'leave') => ({ from, to, date, time, when })

/** Is the reply shaped like an answer? (It comes from the network, so check before showing it.) */
export function isJourneyAnswer(x: unknown): x is JourneyAnswer {
  const o = x as JourneyAnswer
  return !!o && typeof o.from === 'string' && Array.isArray(o.options) && o.options.every((p) => !!p && typeof p.mode === 'string' && typeof p.ok === 'boolean')
}
