/**
 * Meal planning: recipes, a plan for each day, "what shall we have this week?" suggestions, and turning the plan into a shopping
 * list. Pure functions; the events are written by planActions.ts.
 *
 * One meal per day and slot: the plan id is made from the date and slot, so two phones planning the same dinner overwrite each
 * other (latest wins) instead of putting two dinners on one night.
 */
import type { AgendaItem } from './calendar'
import { ARRIVAL_MEALS } from './arrival/pack'
import { addDays, dayName, dayRange, fromMin, toMin } from './dates'
import { isUnpopular, mealKeyOf, tasteOf, type Taste } from './mealRatings'
import { mergeNeeds, parseIngredients, scaleQty, type Need } from './shopping'
import type { FamilyState, Hm, Ingredient, MealPlanEvent, MealSlot, RecipeEvent, Ymd } from './types'
import type { Rng } from '@/engine/types'

export const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
export const SLOT_INFO: Record<MealSlot, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🥣' },
  lunch: { label: 'Lunch', emoji: '🥪' },
  dinner: { label: 'Dinner', emoji: '🍽️' },
  snack: { label: 'Snack', emoji: '🍎' },
}

export { mealKeyOf }

export const planIdFor = (date: Ymd, slot: MealSlot): string => `mp-${date}-${slot}`

// ------------------------------------------------------------------ recipes

export const liveRecipes = (f: FamilyState): RecipeEvent[] =>
  Object.values(f.recipes)
    .filter((r) => !r.deleted)
    .sort((a, b) => a.title.localeCompare(b.title))

export type RecipeDraft = Omit<RecipeEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'>

interface Starter {
  id: string
  title: string
  emoji: string
  minutes: number
  servings: number
  meal: MealSlot
  ingredients: string[]
  method: string
}

