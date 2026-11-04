import type { ItemGenerator } from '@/engine/registry'
import { cultureGenerators } from './culture'
import { foodShoppingGenerators } from './food-shopping'
import { freeTimeGenerators } from './freetime'
import { homeTownGenerators } from './home-town'
import { numbersTimeGenerators } from './numbers-time'
import { peopleGenerators } from './people'
import { readingGenerators } from './reading'
import { schoolWorkGenerators } from './school-work'
import { soundsGenerators } from './sounds'
import { translationGenerators } from './translation'
import { travelGenerators } from './travel'

export { topicSkills } from './skills'

/** All generators for the German Topics part (ids start with german.top.). */
export const topicGenerators: ItemGenerator[] = [
  ...soundsGenerators,
  ...numbersTimeGenerators,
  ...peopleGenerators,
  ...freeTimeGenerators,
  ...schoolWorkGenerators,
  ...homeTownGenerators,
  ...foodShoppingGenerators,
  ...travelGenerators,
  ...readingGenerators,
  ...translationGenerators,
  ...cultureGenerators,
]
