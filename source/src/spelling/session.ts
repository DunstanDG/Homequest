/**
 * One round of the spelling game as plain data plus pure functions, so the rules (hint steps, retries, combos, when the round
 * ends) are tested without a screen. The screen only draws the state and calls these.
 */
import { quality, type Quality } from './model'
import { hintView, isRight, maxHintLevel, type RoundPick } from './round'
import type { TurnResult } from './actions'
import type { SpellingWord } from './words'

export interface Turn {
  wordId: string
  ask: 'first' | 'retry'
  kind: RoundPick['kind']
}

export interface Finished {
  wordId: string
  ask: 'first' | 'retry'
  outcome: 'right' | 'skipped'
  quality: Quality
  xp: number
  tries: number
  hints: number
}

export interface RoundState {
  id: string
  queue: Turn[]
  idx: number
  /** How many different words the round started with (retries do not add to it). */
  words: number
  /** ask: waiting for a guess. right / shown: the answer is on screen. done: the round is over. */
  phase: 'ask' | 'right' | 'shown' | 'done'
  level: number
  tries: number
  /** Wrong guesses this turn, newest last. */
  wrong: string[]
  startedAt: number
  combo: number
  finished: Finished[]
  xp: number
}

/** How many other words come before a missed word is asked again in the same round. */
export const RETRY_GAP = 3

export const startRound = (picks: RoundPick[], id: string, now: number): RoundState => ({
  id,
  queue: picks.map((p) => ({ wordId: p.wordId, ask: 'first', kind: p.kind })),
  idx: 0,
  words: picks.length,
  phase: picks.length ? 'ask' : 'done',
  level: 0,
  tries: 0,
  wrong: [],
  startedAt: now,
  combo: 0,
  finished: [],
  xp: 0,
})

export const currentTurn = (s: RoundState): Turn | undefined => (s.phase === 'done' ? undefined : s.queue[s.idx])

export type GuessResult = 'empty' | 'right' | 'wrong'

/** A guess. Right ends the turn (call finishTurn next); wrong counts a try and opens the next hint step. */
export function guess(s: RoundState, word: SpellingWord, text: string): { state: RoundState; result: GuessResult } {
  if (s.phase !== 'ask') return { state: s, result: 'empty' }
  if (!text.replace(/[^A-Za-z]/g, '')) return { state: s, result: 'empty' }
  const tries = s.tries + 1
  if (isRight(word, text)) return { state: { ...s, tries }, result: 'right' }
  return { state: { ...s, tries, wrong: [...s.wrong, text.trim()], level: Math.min(maxHintLevel(word), s.level + 1) }, result: 'wrong' }
}

/** Open the next hint step (the Hint button). */
export const moreHint = (s: RoundState, word: SpellingWord): RoundState => (s.phase === 'ask' ? { ...s, level: Math.min(maxHintLevel(word), s.level + 1) } : s)

export const canHint = (s: RoundState, word: SpellingWord): boolean => s.phase === 'ask' && s.level < maxHintLevel(word)

/** What the screen should show for the current hint step. */
export const hintFor = (s: RoundState, word: SpellingWord) => hintView(word, s.level)

/**
 * End the current turn as spelt right or skipped. `score` writes the event and reports the XP; it is called exactly once.
 * A word that was skipped, or needed lots of help, is put back a few words later so she gets another go this round.
 */
export function finishTurn(s: RoundState, outcome: 'right' | 'skipped', now: number, score: (r: TurnResult) => { quality: Quality; xp: number }): RoundState {
  const turn = s.queue[s.idx]
  if (!turn || s.phase !== 'ask') return s
  const base = { wordId: turn.wordId, ask: turn.ask, outcome, tries: Math.max(1, s.tries), hints: s.level }
  const q = quality(base)
  let queue = s.queue
  if (turn.ask === 'first' && (q === 'skip' || q === 'heavy')) {
    const at = Math.min(queue.length, s.idx + 1 + RETRY_GAP)
    queue = [...queue.slice(0, at), { wordId: turn.wordId, ask: 'retry', kind: turn.kind }, ...queue.slice(at)]
  }
  const cleanSoFar = s.finished.filter((f) => f.ask === 'first' && f.quality === 'clean').length
  const last = s.idx + 1 >= queue.length
  const result: TurnResult = { ...base, ms: now - s.startedAt, round: s.id, combo: s.combo, roundEnd: last ? { words: s.words, clean: cleanSoFar + (q === 'clean' && turn.ask === 'first' ? 1 : 0) } : undefined }
  const scored = score(result)
  return {
    ...s,
    queue,
    phase: outcome === 'right' ? 'right' : 'shown',
    combo: turn.ask === 'retry' ? s.combo : q === 'clean' ? s.combo + 1 : 0,
    xp: s.xp + scored.xp,
    finished: [...s.finished, { wordId: turn.wordId, ask: turn.ask, outcome, quality: scored.quality, xp: scored.xp, tries: base.tries, hints: base.hints }],
  }
}

/** Move on to the next word, or finish the round. */
export function nextTurn(s: RoundState, now: number): RoundState {
  if (s.phase !== 'right' && s.phase !== 'shown') return s
  if (s.idx + 1 >= s.queue.length) return { ...s, phase: 'done' }
  return { ...s, idx: s.idx + 1, phase: 'ask', level: 0, tries: 0, wrong: [], startedAt: now }
}

/** Words to show as "practise these": anything not spelt cleanly first time. */
export const toPractise = (s: RoundState): string[] => [...new Set(s.finished.filter((f) => f.ask === 'first' && f.quality !== 'clean').map((f) => f.wordId))]

export const cleanCount = (s: RoundState): number => s.finished.filter((f) => f.ask === 'first' && f.quality === 'clean').length

/** 0..1 progress through the round's words (retries do not move it backwards). */
export const progressOf = (s: RoundState): number => (s.words ? Math.min(1, s.finished.filter((f) => f.ask === 'first').length / s.words) : 1)
