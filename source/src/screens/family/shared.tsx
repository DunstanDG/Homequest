import { useMemo, useState, type ReactNode } from 'react'
import * as A from '@/family/actions'
import { notifyTypeOn, useApp, useCalCtx, useFamily, useLearnerOf, useMe, useNow } from '@/app/context'
import { cancelNotification, cancelNotificationsByPrefix, scheduleNotification } from '@/app/push'
import { peopleOf, type AgendaItem, type TaskRow } from '@/family/calendar'
import { commentsFor } from '@/family/comments'
import { suggestDoOn } from '@/family/homework'
import { addDays, dayName, friendlyDay, startOfWeek, weekday, ymdOf } from '@/family/dates'
import { balanceFor, suggestCoins } from '@/family/economy'
import { eventReminderPrefix, eventReminderTag, taskReminderAt, taskReminderTag } from '@/family/notify'
import { uid } from '@/engine/rng'
import type { CalCategory, CalEvent, DayPart, FamilyState, Member, MemberId, PetKind, Recurrence, TaskEvent, TaskKind, Ymd } from '@/family/types'
import { CheckCircle, Coins, MemberChips, Seg } from '@/ui/fam'
import { DropHomeworkSheet } from './homeworkAdmin'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { modeOf, serverOn } from '@/family/travel/travel'
import type { TripSpec } from '@/family/travel/types'
import { TripEditor, TripStatus } from './travelParts'
import { PlanHelp } from './planHelp'

// ------------------------------------------------------------------ small hooks

/** Today as 'YYYY-MM-DD', kept fresh once a minute (and when the app comes back to the front). */
export function useToday(): Ymd {
  return ymdOf(useNow(30_000))
}

/** A member's spendable coins, including their StudyQuest XP. */
export function useBalance(memberId: MemberId | undefined) {
  const f = useFamily()
  const l = useLearnerOf(memberId)
  return useMemo(() => (memberId ? balanceFor(f, memberId, l?.xpByDay ?? {}) : undefined), [f, l, memberId])
}

/** Parents and children (the people who have calendars, tasks and coins). */
export function usePeople(): Member[] {
  const f = useFamily()
  return useMemo(() => peopleOf(f).map((id) => f.members[id]!), [f])
}

/** On Saturday and Sunday the week people care about is the one about to start. */
export const upcomingWeekAnchor = (today: Ymd): Ymd => (weekday(today) >= 5 ? addDays(startOfWeek(today), 7) : today)

export const memberName = (f: FamilyState, id: MemberId | undefined): string => (id ? (f.members[id]?.name ?? 'Someone') : 'Someone')

export const PART_LABEL: Record<DayPart, string> = { morning: 'Morning', day: 'During the day', afternoon: 'After school', evening: 'Evening', any: 'Whenever' }
export const KIND_LABEL: Record<TaskKind, string> = { homework: 'Homework', chore: 'Chore', routine: 'Routine', study: 'Study', other: 'Other' }
export const KIND_EMOJI: Record<TaskKind, string> = { homework: '📚', chore: '🧹', routine: '🔁', study: '🧠', other: '⭐' }
export const CAT_LABEL: Record<CalCategory, string> = {
  family: 'Family',
  school: 'School',
  activity: 'Activity',
  appointment: 'Appointment',
  social: 'Social',
  work: 'Work',
  meal: 'Meal',
  other: 'Other',
}
export const CAT_EMOJI: Record<string, string> = {
  family: '👪',
  school: '🏫',
  activity: '⚽',
  appointment: '🩺',
  social: '🎉',
  work: '💼',
  meal: '🍽️',
  other: '📌',
  lesson: '📖',
  club: '🎭',
  homework: '📚',
  closure: '🏖️',
  birthday: '🎂',
  task: '✅',
  session: '⏱️',
  travel: '🚆',
}

export const timeRange = (i: Pick<AgendaItem, 'start' | 'end' | 'allDay'>): string => (i.allDay || !i.start ? 'All day' : i.end ? `${i.start}–${i.end}` : i.start)

// ------------------------------------------------------------------ task due-reminder notifications
//
// Shared by every place a task is created/edited (this file), completed (Today.tsx, agenda.tsx, School.tsx,
// Dump.tsx) or deleted (this file): the pending reminder's fate follows the task, not any one screen.

