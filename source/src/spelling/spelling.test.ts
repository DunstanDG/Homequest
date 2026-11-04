import { describe, expect, it } from 'vitest'
import type { AppEvent, SpellEvent, SpellStat } from '@/engine/types'
import { project } from '@/engine/events'
import { makeRng } from '@/engine/rng'
import { BOX_HOURS, applySpell, quality, scoreWord, statusOf } from './model'
import { buildRound, confidence, hintView, isRight, maxHintLevel, normalise, summarise, weightedSample } from './round'
import { cleanCount, finishTurn, guess, moreHint, nextTurn, progressOf, startRound, toPractise, currentTurn, canHint, RETRY_GAP } from './session'
import { RANK_OF, WORDS, WORD_BY_ID, WORD_REPORT, backronymSpells, expandPos, maskClue, parseWordList, type SpellingWord } from './words'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const T0 = Date.UTC(2026, 8, 21, 9)

const spell = (wordId: string, ts: number, over: Partial<SpellEvent> = {}): SpellEvent => ({
  type: 'spell',
  id: `s-${wordId}-${ts}-${over.ask ?? 'first'}`,
  ts,
  day: new Date(ts).toISOString().slice(0, 10),
  learnerId: 'ellie',
  v: 1,
  wordId,
  ask: 'first',
  outcome: 'right',
  tries: 1,
  hints: 0,
  ms: 4000,
  round: 'r1',
  award: { total: 6, parts: [] },
  ...over,
})

