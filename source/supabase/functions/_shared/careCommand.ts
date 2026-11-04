/**
 * Voice logging: turn one fixed spoken command ("left feed", "wet nappy", "stop the feed"...) into the events the
 * app would have written, so a Google Home routine (via Home Assistant) can log a feed or a nappy hands-free.
 *
 * Shared, word for word, by the `log-care` Edge Function and the app's tests. Plain TypeScript with no imports so
 * both Vite and Deno can load it. It does no network or clock work of its own: the function reads what it needs
 * from the database, hands it in, and writes whatever comes back.
 *
 * The events built here are the same shapes the app builds itself (a `baby` entry, a `feedrun`, a `void`), so every
 * phone folds them like anything else. They are stamped with actor `home` and `voice: <command>`, which is how the
 * app shows "logged by voice" until someone says who it was (Edit entry > Who).
 */

export const VOICE_ACTOR = 'home'

/** The only things a voice command can do. Feeds and nappies only: nothing here can read, edit or delete. */
export const CARE_COMMANDS = ['feed-left', 'feed-right', 'bottle', 'nappy-wet', 'nappy-dirty', 'nappy-both', 'feed-start-left', 'feed-start-right', 'feed-stop'] as const
export type CareCommand = (typeof CARE_COMMANDS)[number]
export const isCareCommand = (s: unknown): s is CareCommand => typeof s === 'string' && (CARE_COMMANDS as readonly string[]).includes(s)

/** Who a command is for. Only babies today; the function takes it so a pet (walk, meal, wee) can follow later. */
export const CARE_KINDS = ['baby'] as const
export type CareKind = (typeof CARE_KINDS)[number]

export interface VoiceSettings {
  /** What "bottle" logs, as the default amount. */
  bottleMl: number
  milk: 'formula' | 'expressed'
  /** IANA zone the family lives in, so an entry lands on the right calendar day. */
  tz: string
}
export const DEFAULT_VOICE: VoiceSettings = { bottleMl: 120, milk: 'formula', tz: 'Europe/London' }

/** The same command twice inside this window is treated as a double trigger (a routine firing twice, a repeated
 * word) and ignored. */
export const DUPLICATE_WINDOW_MS = 2 * 60_000

export const cleanVoiceSettings = (raw: Partial<VoiceSettings> | undefined): VoiceSettings => {
  const ml = Number(raw?.bottleMl)
  return {
    bottleMl: Number.isFinite(ml) && ml >= 10 && ml <= 400 ? Math.round(ml) : DEFAULT_VOICE.bottleMl,
    milk: raw?.milk === 'expressed' ? 'expressed' : 'formula',
    tz: validZone(raw?.tz) ? (raw!.tz as string) : DEFAULT_VOICE.tz,
  }
}

export function validZone(tz: unknown): boolean {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Calendar day ('YYYY-MM-DD') of a timestamp in a time zone. */
export function dayInZone(ts: number, tz: string): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ts))
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00'
  return `${g('year')}-${g('month')}-${g('day')}`
}

// ------------------------------------------------------------------ what the function reads

/** A stored feed-run event, as much of it as a fold needs. */
export interface RunEv {
  id: string
  ts: number
  feedRunId: string
  babyId: string
  action: 'start' | 'switch' | 'pause' | 'resume' | 'stop' | 'adjust'
  side?: 'L' | 'R'
  method?: 'breast' | 'bottle' | 'pump'
  deltaSec?: number
}

export interface RunState {
  id: string
  method: 'breast' | 'bottle' | 'pump'
  status: 'running' | 'paused' | 'done'
  side: 'L' | 'R'
  startedTs: number
  lastTs: number
  ms: { L: number; R: number }
}

/** Same arithmetic as foldFeedRun in the app (src/family/care.ts): active time per side, paused time left out. */
export function foldRun(events: readonly RunEv[], voided: ReadonlySet<string> = new Set()): RunState | undefined {
  const live = events.filter((e) => !voided.has(e.id)).sort((a, b) => a.ts - b.ts)
  const start = live.find((e) => e.action === 'start')
  if (!start) return undefined
  const s: RunState = { id: start.feedRunId, method: start.method ?? 'breast', status: 'running', side: start.side ?? 'L', startedTs: start.ts, lastTs: start.ts, ms: { L: 0, R: 0 } }
  let from = start.ts
  const close = (ts: number) => {
    if (s.status === 'running') s.ms[s.side] += Math.max(0, ts - from)
  }
  for (const e of live) {
    if (e === start) continue
    if (s.status === 'done') break
    s.lastTs = Math.max(s.lastTs, e.ts)
    if (e.action === 'pause' && s.status === 'running') {
      close(e.ts)
      s.status = 'paused'
    } else if (e.action === 'resume' && s.status === 'paused') {
      s.status = 'running'
      from = e.ts
    } else if (e.action === 'switch' && s.status === 'running') {
      close(e.ts)
      s.side = e.side === 'R' ? 'R' : 'L'
      from = e.ts
    } else if (e.action === 'stop') {
      close(e.ts)
      s.status = 'done'
    } else if (e.action === 'adjust') {
      if (s.status === 'running') {
        close(e.ts)
        from = e.ts
      }
      s.ms[s.side] = Math.max(0, s.ms[s.side] + (e.deltaSec ?? 0) * 1000)
    }
  }
  return s
}

