import type { ItemGenerator, SubjectPack } from '@/engine/registry'
import { chronoGenerators } from './gen.chrono'
import { topicGenerators } from './gen.topic'
import { C20 } from './data.c20'
import { EARLY_MODERN } from './data.early'
import { INDUSTRY } from './data.industry'
import { MEDIEVAL } from './data.medieval'
import { FOUNDATIONS, SKILL_TOPICS } from './data.skills'
import { historySkills } from './skills'
import type { Topic } from './types'

export const HISTORY_VERSION = '1.0.0'

/** Every topic table in the pack. Each `skill` here is a short id (without the 'history.' prefix). */
export const HISTORY_TOPICS: Topic[] = [...FOUNDATIONS, ...SKILL_TOPICS, ...MEDIEVAL, ...EARLY_MODERN, ...INDUSTRY, ...C20]

const strandOf = (short: string) => historySkills.find((s) => s.id === `history.${short}`)?.strand

/** Topic generators borrow distractors (definitions, people) from other topics in the same strand. */
const topicGens: ItemGenerator[] = HISTORY_TOPICS.flatMap((t) =>
  topicGenerators(
    t,
    HISTORY_TOPICS.filter((p) => p !== t && strandOf(p.skill) === strandOf(t.skill)),
  ),
)

export const historyPack: SubjectPack = {
  id: 'history',
  name: 'History',
  tagline: 'Past, present, and why it matters',
  color: '#f4a261',
  version: HISTORY_VERSION,
  skills: historySkills,
  generators: [...topicGens, ...chronoGenerators(HISTORY_TOPICS)],
}
