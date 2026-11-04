/**
 * Choosing the words for a round, the hint ladder, and marking a guess.
 *
 * A round mixes three kinds of word:
 *   new    the next words up the difficulty ladder, picked from a small window (mostly the easiest, sometimes a stretch)
 *   due    words she has met that are ready to come back, weakest and most overdue first (but chosen by weighted chance)
 *   spot   a word that is not due at all and she has usually got right, slipped in so nothing is ever "done for good"
 * How many are new depends on how many are still shaky (so a struggling learner is not buried in new words) and on how
 * sure she has been lately (so a confident one moves up faster). Everything random goes through the supplied rng, so
 * tests can replay a round exactly.
 */
import type { Rng, SpellStat } from '@/engine/types'
import { BOX_MAX, statusOf, type WordStatus } from './model'
import { WORDS, type SpellingWord } from './words'

export type PickKind = 'new' | 'due' | 'spot'
export interface RoundPick {
  wordId: string
  kind: PickKind
}

export interface RoundOpts {
  stats: Record<string, SpellStat>
  now: number
  size: number
  rng: Rng
  /** Defaults to the whole bank (easiest first). Tests pass a small one. */
  words?: readonly SpellingWord[]
}

const MIN = 60_000
const DAY = 86_400_000

/** Pick `n` items without replacement, each with a chance proportional to its weight. */
export function weightedSample<T>(items: readonly T[], weight: (t: T) => number, n: number, rng: Rng): T[] {
  const pool = items.map((t) => ({ t, w: Math.max(0.0001, weight(t)) }))
  const out: T[] = []
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0)
    let r = rng.next() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i]!.w
      if (r <= 0) {
        idx = i
        break
      }
    }
    out.push(pool[idx]!.t)
    pool.splice(idx, 1)
  }
  return out
}

/** How many words she has met that she got right first time, out of all she has met (from the latest turn on each). */
export function confidence(stats: Record<string, SpellStat>): number {
  const met = Object.values(stats).filter((s) => s.seen > 0)
  return met.length ? met.filter((s) => s.last === 'c').length / met.length : 0
}

export function buildRound(o: RoundOpts): RoundPick[] {
  const { stats, now, rng } = o
  const words = o.words ?? WORDS
  const size = Math.max(1, o.size)
  const met = words.filter((w) => (stats[w.id]?.seen ?? 0) > 0)
  const unseen = words.filter((w) => !(stats[w.id]?.seen ?? 0))
  const due = met.filter((w) => stats[w.id]!.dueTs <= now)
  const rested = met.filter((w) => stats[w.id]!.dueTs > now)
  const shaky = met.filter((w) => stats[w.id]!.box <= 1).length
  const sure = confidence(stats)

  // ---- how many of each
  const spotPool = rested.filter((w) => stats[w.id]!.box >= 3)
  let spotN = spotPool.length && size >= 5 && rng.chance(0.7) ? 1 : 0
  if (spotN && size >= 15 && spotPool.length > 1 && rng.chance(0.5)) spotN = 2
  let newN: number
  if (!met.length) newN = size
  else {
    // Plenty still shaky? Hold off on new words until they settle (none at all once 16 or more are shaky).
    newN = shaky >= 16 ? 0 : shaky >= 12 ? 1 : shaky >= 8 ? 2 : shaky >= 5 ? 3 : 4
    if (sure >= 0.8 && shaky < 5) newN += 2
    if (!due.length) newN = size - spotN
  }
  newN = Math.min(newN, unseen.length, size - spotN)
  const dueN = Math.min(due.length, size - spotN - newN)
  // Not enough due words: top up with more new ones, then more spot-checks.
  let gap = size - spotN - newN - dueN
  if (gap > 0) {
    const more = Math.min(gap, unseen.length - newN)
    newN += more
    gap -= more
  }
  if (gap > 0) spotN = Math.min(spotPool.length, spotN + gap)

  // ---- choose them
  const picks: RoundPick[] = []
  const taken = new Set<string>()
  const add = (w: SpellingWord, kind: PickKind) => {
    if (taken.has(w.id)) return
    taken.add(w.id)
    picks.push({ wordId: w.id, kind })
  }

  // due: weakest and most overdue are likelier; a word asked in the last half hour is much less likely.
  const dueW = (w: SpellingWord) => {
    const s = stats[w.id]!
    const overdue = Math.min(3, Math.max(0, (now - s.dueTs) / DAY))
    return (BOX_MAX + 1 - s.box) ** 1.5 * (1 + overdue * 0.3) * (now - s.lastTs < 30 * MIN ? 0.25 : 1)
  }
  // Shaky words are guaranteed a share of the round (up to 40%) however keen she is to move on; the rest of the due slots
  // go to whichever due words the dice pick.
  const shakyDue = due.filter((w) => stats[w.id]!.box <= 1)
  const shakyN = Math.min(shakyDue.length, Math.ceil(size * 0.4), dueN)
  for (const w of weightedSample(shakyDue, dueW, shakyN, rng)) add(w, 'due')
  for (const w of weightedSample(due.filter((x) => !taken.has(x.id)), dueW, dueN - shakyN, rng)) add(w, 'due')

  // spot-checks: any solid word, the longer since it was last asked the likelier
  const spotW = (w: SpellingWord) => 1 + Math.min(10, (now - stats[w.id]!.lastTs) / DAY / 3)
  for (const w of weightedSample(spotPool, spotW, spotN, rng)) add(w, 'spot')

  // new: mostly from the next few easiest, sometimes a little further on (a stretch), further still when she is flying
  for (let i = 0; i < newN; i++) {
    const left = unseen.filter((w) => !taken.has(w.id))
    if (!left.length) break
    const wide = 5 + (sure >= 0.85 ? 3 : 0)
    const window = rng.chance(0.15) ? left.slice(0, wide + 8) : left.slice(0, wide)
    const w = weightedSample(window, (x) => 1 / (1 + window.indexOf(x)), 1, rng)[0]!
    add(w, 'new')
  }

  // Still short (very small bank, or everything rested)? fall back to whatever was asked longest ago.
  if (picks.length < size) {
    const rest = words.filter((w) => !taken.has(w.id)).sort((a, b) => (stats[a.id]?.lastTs ?? 0) - (stats[b.id]?.lastTs ?? 0))
    for (const w of rest.slice(0, size - picks.length)) add(w, (stats[w.id]?.seen ?? 0) > 0 ? 'spot' : 'new')
  }

  // ---- order: shuffled, but start with a word she probably knows so the round begins with a win
  const order = rng.shuffle(picks)
  const warm = order.findIndex((p) => p.kind === 'spot' || (p.kind === 'due' && (stats[p.wordId]?.box ?? 0) >= 3))
  if (warm > 0) order.unshift(order.splice(warm, 1)[0]!)
  return order
}

