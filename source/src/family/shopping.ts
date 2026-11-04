/**
 * Shopping lists: reading a line like "2 x 400g tins chopped tomatoes", working out which supermarket aisle it lives in,
 * adding up duplicates (200g + 300g of mince is 500g), and laying a list out in the order you walk round the shop.
 * Pure functions only; the events that store lists are in planActions.ts.
 */
import type { Aisle, DietaryTag, FamilyState, Ingredient, ShopItemEvent, ShopListEvent } from './types'

/** Dietary tags for recipes and (optionally) shopping items. Informational only — never filters or blocks anything
 * on their own; "Suggest dinners" is the one place that reads them to steer suggestions. */
export const DIETARY_TAGS: { id: DietaryTag; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'nut-free', label: 'Nut-free' },
]

export const dietaryTagsOf = (tags: string[] | undefined): DietaryTag[] => (tags ?? []).filter((t): t is DietaryTag => DIETARY_TAGS.some((d) => d.id === t))

export const AISLES: { id: Aisle; label: string; emoji: string }[] = [
  { id: 'produce', label: 'Fruit & veg', emoji: '🥦' },
  { id: 'bakery', label: 'Bakery', emoji: '🥖' },
  { id: 'meat', label: 'Meat & fish', emoji: '🥩' },
  { id: 'dairy', label: 'Dairy & eggs', emoji: '🥛' },
  { id: 'frozen', label: 'Frozen', emoji: '🧊' },
  { id: 'cupboard', label: 'Cupboard', emoji: '🥫' },
  { id: 'drinks', label: 'Drinks', emoji: '🧃' },
  { id: 'household', label: 'Household', emoji: '🧽' },
  { id: 'baby', label: 'Baby', emoji: '🍼' },
  { id: 'pet', label: 'Pets', emoji: '🐕' },
  { id: 'other', label: 'Other', emoji: '🛒' },
]

export const AISLE_INFO: Record<Aisle, { label: string; emoji: string; order: number }> = Object.fromEntries(AISLES.map((a, i) => [a.id, { label: a.label, emoji: a.emoji, order: i }])) as Record<Aisle, { label: string; emoji: string; order: number }>

/**
 * First match wins, so the specific comes before the general ("frozen peas" is frozen, "chicken stock cubes" is a cupboard item,
 * not meat). Matching is on whole words, on the singular form of each word.
 */
const AISLE_RULES: [Aisle, string][] = [
  ['produce', 'green bean|runner bean|broad bean|french bean|sweet potato|sweetcorn|fresh|cherry tomato'],
  ['baby', 'nappy|nappies|baby wipe|formula|baby|infant|teething|dummy|sudocrem|breast pad|muslin|cotton wool|nipple cream'],
  ['pet', 'dog|cat food|cat litter|pet|treat stick|dentastix|poo bag|puppy'],
  ['household', 'washing up|washing powder|laundry|fabric|toilet roll|kitchen roll|bin bag|bin liner|bleach|cleaner|sponge|foil|cling film|clingfilm|baking paper|wipe|tissue|dishwasher|toothpaste|shampoo|conditioner|soap|deodorant|shower gel|batter(y|ies)|light bulb|paracetamol|plaster|sun cream|hand wash|loo|antibac'],
  ['frozen', 'frozen|ice cream|fish finger|oven chip|waffle|pizza|ice lolly|lolly|sorbet'],
  ['cupboard', 'stock|gravy|tin|tinned|can|canned|chopped tomato|passata|puree|paste|sauce|ketchup|mayo|mayonnaise|mustard|vinegar|oil|olive|pasta|spaghetti|penne|fusilli|macaroni|lasagne|tagliatelle|noodle|rice|couscous|quinoa|lentil|bean|chickpea|flour|sugar|syrup|honey|jam|marmalade|peanut butter|nutella|cereal|porridge|oat|granola|muesli|biscuit|cracker|crisp|snack|nut|seed|raisin|dried|spice|herb|cinnamon|paprika|cumin|curry|turmeric|chilli powder|chilli flake|garlic powder|salt|black pepper|white pepper|baking|yeast|cocoa|chocolate|custard|jelly|soup|tuna|sardine|tortilla|wrap|taco|fajita|popcorn|cornflake|weetabix|marmite|pesto|coconut milk|maple|chia|tahini|hummus|dressing'],
  ['drinks', 'juice|squash|cordial|water|cola|lemonade|fizzy|tea|coffee|wine|beer|cider|prosecco|gin|milkshake|smoothie|kombucha'],
  ['meat', 'chicken|beef|mince|steak|pork|bacon|sausage|ham|gammon|lamb|turkey|duck|salmon|cod|haddock|prawn|fish|tuna steak|meatball|burger|chorizo|pepperoni|salami|joint|drumstick|fillet|kebab'],
  ['dairy', 'milk|cheese|cheddar|mozzarella|parmesan|feta|halloumi|cream|butter|margarine|yoghurt|yogurt|egg|creme fraiche|cottage|quark|kefir|custard pot|fromage|dairy|oat milk|almond milk'],
  ['bakery', 'bread|loaf|loaves|roll|bun|bagel|croissant|baguette|pitta|pita|naan|muffin|crumpet|cake|brioche|sourdough|scone|pastry|doughnut|flatbread|teacake'],
  ['produce', 'apple|banana|orange|lemon|lime|grape|berry|strawberr|blueberr|raspberr|melon|pear|peach|plum|mango|pineapple|kiwi|avocado|tomato|cucumber|lettuce|salad|spinach|rocket|kale|cabbage|broccoli|cauliflower|carrot|potato|sweet potato|onion|garlic|ginger|leek|celery|pepper|chilli|courgette|aubergine|mushroom|sweetcorn|corn|pea|bean sprout|beetroot|parsnip|swede|squash|pumpkin|radish|asparagus|herb|parsley|coriander|basil|mint|thyme|rosemary|fruit|veg|vegetable|satsuma|clementine|nectarine|cherry|cherr|rhubarb|spring onion|shallot'],
]

