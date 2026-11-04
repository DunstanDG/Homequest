// Supabase Edge Function (Deno). Deploy with: supabase functions deploy send-notifications
//
// Called every minute by the pg_cron job at the bottom of supabase/schema.sql. Each tick:
//   1. reads unsent scheduled_notifications rows due now or within the next day
//   2. groups each family's devices by person, and for each person asks the pure planner in
//      ../_shared/notifyPlan.ts what to send: urgent safety reminders (medicine, baby feeds, baby asleep) at once, and
//      everything else bundled into one message, within a daily cap, held back during an "I'm overwhelmed" pause
//      (the latest `calm-pause` event) and, if the person chose it, as one morning summary
//   3. sends a Web Push message to each of that person's devices
//   4. records what was handled (scheduled_notifications.delivered_to / sent_at / skipped, notification_counts),
//      and deletes any subscription the push service reports as gone
// Needs supabase/schema_v7.sql. See docs/calm/D-notify.md.
//
// Required secrets (set with `supabase secrets set NAME=value`, never committed, never sent to the client).
// NOTE: the Supabase CLI refuses to let you set any secret whose name starts with `SUPABASE_` (that prefix is
// reserved for values the platform injects itself) - `SUPABASE_URL` is auto-provided for that reason, but the
// service_role key needs a different name, hence the plain `SERVICE_ROLE_KEY` below rather than the more
// obvious `SUPABASE_SERVICE_ROLE_KEY`, which `supabase secrets set` would reject outright:
//   SUPABASE_URL     - the project's URL; auto-provided by the platform, nothing to set yourself
//   SERVICE_ROLE_KEY - the project's service_role key, used ONLY here, to read/write past RLS
//   VAPID_PUBLIC_KEY  - same public key shipped in the client app
//   VAPID_PRIVATE_KEY - the matching private key; must NEVER be in client code or the repo
//   VAPID_SUBJECT     - a mailto: or https: contact URL the push services can reach you at, e.g.
//                       mailto:you@example.com
//
// Web Push signing (VAPID + payload encryption) is nontrivial to hand-roll correctly, so this imports the
// well-maintained `web-push` npm package via Deno's npm compatibility layer (`npm:web-push`), which Supabase
// Edge Functions' Deno runtime supports. Verify this against the current Supabase Edge Functions docs before
// relying on it in production - npm compat support and version pinning are areas that can change.
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

import {
  latestPauses,
  localParts,
  planMember,
  REPEAT_MEMORY_MS,
  validTz,
  type NotifyPrefs,
  type Outcome,
  type PlanItem,
} from '../_shared/notifyPlan.ts'

interface ScheduledNotification {
  id: number
  family_key: string
  member_id: string | null
  title: string
  body: string
  tag: string
  label: string | null
  fire_at: string
  delivered_to: string[] | null
}

interface PushSubscriptionRow {
  id: number
  family_key: string
  member_id: string
  endpoint: string
  p256dh: string
  auth: string
  prefs: NotifyPrefs | null
  repeat_kids: boolean | null
}

interface CountRow {
  member_id: string
  day: string
  sent: number
  summary_done: boolean
}

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

const enc = encodeURIComponent
const LOOKAHEAD_MS = 26 * 3_600_000