/** A few ordinary family meals so the planner is useful on day one. Quantities are for 4 people. */
const STARTERS: Starter[] = [
  { id: 'spag-bol', title: 'Spaghetti bolognese', emoji: '🍝', minutes: 45, servings: 4, meal: 'dinner', ingredients: ['500g beef mince', '1 onion', '2 cloves garlic', '2 carrots', '2 tins chopped tomatoes', '2 tbsp tomato puree', '350g spaghetti', '50g parmesan'], method: 'Fry the onion, garlic and grated carrot, brown the mince, add tomatoes and puree and simmer 25 minutes. Boil the spaghetti.' },
  { id: 'fajitas', title: 'Chicken fajitas', emoji: '🌯', minutes: 30, servings: 4, meal: 'dinner', ingredients: ['3 chicken breasts', '2 peppers', '1 onion', '1 pack fajita seasoning', '1 pack tortilla wraps', '1 pot soured cream', '1 bag grated cheddar'], method: 'Slice and fry the chicken, peppers and onion with the seasoning. Warm the wraps and serve with cheese and soured cream.' },
  { id: 'sausage-mash', title: 'Sausage, mash & peas', emoji: '🌭', minutes: 35, servings: 4, meal: 'dinner', ingredients: ['8 sausages', '1kg potatoes', '1 bag frozen peas', '1 pack gravy granules', '100ml milk'], method: 'Grill the sausages, boil and mash the potatoes with milk, cook the peas and make the gravy.' },
  { id: 'chilli', title: 'Chilli con carne', emoji: '🌶️', minutes: 50, servings: 4, meal: 'dinner', ingredients: ['500g beef mince', '1 onion', '1 pepper', '1 tin kidney beans', '1 tin chopped tomatoes', '1 tbsp chilli powder', '250g rice'], method: 'Brown the mince with the onion and pepper, add the spices, beans and tomatoes, simmer 30 minutes. Serve with rice.' },
  { id: 'fish-fingers', title: 'Fish fingers, chips & beans', emoji: '🐟', minutes: 25, servings: 4, meal: 'dinner', ingredients: ['1 pack fish fingers', '1 bag oven chips', '1 tin baked beans', '1 bag frozen peas'], method: 'Oven cook the fish fingers and chips together. Heat the beans and peas.' },
  { id: 'mac-cheese', title: 'Macaroni cheese with broccoli', emoji: '🧀', minutes: 35, servings: 4, meal: 'dinner', ingredients: ['300g macaroni', '500ml milk', '200g cheddar', '40g plain flour', '40g butter', '1 head broccoli'], method: 'Make a white sauce with the butter, flour and milk, stir in most of the cheese. Mix with the pasta, top with cheese and grill. Steam the broccoli.' },
  { id: 'roast-chicken', title: 'Roast chicken dinner', emoji: '🍗', minutes: 100, servings: 4, meal: 'dinner', ingredients: ['1 whole chicken', '1kg potatoes', '4 carrots', '1 head broccoli', '1 pack stuffing mix', '1 pack gravy granules'], method: 'Roast the chicken about 20 minutes per 500g plus 20 minutes. Roast the potatoes alongside and boil the veg.' },
  { id: 'pizza', title: 'Homemade pizza night', emoji: '🍕', minutes: 40, servings: 4, meal: 'dinner', ingredients: ['4 pizza bases', '1 jar pasta sauce', '250g mozzarella', '1 pack pepperoni', '1 pepper', '1 tin sweetcorn'], method: 'Spread the sauce on the bases, let everyone add their own toppings, bake at 220C for 10 to 12 minutes.' },
  { id: 'jacket', title: 'Jacket potatoes & beans', emoji: '🥔', minutes: 70, servings: 4, meal: 'dinner', ingredients: ['4 baking potatoes', '1 tin baked beans', '200g cheddar', '50g butter'], method: 'Bake the potatoes for an hour, split, and top with butter, beans and cheese.' },
  { id: 'curry', title: 'Chicken curry & rice', emoji: '🍛', minutes: 40, servings: 4, meal: 'dinner', ingredients: ['3 chicken breasts', '1 onion', '1 jar curry sauce', '250g rice', '1 pack naan'], method: 'Fry the chicken and onion, add the sauce and simmer 20 minutes. Cook the rice and warm the naan.' },
  { id: 'tuna-bake', title: 'Tuna pasta bake', emoji: '🐠', minutes: 35, servings: 4, meal: 'dinner', ingredients: ['300g pasta', '2 tins tuna', '1 tin sweetcorn', '1 jar pasta sauce', '150g cheddar'], method: 'Boil the pasta, mix with the sauce, tuna and sweetcorn, top with cheese and bake 15 minutes.' },
  { id: 'stir-fry', title: 'Veggie noodle stir fry', emoji: '🥢', minutes: 25, servings: 4, meal: 'dinner', ingredients: ['1 pack noodles', '1 bag stir fry veg', '2 carrots', '3 tbsp soy sauce', '1 head broccoli'], method: 'Cook the noodles, stir fry the veg hot and fast, toss everything with the soy sauce.' },
  { id: 'soup-toastie', title: 'Tomato soup & cheese toasties', emoji: '🥪', minutes: 15, servings: 4, meal: 'lunch', ingredients: ['2 tins tomato soup', '1 loaf bread', '150g cheddar', '25g butter'], method: 'Heat the soup. Butter the bread, fill with cheese and fry or grill until golden.' },
  { id: 'pancakes', title: 'Pancakes', emoji: '🥞', minutes: 20, servings: 4, meal: 'breakfast', ingredients: ['200g plain flour', '2 eggs', '300ml milk', '1 punnet blueberries', 'Maple syrup'], method: 'Whisk the batter, rest 10 minutes, fry thin pancakes. Serve with blueberries and syrup.' },
  { id: 'porridge', title: 'Porridge with banana', emoji: '🥣', minutes: 8, servings: 2, meal: 'breakfast', ingredients: ['100g oats', '500ml milk', '2 bananas', 'Honey'], method: 'Simmer the oats in the milk for 5 minutes, top with sliced banana and honey.' },
]

const draftOf = (s: Starter): RecipeDraft => ({ recipeId: `starter-${s.id}`, title: s.title, emoji: s.emoji, servings: s.servings, minutes: s.minutes, meal: s.meal, ingredients: parseIngredients(s.ingredients.join('\n')), method: s.method, tags: ['starter'], source: `starter:${s.id}` })

export const STARTER_RECIPES: RecipeDraft[] = STARTERS.map(draftOf)

/** The new-baby plan's eight one-handed breakfasts and lunches as recipes (ingredients read from the plan's list). */
export const ARRIVAL_RECIPES: RecipeDraft[] = ARRIVAL_MEALS.map((m) => ({
  recipeId: `arrival-${m.id}`,
  title: m.name,
  emoji: m.meal === 'Breakfast' ? '🥣' : '🥪',
  servings: 2,
  meal: m.meal === 'Breakfast' ? 'breakfast' : 'lunch',
  ingredients: parseIngredients(m.ingredients),
  method: `${m.what}\nShortcut: ${m.hack}\nPrep: ${m.prep}`,
  notes: `${m.style}. ${m.diet}.`,
  tags: ['new baby', m.style.toLowerCase().includes('one-handed') ? 'one-handed' : 'easy'],
  source: `arrival:${m.id}`,
}))