const COMPILED: [Aisle, RegExp][] = AISLE_RULES.map(([a, words]) => [a, new RegExp(`(?:^|[^a-z])(?:${words})(?:s|es|ies)?(?![a-z])`, 'i')])

/** Which aisle an item is probably in. */
export function guessAisle(name: string): Aisle {
  const n = name.toLowerCase().replace(/[^a-z' ]+/g, ' ')
  // "cat food" and friends: pets before anything else; otherwise the first rule that matches.
  for (const [aisle, re] of COMPILED) if (re.test(n)) return aisle
  return 'other'
}

const PANTRY = /^(salt|pepper|black pepper|sea salt|oil|olive oil|vegetable oil|sunflower oil|cooking oil|water|sugar|plain flour|flour|butter|cooking spray)$/i

/** Things most kitchens already have, so they are left off a list built from recipes (they can still be added by hand). */
export const isPantryStaple = (name: string): boolean => PANTRY.test(name.trim())

// ---------------------------------------------------------------- reading a line

const UNITS: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', gm: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml',
  l: 'l', litre: 'l', litres: 'l', liter: 'l', ltr: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tin: 'tin', tins: 'tin', can: 'tin', cans: 'tin',
  pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack',
  bag: 'bag', bags: 'bag', bunch: 'bunch', bunches: 'bunch',
  clove: 'clove', cloves: 'clove', slice: 'slice', slices: 'slice',
  pot: 'pot', pots: 'pot', jar: 'jar', jars: 'jar', bottle: 'bottle', bottles: 'bottle',
  pint: 'pint', pints: 'pint', pinch: 'pinch', handful: 'handful', box: 'box', boxes: 'box', carton: 'carton', cartons: 'carton',
  punnet: 'punnet', punnets: 'punnet', loaf: 'loaf', loaves: 'loaf', head: 'head', heads: 'head',
}

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

/** '2', '1.5', '1/2', '1 1/2', '½', '2½' -> number, and how much text it used. */
function readQty(s: string): { qty: number; len: number } | undefined {
  const m = /^(\d+)?\s*([½¼¾⅓⅔])|^(\d+)\s+(\d+)\/(\d+)|^(\d+)\/(\d+)|^(\d+(?:\.\d+)?)/.exec(s)
  if (!m) return undefined
  let qty: number
  if (m[2]) qty = Number(m[1] ?? 0) + FRACTIONS[m[2]]!
  else if (m[3]) qty = Number(m[3]) + Number(m[4]) / Number(m[5])
  else if (m[6]) qty = Number(m[6]) / Number(m[7])
  else qty = Number(m[8])
  return Number.isFinite(qty) && qty > 0 ? { qty, len: m[0].length } : undefined
}

const cleanName = (s: string): string =>
  s
    .replace(/\s+/g, ' ')
    .replace(/^(of|x)\s+/i, '')
    .replace(/[,;.]+$/, '')
    .trim()

export interface ParsedLine {
  name: string
  qty?: number
  unit?: string
  note?: string
}

/**
 * "2 x 400g tins chopped tomatoes" -> 2 tin(s)... it keeps it simple: a leading number, an optional unit, then the name.
 *   "500g mince"            -> 500 g, mince
 *   "3 apples"              -> 3, apples
 *   "milk x2" / "x2 milk"   -> 2, milk
 *   "2 tins tomatoes"       -> 2 tin, tomatoes
 *   "bread (the seeded one)" -> bread, note "the seeded one"
 */
export function parseLine(raw: string): ParsedLine | undefined {
  let s = raw.replace(/^\s*(?:(?:[-*•▪◦]|\d+[.)])\s+)?(?:\[[ xX]?\]\s+)?/, '').trim()
  if (!s) return undefined
  let note: string | undefined
  const paren = /\(([^)]*)\)\s*$/.exec(s)
  if (paren) {
    note = paren[1]!.trim() || undefined
    s = s.slice(0, paren.index).trim()
  }
  let qty: number | undefined
  let unit: string | undefined
  const lead = /^x\s*(\d+)\s+/i.exec(s)
  if (lead) {
    qty = Number(lead[1])
    s = s.slice(lead[0].length)
  } else {
    const q = readQty(s)
    if (q) {
      qty = q.qty
      s = s.slice(q.len).trim()
      // "2 x 400g tins": the number before the x is the count, the weight after it is kept in the name.
      const times = /^x\s+/i.exec(s)
      if (times) s = s.slice(times[0].length)
      const u = /^([a-zA-Z]+)\b\.?\s*/.exec(s)
      if (u && UNITS[u[1]!.toLowerCase()]) {
        unit = UNITS[u[1]!.toLowerCase()]
        s = s.slice(u[0].length)
      }
    }
  }
  const trail = /\s+x\s*(\d+)$/i.exec(s)
  if (trail && qty == null) {
    qty = Number(trail[1])
    s = s.slice(0, trail.index)
  }
  // "500g" written together: the number reader stops at the g, so it ends up as the unit above. "400g" mid-name stays in the name.
  const name = cleanName(s)
  if (!name) return undefined
  return { name: name.replace(/^./, (c) => c.toUpperCase()), qty, unit, note }
}

