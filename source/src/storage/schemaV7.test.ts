/** supabase/schema_v7.sql (calmer notifications) on a real Postgres (PGlite): every schema file in order, v7 twice (it must be
 * safe to re-run), then the rules from the point of view of the public anon key. */
import { describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync } from 'node:fs'

const sql = (f: string) => readFileSync(new URL(`../../supabase/${f}`, import.meta.url), 'utf8')
const A = 'familykeyaaaaaaaaaaaaa1'
const B = 'familykeybbbbbbbbbbbbb2'

async function makeDb() {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema extensions; grant usage on schema extensions to anon;`)
  for (const f of ['schema.sql', 'schema_v2.sql', 'schema_v3.sql', 'schema_v4.sql']) await db.exec(sql(f))
  // A device and a reminder that existed before v7.
  await db.exec(`insert into public.push_subscriptions (family_key, member_id, endpoint, p256dh, auth) values ('${A}', 'mum', 'https://e/1', 'p', 'a')`)
  await db.exec(`insert into public.scheduled_notifications (family_key, fire_at, title, body, tag) values ('${A}', now(), 'T', 'B', 'task:1')`)
  // (v6 needs pg_net, which PGlite lacks, and does not touch these tables)
  for (const f of ['schema_v5.sql', 'schema_v7.sql', 'schema_v7.sql']) await db.exec(sql(f))
  await db.exec(`insert into public.families (family_key) values ('${A}'), ('${B}') on conflict do nothing`)
  const as = <T = Record<string, unknown>>(key: string, q: string, params: unknown[] = []) =>
    db.transaction(async (tx) => {
      await tx.query(`select set_config('request.headers', $1, true)`, [JSON.stringify({ 'x-family-key': key })])
      await tx.exec('set local role anon')
      return (await tx.query<T>(q, params)).rows
    })
  return { db, as }
}

describe('schema_v7: calmer notifications', { timeout: 30_000 }, () => {
  it('keeps existing rows and gives them calm defaults', async () => {
    const { db } = await makeDb()
    const s = (await db.query<any>(`select prefs, repeat_kids from public.push_subscriptions`)).rows[0]
    expect(s).toEqual({ prefs: {}, repeat_kids: false })
    const n = (await db.query<any>(`select label, delivered_to, skipped from public.scheduled_notifications`)).rows[0]
    expect(n).toEqual({ label: null, delivered_to: [], skipped: null })
  })

  it('lets a family save its own prefs and queue labelled reminders, but not touch another family', async () => {
    const { as } = await makeDb()
    await as(A, `update public.push_subscriptions set prefs = '{"morning":true,"morningAt":"07:30"}', repeat_kids = true where family_key = $1`, [A])
    expect((await as<any>(A, `select prefs from public.push_subscriptions`))[0].prefs.morning).toBe(true)
    await as(A, `insert into public.scheduled_notifications (family_key, fire_at, title, body, tag, label) values ($1, now(), 'T', 'B', 'x', 'Piano at 16:15')`, [A])
    // Family B can neither see nor change A's subscription.
    expect(await as(B, `select * from public.push_subscriptions`)).toHaveLength(0)
    await as(B, `update public.push_subscriptions set prefs = '{}' where family_key = $1`, [A])
    expect((await as<any>(A, `select prefs from public.push_subscriptions`))[0].prefs.morning).toBe(true)
    await expect(as(B, `insert into public.push_subscriptions (family_key, member_id, endpoint, p256dh, auth) values ($1, 'x', 'e', 'p', 'a')`, [A])).rejects.toThrow()
  })

  it('keeps notification_counts away from the app key, and counts per person per day', async () => {
    const { db, as } = await makeDb()
    await expect(as(A, `select * from public.notification_counts`)).rejects.toThrow()
    await expect(as(A, `insert into public.notification_counts (family_key, member_id, day) values ($1, 'mum', current_date)`, [A])).rejects.toThrow()
    await db.exec(`insert into public.notification_counts (family_key, member_id, day, sent) values ('${A}', 'mum', '2026-11-04', 2)`)
    await db.exec(`insert into public.notification_counts (family_key, member_id, day, sent) values ('${A}', 'mum', '2026-11-04', 3) on conflict (family_key, member_id, day) do update set sent = excluded.sent`)
    expect((await db.query<any>(`select sent from public.notification_counts`)).rows).toEqual([{ sent: 3 }])
  })
})
