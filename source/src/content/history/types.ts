import type { Figure } from '@/engine/types'

/**
 * Data shapes for the History pack. Every topic skill is described by one `Topic` record (facts in tables), and
 * `gen.topic.ts` turns each record into generators. Adding questions is mostly adding rows.
 */

/** A wrong option: plain label, or [label, feedback] for a real misconception. */
export type W = string | [string, string]

/** A dated event. `y` is the year (negative = BC). `approx` events are used only for ordering, never asked by date. */
export interface Ev {
  y: number
  e: string
  /** Optional one-line note used in explanations. */
  note?: string
  /** A famous date she should know exactly: may be asked as a typed year at levels 4-5. */
  key?: boolean
  approx?: boolean
}

/** A multiple-choice fact question with misconception feedback. */
export interface Fact {
  lv: [number, number]
  q: string
  a: string
  w: W[]
  hint: string
  ex: string
  src?: Figure
}

export interface Term {
  t: string
  d: string
}

/** A person and something specific only they did (phrased to follow "Who ...", e.g. "led the Peasants' Revolt"). */
export interface Person {
  n: string
  did: string
}

/** A cause and its consequence. */
export interface Link {
  c: string
  e: string
}

/** Things to sort into categories (asked one at a time, or "which of these is a ..."). */
export interface Sort {
  /** Category names as shown on the buttons. */
  cats: string[]
  /** How to ask "which of these is a ..." for each category, e.g. 'a long-term cause'. */
  ask: string[]
  /** Question asked about one item, e.g. 'Is this a primary or a secondary source?' */
  q: string
  items: [text: string, cat: number, why?: string][]
  hint: string
  /** General teaching point added to every explanation. */
  ex: string
}

/** A list whose correct order is the order given (reigns, wives, stages of an event). */
export interface Seq {
  prompt: string
  items: string[]
  direction: [string, string]
  hint: string
  ex: string
}

/** A written answer she self-marks. */
export interface Rev {
  lv?: [number, number]
  prompt: string
  model: string
  checklist: string[]
  hint: string
  src?: Figure
}

export interface Topic {
  skill: string
  /** Short topic name used in prompts, e.g. 'the Norman Conquest'. */
  title: string
  events?: Ev[]
  facts?: Fact[]
  terms?: Term[]
  people?: Person[]
  links?: Link[]
  /** Prompt for the links match, when 'cause and consequence' does not fit. */
  linkPrompt?: string
  sorts?: Sort[]
  seqs?: Seq[]
  reveals?: Rev[]
}

/** Compact fact constructor: F([lo, hi], question, answer, wrong, hint, explanation, source?) */
export const F = (lv: [number, number], q: string, a: string, w: W[], hint: string, ex: string, src?: Figure): Fact => ({ lv, q, a, w, hint, ex, src })

/** Compact event constructor. */
export const E = (y: number, e: string, opts: { note?: string; key?: boolean; approx?: boolean } = {}): Ev => ({ y, e, ...opts })