Deno.serve(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response('Missing required secrets (SUPABASE_URL, SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).', { status: 500 })
  }
  const now = Date.now()

  const pendRes = await rest(
    `scheduled_notifications?select=id,family_key,member_id,title,body,tag,label,fire_at,delivered_to&sent_at=is.null&fire_at=lte.${enc(new Date(now + LOOKAHEAD_MS).toISOString())}&order=fire_at.asc&limit=2000`,
  )
  if (!pendRes.ok) return new Response(`Failed to load notifications (has supabase/schema_v7.sql been run?): ${await pendRes.text()}`, { status: 500 })
  const pending = (await pendRes.json()) as ScheduledNotification[]

  let sent = 0
  let failed = 0
  let held = 0
  const deadSubIds = new Set<number>()
  const byFamily = new Map<string, ScheduledNotification[]>()
  for (const n of pending) byFamily.set(n.family_key, [...(byFamily.get(n.family_key) ?? []), n])

  for (const [family, rows] of byFamily) {
    const subsRes = await rest(`push_subscriptions?select=id,family_key,member_id,endpoint,p256dh,auth,prefs,repeat_kids&family_key=eq.${enc(family)}`)
    if (!subsRes.ok) {
      failed++
      continue
    }
    const subs = (await subsRes.json()) as PushSubscriptionRow[]
    const people = new Map<string, PushSubscriptionRow[]>()
    for (const s of subs) people.set(s.member_id ?? '', [...(people.get(s.member_id ?? '') ?? []), s])

    // Pauses ("I'm overwhelmed"), today's counts, and what was recently sent (for the child no-repeat rule).
    const evRes = await rest(`events?select=ts,body&family_key=eq.${enc(family)}&type=eq.calm-pause&order=ts.desc&limit=200`)
    const pauses = latestPauses(evRes.ok ? ((await evRes.json()) as { ts: number; body: { memberId?: string; until?: number } }[]) : [])
    const countsRes = await rest(`notification_counts?select=member_id,day,sent,summary_done&family_key=eq.${enc(family)}&day=gte.${enc(new Date(now - 3 * 86_400_000).toISOString().slice(0, 10))}`)
    const counts = (countsRes.ok ? ((await countsRes.json()) as CountRow[]) : []).reduce((m, c) => m.set(`${c.member_id}|${c.day}`, c), new Map<string, CountRow>())
    const recentRes = await rest(`scheduled_notifications?select=tag,member_id,skipped,delivered_to&family_key=eq.${enc(family)}&sent_at=gte.${enc(new Date(now - REPEAT_MEMORY_MS).toISOString())}`)
    const recent = recentRes.ok ? ((await recentRes.json()) as { tag: string; member_id: string | null; skipped: string | null; delivered_to: string[] | null }[]) : []

    // What happened to each row, across people.
    const handled = new Map<number, { people: Set<string>; sentAny: boolean; reason?: Outcome }>()
    const newCounts: Record<string, unknown>[] = []

    for (const [person, devices] of people) {
      const prefs: NotifyPrefs = devices.find((d) => d.prefs && Object.keys(d.prefs).length)?.prefs ?? {}
      const tz = validTz(prefs.tz)
      const day = localParts(now, tz).ymd
      const mine: PlanItem[] = rows
        .filter((r) => (r.member_id === null || r.member_id === person) && !(r.delivered_to ?? []).includes(person))
        .map((r) => ({ id: r.id, tag: r.tag, title: r.title, body: r.body, label: r.label, fireAt: Date.parse(r.fire_at) }))
      if (!mine.length) continue
      const told = new Set(recent.filter((r) => r.skipped === null || r.skipped === 'summarised').filter((r) => r.member_id === person || (r.member_id === null && (r.delivered_to ?? []).includes(person))).map((r) => r.tag))
      const count = counts.get(`${person}|${day}`)
      const until = pauses.get(person)
      const plan = planMember({
        items: mine,
        prefs,
        now,
        sentToday: count?.sent ?? 0,
        summaryDone: count?.summary_done ?? false,
        paused: until !== undefined && until > now,
        repeatOk: subs.some((d) => d.repeat_kids === true), // a parent's switch, saved on every device of the family
        toldTags: told,
      })

      for (const m of plan.messages) {
        const payload = JSON.stringify({ title: m.title, body: m.body, tag: m.tag })
        await Promise.all(
          devices.map(async (sub) => {
            try {
              await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
            } catch (err) {
              const status = (err as { statusCode?: number })?.statusCode
              if (status === 404 || status === 410) deadSubIds.add(sub.id) // gone for good - stop trying it
              else failed++
            }
          }),
        )
        sent++
      }
      for (const d of plan.done) {
        const h = handled.get(d.id) ?? { people: new Set<string>(), sentAny: false }
        h.people.add(person)
        if (d.outcome === 'sent') h.sentAny = true
        else h.reason = d.outcome
        handled.set(d.id, h)
      }
      held += mine.length - plan.done.length
      if (plan.spent || plan.summaryDone !== (count?.summary_done ?? false)) {
        newCounts.push({ family_key: family, member_id: person, day, sent: (count?.sent ?? 0) + plan.spent, summary_done: plan.summaryDone })
      }
    }

    if (newCounts.length) {
      await rest('notification_counts?on_conflict=family_key,member_id,day', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(newCounts),
      })
    }

    // Record the outcome. A row is finished (sent_at set) once everyone it is for has been dealt with; a row for one
    // person with no devices at all is finished too, as before (there is nobody to send it to).
    for (const r of rows) {
      const h = handled.get(r.id)
      const targets = r.member_id === null ? [...people.keys()] : [r.member_id]
      const nobody = !targets.some((t) => people.has(t)) && Date.parse(r.fire_at) <= now
      if (!h && !nobody) continue
      const delivered = [...new Set([...(r.delivered_to ?? []), ...(h ? h.people : [])])]
      const finished = nobody || targets.filter((t) => people.has(t)).every((t) => delivered.includes(t))
      const patch: Record<string, unknown> = { delivered_to: delivered }
      if (finished) {
        patch.sent_at = new Date(now).toISOString()
        patch.skipped = h && !h.sentAny ? (h.reason ?? null) : null
      }
      await rest(`scheduled_notifications?id=eq.${r.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    }
  }

  if (deadSubIds.size) {
    await rest(`push_subscriptions?id=in.(${[...deadSubIds].join(',')})`, { method: 'DELETE' })
  }

  return new Response(JSON.stringify({ pending: pending.length, sent, held, failed, removedSubscriptions: deadSubIds.size }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
