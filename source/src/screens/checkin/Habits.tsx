import { useState } from 'react'
import * as C from '@/family/checkin/actions'
import { STARTER_HABITS, habitRepeatLabel, liveHabits } from '@/family/checkin/habits'
import { useApp, useFamily, useMe } from '@/app/context'
import type { HabitEvent, HabitWhen, MemberId } from '@/family/types'
import { Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const REPEATS: [string, string][] = [
  ['1', 'Every day'],
  ['2', 'Every 2 days'],
  ['3', 'Every 3 days'],
  ['7', 'Every week'],
  ['14', 'Every 2 weeks'],
  ['28', 'Every 4 weeks'],
  ['wd', 'Certain days of the week'],
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const repeatKey = (h?: Pick<HabitEvent, 'everyDays' | 'weekdays'>): string => (h?.weekdays?.length ? 'wd' : REPEATS.some(([k]) => k === String(h?.everyDays ?? 1)) ? String(h?.everyDays ?? 1) : '1')

/** Quick suggestions: tap to add one to the person's list. */
export function HabitSuggestions({ memberId }: { memberId: MemberId }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const have = new Set(liveHabits(f, memberId).map((h) => h.starterKey))
  const left = STARTER_HABITS.filter((s) => !have.has(s.key))
  if (!left.length) return null
  const basics = STARTER_HABITS.filter((s) => s.preset && !have.has(s.key))
  return (
    <div className="chips" aria-label="Suggested habits">
      {have.size === 0 && basics.length > 0 && (
        <button
          type="button"
          className="btn small"
          onClick={() =>
            act(
              C.addStarterHabits(
                me.id,
                f,
                memberId,
                basics.map((s) => s.key),
              ),
            )
          }
        >
          Start with the basics ({basics.map((s) => s.emoji).join(' ')})
        </button>
      )}
      {left.map((s) => (
        <button key={s.key} type="button" className="chip small" onClick={() => act(C.addStarterHabits(me.id, f, memberId, [s.key]))}>
          {s.emoji} {s.title}
        </button>
      ))}
    </div>
  )
}

/** Someone's personal care habits: add suggestions, add your own, change when and how often, remove. */
export function HabitsSheet({ memberId, onClose }: { memberId: MemberId; onClose: () => void }) {
  const f = useFamily()
  const { act } = useApp()
  const me = useMe()!
  const [editing, setEditing] = useState<{ habit?: HabitEvent } | undefined>()
  const habits = liveHabits(f, memberId)
  const person = f.members[memberId]
  return (
    <Sheet open onClose={onClose} title={editing ? (editing.habit ? 'Edit habit' : 'New habit') : `${memberId === person?.id && person ? `${person.name}'s` : 'Personal'} care habits`}>
      {editing ? (
        <HabitEditor memberId={memberId} habit={editing.habit} onDone={() => setEditing(undefined)} />
      ) : (
        <>
          {habits.length === 0 && <p className="note">Nothing yet. Add some below, or make your own.</p>}
          <ul className="habit-list">
            {habits.map((h, i) => (
              <li key={h.habitId} className="habit-edit-row">
                <button type="button" className="habit-edit" onClick={() => setEditing({ habit: h })}>
                  <span className="habit-emoji">{h.emoji ?? '🧴'}</span>
                  <span className="grow">
                    <strong>{h.title}</strong>
                    <small className="muted">
                      {habitRepeatLabel(h)} · {h.leaving ? 'before you leave' : h.when === 'either' ? 'morning or evening' : h.when}
                    </small>
                  </span>
                  <Icon name="pencil" size={16} />
                </button>
                <span className="habit-move">
                  <button type="button" className="icon-btn small" aria-label={`Move ${h.title} up`} disabled={i === 0} onClick={() => act(C.moveHabit(me.id, f, h.habitId, -1))}>
                    <span aria-hidden="true">▲</span>
                  </button>
                  <button type="button" className="icon-btn small" aria-label={`Move ${h.title} down`} disabled={i === habits.length - 1} onClick={() => act(C.moveHabit(me.id, f, h.habitId, 1))}>
                    <span aria-hidden="true">▼</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="field">
            <span>Suggestions</span>
            <HabitSuggestions memberId={memberId} />
          </div>
          <div className="btn-row">
            <button type="button" className="btn small" onClick={() => setEditing({})}>
              <Icon name="plus" size={16} /> Make my own
            </button>
            <button type="button" className="btn small ghost" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}

function HabitEditor({ memberId, habit, onDone }: { memberId: MemberId; habit?: HabitEvent; onDone: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [title, setTitle] = useState(habit?.title ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '🧴')
  const [when, setWhen] = useState<HabitWhen>(habit?.when ?? 'either')
  const [rep, setRep] = useState(repeatKey(habit))
  const [days, setDays] = useState<number[]>(habit?.weekdays ?? [])
  const [leaving, setLeaving] = useState(!!habit?.leaving)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} aria-label="Icon" />
        </label>
        <label className="field grow">
          <span>What</span>
          <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Moisturise" />
        </label>
      </div>
      <div className="field">
        <span>Which check-in</span>
        <Seg<HabitWhen>
          label="Check-in"
          value={when}
          onChange={setWhen}
          options={[
            { id: 'morning', label: 'Morning' },
            { id: 'evening', label: 'Evening' },
            { id: 'either', label: 'Either' },
          ]}
        />
      </div>
      <label className="field">
        <span>How often</span>
        <select className="tbox" value={rep} onChange={(e) => setRep(e.target.value)}>
          {REPEATS.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {rep === 'wd' && (
        <div className="chips">
          {DAYS.map((d, i) => (
            <button key={d} type="button" className={`chip small${days.includes(i) ? ' selected' : ''}`} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}>
              {d}
            </button>
          ))}
        </div>
      )}
      {when !== 'evening' && (
        <label className="switch-row">
          <span className="sr-main">
            <strong>Before you leave the house</strong>
            <small className="muted">Bag, keys, shoes: it goes in its own group at the end of the morning.</small>
          </span>
          <input type="checkbox" className="switch" checked={leaving} onChange={(e) => setLeaving(e.target.checked)} />
        </label>
      )}
      <p className="note">It shows in the check-in when it is due. Done recently, it is folded away until it is due again.</p>
      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!title.trim()) return toast('What is it?')
            if (rep === 'wd' && !days.length) return toast('Pick at least one day.')
            act(
              C.saveHabit(me.id, f, {
                habitId: habit?.habitId,
                memberId,
                title,
                emoji,
                when,
                everyDays: rep === 'wd' ? 1 : Number(rep),
                weekdays: rep === 'wd' ? days : undefined,
                starterKey: habit?.starterKey,
                leaving: when !== 'evening' && leaving,
              }),
            )
            onDone()
          }}
        >
          Save
        </button>
        <button type="button" className="btn ghost" onClick={onDone}>
          Back
        </button>
        {habit &&
          (confirm ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                act(C.deleteHabit(me.id, habit))
                onDone()
              }}
            >
              Really remove
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>
              <Icon name="trash" size={16} /> Remove
            </button>
          ))}
      </div>
    </>
  )
}
