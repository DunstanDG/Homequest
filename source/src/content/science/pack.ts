import type { SubjectPack } from '@/engine/registry'
import { biologyGenerators, biologySkills } from './biology'
import { chemistryGenerators, chemistrySkills } from './chemistry'
import { physicsGenerators, physicsSkills } from './physics'

export const SCIENCE_VERSION = '1.0.0'

/** KS3 Science (England): Biology, Chemistry and Physics, each its own part with its own skill strands. */
export const sciencePack: SubjectPack = {
  id: 'science',
  name: 'Science',
  tagline: 'Biology, chemistry and physics',
  color: '#9b5de5',
  version: SCIENCE_VERSION,
  skills: [...biologySkills, ...chemistrySkills, ...physicsSkills],
  generators: [...biologyGenerators, ...chemistryGenerators, ...physicsGenerators],
}
