import type { SubjectPack } from '@/engine/registry'
import { englishSkills } from './skills'
import { grammarGenerators } from './grammar'
import { punctuationGenerators } from './punctuation'
import { vocabularyGenerators } from './vocabulary'
import { readingGenerators } from './reading'
import { deviceGenerators } from './devices'
import { poetryGenerators } from './poetry'
import { dramaGenerators } from './shakespeare'
import { fictionGenerators } from './fiction'
import { writingGenerators } from './writing'

/** Bump on any content change so feedback can be tied to the version she saw. */
export const ENGLISH_VERSION = '1.0.0'

export const englishPack: SubjectPack = {
  id: 'english',
  name: 'English',
  tagline: 'Reading, writing and how language works',
  color: '#e76f51',
  version: ENGLISH_VERSION,
  skills: englishSkills,
  generators: [
    ...grammarGenerators,
    ...punctuationGenerators,
    ...vocabularyGenerators,
    ...readingGenerators,
    ...deviceGenerators,
    ...poetryGenerators,
    ...dramaGenerators,
    ...fictionGenerators,
    ...writingGenerators,
  ],
}
