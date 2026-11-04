/**
 * What a celebration looks like, as a pure decision from the person's calm settings and what just happened.
 * The visuals live in celebrate.tsx; keeping the rules here makes them easy to test.
 *
 * Rules (see docs/calm/B-rewards.md):
 *   - celebrate 'off': nothing at all.
 *   - lowStim or reduced motion: a static, calm toast. No motion, no sound, no vibration.
 *   - 'quiet': a small toast and a gentle haptic.
 *   - 'full': burst, coin chip, haptic, and a soft chime unless the device is on quiet timers.
 */
import type { Calm } from '@/app/calm'

export type Moment = 'normal' | 'first' | 'all'

export interface CelebrateInput {
  /** Coins this tick earns for the person holding the phone (0 when none, or they belong to someone else). */
  coins: number
  /** The coins wait for a parent to check. */
  needsCheck: boolean
  moment: Moment
}

export interface CelebrateEnv {
  reducedMotion: boolean
  quietTimers: boolean
}

export interface Decision {
  show: boolean
  message: string
  /** Burst of shapes; `big` for the first thing today and for everything done. */
  burst: boolean
  big: boolean
  chip?: string
  haptic: 'none' | 'gentle' | 'tick'
  chime: boolean
}

const NONE: Decision = { show: false, message: '', burst: false, big: false, haptic: 'none', chime: false }

export const MESSAGES = ['Nice one!', "That's off your plate", 'Another one done', 'Well done', 'One less thing']
export const FIRST_MESSAGES = ['First one of the day, lovely start', 'Off to a good start']
export const ALL_MESSAGES = ["Everything for today is done. You've earned a rest", 'All done for today. Well done']

export const messageFor = (moment: Moment, pick: number): string => {
  const list = moment === 'all' ? ALL_MESSAGES : moment === 'first' ? FIRST_MESSAGES : MESSAGES
  return list[Math.abs(Math.floor(pick)) % list.length] as string
}

export function chipFor(i: Pick<CelebrateInput, 'coins' | 'needsCheck'>): string | undefined {
  if (i.coins <= 0) return undefined
  return i.needsCheck ? `${i.coins} 🪙 once checked` : `+${i.coins} 🪙`
}

export function decideCelebration(calm: Pick<Calm, 'celebrate' | 'lowStim'>, env: CelebrateEnv, input: CelebrateInput, pick = 0): Decision {
  if (calm.celebrate === 'off') return NONE
  const message = messageFor(input.moment, pick)
  const chip = chipFor(input)
  if (calm.lowStim || env.reducedMotion) return { ...NONE, show: true, message, chip, burst: false, big: false }
  if (calm.celebrate === 'quiet') return { ...NONE, show: true, message, chip, haptic: 'gentle' }
  return {
    show: true,
    message,
    chip,
    burst: true,
    big: input.moment !== 'normal',
    haptic: input.moment === 'normal' ? 'tick' : 'gentle',
    chime: !env.quietTimers,
  }
}
