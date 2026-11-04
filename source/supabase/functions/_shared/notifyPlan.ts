// The "calm" rules for push notifications, as one pure function so they can be tested without a network or a clock.
// Used by the send-notifications Edge Function (Deno) and, for the defaults and labels, by the app's settings screen.
// No imports and no Deno/DOM globals: it must run in both.
//
// What it decides, for ONE person (all of their devices share the answer), each time the cron job ticks:
//   * urgent safety kinds (medicine "next safe dose", baby feed due, baby still asleep) go out at once, one by one,
//     and ignore the daily cap, the morning summary, the pause and the "don't repeat" rule;
//   * everything else is bundled: whatever is due now, plus anything due in the next BUNDLE_WINDOW_MIN minutes, goes
//     out as ONE message;
//   * a daily cap on those messages; over the cap, items wait (and are let go once they are STALE_MS old);
//   * "I'm overwhelmed" (calm-pause): non-urgent items wait until it ends, then are let go if STALE_MS old;
//   * an optional morning summary: one message with today's items at the person's chosen time; until then the
//     non-urgent items wait, and the ones it covered are not sent again;
//   * a child is never reminded twice about the same thing unless a parent switched repeats on.

export const BUNDLE_WINDOW_MIN = 10
/** A non-urgent reminder this long past its time is no longer useful ("Piano at 16:15" at 22:00), so it is let go. */
export const STALE_MS = 6 * 3_600_000
/** How long a child's "already told" memory lasts, for the no-repeat rule. Under 24h so a daily check-in still comes daily. */
export const REPEAT_MEMORY_MS = 20 * 3_600_000
export const DEFAULT_CAP_CHILD = 6
export const DEFAULT_CAP_ADULT = 10
export const DEFAULT_MORNING_AT = '07:30'
export const DEFAULT_TZ = 'Europe/London'
export const CAP_CHOICES = [3, 6, 10, 15] as const

/** Per-device preferences written by the app into push_subscriptions.prefs (jsonb). Anything may be missing. */
export interface NotifyPrefs {
  /** "Send me one summary in the morning instead of separate reminders". */
  morning?: boolean
  /** 'HH:MM' local time for that summary. */
  morningAt?: string
  /** Most messages a day, not counting urgent ones. */
  cap?: number
  /** This person is a child: lower default cap, and no repeat reminders unless a parent allows them. */
  child?: boolean
  /** IANA time zone of the device (days and the morning time are in this zone). */
  tz?: string
}

export interface PlanItem {
  id: number
  tag: string
  title: string
  body: string
  /** Short wording for use inside a bundle ("Piano at 16:15"). Falls back to the body. */
  label?: string | null
  fireAt: number
}

export interface PlanMessage {
  title: string
  body: string
  tag: string
  urgent: boolean
}

export type Outcome = 'sent' | 'stale' | 'repeat' | 'summarised'

export interface PlanInput {
  items: PlanItem[]
  prefs: NotifyPrefs
  now: number
  /** Non-urgent messages already sent to this person on their local day. */
  sentToday: number
  /** Whether today's morning summary has already been dealt with. */
  summaryDone: boolean
  paused: boolean
  /** A parent switched "repeat reminders for children" on. */
  repeatOk: boolean
  /** Tags this person was already told about recently (for the child no-repeat rule). */
  toldTags: ReadonlySet<string>
}

export interface PlanOutput {
  messages: PlanMessage[]
  /** Items finished with, and why. Items not listed stay queued. */
  done: { id: number; outcome: Outcome }[]
  /** Messages to add to today's count (urgent ones excluded). */
  spent: number
  summaryDone: boolean
}

/** Urgent safety kinds, by tag prefix: `med:` (next safe dose), `feed:` (feed due) and `sleep:` (baby still asleep). */
export const isUrgentTag = (tag: string): boolean => /^(med|feed|sleep):/.test(tag)

export const capFor = (p: NotifyPrefs): number => (typeof p.cap === 'number' && p.cap > 0 ? Math.floor(p.cap) : p.child ? DEFAULT_CAP_CHILD : DEFAULT_CAP_ADULT)

export const validTz = (tz: unknown): string => {
  if (typeof tz !== 'string' || !tz) return DEFAULT_TZ
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz })
    return tz
  } catch {
    return DEFAULT_TZ
  }
}

