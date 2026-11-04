import type { ItemGenerator } from '@/engine/registry'
import { acidsGenerators } from './acids'
import { atomsGenerators } from './atoms'
import { earthGenerators } from './earth'
import { materialsGenerators } from './materials'
import { particlesGenerators } from './particles'
import { periodicGenerators } from './periodic'
import { reactionsGenerators } from './reactions'
import { separationGenerators } from './separation'
import { chemistrySkills } from './skills'
import { wsGenerators } from './ws'

/** The Chemistry part of the KS3 Science pack. The coordinator combines it with Biology and Physics. */
export { chemistrySkills }

export const chemistryGenerators: ItemGenerator[] = [
  ...wsGenerators,
  ...particlesGenerators,
  ...atomsGenerators,
  ...separationGenerators,
  ...reactionsGenerators,
  ...acidsGenerators,
  ...periodicGenerators,
  ...materialsGenerators,
  ...earthGenerators,
]
