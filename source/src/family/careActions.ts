/**
 * Writers for the Tier 1 Care/Dog additions: feed sessions, medicine dosing, expressed milk, dog treatments/output/stock.
 * Same conventions as planActions.ts: every function returns the AppEvent[] to `act()`; upserts carry a full copy; undo is
 * a `void` event.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { uid } from '@/engine/rng'
import { logBaby, logPet } from './actions'
import { DEFAULT_MED_RULES, feedActiveSec, feedSideResult, type FeedRunState } from './care'
import { addToList } from './planActions'
import { MAIN_LIST } from './shopping'
import { ymdOf } from './dates'
import type { FamilyState, MedRuleEvent, MemberId, PetStockEvent, VaultEvent, Ymd } from './types'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

// ------------------------------------------------------------------ feed sessions

export type FeedSide = 'L' | 'R'

export function startFeedRun(
  actor: MemberId,
  babyId: MemberId,
  method: 'breast' | 'bottle' | 'pump',
  opts: { side?: FeedSide; ml?: number; milk?: 'formula' | 'expressed' } = {},
  now = Date.now(),
): { feedRunId: string; events: AppEvent[] } {
  const feedRunId = uid('fr')
  return {
    feedRunId,
    events: [ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'start', method, side: method !== 'bottle' ? (opts.side ?? 'L') : undefined, ml: opts.ml, milk: opts.milk }, now)],
  }
}
export const switchFeedSide = (actor: MemberId, babyId: MemberId, feedRunId: string, side: FeedSide, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'switch', side }, now),
]
export const pauseFeedRun = (actor: MemberId, babyId: MemberId, feedRunId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'pause' }, now)]
export const resumeFeedRun = (actor: MemberId, babyId: MemberId, feedRunId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'resume' }, now)]
/** Nudge a running or paused feed run's recorded time by `deltaSec` (+/-) — for a parent who started the timer a
 * few minutes late, or forgot to pause/resume at the right moment, to correct the duration without restarting. */
export const adjustFeedRun = (actor: MemberId, babyId: MemberId, feedRunId: string, deltaSec: number, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'adjust', deltaSec }, now),
]

/** Stop the feed session and log it as a normal baby `feed` event, so it shows up everywhere a feed already does.
 * `startedTs` is the run's real start time (its `feedrun` "start" event, unaffected by any pauses in between) -
 * the feed is logged there, not derived from `now - minutes`. That arithmetic assumes every one of `minutes` was
 * spent back-to-back right up to `now`, which is only true for a feed with no pause: `minutes` counts active
 * feeding time only, so a session with a pause in it has a real duration (start to stop) longer than `minutes`,
 * and `now - minutes` lands somewhere between the true start and `now` - the longer the pause, the closer to
 * `now` it drifts, which is exactly the "feed shows at the end" bug this replaces. */
export function stopFeedRun(
  actor: MemberId,
  f: FamilyState,
  feedRunId: string,
  opts: { minutes: number; side: 'L' | 'R' | 'both'; babyId: MemberId; method: 'breast' | 'bottle'; ml?: number; milk?: 'formula' | 'expressed'; startedTs: number },
  now = Date.now(),
): AppEvent[] {
  const out: AppEvent[] = [ev(actor, { type: 'feedrun', feedRunId, babyId: opts.babyId, action: 'stop' }, now)]
  out.push(
    ...logBaby(
      actor,
      {
        babyId: opts.babyId,
        kind: 'feed',
        at: opts.startedTs,
        feed: opts.method === 'bottle' ? { method: 'bottle', ml: opts.ml, milk: opts.milk } : { method: 'breast', side: opts.side, minutes: opts.minutes },
      },
      now + 1,
    ),
  )
  if (opts.method === 'bottle' && opts.milk === 'expressed' && opts.ml) {
    const feedEventId = out[out.length - 1]!.id
    out.push(...deductMilk(actor, f, opts.babyId, opts.ml, feedEventId, now + 2))
  }
  return out
}

