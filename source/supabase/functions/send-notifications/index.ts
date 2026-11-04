// Supabase Edge Function (Deno). Deploy with: supabase functions deploy send-notifications
//
// Called every minute by the pg_cron job at the bottom of supabase/schema.sql. Each tick:
//   1. reads scheduled_notifications rows that are due (fire_at <= now(), sent_at is null)
//   2. for each, loads the matching push_subscriptions rows for that family (+ member, if set)
//   3. sends a Web Push message to every subscription
//   4. marks the notification sent, and deletes any subscription the push service reports as gone
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

interface ScheduledNotification {
  id: number
  family_key: string
  member_id: string | null
  title: string
  body: string
  tag: string
}

interface PushSubscriptionRow {
  id: number
  family_key: string
  member_id: string
  endpoint: string
  p256dh: string
  auth: string
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

Deno.serve(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response('Missing required secrets (SUPABASE_URL, SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).', { status: 500 })
  }

  const dueRes = await rest(`scheduled_notifications?select=id,family_key,member_id,title,body,tag&sent_at=is.null&fire_at=lte.${encodeURIComponent(new Date().toISOString())}`)
  if (!dueRes.ok) return new Response(`Failed to load due notifications: ${await dueRes.text()}`, { status: 500 })
  const due = (await dueRes.json()) as ScheduledNotification[]

  let sent = 0
  let failed = 0
  const deadSubIds = new Set<number>()

  for (const note of due) {
    const memberFilter = note.member_id ? `&member_id=eq.${encodeURIComponent(note.member_id)}` : ''
    const subsRes = await rest(`push_subscriptions?select=id,family_key,member_id,endpoint,p256dh,auth&family_key=eq.${encodeURIComponent(note.family_key)}${memberFilter}`)
    if (!subsRes.ok) {
      failed++
      continue
    }
    const subs = (await subsRes.json()) as PushSubscriptionRow[]
    const payload = JSON.stringify({ title: note.title, body: note.body, tag: note.tag })

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode
          if (status === 404 || status === 410) {
            // The push service says this subscription is gone for good - stop trying it again.
            deadSubIds.add(sub.id)
          } else {
            failed++
          }
        }
      }),
    )

    await rest(`scheduled_notifications?id=eq.${note.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ sent_at: new Date().toISOString() }),
    })
    sent++
  }

  if (deadSubIds.size) {
    await rest(`push_subscriptions?id=in.(${[...deadSubIds].join(',')})`, { method: 'DELETE' })
  }

  return new Response(JSON.stringify({ due: due.length, sent, failed, removedSubscriptions: deadSubIds.size }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