/** A feed left running this long with no activity is treated as forgotten (the app's own limit is 4 hours). */
export const ABANDONED_MS = 4 * 60 * 60_000

/** What the function found in the database for this baby. */
export interface CareContext {
  babyId: string
  /** Every feed-run event for the baby (not voided ones only: voids are passed separately). */
  runEvents: readonly RunEv[]
  voided: ReadonlySet<string>
  /** `voice` and `at`/`ts` of recent non-voided entries this function wrote, newest first (only the last few minutes matter). */
  recentVoice: readonly { voice: string; ts: number }[]
}

export interface CarePlan {
  /** Complete events, ready to insert (id, ts, day, learnerId, v all set). */
  events: Record<string, unknown>[]
  /** What the speaker says back. */
  say: string
  /** True when nothing was written because the same command was just logged. */
  duplicate?: boolean
  /** True when nothing was written because the command could not apply (no feed running). */
  refused?: boolean
}

/** Short, collision-proof ids (the app's own are `e_` + random). */
const mkId = (now: number, n: number, rnd: () => number) => `e_v${now.toString(36)}${n}${Math.floor(rnd() * 36 ** 5).toString(36)}`

export function planCare(command: CareCommand, ctx: CareContext, settings: VoiceSettings, now: number, rnd: () => number = Math.random): CarePlan {
  const day = dayInZone(now, settings.tz)
  let n = 0
  const base = (extra: Record<string, unknown>, ts = now) => ({ ...extra, id: mkId(now, n++, rnd), ts, day, learnerId: VOICE_ACTOR, v: 1, voice: command })
  const baby = (extra: Record<string, unknown>, at = now, ts = now) => base({ type: 'baby', babyId: ctx.babyId, at, ...extra }, ts)

  const dup = ctx.recentVoice.find((r) => r.voice === command && now - r.ts >= 0 && now - r.ts < DUPLICATE_WINDOW_MS)
  if (dup) return { events: [], say: 'Already logged.', duplicate: true }

  const runs = new Map<string, RunEv[]>()
  for (const e of ctx.runEvents) runs.set(e.feedRunId, [...(runs.get(e.feedRunId) ?? []), e])
  const open = [...runs.values()]
    .map((evs) => foldRun(evs, ctx.voided))
    .filter((r): r is RunState => !!r && r.status !== 'done' && r.method === 'breast' && now - r.lastTs < ABANDONED_MS)
    .sort((a, b) => b.startedTs - a.startedTs)[0]

  switch (command) {
    case 'feed-left':
    case 'feed-right': {
      const side = command === 'feed-left' ? 'L' : 'R'
      return { events: [baby({ kind: 'feed', feed: { method: 'breast', side } })], say: `Logged, ${side === 'L' ? 'left' : 'right'} feed.` }
    }
    case 'bottle':
      return { events: [baby({ kind: 'feed', feed: { method: 'bottle', ml: settings.bottleMl, milk: settings.milk } })], say: `Logged, ${settings.bottleMl} millilitre bottle.` }
    case 'nappy-wet':
      return { events: [baby({ kind: 'nappy', nappy: { wet: true, dirty: false } })], say: 'Logged, wet nappy.' }
    case 'nappy-dirty':
      return { events: [baby({ kind: 'nappy', nappy: { wet: false, dirty: true } })], say: 'Logged, dirty nappy.' }
    case 'nappy-both':
      return { events: [baby({ kind: 'nappy', nappy: { wet: true, dirty: true } })], say: 'Logged, wet and dirty nappy.' }
    case 'feed-start-left':
    case 'feed-start-right': {
      const side = command === 'feed-start-left' ? 'L' : 'R'
      if (open) return { events: [], say: 'A feed is already running.', refused: true }
      const feedRunId = `fr_v${now.toString(36)}${Math.floor(rnd() * 36 ** 4).toString(36)}`
      return { events: [base({ type: 'feedrun', feedRunId, babyId: ctx.babyId, action: 'start', method: 'breast', side })], say: `Started, ${side === 'L' ? 'left' : 'right'} side.` }
    }
    case 'feed-stop': {
      if (!open) return { events: [], say: 'No feed running.', refused: true }
      const closed = foldRun([...(runs.get(open.id) ?? []), { id: 'x', ts: now, feedRunId: open.id, babyId: ctx.babyId, action: 'stop' }], ctx.voided)!
      const { L, R } = closed.ms
      const total = L + R
      const side = total === 0 ? 'L' : Math.abs(L - R) / total < 0.2 ? 'both' : L > R ? 'L' : 'R'
      const minutes = Math.max(1, Math.round(total / 60_000))
      return {
        events: [base({ type: 'feedrun', feedRunId: open.id, babyId: ctx.babyId, action: 'stop' }), baby({ kind: 'feed', feed: { method: 'breast', side, minutes } }, open.startedTs, now + 1)],
        say: `Stopped, ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      }
    }
  }
}

/** Words the routine setup shows next to each command (docs and the settings screen). */
export const COMMAND_PHRASES: Record<CareCommand, string> = {
  'feed-left': 'left feed',
  'feed-right': 'right feed',
  bottle: 'bottle',
  'nappy-wet': 'wet nappy',
  'nappy-dirty': 'dirty nappy',
  'nappy-both': 'wet and dirty nappy',
  'feed-start-left': 'start left feed',
  'feed-start-right': 'start right feed',
  'feed-stop': 'stop the feed',
}
