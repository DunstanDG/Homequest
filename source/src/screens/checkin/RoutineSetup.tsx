import { useMemo, useState } from 'react'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { hasOwnSchool } from '@/family/checkin/dayType'
import { STARTER_HABITS, liveHabits } from '@/family/checkin/habits'
import { LEAVING_ADULT, LEAVING_CHILD, applyRoutinePlan, existingRoutine, planDefaults, planIds } from '@/family/checkin/routinePlan'
import type { Hm, MemberId, RoutineDayTimes } from '@/family/types'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

type Step = 0 | 1 | 2

/**
 * A short guided setup for one person's mornings and evenings: when they get up, leave and go to bed (school/work days and
 * days off), what to check before leaving, and which care habits to start with. Saving builds the sessions, the checklist and the
 * check-in times; opening it again starts from the last answers and updates the same things.
 */
export function RoutineSetup({ memberId, onClose }: { memberId: MemberId; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const m = f.members[memberId]
  const child = m?.role === 'child'
  const saved = f.routinePlans[memberId]
  const defaults = useMemo(() => planDefaults(child ? 'child' : 'parent'), [child])
  const haveLeaving = useMemo(
    () =>
      liveHabits(f, memberId)
        .filter((h) => h.leaving)
        .map((h) => h.title),
    [f, memberId],
  )
  const haveKeys = useMemo(
    () =>
      liveHabits(f, memberId)
        .map((h) => h.starterKey)
        .filter((k): k is string => !!k),
    [f, memberId],
  )
  const [step, setStep] = useState<Step>(0)
  const [wd, setWd] = useState<RoutineDayTimes>(saved?.weekday ?? defaults.weekday)
  const [we, setWe] = useState<RoutineDayTimes>(saved?.weekend ?? defaults.weekend)
  const [leaving, setLeaving] = useState<string[]>(saved?.leaving ?? (haveLeaving.length ? haveLeaving : defaults.leaving))
  const [custom, setCustom] = useState('')
  const [keys, setKeys] = useState<string[]>(haveKeys.length ? haveKeys : defaults.habitKeys)
  if (!m) return null

  const suggestions = (child ? LEAVING_CHILD : LEAVING_ADULT).map((x) => x.title)
  const shown = [...suggestions, ...leaving.filter((t) => !suggestions.includes(t))]
  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const schoolDays = hasOwnSchool(ctx, memberId)
  const ids = planIds(memberId)
  const takingOver = (['morning', 'evening'] as const)
    .map((p) => existingRoutine(f, memberId, p))
    .filter((r) => r && !r.part && r.routineId !== ids.routine('morning', 'wd') && r.routineId !== ids.routine('evening', 'wd'))
    .map((r) => r!.title)
  const name = m.name
  const leaveLabel = schoolDays ? 'Leave for school' : child ? 'Leave the house' : 'Leave for work'
  const dayLabel = schoolDays ? 'School days' : 'Weekdays'
  const offLabel = schoolDays ? 'Weekends and school holidays' : 'Weekends'

  const timeField = (label: string, value: Hm | undefined, set: (v: Hm | undefined) => void, optional = false) => (
    <label className="field grow">
      <span>{label}</span>
      <input type="time" className="tbox" value={value ?? ''} onChange={(e) => (e.target.value ? set(e.target.value) : optional && set(undefined))} aria-label={label} />
    </label>
  )

  const save = () => {
    act(applyRoutinePlan(me.id, f, { memberId, weekday: wd, weekend: we, leaving, habitKeys: keys, schoolDays }))
    toast(`${name}'s routines are set up.`)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={`${name}'s routines`}>
      <p className="eyebrow">Step {step + 1} of 3</p>
      {step === 0 && (
        <>
          <p className="note">When does a normal day run? This sets the morning and evening sessions and when the check-ins open.</p>
          <h4>{dayLabel}</h4>
          <div className="row-fields" data-testid="times-weekday">
            {timeField('Wake up', wd.wake, (v) => v && setWd({ ...wd, wake: v }))}
            {timeField(leaveLabel, wd.leave, (v) => setWd({ ...wd, leave: v }), true)}
            {timeField('Bedtime', wd.bed, (v) => v && setWd({ ...wd, bed: v }))}
          </div>
          <h4>{offLabel}</h4>
          <div className="row-fields" data-testid="times-weekend">
            {timeField('Wake up', we.wake, (v) => v && setWe({ ...we, wake: v }))}
            {timeField('Out by (optional)', we.leave, (v) => setWe({ ...we, leave: v }), true)}
            {timeField('Bedtime', we.bed, (v) => v && setWe({ ...we, bed: v }))}
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <p className="note">{child ? `What does ${name} need before they leave?` : 'What do you need before you leave?'} These become a “Before you leave” list at the end of the morning.</p>
          <div className="chips" aria-label="Before you leave">
            {shown.map((t) => (
              <button key={t} type="button" className={`chip${leaving.includes(t) ? ' selected' : ''}`} aria-pressed={leaving.includes(t)} onClick={() => setLeaving(toggle(leaving, t))}>
                {t}
              </button>
            ))}
          </div>
          <div className="row-fields">
            <input className="tbox grow" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Something else…" aria-label="Add to the list" />
            <button
              type="button"
              className="btn small"
              disabled={!custom.trim()}
              onClick={() => {
                const t = custom.trim()
                if (t && !leaving.includes(t)) setLeaving([...leaving, t])
                setCustom('')
              }}
            >
              <Icon name="plus" size={16} /> Add
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <p className="note">Care habits to start with. They sit in the morning and evening routines and in the check-ins, ticked once and shown in both. You can change them any time.</p>
          <div className="chips" aria-label="Habits">
            {STARTER_HABITS.map((s) => (
              <button key={s.key} type="button" className={`chip${keys.includes(s.key) ? ' selected' : ''}`} aria-pressed={keys.includes(s.key)} onClick={() => setKeys(toggle(keys, s.key))}>
                {s.emoji} {s.title}
              </button>
            ))}
          </div>
          {takingOver.length > 0 && (
            <p className="note">
              {name}'s existing “{takingOver.join('” and “')}” will be used rather than making a second one. Its times are set and a “My habits” step is added.
            </p>
          )}
          <p className="note">
            This makes a morning and an evening session for {dayLabel.toLowerCase()} and for {offLabel.toLowerCase()}, and opens the check-ins to match.
          </p>
        </>
      )}
      <div className="btn-row">
        {step > 0 && (
          <button type="button" className="btn ghost" onClick={() => setStep((step - 1) as Step)}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="btn primary" onClick={() => setStep((step + 1) as Step)}>
            Next
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={save}>
            <Icon name="check" size={18} /> Set up routines
          </button>
        )}
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  )
}
