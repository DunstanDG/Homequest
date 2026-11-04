import type { AttemptEvent, LearnerState, SessionEvent } from './types'

export interface BadgeDef {
  id: string
  name: string
  description: string
  /** Return true (or a detail string) when newly earned. Called after each attempt/session. */
  check(state: LearnerState, ctx: { attempt?: AttemptEvent; session?: SessionEvent; combo?: number }): boolean | string
}

/** Declarative badge list. Add rows here; the engine handles awarding and de-duplication. */
export const BADGES: BadgeDef[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Answer your first question correctly.', check: (s) => s.totals.correct >= 1 },
  { id: 'century', name: 'Century', description: '100 correct answers.', check: (s) => s.totals.correct >= 100 },
  { id: 'five-hundred', name: 'Five Hundred', description: '500 correct answers.', check: (s) => s.totals.correct >= 500 },
  { id: 'streak-3', name: 'On a Roll', description: 'A 3-day streak.', check: (s) => s.streak.current >= 3 },
  { id: 'streak-7', name: 'Week Warrior', description: 'A 7-day streak.', check: (s) => s.streak.current >= 7 },
  { id: 'streak-14', name: 'Unstoppable', description: 'A 14-day streak.', check: (s) => s.streak.current >= 14 },
  {
    id: 'combo-8',
    name: 'Hot Streak',
    description: '8 correct in a row in one session.',
    check: (_s, c) => (c.combo ?? 0) >= 8,
  },
  {
    id: 'bounce-back',
    name: 'Bounce Back',
    description: 'Get a topic right after a tricky patch.',
    check: (_s, c) => !!c.attempt?.award.parts.some((p) => p.code === 'comeback'),
  },
  {
    id: 'personal-best',
    name: 'Personal Best',
    description: 'Beat your own previous best on a skill.',
    check: (_s, c) => !!c.attempt?.award.parts.some((p) => p.code === 'pb'),
  },
  {
    id: 'gap-buster',
    name: 'Gap Buster',
    description: 'Turn a weak skill into a strong one.',
    check: (s, c) => {
      const id = c.attempt?.skillId
      const st = id ? s.skills[id] : undefined
      return !!st && st.n >= 6 && st.theta - st.minTheta >= 1.0 ? st.skillId : false
    },
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Finish a Gap Finder run.',
    check: (_s, c) => c.session?.mode === 'diagnostic' && c.session.completed,
  },
  {
    id: 'revision-hero',
    name: 'Revision Hero',
    description: 'Remember 10 topics after a break.',
    check: (s) => Object.values(s.skills).filter((k) => k.days.length >= 2 && k.n >= 2 && k.correct >= 2).length >= 10,
  },
  { id: 'voice', name: 'Bug Hunter', description: 'Send 5 pieces of feedback.', check: (s) => s.totals.feedback >= 5 },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Earn XP in 3 different subjects.',
    check: (s) => Object.keys(s.xpBySubject).length >= 3,
  },
  { id: 'level-5', name: 'Level 5', description: 'Reach level 5.', check: (s) => s.xp >= 1000 },
  { id: 'level-10', name: 'Level 10', description: 'Reach level 10.', check: (s) => s.xp >= 4500 },
]

export function newBadges(state: LearnerState, ctx: Parameters<BadgeDef['check']>[1]): { id: string; detail?: string }[] {
  const out: { id: string; detail?: string }[] = []
  for (const b of BADGES) {
    if (state.badges[b.id]) continue
    const r = b.check(state, ctx)
    if (r) out.push({ id: b.id, detail: typeof r === 'string' ? r : undefined })
  }
  return out
}