// ------------------------------------------------------------------ marking

export const normalise = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '')

export const isRight = (w: Pick<SpellingWord, 'id'>, guess: string): boolean => normalise(guess) === w.id

// -------------------------------------------------------------------- hints

/**
 * The hint ladder. Level 0 is the definition alone. Then, one step at a time (a wrong guess also moves it on):
 *   1  how many letters, and what kind of word it is
 *   2  the first letter, and how it sounds
 *   3  a memory trick (backronym), when the word has one
 *   4+ one more letter from the left each step, until only the last letter is missing
 * After the last step the only ways out are the right answer or "Show me".
 */
export interface HintView {
  level: number
  maxLevel: number
  /** One entry per letter: the letter if shown, otherwise null. Empty at level 0. */
  slots: (string | null)[]
  showPos: boolean
  showSound: boolean
  backronym?: string
  /** True when the next step is only more letters. */
  lettersOnly: boolean
}

export function maxHintLevel(w: Pick<SpellingWord, 'id' | 'backronym'>): number {
  return 2 + (w.backronym ? 1 : 0) + Math.max(0, w.id.length - 2)
}

export function hintView(w: Pick<SpellingWord, 'id' | 'backronym'>, level: number): HintView {
  const max = maxHintLevel(w)
  const lv = Math.max(0, Math.min(max, level))
  const n = w.id.length
  const base = 2 + (w.backronym ? 1 : 0)
  const reveal = Math.max(0, lv - base)
  const slots: (string | null)[] = lv === 0 ? [] : Array.from({ length: n }, () => null)
  if (lv >= 2) slots[0] = w.id[0]!
  for (let i = 1; i <= reveal && i < n - 1; i++) slots[i] = w.id[i]!
  return { level: lv, maxLevel: max, slots, showPos: lv >= 1, showSound: lv >= 2, backronym: w.backronym && lv >= 3 ? w.backronym : undefined, lettersOnly: lv + 1 > base && lv + 1 <= max }
}

// ------------------------------------------------------------------ summary

export interface SpellingSummary {
  total: number
  counts: Record<WordStatus, number>
  /** 1-based band of the hardest word she has met, so "Level 4" means she has reached the fourth stretch of the ladder. */
  level: number
  levels: number
  /** Words seen and shaky, worst first. */
  tricky: string[]
}

export const LEVELS = 10

export function summarise(stats: Record<string, SpellStat>, words: readonly SpellingWord[] = WORDS): SpellingSummary {
  const counts: Record<WordStatus, number> = { new: 0, learning: 0, getting: 0, known: 0 }
  let far = -1
  words.forEach((w, i) => {
    const s = stats[w.id]
    counts[statusOf(s)]++
    if ((s?.seen ?? 0) > 0) far = i
  })
  const band = Math.ceil(words.length / LEVELS)
  const tricky = words
    .filter((w) => (stats[w.id]?.seen ?? 0) > 0 && (stats[w.id]!.box <= 1 || stats[w.id]!.last === 's' || stats[w.id]!.last === 'h'))
    .sort((a, b) => stats[a.id]!.box - stats[b.id]!.box || stats[b.id]!.skips - stats[a.id]!.skips)
    .map((w) => w.id)
  return { total: words.length, counts, level: far < 0 ? 1 : Math.min(LEVELS, Math.floor(far / band) + 1), levels: LEVELS, tricky }
}
