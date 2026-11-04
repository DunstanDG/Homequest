import type { Hm, Ymd } from './types'

/**
 * Calendar-day helpers on 'YYYY-MM-DD' strings. All arithmetic goes through UTC midday so daylight-saving
 * changes can never shift a date, and every phone agrees on what "Thursday" means.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export const isYmd = (s: unknown): s is Ymd => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`))

const utc = (s: Ymd): Date => {
  const y = Number(s.slice(0, 4))
  const m = Number(s.slice(5, 7))
  const d = Number(s.slice(8, 10))
  return new Date(Date.UTC(y, m - 1, d, 12))
}
const fromUtc = (d: Date): Ymd => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Local calendar day for a timestamp. */
export function ymdOf(ts: number): Ymd {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local 'HH:mm' for a timestamp. */
export function hmOf(ts: number): Hm {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Timestamp for a local date + time. */
export function tsOf(date: Ymd, time: Hm = '00:00'): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), h, m).getTime()
}

export const addDays = (s: Ymd, n: number): Ymd => {
  const d = utc(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fromUtc(d)
}

/** Whole days from a to b (b - a). */
export const daysBetween = (a: Ymd, b: Ymd): number => Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000)

/** 0 = Monday ... 6 = Sunday. */
export const weekday = (s: Ymd): number => (utc(s).getUTCDay() + 6) % 7

export const startOfWeek = (s: Ymd): Ymd => addDays(s, -weekday(s))

export const addMonths = (s: Ymd, n: number): Ymd => {
  const y = Number(s.slice(0, 4))
  const m = Number(s.slice(5, 7)) - 1 + n
  const day = Number(s.slice(8, 10))
  const first = new Date(Date.UTC(y, m, 1, 12))
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate()
  return fromUtc(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, last), 12)))
}

export const monthsBetween = (a: Ymd, b: Ymd): number => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))

export const startOfMonth = (s: Ymd): Ymd => `${s.slice(0, 7)}-01`
export const endOfMonth = (s: Ymd): Ymd => addDays(addMonths(startOfMonth(s), 1), -1)

/** Inclusive list of days from a to b (empty if b < a). */
export function dayRange(a: Ymd, b: Ymd): Ymd[] {
  const out: Ymd[] = []
  const n = daysBetween(a, b)
  for (let i = 0; i <= n; i++) out.push(addDays(a, i))
  return out
}

export const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

// ---------------------------------------------------------------- times of day

export function toMin(t: Hm): number {
  const [h, m] = t.split(':').map(Number) as [number, number]
  return h * 60 + m
}
export function fromMin(m: number): Hm {
  const c = Math.max(0, Math.min(24 * 60 - 1, Math.round(m)))
  return `${pad(Math.floor(c / 60))}:${pad(c % 60)}`
}

// ------------------------------------------------------------------ formatting

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dayName = (s: Ymd, long = false): string => (long ? DAYS_LONG : DAYS)[weekday(s)] as string
export const monthName = (s: Ymd, long = false): string => (long ? MONTHS_LONG : MONTHS)[Number(s.slice(5, 7)) - 1] as string
export const dayOfMonth = (s: Ymd): number => Number(s.slice(8, 10))

/** 'Mon 21 Sep' */
export const shortDay = (s: Ymd): string => `${dayName(s)} ${dayOfMonth(s)} ${monthName(s)}`
/** 'Monday 21 September' */
export const longDay = (s: Ymd): string => `${dayName(s, true)} ${dayOfMonth(s)} ${monthName(s, true)}`

/** 'Today', 'Tomorrow', 'Yesterday', otherwise 'Mon 21 Sep'. */
export function friendlyDay(s: Ymd, today: Ymd): string {
  const d = daysBetween(today, s)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d === -1) return 'Yesterday'
  return shortDay(s)
}

/** '1h 05m', '45m', '8m'. */
export function fmtDuration(min: number): string {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${pad(r)}m` : `${h}h`
}

/** '2h 10m ago', '5 min ago', 'just now'. */
export function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h < 24) return r ? `${h}h ${r}m ago` : `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}
