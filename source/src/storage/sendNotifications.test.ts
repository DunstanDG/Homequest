// Runs the real send-notifications Edge Function (supabase/functions/send-notifications/index.ts) against a small
// fake PostgREST and a fake push service, with Deno's globals stubbed: bundling, the daily cap, urgent kinds,
// the "I'm overwhelmed" pause, the morning summary and the child no-repeat rule.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const pushed: { endpoint: string; payload: { title: string; body: string; tag: string } }[] = []
vi.mock('npm:web-push@3.6.7', () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async (sub: { endpoint: string }, payload: string) => {
      if (sub.endpoint.includes('gone')) throw Object.assign(new Error('gone'), { statusCode: 410 })
      pushed.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) })
    },
  },
}))

const KEY = 'f'.repeat(24)
type Obj = Record<string, any>
type Db = { push_subscriptions: Obj[]; scheduled_notifications: Obj[]; events: Obj[]; notification_counts: Obj[] }
let db: Db = { push_subscriptions: [], scheduled_notifications: [], events: [], notification_counts: [] }
let handler: () => Promise<Response>
const NOW = Date.parse('2026-11-04T12:00:00Z') // 12:00 in London (GMT in November)
const at = (min: number) => new Date(NOW + min * 60_000).toISOString()

function cmp(v: unknown, f: string): boolean {
  const [op, ...rest] = f.split('.')
  const val = rest.join('.')
  if (op === 'is') return val === 'null' ? v == null : v != null
  if (op === 'eq') return String(v) === val
  if (op === 'lte') return v != null && String(v) <= val
  if (op === 'gte') return v != null && String(v) >= val
  if (op === 'in') return val.slice(1, -1).split(',').includes(String(v))
  throw new Error('unhandled op ' + op)
}

function fakeRest(url: string, init: RequestInit = {}): Response {
  const u = new URL(url)
  const table = u.pathname.split('/').pop()!
  const tables = db as unknown as Record<string, Obj[]>
  const rows = (tables[table] ??= [])
  const filters = [...u.searchParams].filter(([k]) => !['select', 'order', 'limit', 'on_conflict'].includes(k))
  const match = (r: Obj) =>
    filters.every(([k, v]) => {
      const lhs = k === 'ts' ? r.ts : r[k]
      return cmp(lhs, v)
    })
  if (init.method === 'PATCH') {
    for (const r of rows.filter(match)) Object.assign(r, JSON.parse(String(init.body)))
    return new Response(null, { status: 204 })
  }
  if (init.method === 'DELETE') {
    tables[table] = rows.filter((r) => !match(r))
    return new Response(null, { status: 204 })
  }
  if (init.method === 'POST') {
    for (const r of JSON.parse(String(init.body)) as Obj[]) {
      const same = rows.find((x) => x.family_key === r.family_key && x.member_id === r.member_id && x.day === r.day)
      if (same) Object.assign(same, r)
      else rows.push(r)
    }
    return new Response(null, { status: 201 })
  }
  let out = rows.filter(match)
  const order = u.searchParams.get('order')
  if (order) {
    const [col = '', dir] = order.split('.')
    out = out.sort((a, b) => (a[col] < b[col] ? -1 : 1) * (dir === 'desc' ? -1 : 1))
  }
  return new Response(JSON.stringify(out), { status: 200 })
}

beforeAll(async () => {
  const env: Record<string, string> = { SUPABASE_URL: 'https://x.supabase.co', SERVICE_ROLE_KEY: 'svc', VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' }
  ;(globalThis as any).Deno = { env: { get: (k: string) => env[k] }, serve: (h: () => Promise<Response>) => (handler = h) }
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => fakeRest(String(url), init))
  await import('../../supabase/functions/send-notifications/index.ts')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  db = { push_subscriptions: [], scheduled_notifications: [], events: [], notification_counts: [] }
  pushed.length = 0
})
afterEach(() => vi.useRealTimers())

