/**
 * Dog (or other pet) care beyond the plain walk/feed log: the anti-double-feeding lock, preventative medicine (flea/worming)
 * due dates, food stock and its run-out guess, and a vet-ready 7-day output history.
 */
import { addDays, daysBetween, tsOf, ymdOf } from './dates'
import type { FamilyState, MemberId, PetEvent } from './types'

// ------------------------------------------------------------------ anti-double-feeding

export type Meal = 'breakfast' | 'dinner'

/** When each meal's window opens. Fixed defaults; not currently per-family editable. */
export const MEAL_WINDOWS: Record<Meal, { fromHm: string }> = { breakfast: { fromHm: '06:00' }, dinner: { fromHm: '16:00' } }

export interface MealLock {
  locked: boolean
  by?: MemberId
  at?: number
  meal?: Meal
  /** When the (single) feed button unlocks again: the next meal's window after the one just logged. */
  unlocksAt?: number
}

/** Today's feed of `meal`, if any (voided ones don't count). */
export function mealFedToday(f: FamilyState, petId: MemberId, meal: Meal, now = Date.now()): PetEvent | undefined {
  const today = ymdOf(now)
  return f.pets.find((e) => e.petId === petId && e.kind === 'feed' && e.meal === meal && !f.voided[e.id] && ymdOf(e.at) === today)
}

/** The most recent feed logged (either meal), whichever day it was — the lock window it implies naturally expires once
 * that window has passed, so an old feed does not keep tomorrow locked. */
function lastFeed(f: FamilyState, petId: MemberId): PetEvent | undefined {
  return f.pets
    .filter((e) => e.petId === petId && e.kind === 'feed' && !f.voided[e.id] && (e.meal === 'breakfast' || e.meal === 'dinner'))
    .sort((a, b) => b.at - a.at)[0]
}

/**
 * The dog has one feed button, not two: this is the classic "did someone already feed him?" guard. Once a meal is logged,
 * feeding locks until the *next* meal's window (breakfast logged -> locked until dinner; dinner logged -> locked until
 * tomorrow's breakfast), so both parents can't be tricked into the same meal, but the next one still opens on time.
 */
export function mealLock(f: FamilyState, petId: MemberId, _meal: Meal, now = Date.now()): MealLock {
  const fed = lastFeed(f, petId)
  if (!fed) return { locked: false }
  const meal = fed.meal as Meal
  const today = ymdOf(fed.at)
  const other: Meal = meal === 'breakfast' ? 'dinner' : 'breakfast'
  let unlocksAt = tsOf(meal === 'dinner' ? addDays(today, 1) : today, MEAL_WINDOWS[other].fromHm)
  if (unlocksAt <= fed.at) unlocksAt = tsOf(addDays(today, 1), MEAL_WINDOWS[other].fromHm)
  return { locked: now < unlocksAt, by: fed.learnerId, at: fed.at, meal, unlocksAt }
}

// ------------------------------------------------------------------ preventative medicine (flea/worming)

/** The last treatment logged of this product (or any, if product is omitted), most recent first. */
export function lastTreatment(f: FamilyState, petId: MemberId, product?: string): PetEvent | undefined {
  return f.pets
    .filter((e) => e.petId === petId && e.kind === 'treatment' && !f.voided[e.id] && (!product || e.treatment?.product === product))
    .sort((a, b) => b.at - a.at)[0]
}

export interface TreatmentDue {
  due: boolean
  dueAt?: number
  locked: boolean
}

/** Locked for `cycleDays` after the last dose; due once that has passed (shown as a banner, not a push notification —
 * this app has no server to send one from). */
export function treatmentDue(f: FamilyState, petId: MemberId, product: string, cycleDays: number, now = Date.now()): TreatmentDue {
  const last = lastTreatment(f, petId, product)
  if (!last) return { due: true, locked: false }
  const dueAt = last.at + cycleDays * 86_400_000
  return { due: now >= dueAt, dueAt, locked: now < dueAt }
}

// ------------------------------------------------------------------ vet output history

export interface OutputRow {
  at: number
  kind: 'diarrhoea' | 'vomit'
  firmness?: number
  note?: string
}

/** The last `days` days of logged diarrhoea/being sick, newest first — a "hand this to the vet" table. */
export function vetHistory(f: FamilyState, petId: MemberId, days = 7, now = Date.now()): OutputRow[] {
  const since = now - days * 86_400_000
  return f.pets
    .filter((e) => e.petId === petId && e.kind === 'output' && !f.voided[e.id] && e.at >= since)
    .sort((a, b) => b.at - a.at)
    .map((e) => ({ at: e.at, kind: e.output!.outputKind, firmness: e.output?.firmness, note: e.note }))
}

// ------------------------------------------------------------------ food stock and run-out

export const liveStock = (f: FamilyState, petId: MemberId): typeof f.petStock[string][] =>
  Object.values(f.petStock)
    .filter((s) => s.petId === petId && !s.deleted)
    .sort((a, b) => b.openedDate.localeCompare(a.openedDate))

/** The bag/box currently in use (most recently opened). */
export const currentStock = (f: FamilyState, petId: MemberId) => liveStock(f, petId)[0]

/** When the current bag is expected to run out, from its weight and the daily feed rate. Undefined if we don't know
 * either. */
export function stockRunsOut(f: FamilyState, petId: MemberId): string | undefined {
  const s = currentStock(f, petId)
  if (!s || !s.dailyG) return undefined
  const totalDays = s.weightG / s.dailyG
  return addDays(s.openedDate, Math.round(totalDays))
}

/** True a week (or less) before the current bag is expected to run out, and not already queued on the shopping list. */
export function needsReorder(f: FamilyState, petId: MemberId, now = Date.now()): boolean {
  const s = currentStock(f, petId)
  const runsOut = stockRunsOut(f, petId)
  if (!s || s.reordered || !runsOut) return false
  return daysBetween(ymdOf(now), runsOut) <= 7
}
