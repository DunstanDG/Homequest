import type { ComponentType } from 'react'
import type { GameId, SessionMode, SkillId, SubjectId } from '@/engine/types'
import type { Session, SessionSummary } from '@/engine/session'
import type { IconName } from '@/ui/icons'

/** How a game was started: which subject, and optionally a narrowed focus. */
export interface GameLaunch {
  subject: SubjectId
  /** Practise just these skills (e.g. from Gap Finder results or the skill map). */
  focus?: SkillId[]
  /** Override the game's usual mode (e.g. 'review' from the revision banner). */
  mode?: SessionMode
  /** Sprint without a countdown. */
  relaxed?: boolean
  /** Exam conditions: timed (when the game has a time limit), no hints, no retries — a results screen at the end
   * rather than per-question feedback. XP/coins still earn normally; the point is honest practice conditions. */
  examMode?: boolean
}

export interface GameProps {
  session: Session
  game: GameDef
  launch: GameLaunch
  onDone(summary: SessionSummary): void
  onExit(): void
}

/**
 * A game is a "shell" around the engine: the engine decides WHAT to ask and how to score it;
 * the game decides how it feels. Most games reuse QuestionGame with a different `shell`.
 * A very different game (memory match, listening, drag-and-drop map) supplies its own `Component`,
 * which drives the same `Session` (next / submit / flag / finish), so points, progress and
 * feedback keep working for free.
 */
export interface GameDef {
  id: GameId
  name: string
  tagline: string
  /** Short bullets on the intro card. */
  blurb: string[]
  icon: IconName
  /** Accent colour for the card and the game screen. */
  color: string
  mode: SessionMode
  length: number
  allowRetry: boolean
  /** Question-and-answer chrome: floors, countdown or scanner. */
  shell: 'tower' | 'sprint' | 'scan' | 'meteor'
  timeLimitSec?: number
  /** Skills to focus on when nothing more specific was asked for in the URL (e.g. a game built around one
   * particular skill, like Equation Defence and times tables). A `?focus=` in the URL always wins. */
  defaultFocus?: SkillId[]
  /** Replace the default question screen entirely. */
  Component?: ComponentType<GameProps>
}