/** Recipes from `packs` that are not in the family's book yet (and were not deleted on purpose). */
export function missingRecipes(f: FamilyState, pack: readonly RecipeDraft[]): RecipeDraft[] {
  return pack.filter((r) => !f.recipes[r.recipeId])
}

// -------------------------------------------------------------------- the plan

const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }

export const mealsOn = (f: FamilyState, date: Ymd): MealPlanEvent[] =>
  Object.values(f.meals)
    .filter((m) => !m.deleted && m.date === date)
    .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot])

export const mealAt = (f: FamilyState, date: Ymd, slot: MealSlot): MealPlanEvent | undefined => {
  const m = f.meals[planIdFor(date, slot)]
  return m && !m.deleted ? m : undefined
}

/** The meals that show on the calendar. Snacks do not. */
export const CALENDAR_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']

export const DEFAULT_MEAL_TIMES: Record<'breakfast' | 'lunch' | 'dinner', { start: Hm; end: Hm }> = {
  breakfast: { start: '07:30', end: '08:00' },
  lunch: { start: '12:00', end: '13:00' },
  dinner: { start: '18:00', end: '19:00' },
}

/** The family's usual meal times (or the defaults), for breakfast, lunch and dinner. */
export const mealTimesOf = (f: FamilyState): typeof DEFAULT_MEAL_TIMES => ({
  breakfast: f.mealTimes?.breakfast ?? DEFAULT_MEAL_TIMES.breakfast,
  lunch: f.mealTimes?.lunch ?? DEFAULT_MEAL_TIMES.lunch,
  dinner: f.mealTimes?.dinner ?? DEFAULT_MEAL_TIMES.dinner,
})

/** When this meal is on the calendar: its own time if it has one, otherwise the family's time for that meal. Snacks have none. */
export function mealWindow(f: FamilyState, m: Pick<MealPlanEvent, 'slot' | 'start' | 'end'>): { start: Hm; end: Hm } | undefined {
  if (m.slot === 'snack') return undefined
  const usual = mealTimesOf(f)[m.slot]
  if (m.start) return { start: m.start, end: m.end && toMin(m.end) > toMin(m.start) ? m.end : fromMin(Math.min(1439, toMin(m.start) + (toMin(usual.end) - toMin(usual.start)))) }
  return usual
}

/** Planned breakfast, lunch and dinner as timed items on the calendar, so "what's for tea" sits in the day where it happens. */
export function mealItemsOn(f: FamilyState, date: Ymd): AgendaItem[] {
  const out: AgendaItem[] = []
  for (const m of mealsOn(f, date)) {
    const w = mealWindow(f, m)
    if (!w) continue
    const r = m.recipeId ? f.recipes[m.recipeId] : undefined
    out.push({
      key: `meal:${m.planId}`,
      source: 'meal',
      title: `${r?.emoji ?? SLOT_INFO[m.slot].emoji} ${m.title}`,
      sub: `${SLOT_INFO[m.slot].label}${m.cookId && f.members[m.cookId] ? ` · ${f.members[m.cookId]!.name} cooks` : ''}`,
      date,
      start: w.start,
      end: w.end,
      allDay: false,
      members: [],
      everyone: true,
      category: 'meal',
      busy: false,
    })
  }
  return out
}

/** When a recipe was last planned (on or before `today`), for "haven't had this for a while". */
export function lastPlanned(f: FamilyState, today: Ymd): Record<string, Ymd> {
  const out: Record<string, Ymd> = {}
  for (const m of Object.values(f.meals)) {
    if (m.deleted || !m.recipeId || m.date > today) continue
    if (!out[m.recipeId] || m.date > out[m.recipeId]!) out[m.recipeId] = m.date
  }
  return out
}

const daysSince = (a: Ymd, b: Ymd): number => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)

export interface Suggestion {
  date: Ymd
  /** Set when the suggestion is one of the family's recipes; absent for a meal that has only ever been typed in. */
  recipeId?: string
  title: string
  /** Why it came up ("Maya and Sam liked it", "Had on Fridays lately"), shown beside it. */
  why: string[]
}

/** Enough planned meals in this slot over the last 12 weeks before the planner starts suggesting meals that were only ever typed in. */
const HISTORY_ENOUGH = 7
const HISTORY_DAYS = 84

interface Cand {
  key: string
  title: string
  recipeId?: string
  minutes: number
}

const names = (f: FamilyState, ids: readonly string[]): string => {
  const n = ids.map((id) => f.members[id]?.name).filter((x): x is string => !!x)
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : (n[0] ?? '')
}

