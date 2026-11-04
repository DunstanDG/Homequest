import type { AppEvent, LearnerState } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import { dayOf } from '@/engine/events'
import { quality, scoreWord, streakOn, type Quality } from './model'

export interface TurnResult {
  wordId: string
  ask: 'first' | 'retry'
  outcome: 'right' | 'skipped'
  tries: number
  hints: number
  ms: number
  round: string
  /** Clean answers in a row earlier in this round. */
  combo: number
  /** Set on the last turn of the round. */
  roundEnd?: { words: number; clean: number }
}

/** The event for one finished word, with its XP worked out from where she stood at that moment. */
export function spellTurn(actor: string, state: LearnerState, r: TurnResult, now = Date.now()): { event: AppEvent; quality: Quality; xp: number } {
  const day = dayOf(now)
  const q = quality(r)
  const award = scoreWord({
    quality: q,
    ask: r.ask,
    firstEver: (state.spelling[r.wordId]?.seen ?? 0) === 0,
    combo: r.combo,
    firstToday: state.streak.lastDay !== day,
    streakDays: streakOn(state.streak, day),
    roundEnd: r.roundEnd,
  })
  const event = makeEvent(actor, { type: 'spell', wordId: r.wordId, ask: r.ask, outcome: r.outcome, tries: r.tries, hints: r.hints, ms: Math.max(0, Math.round(r.ms)), round: r.round, award }, now)
  return { event, quality: q, xp: award.total }
}