/** A recipe line, with an aisle and a pantry flag worked out. */
export function parseIngredient(raw: string): Ingredient | undefined {
  const p = parseLine(raw)
  if (!p) return undefined
  return { name: p.name, qty: p.qty, unit: p.unit, aisle: guessAisle(p.name), pantry: isPantryStaple(p.name) || undefined }
}

const DESCRIPTION = /^(finely|roughly|thinly|freshly|chopped|sliced|diced|grated|peeled|crushed|minced|cooked|drained|melted|softened|beaten|to taste|optional|or\b|plus\b|for\b|at room)/i

/** Split "Oats, apples, cinnamon" (or lines) into ingredients. */
export function parseIngredients(text: string): Ingredient[] {
  // Lines first, then commas within a line (unless inside brackets). A bit that is only a description ("1 onion, finely chopped")
  // stays with the ingredient before it.
  const parts = text.split(/\r?\n/).flatMap((line) =>
    line.split(/,(?![^()]*\))/).reduce<string[]>((acc, bit) => {
      if (acc.length && DESCRIPTION.test(bit.trim())) acc[acc.length - 1] += `,${bit}`
      else acc.push(bit)
      return acc
    }, []),
  )
  return parts
    .map(parseIngredient)
    .filter((x): x is Ingredient => !!x)
}

// --------------------------------------------------------------- adding up

/** Rough singular form so "tomato" and "tomatoes", "apple" and "apples" are the same thing. */
export function singular(w: string): string {
  const s = w.toLowerCase().trim()
  if (s.length <= 3) return s
  if (/ies$/.test(s)) return `${s.slice(0, -3)}y`
  if (/(oes|ches|shes|sses|xes)$/.test(s)) return s.slice(0, -2)
  if (/ss$|us$|is$/.test(s)) return s
  if (/s$/.test(s)) return s.slice(0, -1)
  return s
}

export const nameKey = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .join(' ')

/** Weights and volumes are added in grams/millilitres and shown back in kg/l once they are big enough. */
const BASE: Record<string, { unit: 'g' | 'ml'; per: number }> = { g: { unit: 'g', per: 1 }, kg: { unit: 'g', per: 1000 }, ml: { unit: 'ml', per: 1 }, l: { unit: 'ml', per: 1000 } }

interface Amount {
  qty?: number
  unit?: string
}

/** The group two amounts must share to be added: same base unit, or same unit, or both plain counts. */
const unitGroup = (u: string | undefined): string => (u && BASE[u] ? BASE[u]!.unit : u ?? '')

