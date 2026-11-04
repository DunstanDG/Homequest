import type { SubjectPack } from '@/engine/registry'
import { mathsSkills } from './skills'
import { foundationGenerators } from './gen.foundation'
import { numberGenerators } from './gen.number'
import { algebraGenerators } from './gen.algebra'
import { ratioGenerators } from './gen.ratio'
import { geometryGenerators } from './gen.geometry'
import { measuresGenerators } from './gen.measures'
import { transformGenerators } from './gen.transform'
import { probabilityGenerators } from './gen.probability'
import { statisticsGenerators } from './gen.statistics'

/** Bump on any content change so feedback can be tied to the version she saw. */
export const MATHS_VERSION = '0.1.0'

export const mathsPack: SubjectPack = {
  id: 'maths',
  name: 'Maths',
  tagline: 'Year 8 and the building blocks underneath it',
  color: '#4cc9f0',
  version: MATHS_VERSION,
  skills: mathsSkills,
  generators: [
    ...foundationGenerators,
    ...numberGenerators,
    ...algebraGenerators,
    ...ratioGenerators,
    ...geometryGenerators,
    ...measuresGenerators,
    ...transformGenerators,
    ...probabilityGenerators,
    ...statisticsGenerators,
  ],
}
