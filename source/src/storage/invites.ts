/**
 * Family invites (supabase/schema_v5.sql). Every family shares one Supabase project; a family can only add rows once its
 * family key is approved, and a family that is already approved can make one-time invite codes (`hqi.` + 12 characters)
 * for others. These are the three RPC calls the app makes, sent with the family key in the same x-family-key header as
 * sync.
 *
 * A project that has not had schema_v5.sql run has none of these functions. That is reported as `notSetUp` so the app
 * can carry on as before (sharing without an invite) until it has.
 */
export interface InviteCfg {
  url: string
  anonKey: string
  familyKey: string
  fetchImpl?: typeof fetch
}

export type InviteError = 'unknown' | 'used' | 'expired' | 'too_many' | 'not_approved' | 'bad_family_key' | 'offline' | 'server'

export type Status = { ok: true; notSetUp: true } | { ok: true; notSetUp?: false; approved: boolean; openInvites: number } | { ok: false; error: InviteError; detail?: string }
export type Created = { ok: true; code: string; expiresAt: string } | { ok: false; error: InviteError | 'not_set_up'; detail?: string }
export type Redeemed = { ok: true; notSetUp?: boolean } | { ok: false; error: InviteError; detail?: string }

const INVITE_RE = /^hqi\.[a-z2-9]{12}$/

/** Tidy what someone typed or pasted: case, spaces, a missing "hqi." prefix. Undefined if it can't be an invite code. */
export function normaliseInvite(raw: string): string | undefined {
  const t = raw.trim().toLowerCase().replace(/\s+/g, '')
  const c = t.startsWith('hqi.') ? t : `hqi.${t}`
  return INVITE_RE.test(c) ? c : undefined
}

/** POST /rest/v1/rpc/<fn>. `missing` is true when the function doesn't exist (schema_v5.sql not run). */
async function rpc(cfg: InviteCfg, fn: string, args: Record<string, unknown> = {}): Promise<{ missing: true } | { missing: false; ok: boolean; status: number; body: unknown }> {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const res = await f(`${cfg.url.replace(/\/+$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'x-family-key': cfg.familyKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = undefined
  }
  // PostgREST: 404 with code PGRST202 = no such function (older versions: 404 with a "Could not find the function" message).
  const code = (body as { code?: string } | undefined)?.code
  if (res.status === 404 && (code === 'PGRST202' || /function/i.test(JSON.stringify(body ?? '')))) return { missing: true }
  return { missing: false, ok: res.ok, status: res.status, body }
}

const detailOf = (r: { status: number; body: unknown }) => `${r.status} ${JSON.stringify(r.body ?? '').slice(0, 160)}`

export async function familyStatus(cfg: InviteCfg): Promise<Status> {
  try {
    const r = await rpc(cfg, 'family_status')
    if (r.missing) return { ok: true, notSetUp: true }
    if (!r.ok) return { ok: false, error: 'server', detail: detailOf(r) }
    const b = r.body as { approved?: boolean; open_invites?: number }
    return { ok: true, approved: !!b.approved, openInvites: Number(b.open_invites ?? 0) }
  } catch (e) {
    return { ok: false, error: 'offline', detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function createInvite(cfg: InviteCfg): Promise<Created> {
  try {
    const r = await rpc(cfg, 'create_family_invite')
    if (r.missing) return { ok: false, error: 'not_set_up' }
    if (!r.ok) return { ok: false, error: 'server', detail: detailOf(r) }
    const b = r.body as { ok?: boolean; code?: string; expires_at?: string; error?: InviteError }
    return b.ok && b.code ? { ok: true, code: b.code, expiresAt: String(b.expires_at ?? '') } : { ok: false, error: b.error ?? 'server' }
  } catch (e) {
    return { ok: false, error: 'offline', detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function redeemInvite(cfg: InviteCfg, code: string): Promise<Redeemed> {
  try {
    const r = await rpc(cfg, 'redeem_family_invite', { invite: code })
    if (r.missing) return { ok: true, notSetUp: true }
    if (!r.ok) return { ok: false, error: 'server', detail: detailOf(r) }
    const b = r.body as { ok?: boolean; error?: InviteError }
    return b.ok ? { ok: true } : { ok: false, error: b.error ?? 'server' }
  } catch (e) {
    return { ok: false, error: 'offline', detail: e instanceof Error ? e.message : String(e) }
  }
}

/** What to tell a person when an invite didn't work. */
export function inviteErrorText(e: InviteError | 'not_set_up' | 'invalid'): string {
  switch (e) {
    case 'invalid':
      return 'That doesn’t look like an invite code. It starts with "hqi." and has 12 letters and numbers after it.'
    case 'unknown':
      return 'That invite code isn’t one we know. Check it with the person who sent it.'
    case 'used':
      return 'That invite code has already been used. Ask for a new one.'
    case 'expired':
      return 'That invite code has run out (they last 14 days). Ask for a new one.'
    case 'too_many':
      return 'This family already has 5 invites waiting to be used. Once one is used or runs out (14 days), you can make another.'
    case 'not_approved':
      return 'This family isn’t approved yet, so it can’t invite others.'
    case 'not_set_up':
      return 'Invites aren’t switched on for this project yet (supabase/schema_v5.sql).'
    case 'offline':
      return 'Couldn’t reach the server. Check the connection and try again.'
    default:
      return 'Something went wrong on the server. Try again in a minute.'
  }
}
