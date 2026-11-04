import { useMemo, useState } from 'react'
import { HelpHead } from '@/ui/ux'
import { HouseSessions } from '@/screens/house/HouseSessions'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { fmtDuration, ymdOf, ago, friendlyDay } from '@/family/dates'
import { describeRecurrence } from '@/family/recur'
import { SESSION_TEMPLATES, type SessionTemplate } from '@/family/sessionTemplates'
import {
  activeRunFor,
  finishedRunsOf,
  liveRoutines,
  minLabel,
  parseSteps,
  plannedMinutes,
  routineDoneOn,
  runView,
  sessionStepsOn,
  startBy,
  stepsAtTypicalTimes,
  typicalSec,
  runOf,
} from '@/family/routines'
import type { DayPart, Member, MemberId, RoutineEvent, RoutineStep, Ymd } from '@/family/types'
import { Avatar, MemberChips } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { fmtClock } from '@/family/timers'
import { RepeatPicker, initialRepeat, repeatToRecur, usePeople, type RepeatState } from '@/screens/family/shared'

/** Sessions: saved lists of steps you work through in order against the clock (a morning routine, a tidy, admin hour). */
export function Sessions() {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(30_000)
  const today = ymdOf(now)
  // A project's planned sessions are listed in the project (and show on their day), not here.
  const routines = liveRoutines(f).filter((r) => !r.project)
  const active = activeRunFor(f, me.id, now)
  const [picking, setPicking] = useState(false)
  const [edit, setEdit] = useState<{ routine?: RoutineEvent; template?: SessionTemplate } | undefined>()

  const start = (r: RoutineEvent) => {
    if (active) {
      toast('Finish or stop your current session first.')
      nav(`/run/${active.id}`)
      return
    }
    const { runId, events } = P.startRun(me.id, me.id, P.runSourceFor(f, r, ymdOf(Date.now())), Date.now())
    if (!events.length) return toast(r.plants ? 'No plants are due a water right now.' : 'Add a step first.')
    act(events)
    nav(`/run/${runId}`)
  }

  return (
    <>
      {active && <ActiveBanner runId={active.id} />}

      <HouseSessions />

      <HelpHead
        title="Sessions" helpId="plan.sessions" help="A list of steps to work through in order, with the clock running: a morning routine, a tidy, an admin hour."
        action={
          <button type="button" className="btn small" onClick={() => setPicking(true)}>
            <Icon name="plus" size={16} /> New
          </button>
        }
      />

      {routines.length === 0 && (
        <div className="card callout">
          <Icon name="timer" size={26} />
          <div>
            <h3>No sessions yet</h3>
            <p className="muted">Start from a ready-made one and change it to suit, or build your own. You can also make one from things in your Brain dump.</p>
            <button type="button" className="btn primary small" onClick={() => setPicking(true)}>
              Choose one
            </button>
          </div>
        </div>
      )}

      {routines.map((r) => (
        <SessionCard
          key={r.routineId}
          r={r}
          f={f}
          today={today}
          now={now}
          onStart={() => start(r)}
          onEdit={() => setEdit({ routine: r })}
          owner={r.ownerId ? f.members[r.ownerId] : undefined}
          live={active?.routineId === r.routineId ? active.id : undefined}
        />
      ))}

      <Sheet open={picking} onClose={() => setPicking(false)} title="New session">
        <button
          type="button"
          className="card pick-row"
          onClick={() => {
            setPicking(false)
            setEdit({})
          }}
        >
          <span className="plan-emoji">✏️</span>
          <div className="grow">
            <strong>Start from scratch</strong>
            <p className="muted small">Add your own steps.</p>
          </div>
          <Icon name="chevron" size={18} />
        </button>
        {SESSION_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="card pick-row"
            onClick={() => {
              setPicking(false)
              setEdit({ template: t })
            }}
          >
            <span className="plan-emoji">{t.emoji}</span>
            <div className="grow">
              <strong>{t.title}</strong>
              <p className="muted small">
                {t.steps.length} steps · {fmtDuration(plannedMinutes(t.steps))}
              </p>
            </div>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </Sheet>

      {edit && <SessionEditor key={edit.routine?.routineId ?? edit.template?.id ?? 'new'} routine={edit.routine} template={edit.template} today={today} onClose={() => setEdit(undefined)} />}
    </>
  )
}

/** Shown on the plan screen and Today when a session is under way. */
export function ActiveBanner({ runId }: { runId: string }) {
  const nav = useNavigate()
  const f = useFamily()
  const now = useNow(1000)
  const run = runOf(f, runId)
  if (!run) return null
  const v = runView(run, now)
  const over = v.stepLeftSec < 0
  return (
    <button type="button" className={`card run-banner${run.status === 'paused' ? ' paused' : ''}${over ? ' over' : ''}`} onClick={() => nav(`/run/${run.id}`)}>
      <span className="plan-emoji">{run.emoji ?? '⏱️'}</span>
      <div className="grow">
        <strong>{run.title}</strong>
        <p className="muted small">
          {run.status === 'paused' ? 'Paused' : v.current ? `${v.current.step.emoji ?? ''} ${v.current.step.title}` : 'Nearly there'} · {v.done + v.skipped} of {v.total}
        </p>
      </div>
      <span className="run-banner-clock">
        {over ? '+' : ''}
        {fmtClock(Math.abs(v.stepLeftSec))}
      </span>
      <Icon name="chevron" size={18} />
    </button>
  )
}

function SessionCard({
  r,
  f,
  today,
  now,
  onStart,
  onEdit,
  owner,
  live,
}: {
  r: RoutineEvent
  f: ReturnType<typeof useFamily>
  today: Ymd
  now: number
  onStart: () => void
  onEdit: () => void
  owner?: Member
  live?: string
}) {
  const nav = useNavigate()
  const steps = sessionStepsOn(f, r, today)
  const mins = plannedMinutes(steps)
  const by = startBy(r.finishBy, steps)
  const last = finishedRunsOf(f, r.routineId)[0]
  const doneToday = routineDoneOn(f, r.routineId, today)
  const sched = r.date ? [r.recur ? describeRecurrence(r.recur) : friendlyDay(r.date, today), r.startAt].filter(Boolean).join(' · ') : ''
  return (
    <article className="card session-card">
      <div className="session-top">
        <span className="plan-emoji">{r.emoji ?? '⏱️'}</span>
        <div className="grow">
          <strong>{r.title}</strong>
          <p className="muted small">
            {r.homework ? `Today's planned homework: ${steps.filter((x) => x.taskId).length} piece${steps.filter((x) => x.taskId).length === 1 ? '' : 's'}` : r.plants ? `${steps.length} plant${steps.length === 1 ? '' : 's'} due a water` : `${steps.length} steps`} ·{' '}
            {fmtDuration(mins)}
            {r.finishBy ? ` · finish by ${r.finishBy}${by ? ` (start by ${by})` : ''}` : ''}
          </p>
          {sched && <p className="muted small">🗓️ {sched}</p>}
          {last && (
            <p className="muted small">
              Last done {ago(last.endedTs ?? last.startedTs, now)} · took {fmtDuration(Math.round(runView(last, now).elapsedSec / 60))}
            </p>
          )}
        </div>
        {owner && <Avatar m={owner} size={28} />}
      </div>
      <div className="btn-row">
        {live ? (
          <button type="button" className="btn primary" onClick={() => nav(`/run/${live}`)}>
            <Icon name="play" size={18} /> Continue
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onStart}>
            <Icon name="play" size={18} /> {doneToday ? 'Go again' : 'Start'}
          </button>
        )}
        <button type="button" className="btn ghost" onClick={onEdit}>
          <Icon name="pencil" size={16} /> Edit
        </button>
        {doneToday && <span className="pill tone-good">Done today</span>}
      </div>
    </article>
  )
}