/** Close an abandoned feed run (see ABANDONED_FEED_RUN_MS in care.ts) as though it had been stopped the moment it
 * went quiet, instead of leaving it "live" forever with nothing ever actually logged for it - logs it as a normal
 * feed, using only the active time already on record (nothing is added for the hours of silence since). Deterministic
 * ids (built from the run's own id, not a fresh uid) make this safe to call from more than one device around the
 * same moment: the sync layer and local repo both dedupe inserts by event id, so two phones independently noticing
 * the same abandoned run end up writing identical events rather than logging it twice. If the guess is wrong, the
 * resulting entry can be corrected with A.editBaby (see the "edit" button on log rows in Care.tsx). */
export function autoCloseFeedRun(actor: MemberId, r: FeedRunState, now = Date.now()): AppEvent[] {
  const minutes = Math.max(0, Math.round(feedActiveSec(r, r.lastTs) / 60))
  const side = feedSideResult(r)
  return [
    ev(actor, { type: 'feedrun', feedRunId: r.id, babyId: r.babyId, action: 'stop' }, now, `autostop-${r.id}`),
    // A forgotten pumping session is logged without an amount (nobody said how much), so stock is left alone; the
    // entry can be edited afterwards.
    r.method === 'pump'
      ? ev(actor, { type: 'baby', babyId: r.babyId, kind: 'pump', at: r.startedTs, pump: { side, minutes } }, now + 1, `autofeed-${r.id}`)
      : ev(actor, { type: 'baby', babyId: r.babyId, kind: 'feed', at: r.startedTs, feed: { method: 'breast', side, minutes } }, now + 1, `autofeed-${r.id}`),
  ]
}

/** Log an expressing session: a pump entry for the history, and (if an amount is given) that milk into stock. */
export function logPump(actor: MemberId, babyId: MemberId, d: { at: number; ml?: number; side?: 'L' | 'R' | 'both'; minutes?: number; location?: 'fridge' | 'freezer' }, now = Date.now()): AppEvent[] {
  const entry = logBaby(actor, { babyId, kind: 'pump', at: d.at, pump: { ml: d.ml || undefined, side: d.side, minutes: d.minutes || undefined } }, now)
  const id = entry[0]!.id
  return [...entry, ...(d.ml ? [ev(actor, { type: 'milk-stock', babyId, action: 'add', ml: d.ml, location: d.location ?? 'fridge', expressedDate: ymdOf(d.at), pumpEventId: id }, now + 1)] : [])]
}

/** Stop a pumping session and log it (see logPump). */
export function stopPumpRun(
  actor: MemberId,
  babyId: MemberId,
  feedRunId: string,
  d: { startedTs: number; ml?: number; side: 'L' | 'R' | 'both'; minutes: number; location?: 'fridge' | 'freezer' },
  now = Date.now(),
): AppEvent[] {
  return [
    ev(actor, { type: 'feedrun', feedRunId, babyId, action: 'stop' }, now),
    ...logPump(actor, babyId, { at: d.startedTs, ml: d.ml, side: d.side, minutes: d.minutes, location: d.location }, now + 1),
  ]
}

// ------------------------------------------------------------------ medicine dosing

export type MedRuleDraft = Pick<MedRuleEvent, 'name' | 'maxPerDay' | 'minGapHours'>

export function saveMedRule(actor: MemberId, r: MedRuleDraft, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'med-rule', name: r.name.trim(), maxPerDay: r.maxPerDay, minGapHours: r.minGapHours }, now)]
}
export const deleteMedRule = (actor: MemberId, existing: MedRuleEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'med-rule', name: existing.name, maxPerDay: existing.maxPerDay, minGapHours: existing.minGapHours, deleted: true }, now),
]

/** Seed the common UK OTC defaults, without overwriting any the family has already edited. */
export function seedMedRules(actor: MemberId, f: FamilyState, now = Date.now()): AppEvent[] {
  return DEFAULT_MED_RULES.filter((r) => !f.medRules[r.name.toLowerCase()]).flatMap((r, i) => saveMedRule(actor, r, now + i))
}

