import { useRef, useState } from 'react'
import { HelpHead } from '@/ui/ux'
import type { AppEvent } from '@/engine/types'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useMe } from '@/app/context'
import { breakdownAvailable, deviceKey, deviceModel, requestBreakdown, setDeviceKey, setDeviceModel, type BreakdownInput } from '@/app/breakdown'
import { DEFAULT_MODEL } from '../../../supabase/functions/_shared/breakdown'
import * as PA from '@/family/projectActions'
import { liveProjects, pathTo, projectTree, readySteps, stepForActivity, type ProjectTree } from '@/family/projects'
import * as P from '@/family/planActions'
import { activeRunFor, minLabel } from '@/family/routines'
import { fmtDuration } from '@/family/dates'
import type { ActivityEvent, FamilyState, Member, ProjectEvent, ProjectSkill } from '@/family/types'
import { Avatar, MemberChips } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { usePeople } from '@/screens/family/shared'

/** Projects: big goals broken down into small activities (by hand, or by asking Gemini), worked through in sessions. */
export function Projects() {
  const nav = useNavigate()
  const f = useFamily()
  const projects = liveProjects(f)
  const me = useMe()!
  const [making, setMaking] = useState(false)
  const [setup, setSetup] = useState(false)
  const active = projects.filter((p) => p.status !== 'archived')
  const archived = projects.filter((p) => p.status === 'archived')
  return (
    <>
      <HelpHead
        title="Projects" helpId="plan.projects" help="A big goal broken down into small activities, then worked through a session at a time."
        action={
          <button type="button" className="btn small" onClick={() => setMaking(true)}>
            <Icon name="plus" size={16} /> New
          </button>
        }
      />
      {projects.length === 0 && (
        <div className="card callout">
          <Icon name="flag" size={26} />
          <div>
            <h3>No projects yet</h3>
            <p className="muted">
              Write down a goal (“Redecorate the bedroom”, “Get ready for the Year 8 science fair”) and break it into steps small enough to do in one go. AI can do the breaking down for you, as many
              levels deep as you like.
            </p>
            <button type="button" className="btn primary small" onClick={() => setMaking(true)}>
              Start a project
            </button>
          </div>
        </div>
      )}
      {active.map((p) => (
        <ProjectCard key={p.projectId} p={p} f={f} onOpen={() => nav(`/project/${p.projectId}`)} />
      ))}
      {archived.length > 0 && (
        <details className="archived-projects">
          <summary className="muted small">Put away ({archived.length})</summary>
          {archived.map((p) => (
            <ProjectCard key={p.projectId} p={p} f={f} onOpen={() => nav(`/project/${p.projectId}`)} />
          ))}
        </details>
      )}
      {me.role === 'parent' && (
        <button type="button" className="link-btn wide muted small" onClick={() => setSetup(true)}>
          <Icon name="sparkle" size={14} /> AI breakdown settings
        </button>
      )}
      {making && <NewProject onClose={() => setMaking(false)} />}
      {setup && <AiSetup onClose={() => setSetup(false)} />}
    </>
  )
}

/** Start just one step as a short session (the run screen), or carry on with the one already running. */
export function useStartStep() {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  return (t: ProjectTree, a: ActivityEvent) => {
    const live = activeRunFor(f, me.id, Date.now())
    if (live) {
      toast('You already have a session going. Let’s carry on with that one.')
      return nav(`/run/${live.id}`)
    }
    const { runId, events } = P.startRun(me.id, me.id, { title: t.project.title, emoji: t.project.emoji ?? '🎯', steps: [stepForActivity(a)] }, Date.now())
    act(events)
    nav(`/run/${runId}`)
  }
}

