/**
 * Folding travel events into TravelState. Events from the home server arrive over the network like any other
 * event, so the shapes they carry are checked here before they reach the screens: a malformed one is ignored
 * rather than breaking the calendar.
 */
import type { AppEvent } from '@/engine/types'
import type { NudgeAnswer, NudgeKind, PlanBlock, PlanKind, RoundTableFacts, RoundTableReview, TravelEvent, TravelLeg, TravelState, TrainHop } from './types'

const TYPES = new Set<string>(['place', 'trip', 'travel-prefs', 'alarm', 'alarm-stop', 'home-settings', 'travel-day', 'sched-status', 'server-features', 'server-ping', 'server-pong', 'proposal', 'proposal-decision', 'proposal-done', 'day-plan', 'daily-prefs', 'nudge', 'nudge-reply', 'round-table', 'round-table-note', 'round-table-settings'])

export const isTravelEvent = (ev: AppEvent): ev is AppEvent & TravelEvent => TYPES.has(ev.type)

const HM = /^([01]\d|2[0-3]):[0-5]\d$/
const YMD = /^\d{4}-\d{2}-\d{2}$/
const str = (v: unknown, max = 80): string | undefined => (typeof v === 'string' && v.length ? v.slice(0, max) : undefined)
const hm = (v: unknown): string | undefined => (typeof v === 'string' && HM.test(v) ? v : undefined)
const num = (v: unknown, lo: number, hi: number): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : undefined)

function cleanHop(h: unknown): TrainHop | undefined {
  if (!h || typeof h !== 'object') return undefined
  const o = h as Record<string, unknown>
  const dep = hm(o.dep)
  const from = str(o.from, 40)
  const to = str(o.to, 40)
  if (!dep || !from || !to) return undefined
  return { from, to, dep, arr: hm(o.arr), platform: str(o.platform, 6), line: str(o.line, 12), late: num(o.late, 0, 600), cancelled: o.cancelled === true || undefined }
}

export function cleanLeg(l: unknown): TravelLeg | undefined {
  if (!l || typeof l !== 'object') return undefined
  const o = l as Record<string, unknown>
  const key = str(o.key, 120)
  const refId = str(o.refId, 80)
  const status = o.status === 'planned' || o.status === 'disrupted' || o.status === 'unknown' ? o.status : undefined
  const direction = o.direction === 'out' || o.direction === 'back' || o.direction === 'between' ? o.direction : undefined
  const mode = o.mode === 'train' || o.mode === 'bus' || o.mode === 'car' || o.mode === 'walk' || o.mode === 'none' ? o.mode : undefined
  if (!key || !refId || !status || !direction || !mode) return undefined
  const hops = Array.isArray(o.hops)
    ? o.hops
        .slice(0, 6)
        .map(cleanHop)
        .filter((h): h is TrainHop => !!h)
    : undefined
  return {
    key,
    refId,
    direction,
    mode,
    status,
    fromName: str(o.fromName, 60) ?? '',
    toName: str(o.toName, 60) ?? '',
    leaveBy: hm(o.leaveBy),
    arrive: hm(o.arrive),
    hops: hops?.length ? hops : undefined,
    note: str(o.note, 160),
  }
}

const PLAN_KINDS = new Set<string>(['event', 'school', 'club', 'travel', 'meal', 'homework', 'task', 'care', 'walk', 'cook', 'free'])
const NUDGE_KINDS = new Set<string>(['homework', 'task', 'cook', 'walk', 'travel'])
const ANSWERS = new Set<string>(['ok', 'done', 'later', 'late', 'skip', 'swap'])

function cleanBlock(b: unknown): PlanBlock | undefined {
  if (!b || typeof b !== 'object') return undefined
  const o = b as Record<string, unknown>
  const start = hm(o.start)
  const end = hm(o.end)
  if (!start || !end || typeof o.kind !== 'string' || !PLAN_KINDS.has(o.kind)) return undefined
  return { start, end, kind: o.kind as PlanKind, title: str(o.title, 60) ?? '', ref: str(o.ref, 80), guess: o.guess === true || undefined, disrupted: o.disrupted === true || undefined }
}

const strs = (v: unknown, n: number, max: number): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, n).map((x) => x.slice(0, max)) : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const n0 = (v: unknown): number => num(v, 0, 100_000) ?? 0