// ------------------------------------------------------------------- editor

const partOf = (hm: string): DayPart => (!hm ? 'any' : hm < '12:00' ? 'morning' : hm < '17:00' ? 'afternoon' : 'evening')
const stepBy = (m: number): number => (m >= 20 ? 5 : 1)
const roundHalf = (m: number): number => Math.max(0.5, Math.round(m * 2) / 2)

interface Draft {
  title: string
  emoji: string
  owner: MemberId | ''
  steps: RoutineStep[]
  finishBy: string
  scheduled: boolean
  date: string
  startAt: string
  rep: RepeatState
  coinsOn: boolean
  coins: string
}

function SessionEditor({ routine, template, today, onClose }: { routine?: RoutineEvent; template?: SessionTemplate; today: Ymd; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople().filter((p) => p.role !== 'baby')
  const linked = routine?.taskId ? f.tasks[routine.taskId] : undefined
  const [d, setD] = useState<Draft>(() => ({
    title: routine?.title ?? template?.title ?? '',
    emoji: routine?.emoji ?? template?.emoji ?? '⏱️',
    owner: routine?.ownerId ?? (routine || template ? '' : me.id),
    steps: routine ? routine.steps.map((s) => ({ ...s })) : (template?.steps ?? []).map((s) => ({ id: P.newStepId(), title: s.title, minutes: s.minutes, emoji: s.emoji, ...(s.habitsSlot ? { habitsSlot: s.habitsSlot } : {}) })),
    finishBy: routine?.finishBy ?? template?.finishBy ?? '',
    scheduled: !!routine?.date,
    date: routine?.date ?? today,
    startAt: routine?.startAt ?? '',
    rep: initialRepeat(routine?.recur),
    coinsOn: !!linked && !linked.deleted,
    coins: linked && !linked.deleted ? String(linked.coins) : '5',
  }))
  const [paste, setPaste] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }))
  const setStep = (id: string, patch: Partial<RoutineStep>) => set({ steps: d.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const move = (i: number, by: -1 | 1) => {
    const j = i + by
    if (j < 0 || j >= d.steps.length) return
    const next = [...d.steps]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    set({ steps: next })
  }
  const addSteps = () => {
    const parsed = parseSteps(paste)
    if (!parsed.length) return
    set({ steps: [...d.steps, ...parsed.map((p) => ({ id: P.newStepId(), title: p.title, minutes: p.minutes }))] })
    setPaste('')
  }
  const typical = useMemo(() => (routine ? typicalSec(f, routine.routineId) : {}), [f, routine])
  const nTypical = Object.keys(typical).length
  const history = routine ? finishedRunsOf(f, routine.routineId).slice(0, 5) : []
  const ownerMember = d.owner ? f.members[d.owner] : undefined
  const canPay = d.scheduled && ownerMember?.role === 'child'
  const total = plannedMinutes(d.steps)
  const by = startBy(d.finishBy || undefined, d.steps)

  const save = () => {
    const steps = d.steps.filter((s) => s.title.trim())
    if (!d.title.trim()) return toast('Give it a name.')
    if (!steps.length && !routine?.homework && !routine?.plants) return toast('Add at least one step.')
    const routineId = routine?.routineId ?? P.newRoutineId()
    const now = Date.now()
    const date = (d.date || today) as Ymd
    const recur = d.scheduled ? repeatToRecur(d.rep, date, routine?.recur) : undefined
    let taskId: string | undefined
    const out = []
    if (canPay && d.coinsOn && d.owner) {
      taskId = routine?.taskId ?? `sess-${routineId}`
      out.push(
        ...A.saveTask(
          me.id,
          {
            taskId,
            title: d.title.trim(),
            assignee: d.owner,
            kind: 'routine',
            part: partOf(d.startAt),
            date,
            time: undefined,
            minutes: Math.max(1, Math.round(total)),
            coins: Math.max(0, Math.round(Number(d.coins) || 0)),
            check: 'self',
            recur,
            exdates: routine?.exdates,
          },
          now + 1,
        ),
      )
    } else if (linked && !linked.deleted) out.push(...A.deleteTask(me.id, linked, now + 1))
    out.unshift(
      ...P.saveRoutine(
        me.id,
        {
          routineId,
          title: d.title,
          emoji: d.emoji.trim() || undefined,
          ownerId: d.owner || undefined,
          steps: routine?.homework || routine?.plants ? [] : steps,
          homework: routine?.homework || undefined,
          plants: routine?.plants || undefined,
          finishBy: d.finishBy || undefined,
          startAt: d.scheduled ? d.startAt || undefined : undefined,
          date: d.scheduled ? date : undefined,
          recur,
          exdates: d.scheduled ? routine?.exdates : undefined,
          taskId,
          part: routine?.part,
        },
        now,
      ),
    )
    act(out)
    toast(routine ? 'Saved.' : 'Session added.')
    onClose()
  }

  const remove = () => {
    if (!routine) return
    const now = Date.now()
    act([...P.deleteRoutine(me.id, routine, now), ...(linked && !linked.deleted ? A.deleteTask(me.id, linked, now + 1) : [])])
    toast('Session deleted.')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={routine ? 'Edit session' : 'New session'}>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={d.emoji} onChange={(e) => set({ emoji: e.target.value.slice(0, 4) })} aria-label="Icon" />
        </label>
        <label className="field grow">
          <span>Name</span>
          <input className="tbox" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Morning routine" />
        </label>
      </div>

      <div className="field">
        <span>Whose is it?</span>
        <MemberChips
          members={people}
          value={d.owner ? [d.owner] : []}
          onChange={(v) => set({ owner: v[0] ?? '' })}
          everyone={{ label: 'Anyone', active: !d.owner, onToggle: () => set({ owner: '' }) }}
          size="small"
        />
      </div>

      {routine?.homework ? (
        <p className="note">The steps are whatever homework is planned for that day: each piece becomes a step, and finishing it ticks the homework off.</p>
      ) : routine?.plants ? (
        <p className="note">The steps are whichever plants are due a water when it starts (not watered for a week): each plant is a step, and finishing it counts as watering it.</p>
      ) : (
        <div className="field">
          <span>
            Steps · {d.steps.length ? `${fmtDuration(total)} in all` : 'none yet'}
            {by ? ` · start by ${by}` : ''}
          </span>
          <ol className="step-edit">
            {d.steps.map((s, i) => (
              <li key={s.id} className="step-row">
                <div className="step-line">
                  <span className="step-n">{i + 1}</span>
                  <input
                    className="tbox slim step-emoji"
                    value={s.emoji ?? ''}
                    onChange={(e) => setStep(s.id, { emoji: e.target.value.slice(0, 4) || undefined })}
                    aria-label={`Step ${i + 1} icon`}
                    placeholder="🙂"
                  />
                  <input className="tbox slim grow" value={s.title} onChange={(e) => setStep(s.id, { title: e.target.value })} aria-label={`Step ${i + 1} name`} placeholder="What to do" />
                  <button type="button" className="icon-btn small" aria-label={`Remove step ${i + 1}`} onClick={() => set({ steps: d.steps.filter((x) => x.id !== s.id) })}>
                    <Icon name="x" size={18} />
                  </button>
                </div>
                <div className="step-line sub">
                  <div className="stepper" role="group" aria-label={`Step ${i + 1} minutes`}>
                    <button type="button" onClick={() => setStep(s.id, { minutes: s.minutes <= 1 ? 0.5 : s.minutes - stepBy(s.minutes - 1) })} aria-label="Less time">
                      <Icon name="minus" size={16} />
                    </button>
                    <strong>{minLabel(s.minutes)}</strong>
                    <button type="button" onClick={() => setStep(s.id, { minutes: s.minutes < 1 ? 1 : s.minutes + stepBy(s.minutes) })} aria-label="More time">
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                  {s.habitsSlot && <small className="muted">fills with {ownerMember ? `${ownerMember.name}'s` : 'their'} {s.habitsSlot} habits that are due</small>}
                  {typical[s.id] && <small className="muted">usually {minLabel(roundHalf(typical[s.id]!.sec / 60))}</small>}
                  <span className="grow" />
                  <button type="button" className="icon-btn small" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <span className="arrow">↑</span>
                  </button>
                  <button type="button" className="icon-btn small" aria-label="Move down" disabled={i === d.steps.length - 1} onClick={() => move(i, 1)}>
                    <span className="arrow">↓</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <textarea className="tbox" rows={2} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Add steps, one per line\nBrush teeth ~2\nPack bag ~5'} aria-label="Add steps" />
          <div className="btn-row">
            <button type="button" className="btn small" onClick={addSteps} disabled={!paste.trim()}>
              <Icon name="plus" size={16} /> Add {paste.trim() ? parseSteps(paste).length : ''} step{parseSteps(paste).length === 1 ? '' : 's'}
            </button>
            {d.owner && !d.steps.some((x) => x.habitsSlot) && (
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  const part = routine?.part ?? (/(bed|evening|night)/i.test(d.title) ? 'evening' : 'morning')
                  set({ steps: [...d.steps, { id: P.newStepId(), title: part === 'morning' ? 'My morning habits' : 'My evening habits', minutes: 6, emoji: '✨', habitsSlot: part }] })
                }}
              >
                ✨ Add “My habits”
              </button>
            )}
            <button type="button" className="btn small ghost" onClick={() => set({ steps: [...d.steps, { id: P.newStepId(), title: '', minutes: 5 }] })}>
              One blank step
            </button>
            {nTypical > 0 && (
              <button type="button" className="btn small ghost" onClick={() => set({ steps: stepsAtTypicalTimes(d.steps, typical) })}>
                <Icon name="clock" size={16} /> Use my usual times
              </button>
            )}
          </div>
        </div>
      )}

      <label className="field">
        <span>Must be done by (optional: shows whether you have time to spare)</span>
        <input type="time" className="tbox" value={d.finishBy} onChange={(e) => set({ finishBy: e.target.value })} />
      </label>

      <label className="switch-row">
        <input type="checkbox" className="switch" checked={d.scheduled} onChange={(e) => set({ scheduled: e.target.checked })} />
        <span>Put it on the calendar</span>
      </label>
      {d.scheduled && (
        <>
          <div className="row-fields">
            <label className="field grow">
              <span>Starts on</span>
              <input type="date" className="tbox" value={d.date} onChange={(e) => set({ date: e.target.value })} />
            </label>
            <label className="field grow">
              <span>At</span>
              <input type="time" className="tbox" value={d.startAt} onChange={(e) => set({ startAt: e.target.value })} />
            </label>
          </div>
          <RepeatPicker value={d.rep} onChange={(rep) => set({ rep })} />
          {routine?.recur?.offDaysOnly && <p className="note">Runs on weekends and school holidays. Leave Repeat alone to keep that.</p>}
        </>
      )}
      {canPay && (
        <>
          <label className="switch-row">
            <input type="checkbox" className="switch" checked={d.coinsOn} onChange={(e) => set({ coinsOn: e.target.checked })} />
            <span>{ownerMember?.name} earns coins when they finish it</span>
          </label>
          {d.coinsOn && (
            <label className="field">
              <span>Coins</span>
              <input className="tbox" inputMode="numeric" value={d.coins} onChange={(e) => set({ coins: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
            </label>
          )}
        </>
      )}

      {history.length > 0 && (
        <div className="field">
          <span>Recent goes</span>
          <ul className="facts">
            {history.map((h) => {
              const v = runView(h, Date.now())
              const drift = Math.round(v.driftSec / 60)
              return (
                <li key={h.id}>
                  <span>{friendlyDay(h.date, ymdOf(Date.now()))}</span>
                  <strong>
                    {fmtDuration(Math.round(v.elapsedSec / 60))}
                    <small className="muted"> {drift === 0 ? 'on plan' : drift > 0 ? `${drift}m over` : `${-drift}m under`}</small>
                  </strong>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <button type="button" className="btn primary big block" onClick={save}>
        Save
      </button>
      {routine && (
        <button type="button" className="btn danger block" onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}>
          <Icon name="trash" size={16} /> {confirmDelete ? 'Tap again to delete' : 'Delete session'}
        </button>
      )}
    </Sheet>
  )
}