/**
 * Fill the empty nights in `dates`. Nothing already planned is touched. It leans towards what the family has liked (from whoever
 * bothered to rate), what has been had on the same day of the week lately, what is planned often, and what has not been had for a
 * while; it leaves out anything two or more people said no to, avoids repeating a meal within the range, and on `quick` nights (busy
 * evenings) prefers things that take 30 minutes or less. Once there are a few weeks of history, meals that were only ever typed in
 * ("Fish and chips") can come back too, not only recipes.
 */
export function suggestMeals(f: FamilyState, dates: readonly Ymd[], rng: Rng, o: { slot?: MealSlot; quick?: ReadonlySet<Ymd>; today: Ymd }): Suggestion[] {
  const slot = o.slot ?? 'dinner'
  const recipes = liveRecipes(f).filter((r) => !r.meal || r.meal === 'any' || r.meal === slot)
  const hist = recentMeals(f, slot, o.today, { days: HISTORY_DAYS, limit: 1000 })
  const histBy = new Map(hist.map((h) => [h.key, h]))
  const enough = hist.reduce((n, h) => n + h.times, 0) >= HISTORY_ENOUGH
  const pool: Cand[] = recipes.map((r) => ({ key: r.recipeId, title: r.title, recipeId: r.recipeId, minutes: r.minutes ?? 60 }))
  if (enough) {
    const have = new Set(pool.map((c) => c.key))
    for (const h of hist) if (!h.recipeId && !have.has(h.key)) pool.push({ key: h.key, title: h.title, minutes: 30 })
  }
  if (!pool.length) return []
  const last = lastPlanned(f, o.today)
  const lastOf = (c: Cand): Ymd | undefined => (c.recipeId ? last[c.recipeId] : undefined) ?? histBy.get(c.key)?.last
  const used = new Set<string>()
  for (const d of dates) {
    const m = mealAt(f, d, slot)
    if (m) used.add(mealKeyOf(m))
  }
  const taste = new Map<string, Taste>(pool.map((c) => [c.key, tasteOf(f, c.key)]))
  const sameDay = (c: Cand, d: Ymd): number => [1, 2, 3, 4].filter((k) => { const m = mealAt(f, addDays(d, -7 * k), slot); return !!m && mealKeyOf(m) === c.key }).length
  const weight = (c: Cand, d: Ymd): number => {
    const l = lastOf(c)
    const n = sameDay(c, d)
    let recency = 1 + Math.min(60, l ? daysSince(l, o.today) : 60) / 10
    // A weekly habit (always fish and chips on Fridays) was "had recently" only because it is a week since last time.
    if (n >= 2) recency = Math.max(recency, 5)
    const t = taste.get(c.key)!
    // Unrated is neutral. "Fine" is neutral too; liked climbs to 3x, disliked falls to 0.3x.
    const like = t.mean === undefined ? 1 : t.mean >= 2 ? 1 + (t.mean - 2) * 2 : 0.3 + (t.mean - 1) * 0.7
    const often = 1 + Math.min(4, histBy.get(c.key)?.times ?? 0) * 0.1
    const day = 1 + Math.min(3, n)
    return recency * like * often * day
  }
  const reasons = (c: Cand, d: Ymd): string[] => {
    const out: string[] = []
    const t = taste.get(c.key)!
    if (t.loved.length && t.disliked.length === 0 && (t.mean ?? 0) >= 2.5) out.push(t.loved.length > 1 && t.loved.length === t.votes ? 'Everyone who voted liked it' : `${names(f, t.loved)} liked it`)
    const n = sameDay(c, d)
    if (n >= 2) out.push(`Had on ${dayName(d, true)}s ${n} of the last 4 weeks`)
    const l = lastOf(c)
    if (l && daysSince(l, o.today) >= 28) out.push(`Not had for ${Math.round(daysSince(l, o.today) / 7)} weeks`)
    return out
  }
  const out: Suggestion[] = []
  // Busy nights choose first, so the few quick meals are not all used up by nights that did not need one.
  const empty = dates.filter((d) => !mealAt(f, d, slot))
  const order = [...empty.filter((d) => o.quick?.has(d)), ...empty.filter((d) => !o.quick?.has(d))]
  for (const d of order) {
    let cands = pool.filter((c) => !used.has(c.key) && !isUnpopular(taste.get(c.key)!))
    if (!cands.length) cands = pool.filter((c) => !isUnpopular(taste.get(c.key)!))
    if (!cands.length) cands = pool
    if (o.quick?.has(d)) {
      const fast = cands.filter((c) => c.minutes <= 30)
      if (fast.length) cands = fast
    }
    const ws = cands.map((c) => weight(c, d))
    const total = ws.reduce((s, w) => s + w, 0)
    let x = rng.next() * total
    let pick = cands[cands.length - 1]!
    for (let i = 0; i < cands.length; i++) {
      x -= ws[i]!
      if (x <= 0) {
        pick = cands[i]!
        break
      }
    }
    used.add(pick.key)
    out.push({ date: d, recipeId: pick.recipeId, title: pick.title, why: reasons(pick, d) })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1))
}