export function cleanFacts(v: unknown, weekOf: string): RoundTableFacts {
  const o = obj(v)
  const days = (Array.isArray(o.days) ? o.days : []).slice(0, 7).flatMap((d) => {
    const x = obj(d)
    const date = typeof x.date === 'string' && YMD.test(x.date) ? x.date : undefined
    if (!date) return []
    const people = (Array.isArray(x.people) ? x.people : []).slice(0, 12).map((p) => {
      const q = obj(p)
      return { name: str(q.name, 40) ?? '?', fixed: strs(q.fixed, 5, 80), mustdo: n0(q.mustdo), free: n0(q.free), school: q.school === true }
    })
    return [{ date, label: str(x.label, 20) ?? date, people, warnings: strs(x.warnings, 8, 200) }]
  })
  const rv = obj(o.review)
  const KEYS = ['asked', 'ok', 'done', 'later', 'late', 'skip', 'swap', 'none', 'tasksDone'] as const
  const people = (Array.isArray(rv.people) ? rv.people : []).slice(0, 12).map((p) => {
    const q = obj(p)
    const r = { name: str(q.name, 40) ?? '?' } as RoundTableReview
    for (const k of KEYS) r[k] = n0(q[k])
    return r
  })
  const ymd = (x: unknown) => (typeof x === 'string' && YMD.test(x) ? x : weekOf)
  return { weekOf, days, issues: strs(o.issues, 12, 240), learned: strs(o.learned, 5, 240), review: { from: ymd(rv.from), to: ymd(rv.to), people } }
}

