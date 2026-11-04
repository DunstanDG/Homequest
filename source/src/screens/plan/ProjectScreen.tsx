import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import * as PA from '@/family/projectActions'
import { addDays, dayName, fmtDuration, friendlyDay, ymdOf } from '@/family/dates'
import { linkClusters, projectRoutines, projectSessionSteps, projectTree, readySteps, stepsToDo, waitingFor, wouldLoop, type ProjectTree } from '@/family/projects'
import { activeRunFor, minLabel, parseSteps, routineDoneOn } from '@/family/routines'
import type { ActivityEvent, FamilyState, ProjectEvent, RoutineEvent, Ymd } from '@/family/types'
import { Avatar, CheckCircle, MemberChips, ScreenHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { usePeople } from '@/screens/family/shared'
import { ProjectFields, draftOf, useBreakdown, useStartStep, type ProjectFormState } from './Projects'

/** Colours for linked clusters (activities that must be done in order), so a chain reads as one thing. */
const LINK_COLOURS = ['#4cc9f0', '#f72585', '#ffc857', '#80ed99', '#b388ff', '#ff9f68']

type PlaySheet = { rootId?: string } | undefined

/** One project: the goal, how far along it is, the activities as a tree, and its planned sessions. */
export function ProjectScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const t = id ? projectTree(f, id) : undefined
  const fRef = useRef(f)
  fRef.current = f
  const bd = useBreakdown()
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState(false)
  const [editAct, setEditAct] = useState<string | undefined>()
  const [adding, setAdding] = useState<{ parentId?: string } | undefined>()
  const [select, setSelect] = useState<Set<string> | undefined>()
  const [grouping, setGrouping] = useState(false)
  const [play, setPlay] = useState<PlaySheet>()
  const [planning, setPlanning] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(t ? [...t.info.values()].filter((n) => n.isGroup && n.complete).map((n) => n.a.activityId) : []))

  if (!t) {
    return (
      <div className="screen">
        <ScreenHead title="Project" onBack={() => nav('/plan?t=projects')} />
        <p>That project isn’t here any more.</p>
      </div>
    )
  }
  const p = t.project
  const owner = p.ownerId ? f.members[p.ownerId] : undefined
  const ready = readySteps(t, f)
  const grain = p.grain ?? 20
  const big = t.order.filter((a) => a.minutes > grain * 1.5)
  const sessions = projectRoutines(f, p.projectId)
  const upcoming = sessions.filter((r) => (r.date ?? today) >= today && !routineDoneOn(f, r.routineId, r.date ?? today))

  const mark = (ids: string[], on: boolean) =>
    setBusy((b) => {
      const n = new Set(b)
      for (const x of ids) on ? n.add(x) : n.delete(x)
      return n
    })

  /** Break down the whole project (no activity) or one activity. */
  const breakDown = async (a?: ActivityEvent) => {
    const key = a?.activityId ?? 'project'
    if (busy.has(key)) return
    mark([key], true)
    const before = fRef.current
    const added = await bd.run(before, p, a, false, () => breakDown(a))
    mark([key], false)
    if (added) {
      toast(a ? `Added ${added.length} steps inside “${a.title}”.` : `Added ${added.length} activities.`, { undo: () => act(PA.revertActivities(me.id, before, added)) })
      if (a)
        setCollapsed((c) => {
          const x = new Set(c)
          x.delete(a.activityId)
          return x
        })
    }
  }

  /** "Add detail": break down every step that's bigger than the project's step size, one after another. */
  const breakDownBig = async () => {
    const list = big.slice(0, 6)
    mark(
      list.map((a) => a.activityId),
      true,
    )
    let done = 0
    for (const a of list) {
      const added = await bd.run(fRef.current, p, a, true, () => breakDownBig())
      mark([a.activityId], false)
      if (added === undefined) break
      done++
    }
    mark(
      list.map((a) => a.activityId),
      false,
    )
    if (done) toast(`Broke down ${done} step${done === 1 ? '' : 's'}.`)
  }

  const start = (rootId?: string, minutes?: number) => {
    const live = activeRunFor(f, me.id, Date.now())
    if (live) {
      toast('Finish or stop your current session first.')
      nav(`/run/${live.id}`)
      return
    }
    const { runId, events } = P.startRun(me.id, me.id, PA.playSource(t, rootId, minutes), Date.now())
    if (!events.length) return toast('Nothing left to do there.')
    act(events)
    nav(`/run/${runId}`)
  }

  const startSession = (r: RoutineEvent) => {
    const live = activeRunFor(f, me.id, Date.now())
    if (live) return nav(`/run/${live.id}`)
    const { runId, events } = P.startRun(me.id, me.id, P.runSourceFor(f, r, today), Date.now())
    if (!events.length) return toast('Everything in that session is already done.')
    act(events)
    nav(`/run/${runId}`)
  }

  const startStep = useStartStep()
  const [whole, setWhole] = useState(false)
  const tick = (a: ActivityEvent, done: boolean) => {
    // A "Plan a thing" step is also a task on someone's day: ticking the step ticks that too, so it leaves their Today.
    const lt = f.tasks[`plan-${a.activityId}`]
    const taskEvs = done && lt && !lt.deleted && !f.done[`${lt.taskId}|${lt.date ?? 'any'}`] ? A.completeTask(me.id, f, lt, lt.date ?? 'any', { minutes: a.minutes }, Date.now() + 1) : []
    const evs = [...PA.tickActivity(me.id, f, a, done, Date.now()), ...taskEvs]
    act(evs)
    if (done) toast(`Done: ${a.title}`, { undo: () => act(P.undoEvents(me.id, evs)) })
  }

  const toggleSelect = (a: ActivityEvent) =>
    setSelect((s) => {
      const n = new Set(s)
      if (n.has(a.activityId)) n.delete(a.activityId)
      else n.add(a.activityId)
      return n
    })
  const selected = select ? [...select].map((x) => f.activities[x]).filter((a): a is ActivityEvent => !!a) : []
  const sameLevel = selected.length > 1 && selected.every((a) => (a.parentId ?? '') === (selected[0]!.parentId ?? ''))
  const groupLoops =
    sameLevel &&
    PA.groupWouldLoop(
      f,
      selected.map((a) => a.activityId),
    )

  const row = (a: ActivityEvent, depth: number, cluster: Map<string, number>) => {
    const n = t.info.get(a.activityId)
    if (!n) return null
    const waits = n.complete ? [] : waitingFor(t, f, a.activityId)
    // Only its own links are spelled out; waiting because the group it's in is waiting shows on the group's row.
    const ownWaits = waits.filter((w) => a.after.includes(w.activityId))
    const c = cluster.get(a.activityId)
    const open = n.isGroup && !collapsed.has(a.activityId)
    const kidsCluster = n.isGroup ? linkClusters(n.kids) : new Map<string, number>()
    const style = c !== undefined ? ({ '--link': LINK_COLOURS[c % LINK_COLOURS.length] } as CSSProperties) : undefined
    return (
      <li key={a.activityId} className={`act-row${n.complete ? ' done' : ''}${waits.length ? ' waiting' : ''}${c !== undefined ? ' linked' : ''}${n.isGroup ? ' group' : ''}`} style={style}>
        <div className="act-line">
          {select ? (
            <input type="checkbox" className="act-select" checked={select.has(a.activityId)} onChange={() => toggleSelect(a)} aria-label={`Select ${a.title}`} />
          ) : n.isGroup ? (
            <button
              type="button"
              className={`act-caret${open ? ' open' : ''}`}
              aria-expanded={open}
              aria-label={open ? `Hide what’s in ${a.title}` : `Show what’s in ${a.title}`}
              onClick={() =>
                setCollapsed((s) => {
                  const x = new Set(s)
                  if (x.has(a.activityId)) x.delete(a.activityId)
                  else x.add(a.activityId)
                  return x
                })
              }
            >
              <Icon name="chevron" size={16} />
            </button>
          ) : (
            <CheckCircle done={n.complete} onClick={() => tick(a, !n.complete)} label={n.complete ? `Not done: ${a.title}` : `Done: ${a.title}`} />
          )}
          <button type="button" className="act-main" onClick={() => (select ? toggleSelect(a) : setEditAct(a.activityId))}>
            <span className="act-title">
              {a.title}
              {a.ai && (
                <span className="act-ai" title="Suggested by AI">
                  {' '}
                  ✨
                </span>
              )}
            </span>
            <span className="act-meta">
              {n.isGroup ? `${n.stepsDone}/${n.stepsTotal} done · ${n.complete ? 'finished' : 'in progress'}` : minLabel(a.minutes)}
              {ownWaits.length > 0 && <span className="act-wait"> · 🔒 after {ownWaits.map((w) => w.title).join(', ')}</span>}
            </span>
          </button>
          {busy.has(a.activityId) ? (
            <span className="act-busy" aria-label="Breaking down">
              <Icon name="sparkle" size={16} />
            </span>
          ) : (
            n.isGroup &&
            !n.complete &&
            !select && (
              <button type="button" className="icon-btn small" aria-label={`Play ${a.title}`} onClick={() => setPlay({ rootId: a.activityId })}>
                <Icon name="play" size={16} />
              </button>
            )
          )}
        </div>
        {open && (
          <ul className="act-kids">
            {n.kids.map((k) => row(k, depth + 1, kidsCluster))}
            {!select && (
              <li>
                <button type="button" className="link-btn act-add" onClick={() => setAdding({ parentId: a.activityId })}>
                  + Add a step inside
                </button>
              </li>
            )}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="screen plan project-screen">
      <ScreenHead
        title={
          <>
            {p.emoji ?? '🎯'} {p.title}
          </>
        }
        eyebrow="Project"
        onBack={() => nav('/plan?t=projects')}
        right={
          <button type="button" className="icon-btn" aria-label="Edit project" onClick={() => setEditing(true)}>
            <Icon name="pencil" />
          </button>
        }
      />

      {((p.goal && p.goal !== p.title) || t.stepsTotal > 0) && (
        <section className="card project-head">
          {p.goal && p.goal !== p.title && <p className="project-goal">{p.goal}</p>}
          {t.stepsTotal > 0 && (
            <>
              {ready[0] ? (
                <div className="project-next-up">
                  <p className="eyebrow">Next</p>
                  <div className="proj-next-card">
                    <CheckCircle done={false} onClick={() => tick(ready[0]!, true)} label={`Done: ${ready[0]!.title}`} />
                    <span className="grow">
                      <strong>{ready[0]!.title}</strong> <small className="muted">(~{minLabel(ready[0]!.minutes)})</small>
                    </span>
                    {owner && <Avatar m={owner} size={24} />}
                  </div>
                  <button type="button" className="btn primary block" onClick={() => startStep(t, ready[0]!)}>
                    <Icon name="play" size={18} /> Start
                  </button>
                </div>
              ) : (
                <p className="muted small">{t.order.length === 0 ? 'Every step is done. Lovely.' : 'The next step is waiting on another one.'}</p>
              )}
              <p className="proj-steps-line">{t.stepsDone} of {t.stepsTotal} steps done</p>
              <Bar value={t.stepsDone / t.stepsTotal} tone={t.stepsDone === t.stepsTotal ? 'good' : 'accent'} />
            </>
          )}
          {t.roots.length > 0 && (
            <button type="button" className="link-btn wide" aria-expanded={whole} onClick={() => setWhole(!whole)}>
              {whole ? 'Hide the whole plan' : 'Show the whole plan'}
            </button>
          )}
          {whole && t.order.length > 0 && (
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setPlay({})}>
                <Icon name="play" size={16} /> Play several
              </button>
              <button type="button" className="btn" onClick={() => setPlanning(true)}>
                <Icon name="calendar" size={16} /> Plan sessions
              </button>
            </div>
          )}
          {t.stepsTotal > 0 && t.order.length === 0 && p.status !== 'done' && (
            <button type="button" className="btn primary block" onClick={() => act(PA.saveProject(me.id, { ...p, status: 'done' }, Date.now()).events)}>
              <Icon name="trophy" size={18} /> Mark the project finished
            </button>
          )}
        </section>
      )}

      {bd.errorCard}

      {t.roots.length === 0 ? (
        <div className="card callout">
          <Icon name="sparkle" size={26} />
          <div>
            <h3>Break it down</h3>
            <p className="muted">Ask AI to suggest the activities (you can change all of them), or add your own.</p>
            <div className="btn-row">
              <button type="button" className="btn primary small" disabled={busy.has('project')} onClick={() => breakDown()}>
                <Icon name="sparkle" size={16} /> {busy.has('project') ? 'Thinking…' : 'Break it down with AI'}
              </button>
              <button type="button" className="btn small ghost" onClick={() => setAdding({})}>
                Add my own
              </button>
            </div>
          </div>
        </div>
      ) : !whole ? null : (
        <>
          {big.length > 0 && !select && (
            <div className="card act-detail">
              <p className="small">
                <strong>
                  {big.length} step{big.length === 1 ? ' is' : 's are'} bigger than {fmtDuration(grain)}.
                </strong>{' '}
                Break {big.length === 1 ? 'it' : 'them'} down a level for smaller, easier steps.
              </p>
              <button type="button" className="btn small" disabled={big.some((a) => busy.has(a.activityId))} onClick={breakDownBig}>
                <Icon name="sparkle" size={16} /> {big.some((a) => busy.has(a.activityId)) ? 'Breaking down…' : big.length > 6 ? 'Break down the first 6' : 'Break them down'}
              </button>
            </div>
          )}

          <div className="row-between act-head">
            <h2 className="project-h2">Activities</h2>
            <div className="btn-row tight">
              {select ? (
                <button type="button" className="btn small ghost" onClick={() => setSelect(undefined)}>
                  Cancel
                </button>
              ) : (
                <>
                  <button type="button" className="btn small ghost" onClick={() => setSelect(new Set())}>
                    Group…
                  </button>
                  <button type="button" className="btn small" onClick={() => setAdding({})}>
                    <Icon name="plus" size={16} /> Add
                  </button>
                </>
              )}
            </div>
          </div>
          {select && <p className="note">Tick activities at the same level to put them in a group you can play together.</p>}
          <ul className="act-tree">{t.roots.map((a) => row(a, 0, linkClusters(t.roots)))}</ul>
          {!select && (
            <button type="button" className="link-btn act-add" disabled={busy.has('project')} onClick={() => breakDown()}>
              ✨ {busy.has('project') ? 'Thinking…' : 'Suggest more activities'}
            </button>
          )}
          {select && (
            <div className="act-select-bar card">
              <span className="grow small">{selected.length ? `${selected.length} selected` : 'None selected'}</span>
              {groupLoops && <span className="small act-wait">Something in between is linked: select it too</span>}
              {selected.length > 1 && !sameLevel && <span className="small act-wait">Pick ones at the same level</span>}
              <button type="button" className="btn primary small" disabled={!sameLevel || groupLoops} onClick={() => setGrouping(true)}>
                Group {selected.length > 1 ? selected.length : ''}
              </button>
            </div>
          )}
        </>
      )}

      {whole && sessions.length > 0 && (
        <>
          <h2 className="project-h2">Planned sessions</h2>
          {upcoming.length === 0 && <p className="note">All the planned sessions are behind you. Plan more when you’re ready.</p>}
          {upcoming.map((r) => (
            <SessionRow key={r.routineId} r={r} f={f} today={today} onStart={() => startSession(r)} />
          ))}
        </>
      )}

      {editing && <EditProject p={p} onClose={() => setEditing(false)} onDeleted={() => nav('/plan?t=projects')} />}
      {editAct && f.activities[editAct] && !f.activities[editAct]!.deleted && (
        <ActivityEditor
          key={editAct}
          t={t}
          a={f.activities[editAct]!}
          busy={busy.has(editAct)}
          onClose={() => setEditAct(undefined)}
          onBreakDown={(a) => {
            setEditAct(undefined)
            void breakDown(a)
          }}
          onAddInside={(a) => {
            setEditAct(undefined)
            setAdding({ parentId: a.activityId })
          }}
          onPlay={(a) => {
            setEditAct(undefined)
            setPlay({ rootId: a.activityId })
          }}
        />
      )}
      {adding && <AddSteps t={t} parentId={adding.parentId} onClose={() => setAdding(undefined)} />}
      {grouping && (
        <GroupSheet
          count={selected.length}
          onClose={() => setGrouping(false)}
          onSave={(title) => {
            const g = PA.groupActivities(
              me.id,
              f,
              selected.map((a) => a.activityId),
              title,
              Date.now(),
            )
            act(g.events)
            setGrouping(false)
            setSelect(undefined)
            toast('Grouped.', { undo: () => act(PA.revertActivities(me.id, f, g.events)) })
          }}
        />
      )}
      {play && <PlaySheetView t={t} rootId={play.rootId} f={f} onClose={() => setPlay(undefined)} onStart={(mins) => start(play.rootId, mins)} />}
      {planning && <PlanSheet t={t} today={today} onClose={() => setPlanning(false)} />}
      {bd.sheet}
    </div>
  )
}

function SessionRow({ r, f, today, onStart }: { r: RoutineEvent; f: FamilyState; today: Ymd; onStart: () => void }) {
  const steps = projectSessionSteps(f, r)
  const owner = r.ownerId ? f.members[r.ownerId] : undefined
  const mins = steps.reduce((s, x) => s + x.minutes, 0)
  return (
    <article className="card session-card">
      <div className="session-top">
        <span className="plan-emoji">{r.emoji ?? '🎯'}</span>
        <div className="grow">
          <strong>
            {r.date ? friendlyDay(r.date, today) : 'Any time'}
            {r.startAt ? ` · ${r.startAt}` : ''}
          </strong>
          <p className="muted small">
            {steps.length
              ? `${steps.length} step${steps.length === 1 ? '' : 's'} · ${fmtDuration(Math.round(mins))} · ${steps
                  .slice(0, 2)
                  .map((s) => s.title)
                  .join(', ')}${steps.length > 2 ? '…' : ''}`
              : 'Everything in it is done'}
          </p>
        </div>
        {owner && <Avatar m={owner} size={26} />}
      </div>
      {steps.length > 0 && r.date === today && (
        <button type="button" className="btn primary small" onClick={onStart}>
          <Icon name="play" size={16} /> Start
        </button>
      )}
    </article>
  )
}

// ------------------------------------------------------------------ sheets

function EditProject({ p, onClose, onDeleted }: { p: ProjectEvent; onClose: () => void; onDeleted: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople().filter((x) => x.role === 'parent' || x.role === 'child')
  const [d, setD] = useState<ProjectFormState>({
    title: p.title,
    emoji: p.emoji ?? '🎯',
    goal: p.goal,
    context: p.context ?? '',
    owner: p.ownerId ?? '',
    grain: p.grain ?? 20,
    daily: p.dailyMinutes,
    skill: p.skill,
  })
  const [confirm, setConfirm] = useState(false)
  const set = (x: Partial<ProjectFormState>) => setD((y) => ({ ...y, ...x }))
  const save = (status = p.status) => {
    act(PA.saveProject(me.id, { ...draftOf(d), projectId: p.projectId, created: p.created, status }, Date.now()).events)
    toast('Saved.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Edit project">
      <ProjectFields d={d} set={set} people={people} />
      <button type="button" className="btn primary big block" onClick={() => save()}>
        Save
      </button>
      <div className="btn-row">
        {p.status === 'done' || p.status === 'archived' ? (
          <button type="button" className="btn ghost" onClick={() => save('active')}>
            Bring it back
          </button>
        ) : (
          <>
            <button type="button" className="btn ghost" onClick={() => save('done')}>
              <Icon name="trophy" size={16} /> Finished
            </button>
            <button type="button" className="btn ghost" onClick={() => save('archived')}>
              Put away
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        className="btn danger block"
        onClick={() => {
          if (!confirm) return setConfirm(true)
          act(PA.deleteProject(me.id, f, p, Date.now()))
          toast('Project deleted.')
          onDeleted()
        }}
      >
        <Icon name="trash" size={16} /> {confirm ? 'Tap again to delete it and its planned sessions' : 'Delete project'}
      </button>
    </Sheet>
  )
}

const stepBy = (m: number): number => (m >= 60 ? 15 : m >= 20 ? 5 : 1)

function ActivityEditor({
  t,
  a,
  busy,
  onClose,
  onBreakDown,
  onAddInside,
  onPlay,
}: {
  t: ProjectTree
  a: ActivityEvent
  busy: boolean
  onClose: () => void
  onBreakDown: (a: ActivityEvent) => void
  onAddInside: (a: ActivityEvent) => void
  onPlay: (a: ActivityEvent) => void
}) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const n = t.info.get(a.activityId)
  const siblings = ((a.parentId ? t.info.get(a.parentId)?.kids : t.roots) ?? []).filter((s) => s.activityId !== a.activityId)
  const [title, setTitle] = useState(a.title)
  const [description, setDescription] = useState(a.description ?? '')
  const [minutes, setMinutes] = useState(a.minutes)
  const [after, setAfter] = useState<string[]>(a.after.filter((x) => siblings.some((s) => s.activityId === x)))
  const [confirm, setConfirm] = useState(false)
  const all = useMemo(() => [...siblings, a], [siblings, a])

  const save = () => {
    act(PA.saveActivity(me.id, f, a, { title, description, minutes, after }, Date.now()))
    onClose()
  }
  const pos = ((a.parentId ? t.info.get(a.parentId)?.kids : t.roots) ?? []).findIndex((x) => x.activityId === a.activityId)
  const levelLen = siblings.length + 1
  const move = (by: -1 | 1) => {
    const evs = PA.moveActivity(me.id, f, a, by, Date.now())
    if (!evs.length) return toast('It’s linked to the one next to it, so it stays in that order.')
    act(evs)
  }
  return (
    <Sheet open onClose={onClose} title={n?.isGroup ? 'Group' : 'Activity'}>
      <label className="field">
        <span>What</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>Details (optional)</span>
        <textarea className="tbox" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What to do, and what “done” looks like" />
      </label>
      {n?.isGroup ? (
        <p className="note">
          {n.stepsTotal} steps inside · {fmtDuration(n.minutes)} in all · {n.stepsDone} done
        </p>
      ) : (
        <div className="field">
          <span>About how long</span>
          <div className="stepper" role="group" aria-label="Minutes">
            <button type="button" onClick={() => setMinutes((m) => Math.max(1, m - stepBy(m - 1)))} aria-label="Less time">
              <Icon name="minus" size={16} />
            </button>
            <strong>{fmtDuration(minutes)}</strong>
            <button type="button" onClick={() => setMinutes((m) => m + stepBy(m))} aria-label="More time">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      )}
      {siblings.length > 0 && (
        <div className="field">
          <span>Has to wait for</span>
          <div className="chips">
            {siblings.map((s) => {
              const on = after.includes(s.activityId)
              const loops = !on && wouldLoop(all, a.activityId, [...after, s.activityId])
              return (
                <button
                  key={s.activityId}
                  type="button"
                  className={`chip small${on ? ' selected' : ''}`}
                  aria-pressed={on}
                  disabled={loops}
                  title={loops ? 'That one already waits for this' : undefined}
                  onClick={() => setAfter((x) => (on ? x.filter((y) => y !== s.activityId) : [...x, s.activityId]))}
                >
                  {s.title}
                </button>
              )
            })}
          </div>
          <p className="muted small">Linked activities are played in this order. Greyed-out ones already wait for this one.</p>
        </div>
      )}
      <button type="button" className="btn primary big block" onClick={save}>
        Save
      </button>
      <div className="btn-row">
        <button type="button" className="btn small" disabled={busy} onClick={() => onBreakDown(a)}>
          <Icon name="sparkle" size={16} /> {busy ? 'Breaking down…' : n?.isGroup ? 'Suggest more steps inside' : 'Break down with AI'}
        </button>
        <button type="button" className="btn small ghost" onClick={() => onAddInside(a)}>
          <Icon name="plus" size={16} /> Add steps inside
        </button>
        {n?.isGroup && !n.complete && (
          <button type="button" className="btn small ghost" onClick={() => onPlay(a)}>
            <Icon name="play" size={16} /> Play this group
          </button>
        )}
      </div>
      <div className="btn-row">
        <button type="button" className="btn small ghost" disabled={pos <= 0} onClick={() => move(-1)}>
          ↑ Earlier
        </button>
        <button type="button" className="btn small ghost" disabled={pos < 0 || pos >= levelLen - 1} onClick={() => move(1)}>
          ↓ Later
        </button>
        {n?.isGroup && (
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              const evs = PA.ungroupActivity(me.id, f, a, Date.now())
              act(evs)
              toast('Ungrouped.', { undo: () => act(PA.revertActivities(me.id, f, evs)) })
              onClose()
            }}
          >
            Ungroup
          </button>
        )}
        {!n?.isGroup && (
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              act(PA.tickActivity(me.id, f, a, !n?.complete, Date.now()))
              onClose()
            }}
          >
            <Icon name="check" size={16} /> {n?.complete ? 'Not done after all' : 'Mark done'}
          </button>
        )}
      </div>
      <button
        type="button"
        className="btn danger block"
        onClick={() => {
          if (!confirm) return setConfirm(true)
          const evs = PA.deleteActivity(me.id, f, a, Date.now())
          act(evs)
          toast('Deleted.', { undo: () => act(PA.revertActivities(me.id, f, evs)) })
          onClose()
        }}
      >
        <Icon name="trash" size={16} /> {confirm ? (n?.isGroup ? `Tap again to delete it and its ${n.stepsTotal} steps` : 'Tap again to delete') : 'Delete'}
      </button>
    </Sheet>
  )
}