describe('word bank', () => {
  it('has every unique word from the supplied lists, each with a definition and sound', () => {
    expect(WORD_REPORT.rows).toBe(265)
    expect(WORDS).toHaveLength(243)
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length)
    for (const w of WORDS) {
      expect(w.id).toMatch(/^[a-z]+$/)
      expect(w.definition.length).toBeGreaterThan(3)
      expect(w.phonetic.length).toBeGreaterThan(1)
      expect(w.pos.length).toBeGreaterThan(2)
    }
  })

  it("every supplied letter count matches its word, so a typo in the list can't slip through", () => {
    expect(WORD_REPORT.badLength).toEqual([])
  })

  it('every word has a backronym whose first letters really spell it', () => {
    expect(WORD_REPORT.noBackronym).toEqual([])
    expect(WORD_REPORT.badBackronym).toEqual([])
    for (const w of WORDS) expect(backronymSpells(w.id, w.backronym!)).toBe(true)
    // the three supplied ones that were wrong were replaced, not passed on
    expect(WORD_BY_ID.get('queue')!.backronym).not.toMatch(/embrella/i)
    expect(backronymSpells('continuous', 'Cats Often Need To Inhale New Ice Or Use Snow')).toBe(false)
    expect(backronymSpells('silhouette', "Seven Igloos Look Horrible Under Every Tree, Tigers Eat")).toBe(false)
  })

  it('a clue never contains the answer or a word built on it', () => {
    for (const w of WORDS) {
      const stem = w.id.slice(0, Math.min(5, w.id.length))
      expect(w.definition.toLowerCase().split(/[^a-z']+/).filter((x) => x.startsWith(stem))).toEqual([])
    }
    expect(WORD_BY_ID.get('government')!.definition).toBe('The _________ body of a nation.')
    expect(maskClue('equip', 'Supplied with equipped items')).toBe('Supplied with ________ items')
  })

  it('files a word that is in two lists once, under the easier list', () => {
    const acc = WORD_BY_ID.get('accommodate')!
    expect(acc.lists).toEqual(['Year 5-6', 'Year 8'])
    expect(acc.tier).toBe(2)
    expect(WORD_BY_ID.get('separate')!.tier).toBe(1) // Year 3-4 and Year 8
    expect(WORD_BY_ID.get('separate')!.backronym).toMatch(/^Seven Elephants/) // the real backronym, not "See KS3 list above"
  })

  it('starts with short, common words and ends with the hardest', () => {
    const first = WORDS.slice(0, 12)
    expect(first.every((w) => w.id.length <= 8)).toBe(true)
    expect(first.some((w) => w.id === 'could')).toBe(true)
    const last = WORDS.slice(-10).map((w) => w.id)
    expect(last).toContain('unnecessary')
    expect(last).toContain('chronological')
    expect(RANK_OF.get('busy')!).toBeLessThan(RANK_OF.get('parliament')!)
    expect(RANK_OF.get('could')!).toBeLessThan(RANK_OF.get('accommodate')!)
  })

  it('expands parts of speech and parses a small table', () => {
    expect(expandPos('N/V')).toBe('noun or verb')
    expect(expandPos('Adj')).toBe('adjective')
    const { words, report } = parseWordList('Key Stage 1: Years 1 & 2 Overview\n| Word (Ltrs) | POS |\n|---|---|\n| Cat (3) | N | kat | A small pet. | Cats Always Tease |\n| Dog (4) | N | dog | A pet. | nope |')
    expect(words.map((w) => w.id)).toEqual(['cat', 'dog'])
    expect(report.badLength).toEqual(['dog'])
    expect(report.badBackronym).toEqual(['dog'])
    expect(words[1]!.backronym).toBeUndefined()
  })
})

describe('marking and hints', () => {
  const w = WORD_BY_ID.get('necessary')!
  it('ignores case, spaces and punctuation, but not spelling', () => {
    expect(normalise(' Nec-es Sary! ')).toBe('necessary')
    expect(isRight(w, 'Necessary')).toBe(true)
    expect(isRight(w, ' necessary ')).toBe(true)
    expect(isRight(w, 'neccessary')).toBe(false)
    expect(isRight(w, '')).toBe(false)
  })

  it('shows only the definition at first, then the length, then first letter and sound, then the memory trick, then more letters', () => {
    const v0 = hintView(w, 0)
    expect(v0.slots).toEqual([])
    expect(v0.showPos).toBe(false)
    const v1 = hintView(w, 1)
    expect(v1.slots).toHaveLength(9)
    expect(v1.slots.every((s) => s === null)).toBe(true)
    expect(v1.showPos).toBe(true)
    expect(v1.showSound).toBe(false)
    const v2 = hintView(w, 2)
    expect(v2.slots[0]).toBe('n')
    expect(v2.showSound).toBe(true)
    expect(v2.backronym).toBeUndefined()
    const v3 = hintView(w, 3)
    expect(v3.backronym).toBe(w.backronym)
    const v4 = hintView(w, 4)
    expect(v4.slots.slice(0, 2)).toEqual(['n', 'e'])
    expect(v4.lettersOnly).toBe(true)
  })

  it('never shows the last letter, and stops after the last step', () => {
    for (const word of WORDS) {
      const max = maxHintLevel(word)
      const v = hintView(word, max + 5)
      expect(v.level).toBe(max)
      expect(v.slots[word.id.length - 1]).toBeNull()
      expect(v.slots.filter((s) => s !== null).length).toBe(word.id.length - 1)
    }
  })

  it('skips the memory-trick step for a word without one', () => {
    const bare = { id: 'cat', backronym: undefined }
    expect(hintView(bare, 3).backronym).toBeUndefined()
    expect(hintView(bare, 3).slots.filter(Boolean)).toHaveLength(2)
    expect(maxHintLevel(bare)).toBe(3)
  })
})

describe('word memory', () => {
  it('rates a turn by how much help it needed', () => {
    expect(quality({ outcome: 'right', tries: 1, hints: 0 })).toBe('clean')
    expect(quality({ outcome: 'right', tries: 2, hints: 1 })).toBe('light')
    expect(quality({ outcome: 'right', tries: 1, hints: 1 })).toBe('light')
    expect(quality({ outcome: 'right', tries: 3, hints: 3 })).toBe('heavy')
    expect(quality({ outcome: 'right', tries: 1, hints: 3 })).toBe('heavy')
    expect(quality({ outcome: 'skipped', tries: 2, hints: 4 })).toBe('skip')
  })

  it('a word she knows straight away jumps ahead; the next clean turns keep climbing to the top', () => {
    let s = applySpell(undefined, spell('could', T0))
    expect(s.box).toBe(2)
    s = applySpell(s, spell('could', T0 + DAY))
    expect(s.box).toBe(3)
    s = applySpell(s, spell('could', T0 + 4 * DAY))
    s = applySpell(s, spell('could', T0 + 12 * DAY))
    s = applySpell(s, spell('could', T0 + 40 * DAY))
    expect(s.box).toBe(5)
    expect(s.clean).toBe(5)
    expect(s.streak).toBe(5)
    expect(statusOf(s)).toBe('known')
  })

  it('a simple word she keeps missing stays at the bottom and keeps coming straight back', () => {
    let s = applySpell(undefined, spell('would', T0, { outcome: 'skipped', tries: 2, hints: 3 }))
    expect(s.box).toBe(0)
    expect(s.dueTs).toBe(T0) // box 0 is always due
    s = applySpell(s, spell('would', T0, { ask: 'retry' })) // spelt right after seeing it: practice only
    expect(s.box).toBe(0)
    s = applySpell(s, spell('would', T0 + DAY, { tries: 4, hints: 4 }))
    expect(s.box).toBe(0)
    expect(statusOf(s)).toBe('learning')
    expect(s.seen).toBe(3)
    expect(s.skips).toBe(1)
  })

  it('a slip drops a solid word back, and a little help holds it where it is', () => {
    let s = applySpell(undefined, spell('busy', T0))
    s = applySpell(s, spell('busy', T0 + 1 * DAY))
    s = applySpell(s, spell('busy', T0 + 4 * DAY))
    expect(s.box).toBe(4)
    const light = applySpell(s, spell('busy', T0 + 12 * DAY, { tries: 2, hints: 1 }))
    expect(light.box).toBe(4)
    expect(light.streak).toBe(0)
    const skipped = applySpell(s, spell('busy', T0 + 12 * DAY, { outcome: 'skipped', tries: 1, hints: 2 }))
    expect(skipped.box).toBe(2)
    expect(skipped.last).toBe('s')
  })

  it('sets the next due time from the box, jittered by a quarter either way and the same on every phone', () => {
    const s = applySpell(applySpell(undefined, spell('early', T0)), spell('early', T0 + DAY))
    expect(s.box).toBe(3)
    const gap = (s.dueTs - (T0 + DAY)) / HOUR
    expect(gap).toBeGreaterThanOrEqual(BOX_HOURS[3] * 0.75)
    expect(gap).toBeLessThanOrEqual(BOX_HOURS[3] * 1.25)
    const again = applySpell(applySpell(undefined, spell('early', T0)), spell('early', T0 + DAY))
    expect(again.dueTs).toBe(s.dueTs)
  })

  it('scores a clean word best, help less, a skip a point, and adds round and daily bonuses once', () => {
    const base = { ask: 'first' as const, firstEver: false, combo: 0, firstToday: false, streakDays: 1 }
    expect(scoreWord({ ...base, quality: 'clean' }).total).toBe(6)
    expect(scoreWord({ ...base, quality: 'clean', firstEver: true }).total).toBe(8)
    expect(scoreWord({ ...base, quality: 'light' }).total).toBe(4)
    expect(scoreWord({ ...base, quality: 'heavy' }).total).toBe(2)
    expect(scoreWord({ ...base, quality: 'skip' }).total).toBe(1)
    expect(scoreWord({ ...base, quality: 'clean', combo: 4 }).total).toBe(6 + 3)
    expect(scoreWord({ ...base, quality: 'clean', roundEnd: { words: 10, clean: 9 } }).total).toBe(6 + 10 + 8)
    expect(scoreWord({ ...base, quality: 'clean', roundEnd: { words: 3, clean: 3 } }).total).toBe(6) // too short for a bonus
    expect(scoreWord({ ...base, quality: 'clean', firstToday: true, streakDays: 3 }).total).toBe(6 + 11)
    expect(scoreWord({ ...base, ask: 'retry', quality: 'clean' }).total).toBe(1)
    expect(scoreWord({ ...base, ask: 'retry', quality: 'skip' }).total).toBe(0)
  })

  it("feeds the learner's XP, streak and word records (so coins follow)", () => {
    const evs: AppEvent[] = [spell('could', T0, { award: { total: 8, parts: [] } }), spell('would', T0 + 1000, { award: { total: 6, parts: [] } }), spell('could', T0 + 2000, { ask: 'retry', award: { total: 1, parts: [] } })]
    const st = project('ellie', evs)
    expect(st.xp).toBe(15)
    expect(st.xpBySubject['spelling']).toBe(15)
    expect(st.xpByDay['2026-09-21']).toBe(15)
    expect(st.streak.current).toBe(1)
    expect(st.spelling['could']!.seen).toBe(2)
    expect(st.spelling['would']!.box).toBe(2)
    // someone else's spelling does not count
    expect(project('mum', evs).xp).toBe(0)
  })
})

// ------------------------------------------------------------------ choosing a round

type Outcome = Pick<SpellEvent, 'outcome' | 'tries' | 'hints'>
const CLEAN: Outcome = { outcome: 'right', tries: 1, hints: 0 }
const HELPED: Outcome = { outcome: 'right', tries: 2, hints: 1 }
const MISSED: Outcome = { outcome: 'skipped', tries: 3, hints: 4 }

/** Play rounds against a made-up learner. `p` is the chance she spells a given word cleanly. */
function play(rounds: number, opts: { p: (w: SpellingWord) => number; size?: number; seed?: number; everyDays?: number; words?: readonly SpellingWord[] }) {
  const rng = makeRng(opts.seed ?? 1)
  const dice = makeRng((opts.seed ?? 1) + 999)
  let stats: Record<string, SpellStat> = {}
  let now = T0
  const asked: string[][] = []
  const kinds: Record<string, number> = { new: 0, due: 0, spot: 0 }
  const log: { wordId: string; ts: number }[] = []
  for (let r = 0; r < rounds; r++) {
    const round = buildRound({ stats, now, size: opts.size ?? 10, rng, words: opts.words })
    asked.push(round.map((p) => p.wordId))
    for (const p of round) {
      kinds[p.kind] = (kinds[p.kind] ?? 0) + 1
      const w = WORD_BY_ID.get(p.wordId)!
      const roll = dice.next()
      const out: Outcome = roll < opts.p(w) ? CLEAN : roll < opts.p(w) + 0.15 ? HELPED : MISSED
      now += 30_000
      stats = { ...stats, [w.id]: applySpell(stats[w.id], spell(w.id, now, out)) }
      log.push({ wordId: w.id, ts: now })
    }
    now += (opts.everyDays ?? 1) * DAY
  }
  return { stats, asked, kinds, now, log }
}

describe('choosing a round', () => {
  it('the very first round is all new words, the easiest ones, and no repeats', () => {
    const r = buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(7) })
    expect(r).toHaveLength(10)
    expect(new Set(r.map((p) => p.wordId)).size).toBe(10)
    expect(r.every((p) => p.kind === 'new')).toBe(true)
    // all from the easy end of the ladder (a window a few words wide, with an occasional stretch)
    for (const p of r) expect(RANK_OF.get(p.wordId)!).toBeLessThan(20)
  })

  it('replays exactly for the same seed and differs for another', () => {
    const a = buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(3) }).map((p) => p.wordId)
    const b = buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(3) }).map((p) => p.wordId)
    const c = buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(4) }).map((p) => p.wordId)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('a word she missed comes back in the very next round, ahead of most new words', () => {
    let stats: Record<string, SpellStat> = {}
    const first = buildRound({ stats, now: T0, size: 10, rng: makeRng(2) })
    for (const [i, p] of first.entries()) stats = { ...stats, [p.wordId]: applySpell(stats[p.wordId], spell(p.wordId, T0 + i * 1000, i < 3 ? { ...MISSED } : { ...CLEAN })) }
    const missed = first.slice(0, 3).map((p) => p.wordId)
    let seenAgain = 0
    for (let seed = 0; seed < 20; seed++) {
      const next = buildRound({ stats, now: T0 + 2 * HOUR, size: 10, rng: makeRng(seed) }).map((p) => p.wordId)
      seenAgain += missed.filter((m) => next.includes(m)).length
    }
    // 3 missed words, 20 rounds: they should turn up nearly every time
    expect(seenAgain).toBeGreaterThanOrEqual(50)
  })

  it('does not bury a struggling learner in new words, but still keeps some coming', () => {
    const sim = play(12, { p: () => 0.1, seed: 5, everyDays: 1 })
    const met = Object.values(sim.stats).length
    const easy = play(12, { p: () => 0.97, seed: 5, everyDays: 1 })
    expect(met).toBeLessThan(Object.values(easy.stats).length)
    expect(met).toBeGreaterThan(10)
    // 120 turns, but a struggling learner spends most of them on words she already met
    expect(met).toBeLessThan(70)
  })

  it('moves a confident learner up the ladder faster, and slows down once she starts missing', () => {
    const strong = play(15, { p: () => 0.95, seed: 9 })
    const weak = play(15, { p: () => 0.35, seed: 9 })
    const reach = (st: Record<string, SpellStat>) => Math.max(...Object.keys(st).map((id) => RANK_OF.get(id)!))
    expect(reach(strong.stats)).toBeGreaterThan(reach(weak.stats))
    expect(summarise(strong.stats).level).toBeGreaterThanOrEqual(summarise(weak.stats).level)
  })

  it("simple words she finds hard are practised across many sessions, while ones she knows are not drilled", () => {
    const hardOnes = new Set(['could', 'would', 'should'])
    const sim = play(20, { p: (w) => (hardOnes.has(w.id) ? 0.05 : 0.95), seed: 11 })
    const turns = (id: string) => sim.log.filter((l) => l.wordId === id).length
    const days = (id: string) => new Set(sim.log.filter((l) => l.wordId === id).map((l) => Math.floor((l.ts - T0) / DAY))).size
    for (const id of hardOnes) {
      expect(turns(id)).toBeGreaterThanOrEqual(6)
      expect(days(id)).toBeGreaterThanOrEqual(5) // over many separate days, not one long drill
      expect(sim.stats[id]!.box).toBeLessThanOrEqual(2)
    }
    const known = ['busy', 'early', 'earth', 'fruit'].filter((id) => sim.stats[id])
    for (const id of known) expect(turns(id)).toBeLessThan(turns('could'))
  })

  it('never says "done": words she has mastered are still checked now and then', () => {
    // Everything is known perfectly, over a long stretch of days.
    const sim = play(60, { p: () => 1, seed: 21, size: 10, everyDays: 1 })
    const solid = Object.entries(sim.stats).filter(([, s]) => s.box >= 4).map(([id]) => id)
    expect(solid.length).toBeGreaterThan(20)
    // Some solid words were asked again on 3 or more separate days after reaching the top boxes.
    const revisited = solid.filter((id) => sim.log.filter((l) => l.wordId === id).length >= 5)
    expect(revisited.length).toBeGreaterThan(5)
    // ...and spot-checks (not due yet) were a real part of the mix
    expect(sim.kinds['spot']!).toBeGreaterThan(20)
  })

  it('the order changes from round to round and is not just the same list shuffled', () => {
    const sim = play(10, { p: () => 0.7, seed: 31 })
    const firsts = sim.asked.map((r) => r[0])
    expect(new Set(firsts).size).toBeGreaterThan(4)
    const seqs = new Set(sim.asked.map((r) => r.join(',')))
    expect(seqs.size).toBe(sim.asked.length)
    for (const r of sim.asked) expect(new Set(r).size).toBe(r.length)
  })

  it('handles a round bigger than the bank, an empty bank and words that are all solid', () => {
    const tiny = WORDS.slice(0, 4)
    const r = buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(1), words: tiny })
    expect(r.map((p) => p.wordId).sort()).toEqual(tiny.map((w) => w.id).sort())
    expect(buildRound({ stats: {}, now: T0, size: 10, rng: makeRng(1), words: [] })).toEqual([])
    const stats: Record<string, SpellStat> = {}
    for (const w of tiny) stats[w.id] = { box: 5, seen: 9, right: 9, clean: 9, skips: 0, streak: 9, last: 'c', firstTs: T0, lastTs: T0, dueTs: T0 + 30 * DAY }
    const again = buildRound({ stats, now: T0 + DAY, size: 3, rng: makeRng(1), words: tiny })
    expect(again).toHaveLength(3)
  })

  it('weighted sampling favours heavy items without ever repeating one', () => {
    const rng = makeRng(1)
    let heavy = 0
    for (let i = 0; i < 200; i++) {
      const s = weightedSample(['a', 'b', 'c', 'd'], (x) => (x === 'a' ? 20 : 1), 2, rng)
      expect(new Set(s).size).toBe(2)
      if (s.includes('a')) heavy++
    }
    expect(heavy).toBeGreaterThan(150)
  })

  it('summarises progress into counts, a level and a list of tricky words', () => {
    const sim = play(8, { p: (w) => (w.id === 'could' ? 0 : 0.9), seed: 41 })
    const sum = summarise(sim.stats)
    expect(sum.counts.new + sum.counts.learning + sum.counts.getting + sum.counts.known).toBe(WORDS.length)
    expect(sum.level).toBeGreaterThanOrEqual(1)
    expect(sum.level).toBeLessThanOrEqual(sum.levels)
    expect(sum.tricky).toContain('could')
    expect(confidence({})).toBe(0)
  })
})

