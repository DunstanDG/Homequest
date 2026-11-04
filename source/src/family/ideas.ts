import type { FamilyState, Idea, MemberId } from './types'

export const VOTE_WEIGHT = { yes: 2, maybe: 1, no: -2 } as const

export interface IdeaTally {
  idea: Idea
  yes: MemberId[]
  maybe: MemberId[]
  no: MemberId[]
  /** Family members who can vote and have not. */
  waiting: MemberId[]
  score: number
}

/** People who get a vote: parents and children who are active. */
export const voters = (f: FamilyState): MemberId[] =>
  Object.values(f.members)
    .filter((m) => m.active && (m.role === 'parent' || m.role === 'child'))
    .map((m) => m.id)

/** Open ideas ranked by how much the family likes them: yes = 2, maybe = 1, no = -2. */
export function rankIdeas(f: FamilyState, statuses: Idea['status'][] = ['open']): IdeaTally[] {
  const all = voters(f)
  return Object.values(f.ideas)
    .filter((i) => statuses.includes(i.status))
    .map((idea) => {
      const yes: MemberId[] = []
      const maybe: MemberId[] = []
      const no: MemberId[] = []
      for (const m of all) {
        const v = f.votes[`${idea.id}|${m}`]
        if (v === 'yes') yes.push(m)
        else if (v === 'maybe') maybe.push(m)
        else if (v === 'no') no.push(m)
      }
      const waiting = all.filter((m) => !yes.includes(m) && !maybe.includes(m) && !no.includes(m))
      const score = yes.length * VOTE_WEIGHT.yes + maybe.length * VOTE_WEIGHT.maybe + no.length * VOTE_WEIGHT.no
      return { idea, yes, maybe, no, waiting, score }
    })
    .sort((a, b) => b.score - a.score || b.yes.length - a.yes.length || a.no.length - b.no.length || a.idea.createdTs - b.idea.createdTs)
}

export const IDEA_SEEDS: { title: string; kind: Idea['kind']; emoji: string }[] = [
  { title: 'Movie night', kind: 'movie', emoji: '🍿' },
  { title: 'Pizza night', kind: 'dinner', emoji: '🍕' },
  { title: 'Board games', kind: 'game', emoji: '🎲' },
  { title: 'Family walk with the dog', kind: 'outing', emoji: '🐕' },
  { title: 'Picnic in the park', kind: 'outing', emoji: '🧺' },
  { title: 'Bike ride', kind: 'outing', emoji: '🚲' },
  { title: 'Beach day', kind: 'outing', emoji: '🏖️' },
  { title: 'Bowling', kind: 'outing', emoji: '🎳' },
  { title: 'Bake something', kind: 'game', emoji: '🧁' },
  { title: 'Cinema', kind: 'movie', emoji: '🎬' },
  { title: 'Swimming', kind: 'outing', emoji: '🏊' },
  { title: 'Takeaway night', kind: 'dinner', emoji: '🥡' },
  { title: 'Roast dinner', kind: 'dinner', emoji: '🍗' },
  { title: 'Ice cream trip', kind: 'treat', emoji: '🍦' },
]