function ProjectCard({ p, f, onOpen }: { p: ProjectEvent; f: FamilyState; onOpen: () => void }) {
  const t = projectTree(f, p.projectId)
  const owner = p.ownerId ? f.members[p.ownerId] : undefined
  const next = t ? readySteps(t, f)[0] : undefined
  const start = useStartStep()
  return (
    <div className="card project-card">
      <button type="button" className="project-card-open pick-row" onClick={onOpen} aria-label={`Open ${p.title}`}>
        <span className="plan-emoji">{p.emoji ?? '🎯'}</span>
        <div className="grow">
          <strong>{p.title}</strong>
          {t && t.stepsTotal > 0 ? (
            <>
              {next && p.status !== 'done' ? (
                <p className="small project-next">
                  Next: {next.title} <span className="muted">(~{minLabel(next.minutes)})</span>
                </p>
              ) : (
                <p className="muted small">{p.status === 'done' || t.stepsDone === t.stepsTotal ? 'All steps done. Lovely.' : 'Waiting on an earlier step'}</p>
              )}
              <Bar value={t.stepsDone / t.stepsTotal} tone={t.stepsDone === t.stepsTotal ? 'good' : 'accent'} />
              <p className="muted small">
                {t.stepsDone} of {t.stepsTotal} steps done
              </p>
            </>
          ) : (
            <p className="muted small">Not broken down yet</p>
          )}
        </div>
        {owner && <Avatar m={owner} size={28} />}
        <Icon name="chevron" size={18} />
      </button>
      {t && next && p.status !== 'done' && (
        <button type="button" className="btn small primary" onClick={() => start(t, next)}>
          <Icon name="play" size={16} /> Start
        </button>
      )}
    </div>
  )
}

// ----------------------------------------------------------- asking for a breakdown

const whoOf = (m: Member | undefined): BreakdownInput['who'] => (!m ? 'family' : m.role === 'child' ? 'child' : 'parent')

/** What to send for breaking down the project itself (no activity) or one activity a level deeper. */
export function breakdownInput(f: FamilyState, t: ProjectTree | undefined, p: ProjectEvent, a?: ActivityEvent): BreakdownInput {
  const base = { context: p.context, grain: p.grain, dailyMinutes: p.dailyMinutes, skill: p.skill, who: whoOf(p.ownerId ? f.members[p.ownerId] : undefined) }
  if (!a) {
    const have = t?.roots.map((r) => r.title)
    return { ...base, goal: p.goal || p.title, siblings: have?.length ? have : undefined }
  }
  const sibs = (a.parentId ? t?.info.get(a.parentId)?.kids : t?.roots) ?? []
  const info = t?.info.get(a.activityId)
  return {
    ...base,
    goal: a.description ? `${a.title}. ${a.description}` : a.title,
    projectGoal: p.goal || p.title,
    path: pathTo(f, a.activityId).map((x) => x.title),
    siblings: [...sibs.filter((s) => s.activityId !== a.activityId).map((s) => s.title), ...(info?.kids.map((k) => k.title) ?? [])],
    minutes: info?.isGroup ? undefined : a.minutes,
  }
}

/**
 * Break down the project (no `a`) or one activity, and save what comes back inside it. Returns the events it added
 * (so the caller can offer Undo), or undefined (having already said why) if it didn't work.
 */
export function useBreakdown() {
  const { sync, demo, act, toast } = useApp()
  const me = useMe()!
  const [setup, setSetup] = useState(false)
  const [error, setError] = useState<{ text: string; setup?: boolean; again?: () => void } | undefined>()
  const fam = useFamily()
  const famRef = useRef(fam)
  famRef.current = fam
  const [retrying, setRetrying] = useState(false)
  /** `again` is what the card's "Try again" does; by default the same breakdown again on the latest family state. */
  const run = async (f: FamilyState, p: ProjectEvent, a?: ActivityEvent, quiet = false, again?: () => Promise<unknown>): Promise<AppEvent[] | undefined> => {
    const t = projectTree(f, p.projectId)
    setError(undefined)
    const out = await requestBreakdown(sync, demo, breakdownInput(f, t, p, a))
    if (!out.ok) {
      const retry =
        again ??
        (async () => {
          const live = famRef.current.projects[p.projectId] ?? p
          const liveA = a ? famRef.current.activities[a.activityId] ?? a : undefined
          const evs = await run(famRef.current, live, liveA, quiet)
          if (evs) toast(liveA ? `Added ${evs.length} steps inside “${liveA.title}”.` : `Added ${evs.length} activities.`)
        })
      // Shown in a card that stays until dismissed or the next try, not a toast that's gone in a few seconds.
      setError({
        text: out.error,
        setup: out.setup,
        again: out.retry
          ? () => {
              setRetrying(true)
              void retry().finally(() => setRetrying(false))
            }
          : undefined,
      })
      if (!quiet) toast(out.error)
      return undefined
    }
    const { events } = PA.applyBreakdown(me.id, f, p.projectId, a?.activityId, out.result, Date.now())
    act(events)
    return events
  }
  const errorCard = error ? (
    <div className="card bd-error" role="alert">
      <p className="small">
        <strong>AI breakdown didn’t work.</strong> {error.text}
      </p>
      <div className="btn-row tight">
        {error.again && (
          <button type="button" className="btn small primary" onClick={error.again} disabled={retrying}>
            {retrying ? 'Trying…' : 'Try again'}
          </button>
        )}
        {error.setup && (
          <button type="button" className="btn small" onClick={() => setSetup(true)}>
            How to set it up
          </button>
        )}
        <button type="button" className="btn small ghost" onClick={() => setError(undefined)}>
          Dismiss
        </button>
      </div>
    </div>
  ) : null
  const sheet = setup ? <AiSetup onClose={() => setSetup(false)} /> : null
  return { run, sheet, errorCard, failed: !!error, openSetup: () => setSetup(true), available: breakdownAvailable(sync, demo) }
}

