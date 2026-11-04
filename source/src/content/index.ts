import { Registry } from '@/engine/registry'
import { mathsPack } from './maths/pack'
import { englishPack } from './english/pack'
import { historyPack } from './history/pack'
import { geographyPack } from './geography/pack'
import { computingPack } from './computing/pack'
import { germanPack } from './german/pack'
import { sciencePack } from './science/pack'

/** Every subject pack in the app. Add new subjects here (see docs/ADDING_A_SUBJECT.md). */
export const registry = new Registry([mathsPack, englishPack, sciencePack, historyPack, geographyPack, computingPack, germanPack])
