/**
 * Co-parenting: two SEPARATE households, each running its own copy of this app (own family, own event log,
 * own optional Supabase project for their family sync), sharing one child's schedule. The two households'
 * busy-block snapshots for a given link live in ONE shared Supabase project (see `CoparentLinkCode`), which is
 * a transport detail only — everything below is pure logic and has no idea which side hosts it. No React, no
 * browser APIs (the one exception, `linkCodeFor`, needs no browser API either; encoding is plain base64url).
 *
 * Nothing here pools coins/XP across households: that stays entirely separate because each household's event
 * log and optional Supabase project already are. See docs/ARCHITECTURE.md, "Decisions and their reasons".
 *
 * The sharing rules this file exists to enforce:
 *  - scoped to exactly one child per link — never touches another child's items
 *  - default visibility is busy/free only, EXCEPT school/club-type items always show their label (not private)
 *  - an individual calendar event can be flagged (`shareDetail`) to share its full detail
 *  - a parent's own personal event detail is never shared, at any level beyond busy/free
 */
import { addDays, startOfWeek, weekday } from './dates'
import { itemsOn, type CalCtx } from './calendar'
import type { CoparentLinkEvent, HouseholdSlot, Hm, Ymd } from './types'

// ------------------------------------------------------------------------------- rotation ("whose week is it")

/** One-week-on/one-week-off rotation, anchored at `rotationAnchorMonday` (a Monday). */
export function isHereWeek(link: Pick<CoparentLinkEvent, 'rotationAnchorMonday' | 'anchorHere'>, date: Ymd): boolean {
  const thisMonday = startOfWeek(date)
  const anchorMonday = startOfWeek(link.rotationAnchorMonday)
  const weeks = Math.round((dateToDays(thisMonday) - dateToDays(anchorMonday)) / 7)
  const sameParity = weeks % 2 === 0
  return sameParity ? link.anchorHere : !link.anchorHere
}

const dateToDays = (s: Ymd): number => Date.parse(`${s}T12:00:00Z`) / 86_400_000

/** The next Monday (strictly after `from`) on which the rotation flips — i.e. the next handoff day. */
export function nextHandoff(link: Pick<CoparentLinkEvent, 'rotationAnchorMonday' | 'anchorHere'>, from: Ymd): Ymd {
  void link // the flip cadence (every Monday) does not depend on which side of the rotation the anchor started on
  return weekday(from) === 0 ? addDays(from, 7) : addDays(startOfWeek(from), 7)
}

// ------------------------------------------------------------------------------------- link codes

/** What a link code carries: the ONE shared Supabase project both households' `shared_busy` rows for this
 * link live in, the link's secret, and which slot the code's RECIPIENT should use (the opposite of the
 * creator's own slot, so the two sides always end up complementary). */
export interface CoparentLinkCode {
  url: string
  anonKey: string
  linkKey: string
  /** The slot the code's redeemer should adopt. */
  householdSlot: HouseholdSlot
}

export const otherSlot = (slot: HouseholdSlot): HouseholdSlot => (slot === 'a' ? 'b' : 'a')

/** `hqc2.<base64url(JSON)>` — the household that creates a link generates this from ITS OWN Supabase project
 * (the one that will host this link's `shared_busy` rows) plus the link's secret; it hands out the slot it is
 * NOT using itself, since the redeemer must end up on the complementary slot. The other parent pastes it into
 * their app to complete the pairing — no Supabase project of their own is needed for this link. Treat it like
 * a password. */
export function linkCodeFor(code: CoparentLinkCode): string {
  return `hqc2.${toBase64Url(JSON.stringify({ u: code.url, a: code.anonKey, k: code.linkKey, s: code.householdSlot }))}`
}

export function parseLinkCode(code: string): CoparentLinkCode | null {
  const m = /^hqc2\.([A-Za-z0-9_-]+)$/.exec(code.trim())
  if (!m) return null
  try {
    const raw = JSON.parse(fromBase64Url(m[1] as string)) as { u?: string; a?: string; k?: string; s?: string }
    if (!raw.u || !raw.a || !raw.k || !/^https:\/\//.test(raw.u) || raw.k.length < 8) return null
    if (raw.s !== 'a' && raw.s !== 'b') return null
    return { url: raw.u, anonKey: raw.a, linkKey: raw.k, householdSlot: raw.s }
  } catch {
    return null
  }
}

const toBase64Url = (s: string): string => {
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf-8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromBase64Url = (s: string): string => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  return typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf-8')
}

// ------------------------------------------------------------------------------------- busy-block projection

/** One block of time on a shared child's calendar, as published to the other household. `label` is set only for
 * a school/club-type item (never private) or when the source event opted into full detail; `detail` is set ONLY
 * when the source event had `shareDetail: true`. No label and no detail = plain busy/free. */
export interface BusyBlock {
  date: Ymd
  start: Hm
  end: Hm
  label?: string
  detail?: { title: string; notes?: string; location?: string }
}

const LABELLED_SOURCES = new Set(['school', 'lesson', 'club', 'school-event', 'closure'])

/** Derive the busy blocks for ONE child, for local publishing to the other household. Never includes another
 * child's items, and never a parent's personal event detail — only what that child's own agenda items carry. */
export function busyBlocksFor(ctx: CalCtx, childId: string, from: Ymd, to: Ymd): BusyBlock[] {
  const out: BusyBlock[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const item of itemsOn(ctx, d, { schoolDetail: 'block' })) {
      if (!item.busy) continue
      // Scoped strictly to this child: everyone-items count (the whole family, including this child, is involved),
      // but an item naming other specific people without this child is excluded.
      if (!item.everyone && !item.members.includes(childId)) continue
      const start = item.allDay ? '00:00' : (item.start ?? '00:00')
      const end = item.allDay ? '23:59' : (item.end ?? start)
      const block: BusyBlock = { date: item.date, start, end }
      if (LABELLED_SOURCES.has(item.source)) {
        block.label = item.title
      } else if (item.source === 'cal' && item.calId) {
        // Only a plain calendar event can carry full detail, and only when its owning household flagged it.
        const cal = ctx.family.cal[item.calId]
        if (cal?.shareDetail) block.detail = { title: item.title, notes: item.notes, location: item.location }
      }
      out.push(block)
    }
  }
  return out
}