// ---------------------------------------------------------------------- a round

describe('playing a round', () => {
  const picks = ['could', 'would', 'busy', 'earth', 'fruit', 'group'].map((wordId) => ({ wordId, kind: 'new' as const }))
  const scorer = () => (r: { tries: number; hints: number; outcome: 'right' | 'skipped' }) => ({ quality: quality(r), xp: quality(r) === 'clean' ? 6 : 2 })
  const word = (s: ReturnType<typeof startRound>) => WORD_BY_ID.get(currentTurn(s)!.wordId)!

  it('starts on the first word with only the definition showing', () => {
    const s = startRound(picks, 'r1', T0)
    expect(s.phase).toBe('ask')
    expect(s.level).toBe(0)
    expect(currentTurn(s)!.wordId).toBe('could')
    expect(startRound([], 'r', T0).phase).toBe('done')
  })

  it('a right first guess is clean; a wrong one opens the next hint and counts a try; a blank one does nothing', () => {
    let s = startRound(picks, 'r1', T0)
    expect(guess(s, word(s), '   ').result).toBe('empty')
    const g1 = guess(s, word(s), 'cud')
    expect(g1.result).toBe('wrong')
    s = g1.state
    expect(s.level).toBe(1)
    expect(s.tries).toBe(1)
    expect(s.wrong).toEqual(['cud'])
    const g2 = guess(s, word(s), 'Could')
    expect(g2.result).toBe('right')
    s = finishTurn(g2.state, 'right', T0 + 9000, scorer())
    expect(s.phase).toBe('right')
    expect(s.finished[0]).toMatchObject({ outcome: 'right', tries: 2, hints: 1, quality: 'light' })
    expect(s.combo).toBe(0) // it needed help, so no combo
  })

  it('the Hint button opens steps one at a time until the last, then stops', () => {
    let s = startRound(picks, 'r1', T0)
    const w = word(s)
    let n = 0
    while (canHint(s, w)) {
      s = moreHint(s, w)
      n++
    }
    expect(n).toBeGreaterThan(3)
    expect(moreHint(s, w).level).toBe(s.level)
  })

  it('a skipped word comes back a few words later, once, and does not count as a new word', () => {
    let s = startRound(picks, 'r1', T0)
    s = finishTurn(s, 'skipped', T0 + 2000, scorer())
    expect(s.phase).toBe('shown')
    expect(s.queue).toHaveLength(7)
    expect(s.queue[1 + RETRY_GAP]).toMatchObject({ wordId: 'could', ask: 'retry' })
    expect(s.words).toBe(6)
    s = nextTurn(s, T0 + 3000)
    expect(s).toMatchObject({ idx: 1, phase: 'ask', level: 0, tries: 0, wrong: [] })
    // skipping the retry does not queue it again
    for (let i = 1; i < 4; i++) {
      s = finishTurn(s, 'right', T0 + 4000 + i, scorer())
      s = nextTurn(s, T0 + 5000 + i)
    }
    expect(currentTurn(s)).toMatchObject({ wordId: 'could', ask: 'retry' })
    const before = s.queue.length
    s = finishTurn(s, 'skipped', T0 + 9000, scorer())
    expect(s.queue).toHaveLength(before)
  })

  it('a word that needed lots of help is also asked again', () => {
    let s = startRound(picks, 'r1', T0)
    const w = word(s)
    for (const t of ['a', 'b', 'c']) s = guess(s, w, t).state
    s = guess(s, w, 'could').state
    s = finishTurn(s, 'right', T0 + 8000, scorer())
    expect(s.finished[0]!.quality).toBe('heavy')
    expect(s.queue.filter((t) => t.wordId === 'could')).toHaveLength(2)
  })

  it('counts a combo for clean words in a row, marks the last turn for the round bonus, and ends the round', () => {
    let s = startRound(picks.slice(0, 3), 'r1', T0)
    const seen: { combo: number; end?: { words: number; clean: number } }[] = []
    for (let i = 0; i < 3; i++) {
      s = guess(s, word(s), word(s).id).state
      s = finishTurn(s, 'right', T0 + i * 1000, (r) => {
        seen.push({ combo: r.combo, end: r.roundEnd })
        return { quality: quality(r), xp: 6 }
      })
      s = nextTurn(s, T0 + i * 1000 + 500)
    }
    expect(seen.map((x) => x.combo)).toEqual([0, 1, 2])
    expect(seen.map((x) => x.end)).toEqual([undefined, undefined, { words: 3, clean: 3 }])
    expect(s.phase).toBe('done')
    expect(s.xp).toBe(18)
    expect(cleanCount(s)).toBe(3)
    expect(progressOf(s)).toBe(1)
    expect(toPractise(s)).toEqual([])
  })

  it('a skip at the end of a round pushes the end back so the retry still happens', () => {
    let s = startRound(picks.slice(0, 1), 'r1', T0)
    let sawEnd = false
    s = finishTurn(s, 'skipped', T0 + 1000, (r) => {
      sawEnd = !!r.roundEnd
      return { quality: quality(r), xp: 1 }
    })
    expect(sawEnd).toBe(false) // the retry is still to come
    s = nextTurn(s, T0 + 2000)
    expect(s.phase).toBe('ask')
    expect(currentTurn(s)!.ask).toBe('retry')
    s = finishTurn(guess(s, word(s), 'could').state, 'right', T0 + 3000, () => ({ quality: 'clean', xp: 1 }))
    s = nextTurn(s, T0 + 4000)
    expect(s.phase).toBe('done')
    expect(toPractise(s)).toEqual(['could'])
  })

  it('ignores taps that arrive in the wrong phase (a double tap on Next, a guess after the answer)', () => {
    let s = startRound(picks, 'r1', T0)
    s = finishTurn(s, 'skipped', T0 + 1, scorer())
    expect(guess(s, word(s), 'could').result).toBe('empty')
    expect(finishTurn(s, 'right', T0 + 2, scorer())).toBe(s)
    const n1 = nextTurn(s, T0 + 3)
    expect(nextTurn(n1, T0 + 4)).toBe(n1)
  })
})