function AddSteps({ t, parentId, onClose }: { t: ProjectTree; parentId?: string; onClose: () => void }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [text, setText] = useState('')
  const [chain, setChain] = useState(true)
  const grain = t.project.grain ?? 20
  const parsed = parseSteps(text, grain)
  const parent = parentId ? t.info.get(parentId)?.a : undefined
  const add = () => {
    if (!parsed.length) return
    act(
      PA.addActivities(
        me.id,
        f,
        t.project.projectId,
        parentId,
        parsed.map((p) => ({ title: p.title, minutes: p.minutes })),
        Date.now(),
        { chain },
      ),
    )
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title={parent ? `Add inside “${parent.title}”` : 'Add activities'}>
      <textarea
        className="tbox"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'One per line, with a time if you like\nMeasure the window ~10\nOrder the blind ~15'}
        aria-label="Activities"
        autoFocus
      />
      <label className="switch-row">
        <input type="checkbox" className="switch" checked={chain} onChange={(e) => setChain(e.target.checked)} />
        <span>They have to be done in this order</span>
      </label>
      <p className="muted small">Lines without a time get {fmtDuration(grain)}.</p>
      <button type="button" className="btn primary big block" disabled={!parsed.length} onClick={add}>
        Add {parsed.length || ''}
      </button>
    </Sheet>
  )
}