// ------------------------------------------------------------------ new project

const GRAINS = [10, 20, 30, 60]
const DAILY = [15, 30, 60, 120]
const SKILLS: { id: ProjectSkill; label: string }[] = [
  { id: 'new', label: 'New to this' },
  { id: 'some', label: 'Done a bit' },
  { id: 'experienced', label: 'Experienced' },
]

export interface ProjectFormState {
  title: string
  emoji: string
  goal: string
  context: string
  owner: string
  grain: number
  daily?: number
  skill?: ProjectSkill
}

export function ProjectFields({ d, set, people }: { d: ProjectFormState; set: (p: Partial<ProjectFormState>) => void; people: Member[] }) {
  return (
    <>
      <label className="field">
        <span>What’s the goal?</span>
        <textarea className="tbox" rows={3} value={d.goal} onChange={(e) => set({ goal: e.target.value })} placeholder="e.g. Turn the box room into a study by half term" />
      </label>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={d.emoji} onChange={(e) => set({ emoji: e.target.value.slice(0, 4) })} aria-label="Icon" />
        </label>
        <label className="field grow">
          <span>Short name (optional)</span>
          <input className="tbox" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="AI can suggest one" />
        </label>
      </div>
      <div className="field">
        <span>Whose project?</span>
        <MemberChips
          members={people}
          value={d.owner ? [d.owner] : []}
          onChange={(v) => set({ owner: v[0] ?? '' })}
          everyone={{ label: 'Family', active: !d.owner, onToggle: () => set({ owner: '' }) }}
          size="small"
        />
      </div>
      <label className="field">
        <span>Anything to know? (optional)</span>
        <textarea className="tbox" rows={2} value={d.context} onChange={(e) => set({ context: e.target.value })} placeholder="Budget, deadline, what you already have, what to avoid…" />
      </label>
      <div className="field">
        <span>Smallest step: about how long?</span>
        <div className="chips">
          {GRAINS.map((g) => (
            <button key={g} type="button" className={`chip small${d.grain === g ? ' selected' : ''}`} aria-pressed={d.grain === g} onClick={() => set({ grain: g })}>
              {fmtDuration(g)}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Time for it most days</span>
        <div className="chips">
          {DAILY.map((m) => (
            <button key={m} type="button" className={`chip small${d.daily === m ? ' selected' : ''}`} aria-pressed={d.daily === m} onClick={() => set({ daily: d.daily === m ? undefined : m })}>
              {fmtDuration(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Experience</span>
        <div className="chips">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip small${d.skill === s.id ? ' selected' : ''}`}
              aria-pressed={d.skill === s.id}
              onClick={() => set({ skill: d.skill === s.id ? undefined : s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export const draftOf = (p: ProjectFormState): PA.ProjectDraft => ({
  title: p.title,
  goal: p.goal,
  emoji: p.emoji.trim() || undefined,
  ownerId: p.owner || undefined,
  context: p.context,
  grain: p.grain,
  dailyMinutes: p.daily,
  skill: p.skill,
})

function NewProject({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople().filter((p) => p.role === 'parent' || p.role === 'child')
  const bd = useBreakdown()
  const [d, setD] = useState<ProjectFormState>({ title: '', emoji: '🎯', goal: '', context: '', owner: me.role === 'child' ? me.id : '', grain: 20 })
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<string | undefined>()
  const set = (p: Partial<ProjectFormState>) => setD((x) => ({ ...x, ...p }))

  const create = async (withAi: boolean) => {
    if (!d.goal.trim()) return toast('Write the goal first.')
    const now = Date.now()
    const { projectId, events } = PA.saveProject(me.id, draftOf(d), now)
    act(events)
    if (!withAi) {
      onClose()
      nav(`/project/${projectId}`)
      return
    }
    setBusy(true)
    const p = events[0] as unknown as ProjectEvent
    // `act` updates the family state asynchronously; build on a copy that already has the new project.
    const f2: FamilyState = { ...f, projects: { ...f.projects, [projectId]: p } }
    const added = await bd.run(f2, p, undefined, true)
    setBusy(false)
    if (!added) {
      // Keep the sheet open so the reason (and how to fix it) can be read; the project itself is saved.
      setCreated(projectId)
      return
    }
    toast(`Broken down into ${added.length} activities.`)
    onClose()
    nav(`/project/${projectId}`)
  }

  return (
    <Sheet open onClose={onClose} title="New project">
      {created && (
        <>
          {bd.errorCard}
          <p className="note">The project is saved. You can add the steps yourself, or try AI again from the project once it’s set up.</p>
          <button
            type="button"
            className="btn primary big block"
            onClick={() => {
              onClose()
              nav(`/project/${created}`)
            }}
          >
            Open the project
          </button>
          {bd.sheet}
        </>
      )}
      {!created && (
        <>
          <ProjectFields d={d} set={set} people={people} />
          <button type="button" className="btn primary big block" disabled={busy || !d.goal.trim()} onClick={() => create(true)}>
            <Icon name="sparkle" size={18} /> {busy ? 'Breaking it down…' : 'Break it down with AI'}
          </button>
          {!bd.available && <p className="note">AI isn’t set up on this phone yet: it will explain how. Or add the steps yourself.</p>}
          <button type="button" className="btn ghost block" disabled={busy} onClick={() => create(false)}>
            I’ll add the steps myself
          </button>
          {bd.sheet}
        </>
      )}
    </Sheet>
  )
}

// ------------------------------------------------------------------ AI set-up

/** How to switch AI breakdowns on: the family's Supabase function (normal), or a key kept on this phone only. */
export function AiSetup({ onClose }: { onClose: () => void }) {
  const { toast } = useApp()
  const me = useMe()!
  const [key, setKey] = useState(deviceKey())
  const [model, setModel] = useState(deviceModel())
  const save = () => {
    setDeviceKey(key)
    setDeviceModel(model || DEFAULT_MODEL)
    toast(key.trim() ? 'Saved on this phone.' : 'Removed from this phone.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Setting up AI breakdowns">
      <p>Breaking a goal down uses Google’s Gemini. It’s sent the goal, your notes and the names of the activities, never anyone’s name.</p>
      <h3 className="sheet-sub">For the whole family (recommended)</h3>
      <p className="muted small">
        Two things in your Supabase project, both needed: the Gemini key and your family code as secrets (<code>GEMINI_API_KEY</code>, <code>ALLOWED_FAMILY_KEYS</code>), and the <code>breakdown</code>{' '}
        function itself, deployed under Edge Functions. Adding the secrets doesn’t create the function. Once both are there, every phone with sharing turned on can use it, children included, and
        you don’t need to enter the key here. Steps in <code>docs/PROJECTS.md</code>.
      </p>
      {me.role === 'parent' ? (
        <details className="ai-phone-key" open={!!deviceKey()}>
          <summary className="muted small">Or use a key on this phone only (optional)</summary>
          <p className="muted small">Only if you’d rather not use the Supabase function. The key stays in this browser: it isn’t synced or shared. While a key is saved here, this phone uses it instead of the function.</p>
          <label className="field">
            <span>Gemini API key</span>
            <input className="tbox" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza…" />
          </label>
          <label className="field">
            <span>Model</span>
            <input className="tbox" value={model} onChange={(e) => setModel(e.target.value)} placeholder={DEFAULT_MODEL} />
          </label>
          <button type="button" className="btn primary block" onClick={save}>
            {key.trim() || !deviceKey() ? 'Save on this phone' : 'Remove from this phone'}
          </button>
        </details>
      ) : (
        <p className="note">Ask a grown-up to set it up.</p>
      )}
    </Sheet>
  )
}
