import type { ItemGenerator } from '@/engine/registry'
import { adjectiveGenerators } from './adjectives'
import { nounGenerators } from './nouns'
import { prepositionGenerators } from './prepositions'
import { pronounGenerators } from './pronouns'
import { tenseGenerators } from './tenses'
import { verbGenerators } from './verbs'
import { wordOrderGenerators } from './wordorder'

export { grammarSkills } from './skills'

/** All generators for the German grammar part (ids start with german.gram.). */
export const grammarGenerators: ItemGenerator[] = [
  ...nounGenerators,
  ...prepositionGenerators,
  ...pronounGenerators,
  ...adjectiveGenerators,
  ...verbGenerators,
  ...tenseGenerators,
  ...wordOrderGenerators,
]
