/**
 * supabase/schema_v5.sql (family invites) on a real Postgres (PGlite): every schema file in order, then v5 twice
 * (it must be safe to re-run), then the rules from the point of view of the public anon key.
 */
import { describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync } from 'node:fs'

const sql = (f: string) => readFileSync(new URL(`../../supabase/${f}`, import.meta.url), 'utf8')
const OLD = 'oldfamilykey000000001'
const NEW = 'newfamilykey000000002'
const STRANGER = 'strangerkey0000000003'

async function makeDb() {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema extensions; grant usage on schema extensions to anon;`)
  for (const f of ['schema.sql', 'schema_v2.sql', 'schema_v3.sql', 'schema_v4.sql']) await db.exec(sql(f))
  // A family already syncing before invites existed.
  await db.exec(`insert into public.events (id, family_key, learner_id, ts, type, body) values ('e0', '${OLD}', 'm', 1, 'x', '{}')`)
  await db.exec(sql('schema_v5.sql'))
  await db.exec(sql('schema_v5.sql'))
  const as = <T = Record<string, unknown>>(key: string, q: string, params: unknown[] = []) =>
    db.transaction(async (tx) => {
      await tx.query(`select set_config('request.headers', $1, true)`, [JSON.stringify({ 'x-family-key': key })])
      await tx.exec('set local role anon')
      return (await tx.query<T>(q, params)).rows
    })
  const rpc = async (key: string, q: string, params: unknown[] = []) => ((await as<{ r: Record<string, unknown> }>(key, `select ${q} r`, params))[0] as { r: Record<string, unknown> }).r
  const write = (key: string, id: string) =>
    as(key, `insert into public.events (id, family_key, learner_id, ts, type, body) values ($1, $2, 'm', 1, 'x', '{}')`, [id, key]).then(
      () => 'ok',
      () => 'refused',
    )
  return { db, as, rpc, write }
}

describe('schema_v5: one server, families by invitation', () => {
  it('keeps families that were already syncing, and keeps strangers out', async () => {
    const { as, rpc, write } = await makeDb()
    expect(await rpc(OLD, 'public.family_status()')).toMatchObject({ approved: true })
    expect(await write(OLD, 'e1')).toBe('ok')
    expect(await write(STRANGER, 's1')).toBe('refused')
    expect(await rpc(STRANGER, 'public.create_family_invite()')).toMatchObject({ ok: false, error: 'not_approved' })
    await expect(as(STRANGER, 'select * from public.families')).rejects.toThrow()
    await expect(as(STRANGER, `insert into public.families (family_key) values ('${STRANGER}')`)).rejects.toThrow()
    await expect(as(STRANGER, 'select * from public.family_invites')).rejects.toThrow()
  })

  it('an invite lets exactly one new family in', async () => {
    const { as, rpc, write } = await makeDb()
    const inv = await rpc(OLD, 'public.create_family_invite()')
    expect(inv.ok).toBe(true)
    expect(String(inv.code)).toMatch(/^hqi\.[a-z2-9]{12}$/)
    expect(await rpc(NEW, 'public.redeem_family_invite($1)', ['hqi.nosuchcode1'])).toMatchObject({ ok: false, error: 'unknown' })
    expect(await rpc(NEW, 'public.redeem_family_invite($1)', [` ${String(inv.code).toUpperCase()} `])).toMatchObject({ ok: true })
    expect(await write(NEW, 'n1')).toBe('ok')
    expect(await rpc(STRANGER, 'public.redeem_family_invite($1)', [inv.code])).toMatchObject({ ok: false, error: 'used' })
    expect(await write(STRANGER, 's1')).toBe('refused')
    // Each family still only sees its own rows.
    expect(await as(NEW, 'select id from public.events')).toEqual([{ id: 'n1' }])
  })

  it('invites run out, and a family can only have 5 waiting at once', async () => {
    const { db, rpc } = await makeDb()
    for (let i = 0; i < 7; i++) await rpc(OLD, 'public.create_family_invite()')
    expect(await rpc(OLD, 'public.family_status()')).toMatchObject({ open_invites: 5 })
    expect(await rpc(OLD, 'public.create_family_invite()')).toMatchObject({ ok: false, error: 'too_many' })
    await db.exec(`insert into public.family_invites (code, created_by, expires_at) values ('hqi.expiredcode1', '${OLD}', now() - interval '1 day')`)
    expect(await rpc(STRANGER, 'public.redeem_family_invite($1)', ['hqi.expiredcode1'])).toMatchObject({ ok: false, error: 'expired' })
  })

  it('private events (schema_v3) still need their owner key, and push subscriptions need an approved family', async () => {
    const { as } = await makeDb()
    const priv = (owner: string) =>
      as(OLD, `insert into public.events (id, family_key, learner_id, ts, type, body, owner_key) values ($1, $2, 'm', 1, 'x', '{}', $3)`, [`p-${owner.length}`, OLD, owner]).then(
        () => 'ok',
        () => 'refused',
      )
    expect(await priv('short')).toBe('refused')
    expect(await priv('k'.repeat(32))).toBe('ok')
    const sub = (key: string) =>
      as(key, `insert into public.push_subscriptions (family_key, member_id, endpoint, p256dh, auth) values ($1, 'm', 'https://push.example/1', 'p', 'a')`, [key]).then(
        () => 'ok',
        () => 'refused',
      )
    expect(await sub(OLD)).toBe('ok')
    expect(await sub(STRANGER)).toBe('refused')
  })
})