/** Schedule (or, if the type is off or the task no longer has both a date and a time, cancel) the due-reminder
 * for a task, using the settings snapshot the caller already has from `useApp()`. */
export async function rescheduleTaskReminder(
  sync: ReturnType<typeof useApp>['sync'],
  settings: ReturnType<typeof useApp>['settings'],
  taskId: string,
  taskTitle: string,
  date: Ymd | undefined,
  time: string | undefined,
): Promise<void> {
  const tag = taskReminderTag(taskId)
  if (!notifyTypeOn(settings, 'tasks')) return cancelNotification(sync, tag)
  const fireAt = taskReminderAt(date, time)
  if (!fireAt) return cancelNotification(sync, tag)
  await scheduleNotification(sync, { fireAt, title: 'Coming up', body: taskTitle, label: taskTitle, tag })
}

/** Cancel a task's pending reminder outright - it is done or gone, so there is nothing left to remind about. */
export const cancelTaskReminder = (sync: ReturnType<typeof useApp>['sync'], taskId: string): Promise<void> => cancelNotification(sync, taskReminderTag(taskId))

// ------------------------------------------------------------------ calendar event reminder notifications
//
// Scheduling a calendar event's own "coming up" reminder happens in the background now, for every upcoming
// occurrence (not just the one being saved right now) - see app/calendarReminders.ts, mounted once near the top
// of the app, which reacts to the family's data changing on its own. All that's left for this screen to do is
// cancel reminders that no longer apply when an event (or one occurrence of it) is removed.

/** Cancel every pending reminder for a whole calendar event/series - it was deleted outright, or a repeating
 * event that has no exceptions was removed (in which case there's no single surviving occurrence to narrow to). */
export const cancelEventReminder = (sync: ReturnType<typeof useApp>['sync'], calId: string): Promise<void> => cancelNotificationsByPrefix(sync, eventReminderPrefix(calId))

/** Cancel just one occurrence's pending reminder - skipping a single day of a repeating event, which leaves the
 * rest of the series (and their reminders) alone. */
export const cancelEventOccurrenceReminder = (sync: ReturnType<typeof useApp>['sync'], calId: string, date: Ymd): Promise<void> => cancelNotification(sync, eventReminderTag(`cal:${calId}:${date}`))

// ------------------------------------------------------------------- repeat picker

type RepeatKind = 'none' | 'daily' | 'weekdays' | 'weekly' | 'school' | 'monthly' | 'yearly'

const WEEKDAYS = [0, 1, 2, 3, 4]

export function repeatKindOf(r: Recurrence | undefined): { kind: RepeatKind; days: number[]; alt?: boolean } {
  if (!r) return { kind: 'none', days: [] }
  const alt = r.freq === 'weekly' && r.interval === 2 ? true : undefined
  if (r.schoolDaysOnly) return { kind: 'school', days: [], alt }
  if (r.freq === 'daily') return { kind: 'daily', days: [] }
  if (r.freq === 'monthly') return { kind: 'monthly', days: [] }
  if (r.freq === 'yearly') return { kind: 'yearly', days: [] }
  const d = r.byWeekday ?? []
  if (d.length === 5 && WEEKDAYS.every((x) => d.includes(x))) return { kind: 'weekdays', days: [], alt }
  return { kind: 'weekly', days: d, alt }
}

/** Kinds that can run every other week instead of every week. */
const ALT_KINDS = new Set<RepeatKind>(['weekdays', 'weekly', 'school'])

function recurFrom(kind: RepeatKind, days: number[], until: Ymd | '', startDate: Ymd, alt = false): Recurrence | undefined {
  const u = until ? { until } : {}
  const every2 = alt && ALT_KINDS.has(kind) ? { interval: 2 } : {}
  switch (kind) {
    case 'none':
      return undefined
    case 'daily':
      return { freq: 'daily', ...u }
    case 'school':
      return alt ? { freq: 'weekly', byWeekday: WEEKDAYS, schoolDaysOnly: true, ...every2, ...u } : { freq: 'daily', schoolDaysOnly: true, ...u }
    case 'weekdays':
      return { freq: 'weekly', byWeekday: WEEKDAYS, ...every2, ...u }
    case 'weekly':
      return { freq: 'weekly', byWeekday: days.length ? [...days].sort() : [weekday(startDate)], ...every2, ...u }
    case 'monthly':
      return { freq: 'monthly', ...u }
    case 'yearly':
      return { freq: 'yearly', ...u }
  }
}