/** Local calendar day ('YYYY-MM-DD') and minutes since local midnight, in a time zone. */
export function localParts(ms: number, tz: string): { ymd: string; min: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: validTz(tz), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(ms)
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { ymd: `${g('year')}-${g('month')}-${g('day')}`, min: Number(g('hour')) * 60 + Number(g('minute')) }
}

export const minutesOf = (hm: string | undefined): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm ?? '')
  const v = m ? Number(m[1]) * 60 + Number(m[2]) : NaN
  return v >= 0 && v < 1440 ? v : 7 * 60 + 30
}

const labelOf = (i: PlanItem): string => (i.label && i.label.trim()) || i.body || i.title

function joined(items: PlanItem[]): string {
  const labels = items.map(labelOf)
  return labels.length > 5 ? `${labels.slice(0, 5).join(', ')} and ${labels.length - 5} more` : labels.join(', ')
}

const gentle = (n: number): string => (n === 1 ? '1 thing' : `${n} things`)

export function planMember(input: PlanInput): PlanOutput {
  const { prefs, now } = input
  const out: PlanOutput = { messages: [], done: [], spent: 0, summaryDone: input.summaryDone }
  const sorted = [...input.items].sort((a, b) => a.fireAt - b.fireAt || a.id - b.id)

  // 1. Urgent: straight out, one each, nothing else applies.
  for (const i of sorted) {
    if (isUrgentTag(i.tag) && i.fireAt <= now) {
      out.messages.push({ title: i.title, body: i.body, tag: i.tag, urgent: true })
      out.done.push({ id: i.id, outcome: 'sent' })
    }
  }

  // 2. Non-urgent: let go of what is stale, and (for a child) what they were already told about.
  let rest: PlanItem[] = []
  for (const i of sorted) {
    if (isUrgentTag(i.tag)) continue
    if (i.fireAt <= now && now - i.fireAt > STALE_MS) out.done.push({ id: i.id, outcome: 'stale' })
    else if (i.fireAt <= now && prefs.child && !input.repeatOk && input.toldTags.has(i.tag)) out.done.push({ id: i.id, outcome: 'repeat' })
    else rest.push(i)
  }

  // 3. Paused ("I'm overwhelmed"): everything else waits.
  if (input.paused) return out

  // 4. Morning summary.
  const tz = validTz(prefs.tz)
  if (prefs.morning) {
    const here = localParts(now, tz)
    if (!out.summaryDone) {
      if (here.min < minutesOf(prefs.morningAt)) return out // not yet: hold the individual ones for the summary
      const today = rest.filter((i) => localParts(i.fireAt, tz).ymd === here.ymd)
      out.summaryDone = true
      if (today.length) {
        out.messages.push({ title: `Today: ${gentle(today.length)}`, body: joined(today), tag: `summary:${here.ymd}`, urgent: false })
        out.spent++
        for (const i of today) out.done.push({ id: i.id, outcome: 'summarised' })
        const gone = new Set(today.map((i) => i.id))
        rest = rest.filter((i) => !gone.has(i.id))
      }
    }
  }

  // 5. Bundle what is due now (and what is due in the next few minutes) into one message, within the daily cap.
  if (!rest.some((i) => i.fireAt <= now)) return out
  if (input.sentToday + out.spent >= capFor(prefs)) return out
  const group = rest.filter((i) => i.fireAt <= now + BUNDLE_WINDOW_MIN * 60_000)
  const first = group[0]
  if (!first) return out
  out.messages.push(
    group.length === 1
      ? { title: first.title, body: first.body, tag: first.tag, urgent: false }
      : { title: `${gentle(group.length)} coming up`, body: joined(group), tag: `bundle:${Math.floor(now / 60_000)}`, urgent: false },
  )
  out.spent++
  for (const i of group) out.done.push({ id: i.id, outcome: 'sent' })
  return out
}

/** The most recent `calm-pause` per member from event rows (newest row wins), as memberId -> until (ms). */
export function latestPauses(rows: { ts: number; body?: { memberId?: string; until?: number } | null }[]): Map<string, number> {
  const out = new Map<string, number>()
  const seenTs = new Map<string, number>()
  for (const r of rows) {
    const m = r.body?.memberId
    if (!m || typeof r.body?.until !== 'number') continue
    if ((seenTs.get(m) ?? -Infinity) <= r.ts) {
      seenTs.set(m, r.ts)
      out.set(m, r.body.until)
    }
  }
  return out
}