export function logMedicine(actor: MemberId, babyId: MemberId, name: string, opts: { mg?: number; ml?: number } = {}, now = Date.now()): AppEvent[] {
  return logBaby(actor, { babyId, kind: 'medicine', at: now, medicine: { name, ...opts } }, now)
}

// ------------------------------------------------------------------ expressed milk

export function addMilk(actor: MemberId, babyId: MemberId, ml: number, opts: { location?: 'fridge' | 'freezer'; expressedDate?: Ymd } = {}, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'milk-stock', babyId, action: 'add', ml, location: opts.location ?? 'fridge', expressedDate: opts.expressedDate ?? ymdOf(now) }, now)]
}
export function deductMilk(actor: MemberId, _f: FamilyState, babyId: MemberId, ml: number, feedEventId: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'milk-stock', babyId, action: 'deduct', ml, feedEventId }, now)]
}

// ------------------------------------------------------------------ dog: treatment, output, stock

export function logTreatment(actor: MemberId, f: FamilyState, petId: MemberId, product: string, cycleDays: number, now = Date.now()): AppEvent[] {
  return logPet(actor, f, { petId, kind: 'treatment', at: now, treatment: { product, cycleDays } }, now)
}

export function logOutput(
  actor: MemberId,
  f: FamilyState,
  petId: MemberId,
  outputKind: 'diarrhoea' | 'vomit',
  opts: { firmness?: 1 | 2 | 3 | 4 | 5; note?: string } = {},
  now = Date.now(),
): AppEvent[] {
  return logPet(actor, f, { petId, kind: 'output', at: now, output: { outputKind, firmness: opts.firmness }, note: opts.note }, now)
}

export type PetStockDraft = Omit<PetStockEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'stockId' | 'reordered'> & { stockId?: string }

export function openStock(actor: MemberId, s: PetStockDraft, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'pet-stock', stockId: s.stockId ?? uid('ps'), petId: s.petId, product: s.product, weightG: s.weightG, dailyG: s.dailyG, openedDate: s.openedDate }, now)]
}
export const deleteStock = (actor: MemberId, existing: PetStockEvent, now = Date.now()): AppEvent[] => [
  ev(
    actor,
    {
      type: 'pet-stock',
      stockId: existing.stockId,
      petId: existing.petId,
      product: existing.product,
      weightG: existing.weightG,
      dailyG: existing.dailyG,
      openedDate: existing.openedDate,
      deleted: true,
    },
    now,
  ),
]

/** Add the food to the shared shopping list (once) and mark the current bag as reordered, so it is not added twice. */
export function reorderStock(actor: MemberId, f: FamilyState, existing: PetStockEvent, now = Date.now()): AppEvent[] {
  const add = addToList(actor, f, MAIN_LIST, [{ name: existing.product, aisle: 'pet' }], now)
  const mark = ev(
    actor,
    {
      type: 'pet-stock',
      stockId: existing.stockId,
      petId: existing.petId,
      product: existing.product,
      weightG: existing.weightG,
      dailyG: existing.dailyG,
      openedDate: existing.openedDate,
      reordered: true,
    },
    now + add.length,
  )
  return [...add, mark]
}

// ------------------------------------------------------------------ static info vault

export type VaultDraft = Omit<VaultEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'itemId'> & { itemId?: string }

export function saveVaultItem(actor: MemberId, d: VaultDraft, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'vault', itemId: d.itemId ?? uid('va'), memberId: d.memberId, label: d.label.trim(), value: d.value.trim(), category: d.category }, now)]
}
export const deleteVaultItem = (actor: MemberId, existing: VaultEvent, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'vault', itemId: existing.itemId, memberId: existing.memberId, label: existing.label, value: existing.value, category: existing.category, deleted: true }, now),
]

// ------------------------------------------------------------------ voice logging

/** What "bottle" logs by voice, and the family's time zone, for the log-care function (see docs/VOICE_LOGGING.md). */
export const saveVoiceConfig = (actor: MemberId, c: { bottleMl: number; milk: 'formula' | 'expressed'; tz: string }, now = Date.now()): AppEvent[] => [ev(actor, { type: 'voice-config', ...c }, now)]
