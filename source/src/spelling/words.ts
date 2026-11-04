/**
 * The spelling word bank, read from `wordlist.txt` (the tables exactly as they were supplied: word and letter count,
 * part of speech, phonetic, clue and a backronym). Nothing here is hand-typed twice: the parser checks the letter counts
 * and the backronyms so a typo in the list can never teach a wrong spelling.
 *
 *  - Words that appear in several lists (e.g. "accommodate" is in both Year 5-6 and Year 8) become ONE word, filed under the
 *    easiest list it appears in.
 *  - A clue that contains the answer (or a word built on it) has that part blanked out, so the clue never gives it away.
 *  - A backronym is only used as a hint if its initials really spell the word.
 */
import raw from './wordlist.txt?raw'

export type Tier = 0 | 1 | 2 | 3

export interface SpellingWord {
  /** The word in lower case; also its id (words are unique). */
  id: string
  /** Part of speech, spelled out ('noun', 'verb', 'adjective or verb'...). */
  pos: string
  phonetic: string
  /** The clue as supplied. */
  clue: string
  /** The clue with any part of the answer blanked out. */
  definition: string
  /** A memory trick whose initials spell the word. Absent if the supplied one did not. */
  backronym?: string
  tier: Tier
  /** Every list it appears in, easiest first. */
  lists: string[]
  /** Sub-heading it was filed under (Year 8 lists only). */
  group?: string
  /** Higher = harder to spell. Used to decide the order words are introduced. */
  difficulty: number
}

export const TIER_LABEL: Record<Tier, string> = { 0: 'Year 1-2', 1: 'Year 3-4', 2: 'Year 5-6', 3: 'Year 8' }

const LIST_ORDER = [TIER_LABEL[0], TIER_LABEL[1], TIER_LABEL[2], TIER_LABEL[3]]

const POS_NAMES: Record<string, string> = { N: 'noun', V: 'verb', Adj: 'adjective', Adv: 'adverb', Prep: 'preposition', Conj: 'conjunction', Pron: 'pronoun', Num: 'number', Det: 'determiner' }

export function expandPos(code: string): string {
  return code
    .split('/')
    .map((p) => POS_NAMES[p.trim()] ?? p.trim().toLowerCase())
    .join(' or ')
}

/** Do the first letters of the words in `text` spell `word`? ("X-ray" gives x, "cat's" gives c.) */
export function backronymSpells(word: string, text: string): boolean {
  const initials = text
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z]+/, '').charAt(0).toLowerCase())
    .join('')
  return initials === word.toLowerCase()
}

/**
 * Blank out any part of the answer that shows in the clue. A word counts as showing the answer if it starts with the first
 * five letters (or the whole of a shorter answer): "equip" hides "equipped" and "equipment" too.
 */
