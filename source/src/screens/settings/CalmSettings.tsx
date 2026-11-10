/**
 * Comfort and accessibility (/settings/calm): text size, a readable font, contrast, low stimulation, countdowns,
 * celebrations and how much Today shows. Device-local (this phone's person), stored through useCalm().set(), and
 * applied app-wide straight away by the calm shell (ui/calmShell.tsx). Each setting shows a live preview.
 */
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motionOk, useCalm, type CalmFont, type CalmPrefs, type CelebrateMode, type FocusMode, type TextScale } from '@/app/calm'
import { useNow } from '@/app/context'
import { DrainBar, openCalmSheet, untilLabel } from '@/ui/calmShell'
import { Icon } from '@/ui/icons'

interface Opt<T extends string> {
  value: T
  label: string
}

/** A row of choices: real radio buttons (so arrow keys and screen readers work), drawn as a segmented control. */
export function Choice<T extends string>({ name, legend, hint, value, options, onChange, children }: { name: string; legend: string; hint?: string; value: T; options: Opt<T>[]; onChange(v: T): void; children?: ReactNode }) {
  return (
    <fieldset className="card calm-set">
      <legend className="calm-set-legend">{legend}</legend>
      {hint && <p className="muted calm-set-hint">{hint}</p>}
      <div className="calm-seg" role="presentation">
        {options.map((o) => (
          <label key={o.value} className={`calm-seg-opt${o.value === value ? ' on' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {children && (
        <div className="calm-preview" aria-live="polite">
          {children}
        </div>
      )}
    </fieldset>
  )
}

export function Toggle({ legend, hint, checked, onChange, children }: { legend: string; hint: string; checked: boolean; onChange(v: boolean): void; children?: ReactNode }) {
  return (
    <div className="card calm-set">
      <label className="switch-row calm-switch">
        <span className="sr-main">
          <strong>{legend}</strong>
          <small className="muted">{hint}</small>
        </span>
        <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </label>
      {children && (
        <div className="calm-preview" aria-live="polite">
          {children}
        </div>
      )}
    </div>
  )
}

const TEXT: Opt<TextScale>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'larger', label: 'Larger' },
]
const FONT: Opt<CalmFont>[] = [
  { value: 'default', label: 'Standard' },
  { value: 'readable', label: 'Easy to read' },
]
const CONTRAST: Opt<'normal' | 'high'>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]
const CELEBRATE: Opt<CelebrateMode>[] = [
  { value: 'full', label: 'Full' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'off', label: 'Off' },
]
const FOCUS: Opt<FocusMode>[] = [
  { value: 'one', label: 'One thing' },
  { value: 'three', label: 'Three' },
  { value: 'all', label: 'Everything' },
]

const SAMPLE_TASKS = ['🦷 Brush teeth', '🎒 Pack your bag', '📚 Reading, 10 minutes', '🐶 Feed the dog', '🧺 Laundry in the basket']

export function CalmSettings() {
  const nav = useNavigate()
  const calm = useCalm()
  const now = useNow(1000)
  const set = (patch: Partial<CalmPrefs>) => calm.set(patch)
  const sampleEnd = Math.ceil(now / 60_000) * 60_000 + 12 * 60_000
  const sampleLeft = 12 * 60 - (Math.floor(now / 1000) % 60)
  const shown = calm.focus === 'one' ? 1 : calm.focus === 'three' ? 3 : SAMPLE_TASKS.length

  return (
    <div className="screen calm-settings calm-ui">
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/more'))} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">This phone</p>
          <h1>Comfort and accessibility</h1>
        </div>
      </header>
      <p className="muted calm-settings-lead">Make HomeQuest easier on the eyes and the mind. These only change this phone, and you can change them any time.</p>

      <Choice name="calm-text" legend="Text size" hint="Makes everything bigger, buttons too." value={calm.textScale} options={TEXT} onChange={(v) => set({ textScale: v })}>
        <p>This is how big words will look. {calm.textScale === 'normal' ? '' : 'Easier to read at a glance.'}</p>
      </Choice>

      <Choice name="calm-font" legend="Font" hint="A font designed to be clear for people with dyslexia or low vision, with a little more space between letters and lines." value={calm.font} options={FONT} onChange={(v) => set({ font: v })}>
        <p>Pack your bag, then reading for ten minutes. b d p q, I l 1, O 0.</p>
      </Choice>

      <Choice name="calm-contrast" legend="Contrast" hint="Stronger text and borders." value={calm.contrast} options={CONTRAST} onChange={(v) => set({ contrast: v })}>
        <p>
          Main text, <span className="muted">quieter text</span> and a <span className="calm-preview-chip">border</span>.
        </p>
      </Choice>

      <Toggle legend="Low stimulation" hint="Softer colours, no moving or flashing things, quieter emoji." checked={calm.lowStim} onChange={(v) => set({ lowStim: v })}>
        <p>
          <span className="calm-preview-emoji" aria-hidden="true">
            🎉
          </span>{' '}
          {calm.lowStim ? 'Calm colours and still pictures.' : 'Bright colours and a little movement.'} <span className="calm-preview-swatch" aria-hidden="true" />
        </p>
      </Toggle>

      <Toggle legend="Hide ticking countdowns" hint={'Timers say "until 17:20" with a slowly draining bar, instead of counting down the seconds.'} checked={calm.hideCountdowns} onChange={(v) => set({ hideCountdowns: v })}>
        {calm.hideCountdowns ? (
          <div className="calm-preview-timer">
            <span>Reading {untilLabel(sampleEnd)}</span>
            <DrainBar value={sampleLeft / (12 * 60)} />
          </div>
        ) : (
          <div className="calm-preview-timer">
            <span>
              Reading · {String(Math.floor(sampleLeft / 60)).padStart(2, '0')}:{String(sampleLeft % 60).padStart(2, '0')} left
            </span>
          </div>
        )}
      </Toggle>

      <Choice
        name="calm-celebrate"
        legend="Celebrations"
        hint={`When you tick something off.${calm.lowStim || !motionOk(calm) ? ' Always quiet while low stimulation or reduced motion is on.' : ''}`}
        value={calm.celebrate}
        options={CELEBRATE}
        onChange={(v) => set({ celebrate: v })}
      >
        <p>{calm.celebrate === 'full' ? '✨ Well done! A cheerful burst and a sound.' : calm.celebrate === 'quiet' ? '✓ A soft tick, nothing more.' : 'Just ticked off, no fuss.'}</p>
      </Choice>

      <Choice name="calm-focus" legend="How much Today shows" hint="Fewer things at once can feel lighter. The rest is still there when you want it." value={calm.focus} options={FOCUS} onChange={(v) => set({ focus: v })}>
        <ul className="calm-preview-list">
          {SAMPLE_TASKS.slice(0, shown).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {shown < SAMPLE_TASKS.length && <p className="muted small">and {SAMPLE_TASKS.length - shown} more, tucked away</p>}
      </Choice>

      <div className="card calm-set">
        <h2 className="calm-set-legend">Feeling overwhelmed?</h2>
        <p className="muted calm-set-hint">The 🌿 Calm button is always at the bottom of the screen: a breather, a quieter day, or letting someone know.</p>
        <button type="button" className="btn block" onClick={openCalmSheet}>
          🌿 Open Calm
        </button>
      </div>
    </div>
  )
}