export interface RepeatState {
  kind: RepeatKind
  days: number[]
  until: Ymd | ''
  /** Every other week (weekly, Mon–Fri and school-day repeats only), counted from the start date's week. */
  alt?: boolean
}

export const initialRepeat = (r?: Recurrence): RepeatState => ({ ...repeatKindOf(r), until: r?.until ?? '' })

/** Builds the recurrence to save. Keeps the original rule untouched when the person did not change the pattern (so custom intervals survive an edit). */
export const repeatToRecur = (st: RepeatState, startDate: Ymd, original?: Recurrence): Recurrence | undefined => {
  const o = initialRepeat(original)
  if (original && o.kind === st.kind && JSON.stringify(o.days) === JSON.stringify(st.days) && o.until === st.until && !!o.alt === !!st.alt) return original
  return recurFrom(st.kind, st.days, st.until, startDate, st.alt)
}

export function RepeatPicker({ value, onChange, allowSchool = true }: { value: RepeatState; onChange: (v: RepeatState) => void; allowSchool?: boolean }) {
  const opts: { id: RepeatKind; label: string }[] = [
    { id: 'none', label: 'Once' },
    { id: 'daily', label: 'Every day' },
    { id: 'weekdays', label: 'Mon–Fri' },
    ...(allowSchool ? [{ id: 'school' as const, label: 'School days' }] : []),
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ]
  return (
    <div className="field">
      <span>Repeat</span>
      <div className="chips">
        {opts.map((o) => (
          <button key={o.id} type="button" className={`chip small${value.kind === o.id ? ' selected' : ''}`} onClick={() => onChange({ ...value, kind: o.id })}>
            {o.label}
          </button>
        ))}
      </div>
      {value.kind === 'weekly' && (
        <div className="chips">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              type="button"
              className={`chip small${value.days.includes(d) ? ' selected' : ''}`}
              onClick={() => onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d] })}
            >
              {dayName(`2026-09-${String(21 + d)}`)}
            </button>
          ))}
        </div>
      )}
      {ALT_KINDS.has(value.kind) && (
        <label className="inline-field">
          <input type="checkbox" checked={!!value.alt} onChange={(e) => onChange({ ...value, alt: e.target.checked })} />
          <span className="note">Every other week, starting the week of the date above</span>
        </label>
      )}
      {value.kind !== 'none' && (
        <label className="inline-field">
          <span className="note">Stop repeating after</span>
          <input type="date" className="tbox slim" value={value.until} onChange={(e) => onChange({ ...value, until: e.target.value })} />
        </label>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ comments

/** A comment thread scoped to one calendar event or task. Never shown anywhere but that item's own sheet. */
export function CommentThread({ targetId }: { targetId: string }) {
  const f = useFamily()
  const me = useMe()!
  const { act } = useApp()
  const [text, setText] = useState('')
  const list = commentsFor(f, targetId)
  const send = () => {
    const t = text.trim()
    if (!t) return
    act(A.addComment(me.id, targetId, t))
    setText('')
  }
  return (
    <div className="field comment-thread">
      <span>Comments{list.length ? ` (${list.length})` : ''}</span>
      {list.length > 0 && (
        <ul className="comment-list">
          {list.map((c) => (
            <li key={c.id}>
              <span className="comment-who">{f.members[c.learnerId]?.name ?? '?'}</span>
              <span className="comment-text">{c.text}</span>
              {c.learnerId === me.id && (
                <button type="button" className="icon-btn small" aria-label="Delete comment" onClick={() => act(A.deleteComment(me.id, c.commentId, targetId))}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="row-fields">
        <input className="tbox grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" maxLength={280} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button type="button" className="btn small" disabled={!text.trim()} onClick={send}>
          Send
        </button>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------- task form

const PARTS: DayPart[] = ['morning', 'afternoon', 'evening', 'day', 'any']
const KINDS: TaskKind[] = ['chore', 'homework', 'routine', 'study', 'other']

export function TaskSheet({ open, onClose, task, defaults }: { open: boolean; onClose: () => void; task?: TaskEvent; defaults?: TaskDefaults }) {
  return (
    <Sheet open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <TaskForm task={task} defaults={defaults} onDone={onClose} />
    </Sheet>
  )
}

/** What a new task starts with. `subject`/`setOn` come from the homework check-in (subject of today's lesson). */
export interface TaskDefaults {
  assignee?: MemberId
  date?: Ymd
  kind?: TaskKind
  subject?: string
  title?: string
}

function TaskForm({ task, defaults, onDone }: { task?: TaskEvent; defaults?: TaskDefaults; onDone: () => void }) {
  const { act, toast, sync, settings } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = useToday()
  const people = usePeople()
  const pets = Object.values(f.members).filter((m) => m.active && m.role === 'pet')
  const parent = me.role === 'parent'
  const [dropping, setDropping] = useState(false)
  const ctx = useCalCtx()
  const [title, setTitle] = useState(task?.title ?? defaults?.title ?? '')
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? defaults?.kind ?? 'chore')
  const [assignee, setAssignee] = useState<MemberId>(task?.assignee ?? defaults?.assignee ?? me.id)
  const [date, setDate] = useState<string>(task ? (task.date ?? '') : (defaults?.date ?? today))
  const [time, setTime] = useState(task?.time ?? '')
  const [part, setPart] = useState<DayPart>(task?.part ?? 'any')
  const [minutes, setMinutes] = useState<string>(task?.minutes ? String(task.minutes) : '')
  const [coins, setCoins] = useState<string>(task ? String(task.coins) : '')
  const [check, setCheck] = useState<'self' | 'parent'>(task?.check ?? 'parent')
  const [checkTouched, setCheckTouched] = useState(!!task)
  const [rep, setRep] = useState<RepeatState>(initialRepeat(task?.recur))
  const [subject, setSubject] = useState(task?.subject ?? defaults?.subject ?? '')
  // Homework: the day to do it on. Until someone picks one, it follows the suggestion (which moves with the due
  // date and the time estimate); an existing plan is kept as it is.
  const [doOn, setDoOn] = useState<string>(task?.doOn ?? '')
  const [doOnTouched, setDoOnTouched] = useState(!!task?.doOn)
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [petLink, setPetLink] = useState<{ petId: MemberId; kind: PetKind } | undefined>(task?.petLink)
  const mins = Number(minutes) || undefined
  const suggested = suggestCoins(kind, mins)
  const shownCoins = coins === '' ? String(suggested) : coins
  const startDate = (date || today) as Ymd
  const isHomework = kind === 'homework' && rep.kind === 'none' && !!date
  const doOnSuggestion = useMemo(() => (isHomework ? suggestDoOn(ctx, assignee, date as Ymd, mins, Date.now(), task?.taskId) : undefined), [isHomework, ctx, assignee, date, mins, task?.taskId])
  const shownDoOn = doOnTouched ? doOn : (doOnSuggestion?.date ?? '')

  const pickKind = (k: TaskKind) => {
    setKind(k)
    if (!checkTouched) setCheck(k === 'routine' ? 'self' : 'parent')
  }

  const save = () => {
    const t = title.trim()
    if (!t) return
    const recur = repeatToRecur(rep, startDate, task?.recur)
    const taskId = task?.taskId ?? uid('t')
    const dueDate = recur || date ? startDate : undefined
    const evs = A.saveTask(me.id, {
      taskId,
      title: t,
      assignee,
      kind,
      part,
      date: dueDate,
      time: time || undefined,
      minutes: mins,
      coins: Math.max(0, Math.round(Number(shownCoins) || 0)),
      check,
      recur,
      exdates: task?.exdates,
      subject: subject.trim() || undefined,
      doOn: isHomework && shownDoOn ? (shownDoOn as Ymd) : undefined,
      setOn: task?.setOn ?? (kind === 'homework' ? today : undefined),
      teacher: task?.teacher,
      notes: notes.trim() || undefined,
      source: task?.source,
      petLink,
      helpWanted: task?.helpWanted,
      handoffFrom: task?.handoffFrom,
    })
    act(evs)
    toast(task ? 'Task updated.' : 'Task added.')
    void rescheduleTaskReminder(sync, settings, taskId, t, dueDate, time || undefined)
    onDone()
  }

  return (
    <>
      <label className="field">
        <span>What needs doing?</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Empty the dishwasher" maxLength={80} autoFocus={!task} />
      </label>
      <div className="chips">
        {KINDS.map((k) => (
          <button key={k} type="button" className={`chip small${kind === k ? ' selected' : ''}`} onClick={() => pickKind(k)}>
            {KIND_EMOJI[k]} {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {kind === 'homework' && (
        <label className="field">
          <span>Subject</span>
          <input className="tbox" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Science" maxLength={30} />
        </label>
      )}
      {parent && (
        <div className="field">
          <span>For</span>
          <MemberChips members={people} value={[assignee]} onChange={(v) => setAssignee(v[0] ?? me.id)} />
        </div>
      )}
      <div className="grid2">
        <label className="field">
          <span>{rep.kind === 'none' ? 'Due' : 'Starting'}</span>
          <input type="date" className="tbox" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>At (optional)</span>
          <input type="time" className="tbox" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      {isHomework && (
        <label className="field">
          <span>Do it on</span>
          <input
            type="date"
            className="tbox"
            min={today}
            max={date}
            value={shownDoOn}
            onChange={(e) => {
              setDoOn(e.target.value)
              setDoOnTouched(true)
            }}
          />
          {doOnSuggestion && (
            <small className="muted">
              {!doOnTouched || shownDoOn === doOnSuggestion.date
                ? `Suggested: ${friendlyDay(doOnSuggestion.date, today)} (${doOnSuggestion.reason})`
                : `Suggested was ${friendlyDay(doOnSuggestion.date, today)} (${doOnSuggestion.reason})`}
            </small>
          )}
        </label>
      )}
      {!time && (
        <div className="field">
          <span>Part of the day</span>
          <div className="chips">
            {PARTS.map((p) => (
              <button key={p} type="button" className={`chip small${part === p ? ' selected' : ''}`} onClick={() => setPart(p)}>
                {PART_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      )}
      <RepeatPicker value={rep} onChange={setRep} />
      <div className="grid2">
        <label className="field">
          <span>Minutes it takes</span>
          <input className="tbox" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="optional" />
        </label>
        <label className="field">
          <span>Coins</span>
          <input className="tbox" inputMode="numeric" value={shownCoins} onChange={(e) => setCoins(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        </label>
      </div>
      <div className="field">
        <span>Who checks it?</span>
        <Seg
          value={check}
          onChange={(v) => (setCheck(v), setCheckTouched(true))}
          options={[
            { id: 'parent', label: 'A parent checks' },
            { id: 'self', label: 'Tick and done' },
          ]}
        />
      </div>
      {pets.length > 0 && (kind === 'chore' || kind === 'routine') && (
        <div className="field">
          <span>Ticks itself when logged in Care</span>
          <div className="chips">
            <button type="button" className={`chip small${!petLink ? ' selected' : ''}`} onClick={() => setPetLink(undefined)}>
              No
            </button>
            {pets.flatMap((p) =>
              (['walk', 'feed'] as const).map((k) => (
                <button
                  key={`${p.id}${k}`}
                  type="button"
                  className={`chip small${petLink?.petId === p.id && petLink.kind === k ? ' selected' : ''}`}
                  onClick={() => setPetLink({ petId: p.id, kind: k })}
                >
                  {k === 'walk' ? 'Walk' : 'Feed'} {p.name}
                </button>
              )),
            )}
          </div>
        </div>
      )}
      <label className="field">
        <span>Notes</span>
        <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" maxLength={200} />
      </label>
      <button type="button" className="btn primary big block" disabled={!title.trim()} onClick={save}>
        <Icon name="check" size={20} /> {task ? 'Save' : 'Add task'}
      </button>
      {task && parent && (
        <div className="field">
          {task.helpWanted ? (
            task.assignee === me.id ? (
              <button type="button" className="btn block" onClick={() => act(A.offerTaskHelp(me.id, task, false))}>
                Marked "could use a hand" — cancel
              </button>
            ) : (
              <button type="button" className="btn primary block" onClick={() => (act(A.claimTask(me.id, task)), toast("You've got this one."))}>
                <Icon name="hand" size={18} /> I'll take this one
              </button>
            )
          ) : (
            task.assignee === me.id && (
              <button type="button" className="btn ghost block" onClick={() => act(A.offerTaskHelp(me.id, task, true))}>
                Could use a hand with this
              </button>
            )
          )}
          {task.handoffFrom && f.members[task.handoffFrom] && <p className="note">Picked up from {f.members[task.handoffFrom]!.name}.</p>}
        </div>
      )}
      {task && <CommentThread targetId={task.taskId} />}
      {task && parent && task.kind === 'homework' && !task.recur && !task.dropped && (
        <button type="button" className="btn ghost block" onClick={() => setDropping(true)}>
          <Icon name="undo" size={18} /> Not needed (no coins)
        </button>
      )}
      {dropping && task && <DropHomeworkSheet task={task} onClose={() => (setDropping(false), onDone())} />}
      {task && (
        <button
          type="button"
          className="btn ghost block"
          onClick={() => {
            act(A.deleteTask(me.id, task))
            toast('Task removed.')
            void cancelTaskReminder(sync, task.taskId)
            onDone()
          }}
        >
          <Icon name="trash" size={18} /> Remove task
        </button>
      )}
    </>
  )
}

// ------------------------------------------------------------------- event form

export function EventSheet({ open, onClose, event, date, occurrenceDate }: { open: boolean; onClose: () => void; event?: CalEvent; date?: Ymd; occurrenceDate?: Ymd }) {
  return (
    <Sheet open={open} onClose={onClose} title={event ? 'Edit event' : 'New event'}>
      <EventForm event={event} date={date} occurrenceDate={occurrenceDate} onDone={onClose} />
    </Sheet>
  )
}

const CATS: CalCategory[] = ['family', 'activity', 'appointment', 'social', 'meal', 'work', 'school', 'other']

function EventForm({ event, date, occurrenceDate, onDone }: { event?: CalEvent; date?: Ymd; occurrenceDate?: Ymd; onDone: () => void }) {
  const { act, toast, sync } = useApp()
  const me = useMe()!
  const today = useToday()
  const people = usePeople()
  const [title, setTitle] = useState(event?.title ?? '')
  const [category, setCategory] = useState<CalCategory>(event?.category ?? 'family')
  const [day, setDay] = useState<Ymd>(event?.date ?? date ?? today)
  const [endDay, setEndDay] = useState<string>(event?.endDate ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [start, setStart] = useState(event?.start ?? '17:00')
  const [end, setEnd] = useState(event?.end ?? '18:00')
  const [everyone, setEveryone] = useState(event?.everyone ?? false)
  const [members, setMembers] = useState<MemberId[]>(event ? event.members : [me.id])
  const [busy, setBusy] = useState(event?.busy ?? true)
  const [busyTouched, setBusyTouched] = useState(!!event)
  const [location, setLocation] = useState(event?.location ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [help, setHelp] = useState(!!event?.help)
  const [helpNote, setHelpNote] = useState(event?.help?.note ?? '')
  const [rep, setRep] = useState<RepeatState>(initialRepeat(event?.recur))
  const [ask, setAsk] = useState(false)
  const [shareDetail, setShareDetail] = useState(!!event?.shareDetail)
  const f = useFamily()
  const [trip, setTrip] = useState<TripSpec | undefined>(event?.trip)
  const [alarmOn, setAlarmOn] = useState(event?.alarmMin != null)
  const [alarmMin, setAlarmMin] = useState(String(event?.alarmMin ?? 0))
  const travelOn = serverOn(f)
  const activeMemberIds = everyone ? people.map((p) => p.id) : members
  const linkedChild = Object.values(f.coparentLinks).find((l) => !l.deleted && activeMemberIds.includes(l.childId))

  const save = async () => {
    const t = title.trim()
    if (!t) return
    const recur = repeatToRecur(rep, day, event?.recur)
    const calId = event?.calId ?? uid('c')
    // Clear any reminder(s) already queued for this event's old date/time/title before the background resync
    // (app/calendarReminders.ts, triggered by the act() below) recomputes fresh ones - awaited, so it's done on
    // the server before that resync can possibly run, otherwise its fresh insert for the new date could race
    // with this delete-by-prefix and get wiped out along with the stale one.
    if (event) await cancelEventReminder(sync, calId)
    act(
      A.saveCal(me.id, {
        calId,
        title: t,
        date: day,
        endDate: endDay && endDay > day && !recur ? endDay : undefined,
        allDay,
        start: allDay ? undefined : start,
        end: allDay ? undefined : end > start ? end : undefined,
        members: everyone ? [] : members.length ? members : [me.id],
        everyone: everyone || undefined,
        category,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        busy,
        help: help ? { note: helpNote.trim() || 'A hand needed' } : undefined,
        recur,
        exdates: event?.exdates,
        shareDetail: linkedChild ? shareDetail : undefined,
        trip: travelOn && !allDay && trip?.placeId ? trip : travelOn ? undefined : event?.trip,
        alarmMin: travelOn ? (alarmOn ? Math.min(240, Number(alarmMin) || 0) : undefined) : event?.alarmMin,
      }),
    )
    toast(event ? 'Event updated.' : 'Added to the family calendar.')
    onDone()
  }

  const remove = async (whole: boolean) => {
    if (!event) return
    if (whole || !occurrenceDate || !event.recur) await cancelEventReminder(sync, event.calId)
    else await cancelEventOccurrenceReminder(sync, event.calId, occurrenceDate)
    act(whole || !occurrenceDate || !event.recur ? A.deleteCal(me.id, event) : A.skipOccurrence(me.id, event, occurrenceDate))
    toast(whole ? 'Event removed.' : 'That day was removed.')
    onDone()
  }

  return (
    <>
      <label className="field">
        <span>What's happening?</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Swimming lesson" maxLength={80} autoFocus={!event} />
      </label>
      <div className="chips">
        {CATS.map((c) => (
          <button key={c} type="button" className={`chip small${category === c ? ' selected' : ''}`} onClick={() => setCategory(c)}>
            {CAT_EMOJI[c]} {CAT_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="field">
        <span>Who's involved</span>
        <MemberChips members={people} value={members} multi onChange={setMembers} everyone={{ active: everyone, onToggle: () => setEveryone((e) => !e) }} />
      </div>
      <label className="switch-row">
        <span className="sr-main">
          <strong>All day</strong>
        </span>
        <input
          type="checkbox"
          className="switch"
          checked={allDay}
          onChange={(e) => {
            setAllDay(e.target.checked)
            if (!busyTouched) setBusy(!e.target.checked)
          }}
        />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Date</span>
          <input type="date" className="tbox" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        {allDay || rep.kind !== 'none' ? (
          rep.kind === 'none' ? (
            <label className="field">
              <span>Until (optional)</span>
              <input type="date" className="tbox" value={endDay} min={day} onChange={(e) => setEndDay(e.target.value)} />
            </label>
          ) : (
            <span />
          )
        ) : null}
      </div>
      {!allDay && (
        <div className="grid2">
          <label className="field">
            <span>Starts</span>
            <input type="time" className="tbox" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="field">
            <span>Ends</span>
            <input type="time" className="tbox" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
      )}
      <RepeatPicker value={rep} onChange={setRep} />
      <label className="switch-row">
        <span className="sr-main">
          <strong>Busy</strong>
          <small className="muted">Blocks their time so nobody plans over it</small>
        </span>
        <input type="checkbox" className="switch" checked={busy} onChange={(e) => (setBusy(e.target.checked), setBusyTouched(true))} />
      </label>
      <label className="switch-row">
        <span className="sr-main">
          <strong>I need a hand</strong>
          <small className="muted">A lift, cover, someone to be there</small>
        </span>
        <input type="checkbox" className="switch" checked={help} onChange={(e) => setHelp(e.target.checked)} />
      </label>
      {help && <input className="tbox" value={helpNote} onChange={(e) => setHelpNote(e.target.value)} placeholder="e.g. Need someone to pick her up at 5" maxLength={100} />}
      <label className="field">
        <span>Where</span>
        <input className="tbox" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="optional" maxLength={80} />
      </label>
      <label className="field">
        <span>Notes</span>
        <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" maxLength={200} />
      </label>
      {travelOn && (
        <details className="getting-there" open={!!trip || alarmOn}>
          <summary>Getting there and alarm</summary>
          <TripEditor value={trip} onChange={setTrip} timed={!allDay} defaultMode={modeOf(f, me.id)} />
          {trip && event && <TripStatus refId={event.calId} date={occurrenceDate ?? event.date} members={event.everyone ? people.map((p) => p.id) : event.members} />}
          <label className="switch-row">
            <span className="sr-main">
              <strong>Alarm on the speakers</strong>
              <small className="muted">{trip ? 'Minutes before leave time' : 'Minutes before it starts'}</small>
            </span>
            <input type="checkbox" className="switch" checked={alarmOn} onChange={(e) => setAlarmOn(e.target.checked)} />
          </label>
          {alarmOn && <input className="tbox slim" inputMode="numeric" aria-label="Minutes before" value={alarmMin} onChange={(e) => setAlarmMin(e.target.value.replace(/\D/g, ''))} />}
        </details>
      )}
      {travelOn && !allDay && (
        <PlanHelp
          title={title}
          draft={{ date: day, start, end, members: members.length ? members : [me.id], everyone, trip: trip?.placeId && trip.mode !== 'none' ? trip : undefined, calId: event?.calId }}
          onPick={(s, e) => (setStart(s), setEnd(e))}
        />
      )}
      {linkedChild && (
        <label className="switch-row">
          <span className="sr-main">
            <strong>Share details with {linkedChild.label || 'other home'}</strong>
            <small className="muted">Off: {linkedChild.label || 'the other home'} only sees this as busy time. On: they also see the title, notes and location.</small>
          </span>
          <input type="checkbox" className="switch" checked={shareDetail} onChange={(e) => setShareDetail(e.target.checked)} />
        </label>
      )}
      <button type="button" className="btn primary big block" disabled={!title.trim()} onClick={save}>
        <Icon name="check" size={20} /> {event ? 'Save' : 'Add to calendar'}
      </button>
      {event && <CommentThread targetId={event.calId} />}
      {event && !ask && (
        <button type="button" className="btn ghost block" onClick={() => (event.recur ? setAsk(true) : remove(true))}>
          <Icon name="trash" size={18} /> Remove
        </button>
      )}
      {event && ask && (
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={() => remove(false)}>
            Only {occurrenceDate ? friendlyDay(occurrenceDate, today) : 'this day'}
          </button>
          <button type="button" className="btn danger" onClick={() => remove(true)}>
            The whole series
          </button>
        </div>
      )}
    </>
  )
}

// ------------------------------------------------------------------- task line

/** One row of someone's list: circle, title, a line of detail, coins and (optionally) a timer button. */
export function TaskLine({
  row,
  onToggle,
  onTimer,
  onOpen,
  canTick,
  dateLabel,
}: {
  row: TaskRow
  onToggle: () => void
  onTimer?: () => void
  onOpen: () => void
  canTick: boolean
  dateLabel?: string
}) {
  const t = row.task
  const d = row.done
  const finished = !!d && d.status !== 'rejected'
  const sub: string[] = []
  if (t.subject && t.kind === 'homework') sub.push(t.subject)
  if (row.slipped && t.doOn) sub.push(`planned for ${dayName(t.doOn)}`)
  if (row.dueIn !== undefined && !finished)
    sub.push(row.overdue ? `${Math.abs(row.dueIn)} day${Math.abs(row.dueIn) === 1 ? '' : 's'} late` : row.dueIn === 0 ? 'due today' : row.dueIn === 1 ? 'due tomorrow' : `due in ${row.dueIn} days`)
  if (t.time) sub.push(t.time)
  if (t.minutes) sub.push(`${t.minutes} min`)
  if (dateLabel) sub.push(dateLabel)
  return (
    <li className={`task-line${finished ? ' done' : ''}${row.overdue ? ' overdue' : ''}${d?.status === 'rejected' ? ' redo' : ''}`}>
      <CheckCircle done={finished} pending={d?.status === 'pending'} onClick={onToggle} label={finished ? `Undo ${t.title}` : `Done: ${t.title}`} disabled={!canTick} />
      <button type="button" className="tl-main" onClick={onOpen}>
        <strong>{t.title}</strong>
        <small>
          {sub.join(' · ')}
          {d?.status === 'pending' && ` ${sub.length ? '· ' : ''}waiting for a parent to check`}
          {d?.status === 'rejected' && ` ${sub.length ? '· ' : ''}${d.checkNote ? `try again: ${d.checkNote}` : 'try again'}`}
        </small>
      </button>
      {t.coins > 0 && <Coins n={t.coins} tone={finished ? 'good' : 'xp'} />}
      {onTimer && !finished && canTick && (
        <button type="button" className="icon-btn tl-timer" onClick={onTimer} aria-label={`Start a timer for ${t.title}`}>
          <Icon name="timer" size={22} />
        </button>
      )}
    </li>
  )
}

export function Group({ title, children, count }: { title: ReactNode; children: ReactNode; count?: number }) {
  return (
    <section className="group">
      <h3 className="group-title">
        {title}
        {count !== undefined && <span className="count-pill">{count}</span>}
      </h3>
      <ul className="task-list">{children}</ul>
    </section>
  )
}
