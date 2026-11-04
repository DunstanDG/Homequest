/**
 * The weekly plan (/week, 0.18): one short, fixed script in place of the weekly summit and the round table screen.
 * Always the same steps in the same order, with "Step 2 of 5" so nobody wonders how long it goes on:
 *   1. Things people raised (and the round table's agenda, when the home server has one)
 *   2. The week at a glance
 *   3. Loose ends, kindly
 *   4. Meals, and nights when there's a baby
 *   5. This week's 5: up to five things that matter, and everything else can wait
 * Children get the first two. Each step reads from the screens that own the data and links there; the only things
 * written here are the round table notes, the summit's "done" marker and this week's 5 (family/weekPlan.ts).
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { addDays, dayName, startOfWeek, ymdOf } from '@/family/dates'
import { currentRoundTable } from '@/family/travel/roundTable'
import { serverOn } from '@/family/travel/travel'
import { focusCandidates, focusItemDone, focusKey, planWeekOf, saveWeekFocus, shownWeekFocus, WEEK_FOCUS_MAX, type FocusCandidate } from '@/family/weekPlan'
import type { WeekFocusItem } from '@/family/types'
import { Icon } from '@/ui/icons'
import { Raise, RoundTableSettings, RoundTableStatus, useRoundTableWeek, Week } from './RoundTable'
import { ComingUpStep, HomeworkStep, IdeasToAgree, LooseEndsStep, MealsAndNightsStep } from './Summit'
import '../../calm-nav.css'

type StepId = 'raised' | 'week' | 'loose' | 'meals' | 'five'

const STEP_TITLES: Record<StepId, string> = {
  raised: 'Things people raised',
  week: 'The week at a glance',
  loose: 'Loose ends',
  meals: 'Meals',
  five: 'This week’s 5',
}

const ALL_STEPS: StepId[] = ['raised', 'week', 'loose', 'meals', 'five']
const CHILD_STEPS: StepId[] = ['raised', 'week']

const CALM_LINE = 'These are this week. Everything else can wait.'

/** The saved five, as a calm card: the same on /week (and ready for Today to show). */
export function WeekFocusCard({ items, which, onChange }: { items: WeekFocusItem[]; which: 'this' | 'next'; onChange?: () => void }) {
  const f = useFamily()
  return (
    <section className="card wk-five" aria-labelledby="wk-five-title">
      <div className="row-between">
        <h2 className="section" id="wk-five-title">
          {which === 'next' ? 'Next week’s 5' : 'This week’s 5'}
        </h2>
        {onChange && (
          <button type="button" className="btn small ghost" onClick={onChange}>
            Change
          </button>
        )}
      </div>
      <ol className="wk-five-list">
        {items.map((i) => {
          const done = focusItemDone(f, i)
          return (
            <li key={focusKey(i)} className={done ? 'done' : undefined}>
              <span className="wk-five-mark" aria-hidden="true">
                {done ? '✓' : ''}
              </span>
              <span className="grow">{i.title}</span>
              {done && <span className="lq-sr"> (done)</span>}
            </li>
          )
        })}
      </ol>
      <p className="wk-calm">{CALM_LINE}</p>
    </section>
  )
}

