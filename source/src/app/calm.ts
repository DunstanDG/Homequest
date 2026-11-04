/**
 * Calm settings: the shared contract for "reduce stress, support neurodiverse people" (0.18). Device-local, like the rest
 * of Settings (a phone belongs to one person), stored under `settings.calm`.
 *
 * Who uses what (see docs/calm/CONTRACT.md):
 *   - textScale / font / contrast / lowStim / hideCountdowns: applied app-wide by the accessibility work.
 *   - celebrate: how ticking something off is celebrated (celebration work). Always quieter when lowStim or reduced motion.
 *   - focus: how much of the to-do list Today shows (calm Today work).
 *   - pauseUntil: the "I'm overwhelmed" button. While paused, Today shows one thing, questions and reminders wait.
 */
import { useApp } from './context'

export type TextScale = 'normal' | 'large' | 'larger'
export type CalmFont = 'default' | 'readable'
export type FocusMode = 'one' | 'three' | 'all'
export type CelebrateMode = 'full' | 'quiet' | 'off'

export interface CalmPrefs {
  textScale?: TextScale
  /** 'readable': a dyslexia-friendly font with wider letter spacing. */
  font?: CalmFont
  contrast?: 'normal' | 'high'
  /** Low stimulation: softer colours, fewer emoji, no motion or sound in celebrations. */
  lowStim?: boolean
  /** Show "until 17:00" instead of a ticking countdown. */
  hideCountdowns?: boolean
  celebrate?: CelebrateMode
  /** How much of the to-do list Today shows: just the next thing, three, or everything. */
  focus?: FocusMode
  /** "I'm overwhelmed": calm mode until this time (ms since epoch). */
  pauseUntil?: number
}

export interface Calm extends Required<Omit<CalmPrefs, 'pauseUntil' | 'focus'>> {
  focus: FocusMode
  pauseUntil?: number
}

/** Defaults: calm unless asked otherwise. Children see one thing at a time, adults three. */
export function calmOf(prefs: CalmPrefs | undefined, role: 'parent' | 'child' = 'parent'): Calm {
  const p = prefs ?? {}
  return {
    textScale: p.textScale ?? 'normal',
    font: p.font ?? 'default',
    contrast: p.contrast ?? 'normal',
    lowStim: !!p.lowStim,
    hideCountdowns: !!p.hideCountdowns,
    celebrate: p.celebrate ?? 'full',
    focus: p.focus ?? (role === 'child' ? 'one' : 'three'),
    pauseUntil: p.pauseUntil,
  }
}

export const isPaused = (c: Pick<CalmPrefs, 'pauseUntil'>, now = Date.now()): boolean => !!c.pauseUntil && c.pauseUntil > now

/** The end of today (local), the default length of an "I'm overwhelmed" pause. */
export function endOfToday(now = Date.now()): number {
  const d = new Date(now)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** The user's OS asks for less motion. */
export const prefersReducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Is motion (animations, confetti) OK right now? */
export const motionOk = (c: Pick<Calm, 'lowStim'>): boolean => !c.lowStim && !prefersReducedMotion()

/** Hook: this phone's calm settings, for the person holding it. */
export function useCalm(): Calm & { set(patch: Partial<CalmPrefs>): void; paused: boolean; pause(until?: number): void; resume(): void } {
  const { settings, updateSettings, repo } = useApp()
  const me = repo.me()
  const role = me && repo.family().members[me]?.role === 'child' ? 'child' : 'parent'
  const c = calmOf(settings.calm, role)
  const set = (patch: Partial<CalmPrefs>) => updateSettings({ calm: { ...settings.calm, ...patch } })
  return {
    ...c,
    set,
    paused: isPaused(c),
    pause: (until = endOfToday()) => set({ pauseUntil: until }),
    resume: () => set({ pauseUntil: undefined }),
  }
}
