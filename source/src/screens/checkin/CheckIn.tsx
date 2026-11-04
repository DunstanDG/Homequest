import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as A from '@/family/actions'
import * as C from '@/family/checkin/actions'
import { dayTypeOf } from '@/family/checkin/dayType'
import { noLeavingOnDaysOff } from '@/family/checkin/routineHabits'
import { routineForPart } from '@/family/checkin/routineCard'
import * as P from '@/family/planActions'
import { MOODS, canSeeMood, checkinOf, hasCheckin, recentMoods } from '@/family/checkin/checkin'
import { habitNote, habitRepeatLabel, habitsForPart, type HabitStatus } from '@/family/checkin/habits'
import { eveningReview, morningReview } from '@/family/checkin/review'
import { useApp, useCalCtx, useFamily, useMe, useNow } from '@/app/context'
import { addDays, fmtDuration, ymdOf } from '@/family/dates'
import type { CheckinPart, Ymd } from '@/family/types'
import { Avatar, CheckCircle, ScreenHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { cancelTaskReminder, Group, TaskLine } from '../family/shared'
import { MealRatingCard } from '../plan/MealRatingCard'
import { AddSheet } from './AddSheet'
import { RoutineSetup } from './RoutineSetup'
import { PrivateKeys } from '@/screens/family/PrivateKeys'
import { usePrivacy } from '@/app/usePrivacy'
import { HabitSuggestions, HabitsSheet } from './Habits'
import { CheckinSettings } from './Settings'

/**
 * The morning or evening check-in: a look back (what was done, what is still open), a place to add what the app missed,
 * personal care habits to tick, and how you are feeling. Finishing it just records that it was done; ticking things on the way
 * is saved as you go, so it can be left and come back to.
 */
export function CheckIn() {
  const { part: partParam } = useParams()
  const [qs] = useSearchParams()
  const nav = useNavigate()
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const part: CheckinPart = partParam === 'evening' ? 'evening' : 'morning'
  const target = f.members[qs.get('for') ?? me.id] ?? me
  const self = target.id === me.id
  const allowed = hasCheckin(target) && (self || me.role === 'parent')
  const [adding, setAdding] = useState(false)
  const [editHabits, setEditHabits] = useState(false)
  const [settings, setSettings] = useState(false)
  const [setup, setSetup] = useState(qs.get('setup') === '1')
  const [keys, setKeys] = useState(false)
  const privacy = usePrivacy()
  const existing = checkinOf(f, target.id, today, part)
  const [mood, setMood] = useState<number | undefined>(existing?.mood)
  const [why, setWhy] = useState(existing?.why ?? '')
  const [note, setNote] = useState(existing?.note ?? '')

  const review = useMemo(() => (part === 'evening' ? eveningReview(ctx, target.id, today, now) : morningReview(ctx, target.id, today, now)), [ctx, part, target.id, today, now])
  const yesterday: Ymd = addDays(today, -1)
  const habits = habitsForPart(f, target.id, part, today)
  const routine = routineForPart(ctx, target.id, part, today, now)
  const hideLeaving = dayTypeOf(ctx, target.id, today) === 'weekend' && noLeavingOnDaysOff(f, target.id)
  const leavingNow = part === 'morning' && !hideLeaving ? habits.shown.filter((x) => x.habit.leaving) : []
  const careNow = habits.shown.filter((x) => !(part === 'morning' && x.habit.leaving))
  const lastNight = part === 'morning' ? habitsForPart(f, target.id, 'evening', yesterday).shown.filter((s) => !s.done) : []
  const anyHabits = habits.shown.length + habits.later.length + lastNight.length > 0
  const showMood = canSeeMood(f, me.id, target.id)
  const moods = showMood ? recentMoods(f, target.id, today, 7).filter((m) => m.mood != null) : []
  const label = part === 'morning' ? 'Morning check-in' : 'Evening check-in'
  const who = self ? '' : ` for ${target.name}`

  if (!allowed) {
    return (
      <div className="screen">
        <ScreenHead title={label} onBack={() => nav('/')} />
        <p className="note">{hasCheckin(target) ? 'Only a parent can do a check-in for someone else.' : 'This person does not have check-ins.'}</p>
      </div>
    )
  }

  const toggleTask = (row: (typeof review.open)[number]) => {
    const evs = A.completeTask(me.id, f, row.task, row.date, {}, Date.now())
    act(evs)
    const ev = evs[0]
    if (ev) toast(row.task.coins ? `Done! ${row.task.coins} coins.` : 'Done!', { undo: () => act(A.undo(me.id, ev.id)) })
    void cancelTaskReminder(sync, row.task.taskId)
  }
  const tick = (s: HabitStatus, date: Ymd) => act(s.done ? C.untickHabit(me.id, f, s.habit.habitId, date) : C.tickHabit(me.id, f, s.habit.habitId, date))
  const habitRow = (s: HabitStatus, date: Ymd, sub?: string) => (
    <li key={`${date}|${s.habit.habitId}`} className={`habit-row${s.done ? ' done' : ''}`}>
      <CheckCircle done={s.done} onClick={() => tick(s, date)} label={s.done ? `Undo ${s.habit.title}` : `Done: ${s.habit.title}`} />
      <span className="habit-emoji" aria-hidden>
        {s.habit.emoji ?? '✨'}
      </span>
      <span className="grow">
        <strong>{s.habit.title}</strong>
        <small className="muted">{sub ?? (s.habit.everyDays > 1 || s.habit.weekdays?.length ? `${habitRepeatLabel(s.habit)} · ${habitNote(s, today)}` : '')}</small>
      </span>
    </li>
  )

  const startRoutine = () => {
    if (!routine) return
    const { runId, events } = P.startRun(me.id, target.id, P.runSourceFor(f, routine.routine, today), Date.now())
    if (!events.length) return toast('Nothing left to do in it today.')
    act(events)
    nav(`/run/${runId}`)
  }

  const finish = () => {
    act(C.finishCheckin(me.id, target.id, today, part, { mood: mood, why: part === 'evening' ? why.trim() || undefined : undefined, note: note.trim() || undefined }))
    toast(part === 'morning' ? 'Have a good day!' : 'Sleep well!')
    nav('/', { replace: true })
  }

  return (
    <div className="screen checkin">
      <ScreenHead
        title={`${label}${who}`}
        eyebrow={`${part === 'morning' ? '🌅 This morning' : '🌙 Tonight'}${existing ? ' · done, you can still change things' : ''}`}
        onBack={() => nav('/')}
        right={
          <button type="button" className="icon-btn" aria-label="Check-in settings" onClick={() => setSettings(true)}>
            <Icon name="settings" />
          </button>
        }
      />

      <section className="card checkin-review" aria-label={part === 'evening' ? 'Your day' : 'Since last night and today'}>
        <h3>{part === 'evening' ? (self ? 'Your day' : `${target.name}'s day`) : 'Looking back and ahead'}</h3>
        {review.lines.length ? (
          <ul className="review-lines">
            {review.lines.map((l) => (
              <li key={l.key}>
                <span aria-hidden>{l.emoji}</span>
                <span className="grow">
                  {l.text}
                  {l.sub && <small className="muted">{l.sub}</small>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{part === 'evening' ? 'Nothing is recorded for today yet. Add anything the app missed below.' : 'A clear start. Nothing carried over.'}</p>
        )}
        {review.ahead.length > 0 && (
          <details className="review-ahead">
            <summary>On today ({review.ahead.length})</summary>
            <ul>
              {review.ahead.map((i) => (
                <li key={i.key}>
                  {i.start ? <span className="muted">{i.start} </span> : null}
                  {i.title}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card checkin-routine" aria-label={part === 'morning' ? 'Morning routine' : 'Evening routine'}>
        {routine ? (
          <>
            <div className="row-fields">
              <span className="habit-emoji" aria-hidden>
                {routine.routine.emoji ?? (part === 'morning' ? '🌅' : '🌙')}
              </span>
              <div className="grow">
                <h3>{routine.routine.title}</h3>
                <small className="muted">
                  {routine.done
                    ? 'Done today'
                    : routine.steps.length
                      ? `${routine.steps.length} step${routine.steps.length === 1 ? '' : 's'} · ${fmtDuration(routine.minutes)}${routine.routine.finishBy ? ` · done by ${routine.routine.finishBy}` : ''}`
                      : 'Nothing left to do in it today'}
                </small>
              </div>
              {routine.done ? (
                <span className="chip small selected" aria-label="Routine done">
                  <Icon name="check" size={14} /> Done
                </span>
              ) : routine.runId ? (
                <Link to={`/run/${routine.runId}`} className="btn primary small">
                  Continue
                </Link>
              ) : routine.steps.length ? (
                <button type="button" className="btn primary small" onClick={startRoutine}>
                  <Icon name="play" size={16} /> Start
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="row-fields">
            <p className="muted grow">No {part} routine yet. Set the times and what goes in it in a minute.</p>
            <button type="button" className="btn small" onClick={() => setSetup(true)}>
              Set up routines
            </button>
          </div>
        )}
      </section>

      {review.open.length > 0 && (
        <Group title={part === 'evening' ? 'Still open' : 'Carried over'} count={review.open.length}>
          {review.open.map((r) => (
            <TaskLine key={`${r.task.taskId}|${r.date}`} row={r} canTick onToggle={() => toggleTask(r)} onOpen={() => undefined} />
          ))}
        </Group>
      )}

      <MealRatingCard
        date={part === 'evening' ? today : yesterday}
        people={[target]}
        now={now}
        title={part === 'evening' ? (self ? 'How were today’s meals?' : `How were today’s meals for ${target.name}?`) : 'How were yesterday’s meals?'}
        hideDone={part === 'morning'}
      />

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> {part === 'morning' ? 'Add something from last night' : 'Add something I did'}
        </button>
      </div>

      <section className="card checkin-habits" aria-label="Personal care">
        <div className="row-fields">
          <h3 className="grow">Looking after {self ? 'yourself' : target.name}</h3>
          <button type="button" className="link-btn" onClick={() => setEditHabits(true)}>
            Edit habits
          </button>
        </div>
        {!anyHabits ? (
          <>
            <p className="muted">Things like meditating, moisturising or cutting nails. Pick some to start, and change them any time.</p>
            <HabitSuggestions memberId={target.id} />
          </>
        ) : (
          <>
            {lastNight.length > 0 && (
              <>
                <p className="eyebrow">Last night</p>
                <ul className="habit-list">{lastNight.map((s) => habitRow(s, yesterday, 'Not ticked last night'))}</ul>
              </>
            )}
            {careNow.length > 0 ? (
              <ul className="habit-list">{careNow.map((s) => habitRow(s, today))}</ul>
            ) : leavingNow.length === 0 ? (
              <p className="muted">Nothing due this {part === 'morning' ? 'morning' : 'evening'}.</p>
            ) : null}
            {habits.later.length > 0 && (
              <details className="habit-later">
                <summary>Not due yet ({habits.later.length})</summary>
                <ul className="habit-list">{habits.later.map((s) => habitRow(s, today, `${habitRepeatLabel(s.habit)} · ${habitNote(s, today)}`))}</ul>
              </details>
            )}
          </>
        )}
      </section>

      {leavingNow.length > 0 && (
        <section className="card checkin-leaving" aria-label="Before you leave">
          <h3>
            Before {self ? 'you' : target.name} leave{self ? '' : 's'}
          </h3>
          <ul className="habit-list">{leavingNow.map((s) => habitRow(s, today))}</ul>
        </section>
      )}

      <section className="card checkin-mood" aria-label="How are you">
        <h3>{self ? 'How are you feeling?' : `How is ${target.name} feeling?`}</h3>
        <div className="mood-row" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mood === m.value}
              className={`mood-btn${mood === m.value ? ' on' : ''}`}
              onClick={() => setMood(mood === m.value ? undefined : m.value)}
            >
              <span aria-hidden>{m.emoji}</span>
              <small>{m.label}</small>
            </button>
          ))}
        </div>
        {part === 'evening' && (
          <label className="field why-field">
            <span>{mood != null && mood <= 2 ? 'What was behind that?' : 'What was behind that? (optional)'}</span>
            <textarea className="tbox" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Tired, an argument, a big day, nothing in particular…" aria-label="What was behind your mood" maxLength={400} />
          </label>
        )}
        <input
          className="tbox"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={part === 'morning' ? 'Anything on your mind? (optional)' : 'Best bit of the day? (optional)'}
          aria-label="A note"
          maxLength={200}
        />
        {moods.length > 1 && (
          <p className="mood-strip muted" aria-label="Recent days">
            {moods.map((m) => MOODS.find((x) => x.value === m.mood)?.emoji).join(' ')}
            <small> recent days</small>
          </p>
        )}
        {showMood && moods.some((m) => m.why) && (
          <details className="why-list">
            <summary>What was behind it ({moods.filter((m) => m.why).length})</summary>
            <ul>
              {moods
                .filter((m) => m.why)
                .reverse()
                .map((m) => (
                  <li key={m.date}>
                    <span aria-hidden>{MOODS.find((x) => x.value === m.mood)?.emoji ?? '·'}</span> <small className="muted">{m.date}</small> {m.why}
                  </li>
                ))}
            </ul>
          </details>
        )}
        {!self && <p className="note">Only {target.name} and the parents can see this.</p>}
        {self && me.role === 'parent' && (
          <p className="note">
            {privacy.dbReady && privacy.hasKey ? (
              '🔒 Your mood, why and note are private to you: other phones do not receive them.'
            ) : (
              <>
                Other people’s phones can hold these.{' '}
                <button type="button" className="link-btn" onClick={() => setKeys(true)}>
                  Make my check-ins private
                </button>
              </>
            )}
          </p>
        )}
      </section>

      <div className="checkin-bar">
        <button type="button" className="btn primary block" onClick={finish}>
          <Icon name="check" size={18} /> {existing ? 'Update' : 'Finish'} {part} check-in
        </button>
        <Link to="/" className="link-btn">
          Not now
        </Link>
      </div>

      {adding && <AddSheet member={target} defaultDay={part === 'morning' ? 'yesterday' : 'today'} onClose={() => setAdding(false)} />}
      {keys && <PrivateKeys onClose={() => setKeys(false)} />}
      {setup && <RoutineSetup memberId={target.id} onClose={() => setSetup(false)} />}
      {editHabits && <HabitsSheet memberId={target.id} onClose={() => setEditHabits(false)} />}
      <Sheet open={settings} onClose={() => setSettings(false)} title={`Check-in settings${who}`}>
        <div className="who-line">
          <Avatar m={target} size={28} /> <strong>{target.name}</strong>
        </div>
        <CheckinSettings memberId={target.id} />
      </Sheet>
    </div>
  )
}
