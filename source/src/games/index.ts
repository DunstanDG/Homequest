import { MeteorDefence } from './MeteorDefence'
import type { GameDef } from './types'

export const skillTower: GameDef = {
  id: 'tower',
  name: 'Skill Tower',
  tagline: 'Climb 10 floors at your level',
  blurb: [
    'Mixes new topics, revision and quick building-block checks.',
    'Got one wrong? You get a hint and a second go for partial credit.',
    'Streaks of right answers build a combo bonus.',
  ],
  icon: 'tower',
  color: '#4cc9f0',
  mode: 'practice',
  length: 10,
  allowRetry: true,
  shell: 'tower',
}

export const sprint: GameDef = {
  id: 'sprint',
  name: 'Sprint',
  tagline: '90 seconds. How many can you nail?',
  blurb: [
    'Fast questions on things you already know well.',
    'Right answers build a combo. Wrong ones just reset it.',
    'Prefer no clock? Switch on Relaxed mode.',
  ],
  icon: 'bolt',
  color: '#ffc857',
  mode: 'sprint',
  length: 40,
  allowRetry: false,
  shell: 'sprint',
  timeLimitSec: 90,
}

export const gapFinder: GameDef = {
  id: 'gaps',
  name: 'Gap Finder',
  tagline: 'Find what needs another look',
  blurb: [
    'Checks a spread of Year 8 topics. If one is shaky, it steps back to the building blocks underneath.',
    'Hints are off so it can see what you really know.',
    'No pressure - the point is to find gaps, not to score.',
  ],
  icon: 'compass',
  color: '#b892ff',
  mode: 'diagnostic',
  length: 16,
  allowRetry: false,
  shell: 'scan',
}

export const equationDefence: GameDef = {
  id: 'meteors',
  name: 'Equation Defence',
  tagline: 'Meteors fall, carrying times-table facts. Fire before they land.',
  blurb: [
    'A few facts fall at once - type the answer and hit fire to zap the one closest to your base.',
    'A miss (or a meteor that lands) costs a life, but there is always another one coming.',
    'Built for speed on facts you already half-know, not for learning something new.',
  ],
  icon: 'meteor',
  color: '#ff6b6b',
  // Any non-empty focus (its own defaultFocus below, since none is set in the URL) makes the planner use
  // 'focus' mode regardless of what's set here - see src/screens/Play.tsx. Named for clarity.
  mode: 'focus',
  length: 60,
  allowRetry: false,
  shell: 'meteor',
  timeLimitSec: 90,
  defaultFocus: ['maths.f.times-tables'],
  Component: MeteorDefence,
}

/** Register new games here; Home and the Play screen pick them up automatically. */
export const GAMES: GameDef[] = [skillTower, sprint, gapFinder, equationDefence]

export const getGame = (id: string | undefined): GameDef | undefined => GAMES.find((g) => g.id === id)

export type { GameDef, GameLaunch, GameProps } from './types'
