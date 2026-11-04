import type { SubjectPack } from '@/engine/registry'
import { biomesGenerators } from './biomes'
import { environmentGenerators } from './environment'
import { humanGenerators } from './human'
import { landscapesGenerators } from './landscapes'
import { mapsGenerators } from './maps'
import { placeGenerators } from './place'
import { regionsGenerators } from './regions'
import { geographySkills } from './skills'
import { tectonicsGenerators } from './tectonics'
import { weatherGenerators } from './weather'

export const GEOGRAPHY_VERSION = '1.0.0'

export const geographyPack: SubjectPack = {
  id: 'geography',
  name: 'Geography',
  tagline: 'Places, people and the planet',
  color: '#4c956c',
  version: GEOGRAPHY_VERSION,
  skills: geographySkills,
  generators: [
    ...placeGenerators,
    ...mapsGenerators,
    ...weatherGenerators,
    ...biomesGenerators,
    ...landscapesGenerators,
    ...tectonicsGenerators,
    ...humanGenerators,
    ...regionsGenerators,
    ...environmentGenerators,
  ],
}
