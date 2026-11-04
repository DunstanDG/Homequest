import type { ItemGenerator } from '@/engine/registry'
import { bodyGenerators } from './body'
import { cellsGenerators } from './cells'
import { ecoGenerators } from './eco'
import { gasGenerators } from './gas'
import { geneticsGenerators } from './genetics'
import { healthGenerators } from './health'
import { nutritionGenerators } from './nutrition'
import { plantsGenerators } from './plants'
import { reproGenerators } from './repro'
import { biologySkills } from './skills'
import { wsGenerators } from './ws'

/** The Biology part of the KS3 Science pack. The coordinator combines it with Chemistry and Physics. */
export { biologySkills }

export const biologyGenerators: ItemGenerator[] = [
  ...wsGenerators,
  ...cellsGenerators,
  ...bodyGenerators,
  ...nutritionGenerators,
  ...gasGenerators,
  ...plantsGenerators,
  ...reproGenerators,
  ...healthGenerators,
  ...ecoGenerators,
  ...geneticsGenerators,
]