function StepIndicator({ steps, at, onJump }: { steps: StepId[]; at: number; onJump: (i: number) => void }) {
  return (
    <nav className="wk-steps" aria-label="Steps">
      <p className="wk-step-text" aria-live="polite">
        Step {at + 1} of {steps.length}
      </p>
      <ol className="wk-step-bar">
        {steps.map((s, i) => (
          <li key={s}>
            <button type="button" className={`wk-seg${i === at ? ' on' : i < at ? ' past' : ''}`} aria-label={`Step ${i + 1}: ${STEP_TITLES[s]}`} aria-current={i === at ? 'step' : undefined} onClick={() => onJump(i)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}

function FivePicker({ weekOf, today, picked, setPicked }: { weekOf: string; today: string; picked: WeekFocusItem[]; setPicked: (p: WeekFocusItem[]) => void }) {
  const f = useFamily()
  const c = useMemo(() => focusCandidates(f, weekOf, today), [f, weekOf, today])
  const [more, setMore] = useState<Record<string, boolean>>({})
  const [text, setText] = useState('')
  const keys = new Set(picked.map(focusKey))
  const full = picked.length >= WEEK_FOCUS_MAX
  const toggle = (it: FocusCandidate) => {
    if (keys.has(it.key)) setPicked(picked.filter((p) => focusKey(p) !== it.key))
    else if (!full) setPicked([...picked, { kind: it.kind, ref: it.ref, title: it.title }])
  }
  const addNote = () => {
    const title = text.trim()
    if (!title || full) return
    const item: WeekFocusItem = { kind: 'note', ref: '', title }
    if (!keys.has(focusKey(item))) setPicked([...picked, item])
    setText('')
  }
  const section = (id: string, title: string, list: FocusCandidate[]) => {
    if (!list.length) return null
    const shown = more[id] ? list : list.slice(0, 6)
    return (
      <div className="wk-pick-group">
        <h3>{title}</h3>
        <ul className="wk-pick-list">
          {shown.map((it) => {
            const on = keys.has(it.key)
            return (
              <li key={it.key}>
                <button type="button" className={`wk-pick${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && full} onClick={() => toggle(it)}>
                  <span className="wk-tick" aria-hidden="true">
                    {on ? <Icon name="check" size={16} /> : null}
                  </span>
                  <span className="grow">
                    {it.title}
                    <small className="muted"> · {it.sub}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {list.length > 6 && (
          <button type="button" className="btn small ghost" onClick={() => setMore({ ...more, [id]: !more[id] })}>
            {more[id] ? 'Show fewer' : `Show all ${list.length}`}
          </button>
        )}
      </div>
    )
  }
  return (
    <>
      <p className="note">Pick up to five things that matter this week. Only five, so the rest can rest.</p>
      <div className="card wk-card wk-picked">
        <p className="wk-count">
          <strong>
            {picked.length} of {WEEK_FOCUS_MAX}
          </strong>{' '}
          picked{full ? ': that’s five. Take one off to swap.' : ''}
        </p>
        {picked.length > 0 && (
          <ol className="wk-five-list">
            {picked.map((p) => (
              <li key={focusKey(p)}>
                <span className="grow">{p.title}</span>
                <button type="button" className="icon-btn small" aria-label={`Take off ${p.title}`} onClick={() => setPicked(picked.filter((x) => focusKey(x) !== focusKey(p)))}>
                  <Icon name="x" size={16} />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="row wk-add">
          <input className="tbox grow" maxLength={120} placeholder="Something else? e.g. Call Grandma" value={text} disabled={full} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} aria-label="Something else for this week" />
          <button type="button" className="btn" disabled={!text.trim() || full} onClick={addNote}>
            Add
          </button>
        </div>
      </div>
      {section('events', 'On the calendar', c.events)}
      {section('tasks', 'To do', c.tasks)}
      {section('dump', 'From the brain dump', c.dump)}
      {!c.events.length && !c.tasks.length && !c.dump.length && <p className="empty-note">Nothing to pick from yet. Type something above, or leave it empty: that’s fine too.</p>}
    </>
  )
}

export function WeekPlan() {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const nav = useNavigate()
  const now = useNow(60_000)
  const today = ymdOf(now)
  const parent = me.role === 'parent'
  const weekOf = planWeekOf(today)
  const weekEnd = addDays(weekOf, 6)
  const rt = currentRoundTable(f, today)
  const notesWeek = useRoundTableWeek()
  const kids = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const hasBaby = Object.values(f.members).some((m) => m.active && m.role === 'baby')
  const steps = parent ? ALL_STEPS : CHILD_STEPS
  const [i, setI] = useState(0)
  const step = steps[i]!
  const shown = shownWeekFocus(f, today)
  const [picked, setPicked] = useState<WeekFocusItem[]>(() => f.weekFocus[weekOf]?.items ?? [])
  const title = (s: StepId) => (s === 'meals' && hasBaby ? 'Meals and nights' : s === 'five' && weekOf !== startOfWeek(today) ? 'Next week’s 5' : STEP_TITLES[s])

  const go = (n: number) => {
    setI(n)
    document.querySelector('.app-body')?.scrollTo({ top: 0 })
  }
  const finish = () => {
    act([...saveWeekFocus(me.id, weekOf, picked), ...A.completeSummit(me.id, startOfWeek(today))])
    toast(picked.length ? 'Saved. That’s the week.' : 'Done. The week is planned.')
    go(0)
  }

  return (
    <div className="screen week-plan round-table">
      <header className="screen-head">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">
            {dayName(weekOf)} {Number(weekOf.slice(8))} to {dayName(weekEnd)} {Number(weekEnd.slice(8))}
          </p>
          <h1>Weekly plan</h1>
        </div>
      </header>

      {shown && shown.items.length > 0 && <WeekFocusCard items={shown.items} which={shown.which} onChange={parent ? () => go(steps.indexOf('five')) : undefined} />}

      <StepIndicator steps={steps} at={i} onJump={go} />
      <h2 className="wk-title">{title(step)}</h2>

      <div className="wk-body">
        {step === 'raised' && (
          <>
            <RoundTableStatus />
            <Raise weekOf={notesWeek} bare />
            <IdeasToAgree />
            {parent && serverOn(f) && <RoundTableSettings />}
          </>
        )}
        {step === 'week' && (
          <>
            <ComingUpStep weekOf={weekOf} />
            {rt && <Week rt={rt} />}
            {parent && <HomeworkStep kids={kids} />}
          </>
        )}
        {step === 'loose' && <LooseEndsStep today={today} />}
        {step === 'meals' && <MealsAndNightsStep weekOf={weekOf} today={today} />}
        {step === 'five' && <FivePicker weekOf={weekOf} today={today} picked={picked} setPicked={setPicked} />}
      </div>

      <div className="btn-row wk-nav">
        {i > 0 && (
          <button type="button" className="btn" onClick={() => go(i - 1)}>
            Back
          </button>
        )}
        {i < steps.length - 1 ? (
          <button type="button" className="btn primary grow" onClick={() => go(i + 1)}>
            Next: {title(steps[i + 1]!)}
          </button>
        ) : step === 'five' ? (
          <button type="button" className="btn primary grow" onClick={finish}>
            <Icon name="check" size={18} /> {picked.length ? 'Save this week’s 5' : 'Finish without picking'}
          </button>
        ) : (
          <button type="button" className="btn primary grow" onClick={() => nav('/')}>
            <Icon name="check" size={18} /> Done
          </button>
        )}
      </div>
    </div>
  )
}