export function addAmounts(a: Amount, b: Amount): Amount | undefined {
  if (unitGroup(a.unit) !== unitGroup(b.unit)) return undefined
  if (a.qty == null && b.qty == null) return { unit: a.unit ?? b.unit }
  const ua = a.unit ? BASE[a.unit] : undefined
  if (ua) {
    const total = (a.qty ?? 1) * ua.per + (b.qty ?? 1) * BASE[b.unit!]!.per
    return total >= 1000 ? { qty: round(total / 1000), unit: ua.unit === 'g' ? 'kg' : 'l' } : { qty: round(total), unit: ua.unit }
  }
  return { qty: round((a.qty ?? 1) + (b.qty ?? 1)), unit: a.unit ?? b.unit }
}

const round = (n: number): number => Math.round(n * 100) / 100

/** "400 g", "1.5 kg", "2", "2 tins" (plural for counts of packs, tins, etc.). */
export function formatQty(qty: number | undefined, unit: string | undefined): string {
  if (qty == null && !unit) return ''
  const q = qty == null ? '' : Number.isInteger(qty) ? String(qty) : String(round(qty))
  if (!unit) return q
  const many: Record<string, string> = { bunch: 'bunches', loaf: 'loaves', box: 'boxes', pinch: 'pinches', handful: 'handfuls' }
  const plural = qty != null && qty > 1 && !['g', 'kg', 'ml', 'l', 'tsp', 'tbsp'].includes(unit) ? (many[unit] ?? `${unit}s`) : unit
  return `${q}${['g', 'kg', 'ml', 'l'].includes(unit) ? '' : ' '}${plural}`.trim()
}

export interface Need {
  name: string
  qty?: number
  unit?: string
  aisle: Aisle
  /** Meal-plan entries (or other sources) this line came from. */
  from: string[]
}

/** Add lines together: same name and compatible units are merged. */
export function mergeNeeds(lines: readonly (Ingredient & { from?: string })[]): Need[] {
  const out: Need[] = []
  for (const l of lines) {
    const key = nameKey(l.name)
    const hit = out.find((n) => nameKey(n.name) === key && addAmounts(n, l) !== undefined)
    if (hit) {
      const sum = addAmounts(hit, l)!
      hit.qty = sum.qty
      hit.unit = sum.unit
      if (l.from && !hit.from.includes(l.from)) hit.from.push(l.from)
    } else out.push({ name: l.name, qty: l.qty, unit: l.unit, aisle: l.aisle ?? guessAisle(l.name), from: l.from ? [l.from] : [] })
  }
  return out
}

/** Scale a quantity for a different number of servings, keeping it tidy (never 0.33333). */
export function scaleQty(qty: number | undefined, ratio: number): number | undefined {
  if (qty == null) return undefined
  const v = qty * ratio
  return v >= 10 ? Math.round(v) : Math.round(v * 4) / 4 || round(v)
}

// ------------------------------------------------------------------- lists

export const MAIN_LIST = 'list-main'

/** Lists in use. The first time, there is none stored yet, so the main one is offered (it is created when something is added). */
export function liveLists(f: FamilyState): ShopListEvent[] {
  const lists = Object.values(f.shopLists).filter((l) => !l.deleted)
  if (lists.length) return lists.sort((a, b) => (a.listId === MAIN_LIST ? -1 : b.listId === MAIN_LIST ? 1 : a.ts - b.ts))
  return [{ type: 'shop-list', id: MAIN_LIST, ts: 0, day: '', learnerId: '', v: 1, listId: MAIN_LIST, name: 'Shopping', emoji: '🛒' } as ShopListEvent]
}

export const itemsOf = (f: FamilyState, listId: string): ShopItemEvent[] => Object.values(f.shopItems).filter((i) => i.listId === listId && !i.deleted)

export interface AisleGroup {
  aisle: Aisle
  label: string
  emoji: string
  items: ShopItemEvent[]
}

/** A list laid out in walking order. Ticked items sink to the bottom of their aisle. Empty aisles are left out. */
export function groupByAisle(items: readonly ShopItemEvent[]): AisleGroup[] {
  const groups = AISLES.map((a) => ({ aisle: a.id, label: a.label, emoji: a.emoji, items: [] as ShopItemEvent[] }))
  for (const i of items) groups[AISLE_INFO[i.aisle]?.order ?? AISLES.length - 1]!.items.push(i)
  for (const g of groups) g.items.sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name))
  return groups.filter((g) => g.items.length)
}

