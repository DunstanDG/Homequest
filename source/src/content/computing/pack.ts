import type { SubjectPack } from '@/engine/registry'
import { computingSkills } from './skills'
import { ctGenerators } from './gen.ct'
import { algGenerators } from './gen.alg'
import { pythonGenerators } from './gen.python'
import { dataGenerators } from './gen.data'
import { logicGenerators } from './gen.logic'
import { systemsGenerators } from './gen.systems'
import { netGenerators } from './gen.net'
import { cyberGenerators } from './gen.cyber'

/** Bump on any content change so feedback can be tied to the version she saw. */
export const COMPUTING_VERSION = '1.0.0'

export const computingPack: SubjectPack = {
  id: 'computing',
  name: 'Computer Studies',
  tagline: 'How computers work, and how to make them do things',
  color: '#00b4d8',
  version: COMPUTING_VERSION,
  skills: computingSkills,
  generators: [...ctGenerators, ...algGenerators, ...pythonGenerators, ...dataGenerators, ...logicGenerators, ...systemsGenerators, ...netGenerators, ...cyberGenerators],
}
