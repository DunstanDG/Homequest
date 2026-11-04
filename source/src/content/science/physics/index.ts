import type { ItemGenerator } from '@/engine/registry'
import { electricityGenerators } from './electricity'
import { energyGenerators } from './energy'
import { forcesGenerators } from './forces'
import { lightGenerators } from './light'
import { matterGenerators } from './matter'
import { motionGenerators } from './motion'
import { physicsSkills } from './skills'
import { spaceGenerators } from './space'
import { wavesGenerators } from './waves'
import { wsGenerators } from './ws'

/** The Physics part of the KS3 Science pack. The coordinator combines it with Biology and Chemistry. */
export { physicsSkills }

export const physicsGenerators: ItemGenerator[] = [
  ...wsGenerators,
  ...energyGenerators,
  ...motionGenerators,
  ...forcesGenerators,
  ...wavesGenerators,
  ...lightGenerators,
  ...electricityGenerators,
  ...matterGenerators,
  ...spaceGenerators,
]