let nid = 1
const sub = (member_id: string, prefs: Obj = {}, extra: Obj = {}) => db.push_subscriptions.push({ id: nid++, family_key: KEY, member_id, endpoint: `https://push/${member_id}-${nid}`, p256dh: 'p', auth: 'a', prefs, repeat_kids: false, ...extra })
const note = (member_id: string | null, tag: string, min: number, body = tag, extra: Obj = {}) =>
  db.scheduled_notifications.push({ id: nid++, family_key: KEY, member_id, title: 'T ' + tag, body, tag, label: null, fire_at: at(min), sent_at: null, delivered_to: [], skipped: null, ...extra })
const pause = (e: { ts: number; body: Obj }) => db.events.push({ family_key: KEY, type: 'calm-pause', ...e })
const run = async () => (await handler()).json() as Promise<Obj>
const to = (m: string) => pushed.filter((p) => p.endpoint.includes(`/${m}-`)).map((p) => p.payload)
const row = (tag: string): Obj => db.scheduled_notifications.find((r) => r.tag === tag)!

describe('send-notifications', () => {
  it('sends a single reminder exactly as it was written', async () => {
    sub('mum')
    note('mum', 'task:1', -1, 'Bins out')
    await run()
    expect(to('mum')).toEqual([{ title: 'T task:1', body: 'Bins out', tag: 'task:1' }])
    expect(row('task:1').sent_at).not.toBeNull()
  })

  it('bundles what is due now plus the next 10 minutes into one message, not later ones', async () => {
    sub('maya', { child: true })
    note('maya', 'hw:1', -2, 'x', { label: 'Walk Biscuit' })
    note('maya', 'event:a', 0, 'Pack school bag')
    note('maya', 'event:b', 8, 'Piano at 16:15', { label: 'Piano at 16:15' })
    note('maya', 'event:c', 40, 'Much later')
    await run()
    expect(to('maya')).toHaveLength(1)
    expect(to('maya')[0]!.title).toBe('3 things coming up')
    expect(to('maya')[0]!.body).toBe('Walk Biscuit, Pack school bag, Piano at 16:15')
    expect(row('event:c').sent_at).toBeNull()
    expect(db.notification_counts[0]).toMatchObject({ member_id: 'maya', sent: 1 })
  })

  it('sends medicine and feed-due reminders separately and at once, past the cap, the pause and the summary', async () => {
    sub('mum', { morning: true, morningAt: '23:00', cap: 3 })
    pause({ ts: 1, body: { type: 'calm-pause', memberId: 'mum', until: NOW + 3_600_000 } })
    db.notification_counts.push({ family_key: KEY, member_id: 'mum', day: '2026-11-04', sent: 99, summary_done: false })
    note('mum', 'med:bub:Calpol', -1, 'Calpol due')
    note('mum', 'feed:bub:mum', -1, 'Feed due')
    note('mum', 'task:1', -1, 'Bins out')
    await run()
    expect(to('mum').map((p) => p.tag).sort()).toEqual(['feed:bub:mum', 'med:bub:Calpol'])
    expect(row('task:1').sent_at).toBeNull()
    expect(db.notification_counts[0]!.sent).toBe(99) // urgent ones are not counted
  })

  it('stops at the daily cap (6 for a child), counted across runs, then holds the rest', async () => {
    sub('maya', { child: true })
    db.notification_counts.push({ family_key: KEY, member_id: 'maya', day: '2026-11-04', sent: 5, summary_done: false })
    note('maya', 'event:1', -1)
    await run()
    expect(to('maya')).toHaveLength(1)
    note('maya', 'event:2', 0)
    await run()
    expect(to('maya')).toHaveLength(1) // 6th was the last
    expect(db.notification_counts[0]!.sent).toBe(6)
    expect(row('event:2').sent_at).toBeNull()
    // The same item is let go once it is stale, not sent late.
    row('event:2').fire_at = at(-7 * 60)
    await run()
    expect(to('maya')).toHaveLength(1)
    expect(row('event:2')).toMatchObject({ skipped: 'stale' })
  })

  it('counts days in the person\'s own time zone', async () => {
    sub('mum', {})
    db.notification_counts.push({ family_key: KEY, member_id: 'mum', day: '2026-11-03', sent: 10, summary_done: false })
    note('mum', 'event:1', -1)
    await run()
    expect(to('mum')).toHaveLength(1) // yesterday's count does not carry over
    expect(db.notification_counts.find((c) => c.day === '2026-11-04')?.sent).toBe(1)
  })

  it('holds a paused person\'s non-urgent items, then sends them gently when the pause ends', async () => {
    sub('maya', { child: true })
    sub('mum')
    pause({ ts: 5, body: { type: 'calm-pause', memberId: 'maya', until: NOW + 30 * 60_000 } })
    pause({ ts: 1, body: { type: 'calm-pause', memberId: 'mum', until: NOW + 30 * 60_000 } })
    pause({ ts: 9, body: { type: 'calm-pause', memberId: 'mum', until: NOW - 1 } }) // latest wins: mum is not paused
    note(null, 'event:1', -1, 'Swimming')
    await run()
    expect(to('maya')).toHaveLength(0)
    expect(to('mum')).toHaveLength(1)
    expect(row('event:1').sent_at).toBeNull() // still waiting for maya
    expect(row('event:1').delivered_to).toEqual(['mum'])
    vi.setSystemTime(NOW + 31 * 60_000)
    await run()
    expect(to('maya')).toHaveLength(1)
    expect(to('mum')).toHaveLength(1) // not sent to mum twice
    expect(row('event:1').sent_at).not.toBeNull()
  })

  it('sends one morning summary at the chosen time and holds the individual items until then', async () => {
    sub('mum', { morning: true, morningAt: '12:30' })
    note('mum', 'task:1', -30, 'Bins out')
    note('mum', 'event:1', 90, 'Dentist at 13:30')
    note('mum', 'event:tmrw', 60 * 14, 'Tomorrow thing')
    await run()
    expect(to('mum')).toHaveLength(0)
    vi.setSystemTime(NOW + 31 * 60_000)
    await run()
    expect(to('mum')).toHaveLength(1)
    expect(to('mum')[0]!).toMatchObject({ title: 'Today: 2 things', body: 'Bins out, Dentist at 13:30' })
    expect(row('task:1').skipped).toBe('summarised')
    expect(row('event:1').skipped).toBe('summarised')
    expect(row('event:tmrw').sent_at).toBeNull()
    vi.setSystemTime(NOW + 2 * 3_600_000)
    await run()
    expect(to('mum')).toHaveLength(1) // the covered items are not sent again
    note('mum', 'task:2', 119, 'Added later') // made after the summary: goes out normally
    await run()
    expect(to('mum')).toHaveLength(2)
  })

  it('never reminds a child twice about the same thing unless a parent allows repeats', async () => {
    sub('maya', { child: true })
    note('maya', 'event:cal:7:2026-11-04', -1, 'Football')
    await run()
    note('maya', 'event:cal:7:2026-11-04', 0, 'Football') // the app re-queued it after it was sent
    await run()
    expect(to('maya')).toHaveLength(1)
    expect(db.scheduled_notifications[1]!).toMatchObject({ skipped: 'repeat' })
    db.push_subscriptions[0]!.repeat_kids = true
    note('maya', 'event:cal:7:2026-11-04', 0, 'Football')
    await run()
    expect(to('maya')).toHaveLength(2)
  })

  it('removes a device the push service says is gone', async () => {
    sub('mum', {}, { endpoint: 'https://push/gone' })
    sub('mum')
    note('mum', 'task:1', -1)
    const r = await run()
    expect(r.removedSubscriptions).toBe(1)
    expect(db.push_subscriptions).toHaveLength(1)
  })
})