export function maskClue(word: string, clue: string): string {
  const stem = word.toLowerCase().slice(0, Math.min(5, word.length))
  return clue.replace(/[A-Za-z']+/g, (w) => (w.toLowerCase().startsWith(stem) ? '_'.repeat(Math.max(3, w.length)) : w))
}

/** A rough "how hard is this to spell" score: length, list, and the usual traps (double letters, silent letters, odd vowel groups). */
export function difficultyOf(word: string, tier: Tier): number {
  const w = word.toLowerCase()
  let d = w.length + tier * 2.5
  d += (w.match(/([a-z])\1/g) ?? []).length
  if (/ough|augh|eigh/.test(w)) d += 2
  if (/ie|ei/.test(w)) d += 1
  if (/^(kn|gn|wr|ps|rh)|mn/.test(w)) d += 1.5
  if (/ph|tch|sc[ie]|ough/.test(w)) d += 1
  return Math.round(d * 10) / 10
}

/**
 * Three supplied backronyms were wrong, and a spelling game must never teach a wrong spelling, so they are replaced:
 * "queue" used the made-up word "embrellas", and the ones for "continuous" and "silhouette" did not spell the word
 * (their initials gave "continious" and "silhuette").
 */
const BACKRONYM_FIXES: Record<string, string> = {
  queue: 'Queens Usually Eat Ugly Eggs',
  continuous: 'Cats Often Need To Inhale New Umbrellas Or Use Snow',
  silhouette: 'Seven Igloos Look Hot, Only Under Every Tiny Tent Everywhere',
}

export interface ParseReport {
  /** Rows whose stated letter count did not match the word. */
  badLength: string[]
  /** Words whose supplied backronym did not spell them (so it is not used). */
  badBackronym: string[]
  /** Words with no usable backronym at all. */
  noBackronym: string[]
  rows: number
}

interface Heading {
  tier: Tier
  list: string
}

const headingOf = (line: string): Heading | undefined => {
  if (/^Key Stage 1/i.test(line)) return { tier: 0, list: TIER_LABEL[0] }
  if (/^Key Stage 2.*Years 3/i.test(line)) return { tier: 1, list: TIER_LABEL[1] }
  if (/^Key Stage 2.*Years 5/i.test(line)) return { tier: 2, list: TIER_LABEL[2] }
  if (/^Key Stage 3/i.test(line)) return { tier: 3, list: TIER_LABEL[3] }
  return undefined
}

export function parseWordList(text: string): { words: SpellingWord[]; report: ParseReport } {
  const byId = new Map<string, SpellingWord>()
  const report: ParseReport = { badLength: [], badBackronym: [], noBackronym: [], rows: 0 }
  let head: Heading = { tier: 3, list: TIER_LABEL[3] }
  let group: string | undefined

  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue
    if (!t.startsWith('|')) {
      const h = headingOf(t)
      if (h) {
        head = h
        group = undefined
      } else group = t
      continue
    }
    const m = /^\|\s*([A-Za-z'-]+)\s*\((\d+)\)\s*\|(.*)\|\s*$/.exec(t)
    if (!m) continue // table header or separator row
    const word = m[1]!.toLowerCase()
    const cells = m[3]!.split('|').map((c) => c.trim())
    const [pos = '', phonetic = '', clue = '', backRaw = ''] = cells
    report.rows++
    if (word.length !== Number(m[2])) report.badLength.push(word)
    const supplied = /^see ks\d/i.test(backRaw) ? undefined : BACKRONYM_FIXES[word] ?? backRaw
    let backronym: string | undefined
    if (supplied) {
      if (backronymSpells(word, supplied)) backronym = supplied
      else report.badBackronym.push(word)
    }

    const have = byId.get(word)
    if (have) {
      // Seen before in another list: keep the easiest list, note the other, and pick up a backronym if this row has the real one.
      have.lists = [...new Set([...have.lists, head.list])].sort((a, b) => LIST_ORDER.indexOf(a) - LIST_ORDER.indexOf(b))
      if (head.tier < have.tier) {
        have.tier = head.tier
        have.difficulty = difficultyOf(word, head.tier)
      }
      if (!have.backronym && backronym) have.backronym = backronym
      continue
    }
    byId.set(word, {
      id: word,
      pos: expandPos(pos),
      phonetic,
      clue,
      definition: maskClue(word, clue),
      backronym,
      tier: head.tier,
      lists: [head.list],
      group: head.tier === 3 ? group : undefined,
      difficulty: difficultyOf(word, head.tier),
    })
  }

  const words = [...byId.values()].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
  for (const w of words) if (!w.backronym) report.noBackronym.push(w.id)
  return { words, report }
}

const parsed = parseWordList(raw)

/** Every word, easiest first. */
export const WORDS: SpellingWord[] = parsed.words
export const WORD_REPORT: ParseReport = parsed.report
export const WORD_BY_ID: ReadonlyMap<string, SpellingWord> = new Map(WORDS.map((w) => [w.id, w]))
/** A word's place in the easiest-first order (0 = easiest). */
export const RANK_OF: ReadonlyMap<string, number> = new Map(WORDS.map((w, i) => [w.id, i]))
