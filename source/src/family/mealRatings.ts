/**
 * Rating meals. Each person rates a meal for themselves, after it has been eaten, and only if they want to: nobody has to vote,
 * and someone who does not simply is not counted. Ratings are kept against the meal's "key" (the recipe, or the lower-cased title
 * for a meal with no recipe) so a meal rated this week is recognised when it comes round again, and they are what the planner's
 * suggestions learn from.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import { hmOf } from './dates'
import type { FamilyState, MealPlanEvent, MealRatingEvent, MealSlot, MemberId, Ymd } from './types'

/** A meal as people think of it: the recipe if it has one, otherwise what was typed (case and spacing ignored). */
export const mealKeyOf = (m: { recipeId?: string; title: string }): string => m.recipeId ?? `t:${m.title.trim().toLowerCase().replace(/\s+/g, ' ')}`

export type Rating = 1 | 2 | 3
export const RATINGS: { value: Rating; emoji: string; label: string }[] = [
  { value: 1, emoji: '👎', label: 'Not for me' },
  { value: 2, emoji: '😐', label: 'Fine' },
  { value: 3, emoji: '👍', label: 'Loved it' },
]

export const ratingOf = (f: FamilyState, memberId: MemberId, planId: string): Rating | undefined => {
  const r = f.mealRatings[`${memberId}|${planId}`]
  return r && !r.cleared ? r.rating : undefined
}

/**
 * Rate a meal for someone, or take their rating back (tapping the same one again). Only for a meal that is planned. A rating
 * is about the person it is for, whoever tapped: a parent may rate for a little one.
 */
export function rateMeal(actor: MemberId, f: FamilyState, d: { planId: string; memberId: MemberId; rating: Rating }, now = Date.now()): AppEvent[] {
  const m = f.meals[d.planId]
  if (!m || m.deleted) return []
  const same = ratingOf(f, d.memberId, d.planId) === d.rating
  return [
    makeEvent(
      actor,
      {
        type: 'meal-rating',
        planId: d.planId,
        memberId: d.memberId,
        rating: d.rating,
        key: mealKeyOf(m),
        title: m.title,
        recipeId: m.recipeId,
        date: m.date,
        slot: m.slot,
        cleared: same || undefined,
      },
      now,
    ),
  ]
}

/** Everyone who has rated meals with this key, from live ratings, newest ratings of each meal. */
export function ratingsForKey(f: FamilyState, key: string): MealRatingEvent[] {
  return Object.values(f.mealRatings).filter((r) => !r.cleared && r.key === key)
}

export interface Taste {
  /** People who rated it (a person counts once per time it was eaten). */
  votes: number
  /** Mean of 1..3, or undefined if nobody has rated it. */
  mean?: number
  loved: MemberId[]
  disliked: MemberId[]
}

/** What the people who bothered to vote think of a meal. */
export function tasteOf(f: FamilyState, key: string): Taste {
  const rs = ratingsForKey(f, key)
  const loved = [...new Set(rs.filter((r) => r.rating === 3).map((r) => r.memberId))]
  const disliked = [...new Set(rs.filter((r) => r.rating === 1).map((r) => r.memberId))]
  return { votes: rs.length, mean: rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : undefined, loved, disliked }
}

/** Two or more people said no, or most who voted did: the planner leaves it out of suggestions. */
export const isUnpopular = (t: Taste): boolean => t.disliked.length >= 2 || (t.votes >= 2 && (t.mean ?? 3) < 1.5)

/** The meals on `date` that are worth asking about: eaten by now (its time has started) and not a snack. */
export function mealsToRate(f: FamilyState, date: Ymd, now: number, today: Ymd): MealPlanEvent[] {
  if (date > today) return []
  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner']
  const hm = hmOf(now)
  const start: Record<string, string> = { breakfast: '07:00', lunch: '11:30', dinner: '17:30' }
  return Object.values(f.meals)
    .filter((m) => !m.deleted && m.date === date && slots.includes(m.slot) && (date < today || hm >= (m.start ?? start[m.slot]!)))
    .sort((a, b) => slots.indexOf(a.slot) - slots.indexOf(b.slot))
}