export function applyTravelEvent(prev: TravelState, ev: AppEvent & TravelEvent): TravelState {
  switch (ev.type) {
    case 'place':
      return { ...prev, places: { ...prev.places, [ev.placeId]: ev } }
    case 'trip':
      return { ...prev, trips: { ...prev.trips, [ev.tripId]: ev } }
    case 'travel-prefs':
      return { ...prev, prefs: { ...prev.prefs, [ev.memberId]: ev } }
    case 'alarm':
      return { ...prev, alarms: { ...prev.alarms, [ev.alarmId]: ev } }
    case 'alarm-stop':
      return { ...prev, stops: { ...prev.stops, [ev.ringId]: Math.max(prev.stops[ev.ringId] ?? 0, ev.ts) } }
    case 'home-settings':
      return !prev.settings || prev.settings.ts <= ev.ts ? { ...prev, settings: ev } : prev
    case 'travel-day': {
      if (!YMD.test(ev.date) || !Array.isArray(ev.legs)) return prev
      const key = `${ev.memberId}|${ev.date}`
      const old = prev.days[key]
      if (old && old.ts > ev.ts) return prev
      const legs = ev.legs
        .slice(0, 20)
        .map(cleanLeg)
        .filter((l): l is TravelLeg => !!l)
      return { ...prev, days: { ...prev.days, [key]: { ...ev, legs } } }
    }
    case 'sched-status': {
      if (!YMD.test(ev.date)) return prev
      const key = `${ev.refId}|${ev.date}`
      const old = prev.status[key]
      if (old && old.ts > ev.ts) return prev
      return { ...prev, status: { ...prev.status, [key]: { ...ev, note: str(ev.note, 160) } } }
    }
    case 'server-features': {
      if (prev.features && prev.features.ts > ev.ts) return prev
      const speakers = Array.isArray(ev.speakers)
        ? ev.speakers
            .slice(0, 30)
            .filter((s) => s && typeof s.id === 'string' && typeof s.name === 'string')
            .map((s) => ({ id: s.id.slice(0, 80), name: s.name.slice(0, 40) }))
        : []
      const linked = Array.isArray(ev.linked) ? ev.linked.filter((m) => typeof m === 'string') : []
      const assistantUrl = typeof ev.assistantUrl === 'string' && /^https:\/\/[^\s/]+(:\d+)?\/?$/.test(ev.assistantUrl) ? ev.assistantUrl.replace(/\/$/, '') : undefined
      return { ...prev, features: { ...ev, speakers, linked, assistantUrl, bus: ev.bus === true } }
    }
    case 'proposal': {
      const summary = str(ev.summary, 200)
      if (!summary || !str(ev.proposalId, 80) || prev.proposals[ev.proposalId]) return prev
      const kind = ev.kind === 'event' || ev.kind === 'task' || ev.kind === 'change' ? ev.kind : 'change'
      const forMembers = Array.isArray(ev.forMembers) ? ev.forMembers.filter((m) => typeof m === 'string').slice(0, 12) : []
      return { ...prev, proposals: { ...prev.proposals, [ev.proposalId]: { ...ev, kind, summary, reason: str(ev.reason, 240), forMembers } } }
    }
    case 'proposal-decision': {
      if (!str(ev.proposalId, 80) || (ev.decision !== 'accept' && ev.decision !== 'reject')) return prev
      const old = prev.decisions[ev.proposalId]
      if (old && old.ts <= ev.ts) return prev // the first decision counts
      return { ...prev, decisions: { ...prev.decisions, [ev.proposalId]: ev } }
    }
    case 'proposal-done': {
      if (!str(ev.proposalId, 80)) return prev
      const outcome = ev.outcome === 'accepted' || ev.outcome === 'rejected' || ev.outcome === 'expired' || ev.outcome === 'failed' ? ev.outcome : 'failed'
      return { ...prev, proposalsDone: { ...prev.proposalsDone, [ev.proposalId]: { ...ev, outcome, note: str(ev.note, 160) } } }
    }
    case 'day-plan': {
      if (!YMD.test(ev.date) || !str(ev.memberId) || !Array.isArray(ev.blocks)) return prev
      const key = `${ev.memberId}|${ev.date}`
      const old = prev.dayPlans[key]
      if (old && old.ts > ev.ts) return prev
      const blocks = ev.blocks
        .slice(0, 60)
        .map(cleanBlock)
        .filter((b): b is PlanBlock => !!b)
      const warnings = Array.isArray(ev.warnings) ? ev.warnings.filter((w): w is string => typeof w === 'string').slice(0, 6).map((w) => w.slice(0, 160)) : []
      return { ...prev, dayPlans: { ...prev.dayPlans, [key]: { ...ev, blocks, warnings, spareMin: num(ev.spareMin, -1440, 1440) ?? 0 } } }
    }
    case 'daily-prefs': {
      if (!str(ev.memberId)) return prev
      const old = prev.dailyPrefs[ev.memberId]
      if (old && old.ts > ev.ts) return prev
      return { ...prev, dailyPrefs: { ...prev.dailyPrefs, [ev.memberId]: { ...ev, morningAt: hm(ev.morningAt) } } }
    }
    case 'nudge': {
      const title = str(ev.title, 60)
      const start = hm(ev.start)
      if (!str(ev.nudgeId, 40) || !title || !start || !YMD.test(ev.date) || !NUDGE_KINDS.has(ev.kind)) return prev
      return { ...prev, nudges: { ...prev.nudges, [ev.nudgeId]: { ...ev, kind: ev.kind as NudgeKind, title, start, end: hm(ev.end) ?? start, minutes: num(ev.minutes, 0, 720), ref: str(ev.ref, 80) } } }
    }
    case 'nudge-reply': {
      if (!str(ev.nudgeId, 40) || !ANSWERS.has(ev.answer)) return prev
      const old = prev.nudgeReplies[ev.nudgeId]
      if (old && old.ts > ev.ts) return prev
      return { ...prev, nudgeReplies: { ...prev.nudgeReplies, [ev.nudgeId]: { ...ev, answer: ev.answer as NudgeAnswer, minutes: num(ev.minutes, 5, 120) } } }
    }
    case 'round-table': {
      if (!YMD.test(ev.weekOf) || (ev.status !== 'waiting' && ev.status !== 'ready')) return prev
      const old = prev.roundTables[ev.weekOf]
      if (old && old.ts > ev.ts) return prev
      const a = ev.agenda ? obj(ev.agenda) : undefined
      const agenda = a
        ? {
            summary: str(a.summary, 500) ?? '',
            points: (Array.isArray(a.points) ? a.points : []).slice(0, 8).flatMap((p) => {
              const t = str(obj(p).text, 200)
              return t ? [{ text: t }] : []
            }),
            proposals: strs(a.proposals, 8, 80),
          }
        : undefined
      const source = ev.source === 'assistant' || ev.source === 'server' ? ev.source : undefined
      return { ...prev, roundTables: { ...prev.roundTables, [ev.weekOf]: { ...ev, facts: cleanFacts(ev.facts, ev.weekOf), agenda, source, notes: num(ev.notes, 0, 1000) } } }
    }
    case 'round-table-note': {
      const text = str(ev.text, 200)
      if (!str(ev.noteId, 40) || !YMD.test(ev.weekOf) || (!text && !ev.deleted)) return prev
      return { ...prev, rtNotes: { ...prev.rtNotes, [ev.noteId]: { ...ev, text: text ?? '' } } }
    }
    case 'round-table-settings': {
      if (prev.rtSettings && prev.rtSettings.ts > ev.ts) return prev
      const weekday = num(ev.weekday, 0, 6) ?? 6
      return { ...prev, rtSettings: { ...ev, on: ev.on !== false, weekday, at: hm(ev.at) ?? '17:00' } }
    }
    case 'server-ping':
      return { ...prev, pings: { ...prev.pings, [ev.pingId]: { ...prev.pings[ev.pingId], sentTs: ev.ts } } }
    case 'server-pong': {
      const p = prev.pings[ev.pingId]
      return { ...prev, pings: { ...prev.pings, [ev.pingId]: { sentTs: p?.sentTs ?? ev.ts, pongTs: ev.ts, version: str(ev.version, 20) } } }
    }
  }
}