// -------------------------------------------------------------- the shopping

export interface PlanShopping {
  needs: Need[]
  /** The planned meals the list was worked out from. */
  plans: MealPlanEvent[]
  /** Planned meals with no recipe (or a recipe with no ingredients): nothing to add for them. */
  bare: MealPlanEvent[]
}

/**
 * What to buy for the meals planned from `from` to `to`. Meals already added to a list (`shopped`) are left out unless asked
 * for, pantry staples (salt, oil, flour...) too, and quantities are scaled to the servings planned.
 */
export function ingredientsFor(f: FamilyState, from: Ymd, to: Ymd, o: { includeShopped?: boolean; includePantry?: boolean } = {}): PlanShopping {
  const plans = Object.values(f.meals)
    .filter((m) => !m.deleted && m.date >= from && m.date <= to && (o.includeShopped || !m.shopped))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]))
  const lines: (Ingredient & { from: string })[] = []
  const bare: MealPlanEvent[] = []
  for (const m of plans) {
    const r = m.recipeId ? f.recipes[m.recipeId] : undefined
    if (!r || r.deleted || !r.ingredients.length) {
      bare.push(m)
      continue
    }
    const ratio = r.servings && m.servings ? m.servings / r.servings : 1
    for (const ing of r.ingredients) {
      if (ing.pantry && !o.includePantry) continue
      lines.push({ ...ing, qty: scaleQty(ing.qty, ratio), from: m.planId })
    }
  }
  return { needs: mergeNeeds(lines), plans: plans.filter((p) => !bare.includes(p)), bare }
}

/** Monday to Sunday of the week that starts on `weekStart`. */
export const weekDates = (weekStart: Ymd): Ymd[] => dayRange(weekStart, addDays(weekStart, 6))

// ------------------------------------------------------------ quick picks and history

export interface RecentMeal {
  key: string
  title: string
  recipeId?: string
  /** How many times it was planned in the look-back. */
  times: number
  last: Ymd
}

/**
 * What has been planned in this slot lately, most recent first: for the one-tap quick picks, and as the history that
 * suggestions learn from. Only meals on or before `today` count, so a plan for next week is not "history".
 */
export function recentMeals(f: FamilyState, slot: MealSlot, today: Ymd, o: { days?: number; limit?: number } = {}): RecentMeal[] {
  const from = addDays(today, -(o.days ?? 90))
  const by = new Map<string, RecentMeal>()
  for (const m of Object.values(f.meals)) {
    if (m.deleted || m.slot !== slot || m.date > today || m.date < from) continue
    const key = mealKeyOf(m)
    const hit = by.get(key)
    if (hit) {
      hit.times += 1
      if (m.date > hit.last) {
        hit.last = m.date
        hit.title = m.title
      }
    } else by.set(key, { key, title: m.title, recipeId: m.recipeId, times: 1, last: m.date })
  }
  return [...by.values()].sort((a, b) => (a.last < b.last ? 1 : a.last > b.last ? -1 : b.times - a.times)).slice(0, o.limit ?? 50)
}

/** The one-tap choices for an empty slot: the family's plain standbys first, then what was used here recently. */
export const STANDBYS: Record<MealSlot, string[]> = {
  breakfast: ['Cereal', 'Toast', 'Porridge', 'Eggs'],
  lunch: ['Sandwiches', 'Leftovers', 'Soup', 'School lunch'],
  dinner: ['Leftovers', 'Takeaway', 'Eating out', 'Something simple'],
  snack: ['Fruit', 'Yoghurt', 'Biscuits'],
}

export function quickPicks(f: FamilyState, slot: MealSlot, today: Ymd, max = 5): { title: string; recipeId?: string }[] {
  const out: { title: string; recipeId?: string }[] = []
  const seen = new Set<string>()
  const add = (title: string, recipeId?: string) => {
    const k = mealKeyOf({ title, recipeId })
    if (seen.has(k) || out.length >= max) return
    seen.add(k)
    out.push({ title, recipeId })
  }
  for (const r of recentMeals(f, slot, today, { limit: 3 })) add(r.title, r.recipeId)
  for (const t of STANDBYS[slot]) add(t)
  return out
}