/** Things bought often that are not on the list right now: quick "add again" chips. */
export function regulars(f: FamilyState, listId: string, limit = 12): { name: string; aisle: Aisle; unit?: string; count: number }[] {
  const onList = new Set(itemsOf(f, listId).filter((i) => !i.done).map((i) => nameKey(i.name)))
  return Object.values(f.shopHistory)
    .filter((h) => h.count >= 2 && !onList.has(nameKey(h.name)))
    .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((h) => ({ name: h.name, aisle: h.aisle, unit: h.unit, count: h.count }))
}

/** Plain text of what is left to buy, for sending in a message. */
export function listText(name: string, items: readonly ShopItemEvent[]): string {
  const lines = [name]
  for (const g of groupByAisle(items.filter((i) => !i.done))) {
    lines.push('', `${g.emoji} ${g.label}`)
    for (const i of g.items) lines.push(`- ${[formatQty(i.qty, i.unit), i.name].filter(Boolean).join(' ')}${i.note ? ` (${i.note})` : ''}`)
  }
  return lines.join('\n')
}

// --------------------------------------------------------- near-duplicates

/**
 * The name with the noise taken off, for spotting the same thing listed twice: lower case, spaces tidied, a leading count
 * ("2 x ", "2x ", "3 ") or trailing one (" x2") dropped, and each word made singular. "2 x Eggs" and "egg" are both "egg".
 */
export function dupKey(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(?:\d+(?:\.\d+)?|[½¼¾⅓⅔])\s*(?:[x×](?=\s|$)\s*)?/, '')
    .replace(/\s+[x×]\s*\d+$/, '')
  return nameKey(s)
}

export interface DupGroup {
  /** Stable id for the group (list + key), e.g. for "not now". */
  key: string
  listId: string
  /** The name to show: the one that would be kept. */
  name: string
  /** Oldest first; the first is the one a merge keeps. */
  items: ShopItemEvent[]
}

/** Un-ticked items on the same list that look like the same thing ("Milk" and "2 x milk"). Ticked ones never count: they are in the basket. */
export function nearDuplicates(items: readonly ShopItemEvent[]): DupGroup[] {
  const groups = new Map<string, ShopItemEvent[]>()
  for (const i of items) {
    if (i.done || i.deleted) continue
    const k = dupKey(i.name)
    if (!k) continue
    const key = `${i.listId}|${k}`
    const g = groups.get(key)
    if (g) g.push(i)
    else groups.set(key, [i])
  }
  const out: DupGroup[] = []
  for (const [key, g] of groups) {
    if (g.length < 2) continue
    g.sort((a, b) => a.ts - b.ts || a.itemId.localeCompare(b.itemId))
    out.push({ key, listId: g[0]!.listId, name: g[0]!.name, items: g })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export interface MergePlan {
  keep: ShopItemEvent
  /** What to change on the kept item (all three are always given, so an empty one clears it). */
  patch: { qty?: number; unit?: string; note?: string }
  remove: ShopItemEvent[]
}

/**
 * How to fold a group into one item: the oldest is kept, amounts are added where the units allow it (2 + 1 = 3, 500 g + 1 kg
 * = 1.5 kg), an amount that cannot be added ("1 l" next to "2 pints") goes into the note, and different notes are joined.
 * The events are an edit of the kept item and a remove of the rest (see planActions.editItem / removeItem).
 */
export function mergeDuplicates(group: readonly ShopItemEvent[]): MergePlan | undefined {
  const [keep, ...rest] = group
  if (!keep || !rest.length) return undefined
  let amount: { qty?: number; unit?: string } = { qty: keep.qty, unit: keep.unit }
  const extra: string[] = []
  for (const r of rest) {
    const sum = addAmounts(amount, r)
    if (sum) amount = sum
    else {
      const q = formatQty(r.qty, r.unit)
      if (q) extra.push(`also ${q}`)
    }
  }
  const notes: string[] = []
  for (const n of [...group.map((i) => i.note?.trim()), ...extra]) if (n && !notes.some((x) => x.toLowerCase() === n.toLowerCase())) notes.push(n)
  return { keep, patch: { qty: amount.qty, unit: amount.unit, note: notes.join('; ') || undefined }, remove: rest }
}

/** A recipe line as text, the way it is typed: "500g Beef mince", "2 tins Chopped tomatoes", "Honey". */
export const ingredientText = (i: Pick<Ingredient, 'name' | 'qty' | 'unit'>): string => [formatQty(i.qty, i.unit), i.name].filter(Boolean).join(' ')