function GroupSheet({ count, onClose, onSave }: { count: number; onClose: () => void; onSave: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return (
    <Sheet open onClose={onClose} title={`Group ${count} activities`}>
      <label className="field">
        <span>Name for the group</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Painting" autoFocus />
      </label>
      <p className="muted small">Links between them stay. Anything they waited for, the group waits for.</p>
      <button type="button" className="btn primary big block" disabled={!title.trim()} onClick={() => onSave(title)}>
        Group them
      </button>
    </Sheet>
  )
}

const LENGTHS = [15, 30, 45, 60, 90]

function PlaySheetView({ t, f, rootId, onClose, onStart }: { t: ProjectTree; f: FamilyState; rootId?: string; onClose: () => void; onStart: (minutes?: number) => void }) {
  const [mins, setMins] = useState<number | undefined>(rootId ? undefined : 30)
  const src = PA.playSource(t, rootId, mins)
  const all = stepsToDo(t, rootId)
  const total = all.reduce((s, a) => s + a.minutes, 0)
  const first = all[0]
  const waits = first ? waitingFor(t, f, first.activityId).filter((w) => !all.includes(w)) : []
  const group = rootId ? t.info.get(rootId)?.a : undefined
  return (
    <Sheet open onClose={onClose} title={group ? `Play “${group.title}”` : 'Play the project'}>
      <div className="field">
        <span>How long have you got?</span>
        <div className="chips">
          {LENGTHS.filter((l) => l < total).map((l) => (
            <button key={l} type="button" className={`chip small${mins === l ? ' selected' : ''}`} aria-pressed={mins === l} onClick={() => setMins(l)}>
              {fmtDuration(l)}
            </button>
          ))}
          <button type="button" className={`chip small${mins === undefined ? ' selected' : ''}`} aria-pressed={mins === undefined} onClick={() => setMins(undefined)}>
            All of it ({fmtDuration(total)})
          </button>
        </div>
      </div>
      {waits.length > 0 && <p className="note warn">This normally waits for {waits.map((w) => `“${w.title}”`).join(', ')}, which isn’t finished.</p>}
      <ol className="play-preview">
        {(src.steps ?? []).map((s) => (
          <li key={s.id}>
            <span className="grow">{s.title}</span>
            <small className="muted">{minLabel(s.minutes)}</small>
          </li>
        ))}
      </ol>
      <button type="button" className="btn primary big block" disabled={!src.steps?.length} onClick={() => onStart(mins)}>
        <Icon name="play" size={18} /> Start {src.steps?.length ?? 0} step{src.steps?.length === 1 ? '' : 's'}
      </button>
    </Sheet>
  )
}

const SESSION_LENGTHS = [20, 30, 45, 60, 90]
const DAY_IDS = [0, 1, 2, 3, 4, 5, 6]
const MONDAY = '2026-01-05'

function PlanSheet({ t, today, onClose }: { t: ProjectTree; today: Ymd; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople().filter((x) => x.role === 'parent' || x.role === 'child')
  const p = t.project
  const [minutes, setMinutes] = useState(p.dailyMinutes && SESSION_LENGTHS.includes(p.dailyMinutes) ? p.dailyMinutes : 30)
  const [days, setDays] = useState<number[]>(() => (f.members[p.ownerId ?? '']?.role === 'child' ? [0, 2, 5] : [0, 1, 2, 3, 4]))
  const [from, setFrom] = useState(today)
  const [at, setAt] = useState('')
  const [owner, setOwner] = useState(p.ownerId ?? '')
  const preview = PA.planSessions(me.id, f, t, { minutes, days, from: from || today, startAt: at || undefined, ownerId: owner || undefined }, Date.now())
  const dropped = preview.events.filter((e) => e.type === 'routine' && (e as { deleted?: boolean }).deleted).length
  const last = preview.sessions[preview.sessions.length - 1]
  const tooBig = t.order.filter((a) => a.minutes > minutes)
  const save = () => {
    const out = PA.planSessions(me.id, f, t, { minutes, days, from: from || today, startAt: at || undefined, ownerId: owner || undefined }, Date.now())
    act(out.events)
    toast(`${out.sessions.length} session${out.sessions.length === 1 ? '' : 's'} planned.`)
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Plan sessions">
      <p className="muted small">
        The steps still to do, in order, packed into sessions on the days you choose. They show on the calendar and Today, and each one runs with the activities as they are on the day.
      </p>
      <div className="field">
        <span>Each session</span>
        <div className="chips">
          {SESSION_LENGTHS.map((m) => (
            <button key={m} type="button" className={`chip small${minutes === m ? ' selected' : ''}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {fmtDuration(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>On</span>
        <div className="chips">
          {DAY_IDS.map((d) => {
            const on = days.includes(d)
            return (
              <button key={d} type="button" className={`chip small${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => setDays((x) => (on ? x.filter((y) => y !== d) : [...x, d].sort()))}>
                {dayName(addDays(MONDAY, d))}
              </button>
            )
          })}
        </div>
      </div>
      <div className="row-fields">
        <label className="field grow">
          <span>Starting</span>
          <input type="date" className="tbox" value={from} min={today} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field grow">
          <span>At (optional)</span>
          <input type="time" className="tbox" value={at} onChange={(e) => setAt(e.target.value)} />
        </label>
      </div>
      <div className="field">
        <span>Who</span>
        <MemberChips members={people} value={owner ? [owner] : []} onChange={(v) => setOwner(v[0] ?? '')} everyone={{ label: 'Anyone', active: !owner, onToggle: () => setOwner('') }} size="small" />
      </div>
      {preview.sessions.length > 0 && last ? (
        <p className="note">
          {preview.sessions.length} session{preview.sessions.length === 1 ? '' : 's'}: {friendlyDay(preview.sessions[0]!.date, today)}
          {preview.sessions.length > 1 ? ` to ${friendlyDay(last.date, today)}` : ''}
          {dropped ? `. Replaces ${dropped} planned session${dropped === 1 ? '' : 's'} that haven’t been started.` : '.'}
        </p>
      ) : (
        <p className="note warn">{days.length ? 'Nothing left to plan.' : 'Pick at least one day.'}</p>
      )}
      {tooBig.length > 0 && (
        <p className="note warn">
          {tooBig.length} step{tooBig.length === 1 ? ' is' : 's are'} longer than a session and will get {tooBig.length === 1 ? 'one' : 'them'} to {tooBig.length === 1 ? 'itself' : 'themselves'}.
          Breaking {tooBig.length === 1 ? 'it' : 'them'} down first would fit better.
        </p>
      )}
      <button type="button" className="btn primary big block" disabled={!preview.sessions.length} onClick={save}>
        Plan {preview.sessions.length || ''} session{preview.sessions.length === 1 ? '' : 's'}
      </button>
    </Sheet>
  )
}
