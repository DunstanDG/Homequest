/**
 * How the spelling game remembers each word.
 *
 * Every word has a "box" from 0 to 5. Box 0 means brand new (or keeps going wrong) and comes straight back; box 5 means solid
 * and is only checked every few weeks. Spelling a word right first time, with no help, moves it up; needing help holds it
 * where it is; skipping or needing lots of help pushes it back. A brand-new word that is spelt cleanly straight away jumps two
 * boxes, so words she already knows are not drilled.
 *
 * Nothing here is ever "finished": even a box-5 word comes back after a while, and the round builder (round.ts) also slips in
 * the odd spot-check of a word that has not been due for a while. All of it is a pure function of the `spell` events.
 */
import type { Award, PointPart, SpellEvent, SpellStat } from '@/engine/types'
import { hashString } from '@/engine/rng'
import { nextStreak } from '@/engine/points'

export const BOX_MAX = 5
const HOUR = 3_600_000

/** How long a word rests in each box, in hours (the actual gap is jittered by +/-25%). */
export const BOX_HOURS = [0, 6, 24, 72, 192, 504] as const

export type Quality = 'clean' | 'light' | 'heavy' | 'skip'

/** How much help a turn needed. */
export function quality(e: Pick<SpellEvent, 'outcome' | 'tries' | 'hints'>): Quality {
  if (e.outcome === 'skipped') return 'skip'
  if (e.tries <= 1 && e.hints === 0) return 'clean'
  if (e.hints <= 1 && e.tries <= 2) return 'light'
  return 'heavy'
}

const LAST: Record<Quality, SpellStat['last']> = { clean: 'c', light: 'l', heavy: 'h', skip: 's' }

/** Same word + same moment = same gap on every phone, so every device works out the same due date. */
export function jitter(wordId: string, ts: number): number {
  return 0.75 + 0.5 * ((hashString(`${wordId}|${ts}`) % 1000) / 1000)
}

export const dueAfter = (box: number, wordId: string, ts: number): number => ts + Math.round(BOX_HOURS[Math.min(BOX_MAX, Math.max(0, box))]! * HOUR * jitter(wordId, ts))

export const newStat = (ts: number): SpellStat => ({ box: 0, seen: 0, right: 0, clean: 0, skips: 0, streak: 0, last: 'h', firstTs: ts, lastTs: ts, dueTs: ts })

/** Fold one `spell` event into a word's record. */
export function applySpell(prev: SpellStat | undefined, e: SpellEvent): SpellStat {
  const s = prev ?? newStat(e.ts)
  const q = quality(e)
  let box = s.box
  let streak = s.streak
  let last = s.last
  if (e.ask === 'first') {
    if (q === 'clean') box = Math.min(BOX_MAX, box + (s.seen === 0 ? 2 : 1))
    else if (q === 'light') box = Math.max(box, 1)
    else if (q === 'heavy') box = Math.max(0, box - 1)
    else box = Math.max(0, box - 2)
    streak = q === 'clean' ? s.streak + 1 : 0
    last = LAST[q]
  }
  // A retry (asked again in the same round straight after a miss) is practice only: the miss already counted.
  return {
    box,
    seen: s.seen + 1,
    right: s.right + (e.outcome === 'right' ? 1 : 0),
    clean: s.clean + (e.ask === 'first' && q === 'clean' ? 1 : 0),
    skips: s.skips + (e.outcome === 'skipped' ? 1 : 0),
    streak,
    last,
    firstTs: s.seen === 0 ? e.ts : s.firstTs,
    lastTs: e.ts,
    dueTs: dueAfter(box, e.wordId, e.ts),
  }
}

/** Where a word stands, in words a child would use. */
export type WordStatus = 'new' | 'learning' | 'getting' | 'known'
export const statusOf = (s: SpellStat | undefined): WordStatus => (!s || s.seen === 0 ? 'new' : s.box <= 1 ? 'learning' : s.box <= 3 ? 'getting' : 'known')
export const STATUS_LABEL: Record<WordStatus, string> = { new: 'New', learning: 'Practising', getting: 'Getting there', known: 'Known' }

// ------------------------------------------------------------------- points

export interface ScoreInput {
  quality: Quality
  ask: 'first' | 'retry'
  /** Was this the very first time she has met the word? */
  firstEver: boolean
  /** Clean answers in a row earlier in this round. */
  combo: number
  /** Is this her first spelling of the day (for the daily bonus)? */
  firstToday: boolean
  streakDays: number
  /** Set on the last word of a round: how many words were in it and how many were clean. */
  roundEnd?: { words: number; clean: number }
}

/** XP for one word. Kept small: a ten-word round is worth roughly 70 XP. */
export function scoreWord(i: ScoreInput): Award {
  const parts: PointPart[] = []
  const add = (code: string, label: string, points: number) => points > 0 && parts.push({ code, label, points })
  if (i.ask === 'retry') add('again', i.quality === 'skip' ? 'Had another go' : 'Second time round', i.quality === 'skip' ? 0 : 1)
  else if (i.quality === 'clean') {
    add('base', 'Spelt it first time', 6)
    if (i.firstEver) add('known', 'Already knew it', 2)
    if (i.combo >= 2) add('combo', `Combo x${i.combo + 1}`, Math.min(4, i.combo - 1))
  } else if (i.quality === 'light') add('base', 'Got it with a little help', 4)
  else if (i.quality === 'heavy') add('base', 'Got it in the end', 2)
  else add('effort', 'Good try', 1)
  if (i.roundEnd && i.roundEnd.words >= 5) {
    add('finish', 'Round complete', 10)
    if (i.roundEnd.clean / i.roundEnd.words >= 0.8) add('sharp', 'Sharp: 80%+ first time', 8)
  }
  if (i.firstToday) add('daily', i.streakDays > 1 ? `Daily bonus: ${i.streakDays}-day streak` : 'Daily bonus', 5 + 2 * Math.min(i.streakDays, 10))
  return { total: parts.reduce((s, p) => s + p.points, 0), parts }
}

/** Streak length if she spells something on `day`, for the daily bonus label. */
export const streakOn = (prev: { current: number; best: number; lastDay?: string }, day: string): number => nextStreak(prev, day).current
