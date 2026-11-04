import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as P from '@/family/planActions'
import * as H from '@/family/house/actions'
import { houseHelpers } from '@/family/house/house'
import { houseProgress, houseRunOf, isHouseLive, jobWaiting, type HouseJobState, type HouseRunState } from '@/family/house/run'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { fmtDuration } from '@/family/dates'
import { fmtClock } from '@/family/timers'
import { livePlants } from '@/family/plants'
import { MAIN_LIST } from '@/family/shopping'
import { Avatar, CheckCircle, Coins, MemberChips, ScreenHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { useWakeLock } from '@/ui/timers'
import type { Member, MemberId } from '@/family/types'
import { BoardSheet } from './BoardSheet'

type Who = 'all' | 'free' | MemberId

/**
 * The live family session. Everyone sees the same list: jobs by room, who has what, and what is done. Tap the circle to tick
 * your own job; tap a job to give it to someone else, tick it for a child, or skip it. Pause stops the clock for everyone.
 */
export function HouseRun() {
  const { id } = useParams()
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(1000)
  const run = id ? houseRunOf(f, id) : undefined
  const [who, setWho] = useState<Who | undefined>()
  const [open, setOpen] = useState<string | undefined>()
  const [people, setPeople] = useState(false)
  const [board, setBoard] = useState(false)
  const [confirm, setConfirm] = useState<'finish' | 'call-off' | undefined>()
  useWakeLock(run?.status === 'running')

  if (!run) {
    return (
      <div className="screen">
        <ScreenHead title="Family session" onBack={() => nav('/plan')} />
        <p className="note">That session isn't here any more.</p>
      </div>
    )
  }
  const live = isHouseLive(run)
  const p = houseProgress(run, now)
  const mineIn = run.people.includes(me.id)
  const filter: Who = who ?? (mineIn ? me.id : 'all')
  const shown = (j: HouseJobState) => (filter === 'all' ? true : filter === 'free' ? j.status === 'todo' && !j.assignee : (j.status === 'todo' ? j.assignee : (j.doneBy ?? j.assignee)) === filter)
  const sel = open ? run.jobs.find((j) => j.job.jobId === open) : undefined

  const tick = (j: HouseJobState, status: 'done' | 'skipped', by?: MemberId) => {
    const evs = H.tickHouseJob(me.id, f, run.id, j.job.jobId, status, by)
    if (evs.length) act(evs)
  }
  const quick = (j: HouseJobState) => {
    if (!live) return toast('The session is paused.')
    if (j.status !== 'todo') return setOpen(j.job.jobId)
    // Your own job (or nobody's) ticks straight away; someone else's asks who really did it.
    if (!j.assignee || j.assignee === me.id) return tick(j, 'done')
    setOpen(j.job.jobId)
  }
  const members = run.people.map((id2) => f.members[id2]).filter((m): m is Member => !!m)
  const everyone = houseHelpers(f)
  const rooms = run.rooms.length ? run.rooms : [...new Map(run.jobs.map((j) => [j.job.roomId, { roomId: j.job.roomId, name: j.job.roomName, emoji: j.job.roomEmoji }])).values()]
  const pct = p.total ? ((p.done + p.skipped) / p.total) * 100 : 0
  const coinsEarned = run.jobs.filter((j) => j.status === 'done' && j.doneBy && f.members[j.doneBy]?.role === 'child').reduce((t, j) => t + j.job.coins, 0)

  return (
    <div className="screen run-screen house-run">
      <ScreenHead
        title={`${run.emoji ?? '🏠'} ${run.title}`}
        eyebrow={run.status === 'paused' ? 'Paused' : run.status === 'done' ? 'Finished' : run.status === 'abandoned' ? 'Called off' : 'Together'}
        onBack={() => nav(-1)}
        right={
          live ? (
            <button
              type="button"
              className="icon-btn"
              aria-label={run.status === 'paused' ? 'Resume the session' : 'Pause the session'}
              onClick={() => act(run.status === 'paused' ? H.resumeHouseRun(me.id, run.id) : H.pauseHouseRun(me.id, run.id))}
            >
              <Icon name={run.status === 'paused' ? 'play' : 'pause'} />
            </button>
          ) : undefined
        }
      />

      {run.status === 'done' && (
        <div className="card callout house-done">
          <Icon name="trophy" size={26} />
          <div>
            <h3>{p.done + p.skipped === p.total ? 'All done, well done everyone' : 'Finished'}</h3>
            <p className="muted">
              {p.done} of {p.total} jobs in {fmtDuration(Math.max(1, Math.round(p.elapsedSec / 60)))}
              {p.skipped ? ` (${p.skipped} skipped)` : ''}.{p.done + p.skipped < p.total ? ' The rest come up again next time.' : ''}
              {coinsEarned > 0 ? ` ${coinsEarned} coins earned, waiting for a parent to check.` : ''}
            </p>
            <button type="button" className="btn small" onClick={() => nav('/')}>
              Back to Today
            </button>
          </div>
        </div>
      )}
      {run.status === 'abandoned' && <p className="note">This session was called off.</p>}
      {run.status === 'paused' && (
        <div className="card callout">
          <Icon name="pause" size={26} />
          <div>
            <h3>Paused</h3>
            <p className="muted">The clock is stopped for everyone.</p>
            <button type="button" className="btn primary small" onClick={() => act(H.resumeHouseRun(me.id, run.id))}>
              <Icon name="play" size={16} /> Carry on
            </button>
          </div>
        </div>
      )}

      <section className="card house-summary" aria-label="Progress">
        <div className="house-clock">
          <strong>{fmtClock(p.elapsedSec)}</strong>
          <span className="muted">
            {p.done + p.skipped} of {p.total} jobs · about {fmtDuration(Math.max(0, Math.ceil(p.minutesLeft / Math.max(1, run.people.length))))} left
          </span>
        </div>
        <Bar value={pct} tone="good" label="Jobs done" />
        <div className="chips house-people" role="group" aria-label="Show jobs for">
          <button type="button" className={`chip small${filter === 'all' ? ' selected' : ''}`} onClick={() => setWho('all')}>
            Everyone
          </button>
          {members.map((m) => {
            const s = p.people.find((x) => x.memberId === m.id)
            return (
              <button key={m.id} type="button" className={`chip small with-avatar${filter === m.id ? ' selected' : ''}`} onClick={() => setWho(m.id)} aria-pressed={filter === m.id}>
                <Avatar m={m} size={18} />
                {m.id === me.id ? 'Me' : m.name} {s ? `${s.done}/${s.total}` : ''}
              </button>
            )
          })}
          {p.unassigned > 0 && live && (
            <button type="button" className={`chip small${filter === 'free' ? ' selected' : ''}`} onClick={() => setWho('free')}>
              Up for grabs {p.unassigned}
            </button>
          )}
        </div>
        {!mineIn && live && (
          <button type="button" className="btn small" onClick={() => act(H.joinHouseRun(me.id, f, run.id, me.id))}>
            <Icon name="plus" size={16} /> Join in
          </button>
        )}
      </section>

      {rooms.map((r) => {
        const here = run.jobs.filter((j) => j.job.roomId === r.roomId && shown(j))
        if (!here.length) return null
        const done = here.filter((j) => j.status !== 'todo').length
        return (
          <section key={r.roomId} className="card house-room-card">
            <header>
              <span className="plan-emoji">{r.emoji ?? '🏠'}</span>
              <strong className="grow">{r.name}</strong>
              <small className="muted">
                {done}/{here.length}
              </small>
            </header>
            <ul className="house-jobs live">
              {here.map((j) => (
                <JobRow key={j.job.jobId} run={run} j={j} f={f} meId={me.id} live={live} onTick={() => quick(j)} onOpen={() => setOpen(j.job.jobId)} />
              ))}
            </ul>
          </section>
        )
      })}

      {live && (
        <div className="btn-row house-actions">
          <button type="button" className="btn small ghost" onClick={() => setPeople(true)}>
            <Icon name="users" size={16} /> People
          </button>
          {p.unassigned > 0 && (
            <button type="button" className="btn small ghost" onClick={() => act(H.shareOutRest(me.id, f, run.id))}>
              Share out the rest
            </button>
          )}
          <button type="button" className="btn small ghost" onClick={() => setBoard(true)}>
            <Icon name="checklist" size={16} /> Board
          </button>
          <button type="button" className="btn small" onClick={() => setConfirm('finish')}>
            Finish now
          </button>
        </div>
      )}

      <Sheet open={!!sel} onClose={() => setOpen(undefined)} title={sel ? sel.job.title : undefined}>
        {sel && <JobSheet key={sel.job.jobId} run={run} j={sel} people={members} onClose={() => setOpen(undefined)} />}
      </Sheet>

      <Sheet open={people} onClose={() => setPeople(false)} title="Who is taking part?">
        <ul className="house-people-list">
          {members.map((m) => (
            <li key={m.id}>
              <Avatar m={m} size={28} />
              <span className="grow">{m.name}</span>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  act(H.leaveHouseRun(me.id, f, run.id, m.id))
                  if (m.id === me.id) setPeople(false)
                }}
              >
                {m.id === me.id ? 'I need to stop' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
        {everyone.some((m) => !run.people.includes(m.id)) && (
          <>
            <p className="note">Someone else joining? Their jobs come from "Share out the rest".</p>
            <MemberChips
              members={everyone.filter((m) => !run.people.includes(m.id))}
              value={[]}
              onChange={(v) => {
                if (v[0]) act(H.joinHouseRun(me.id, f, run.id, v[0]))
              }}
              size="small"
            />
          </>
        )}
        <p className="note">If someone leaves, their jobs that aren't done go back to "up for grabs".</p>
      </Sheet>

      <Sheet open={!!confirm} onClose={() => setConfirm(undefined)} title={confirm === 'finish' ? 'Finish now?' : 'Call it off?'}>
        <p className="note">
          {confirm === 'finish' ? `${p.total - p.done - p.skipped} jobs aren't done yet. They stay as they are, and will come up again next time.` : 'Nothing already ticked is lost.'}
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              act(H.endHouseRun(me.id, f, run.id, confirm === 'call-off' ? 'abandoned' : undefined))
              setConfirm(undefined)
            }}
          >
            {confirm === 'finish' ? 'Finish' : 'Call it off'}
          </button>
          {confirm === 'finish' && (
            <button type="button" className="btn ghost" onClick={() => setConfirm('call-off')}>
              Call it off instead
            </button>
          )}
          <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
            Keep going
          </button>
        </div>
      </Sheet>

      <BoardSheet open={board} onClose={() => setBoard(false)} />
    </div>
  )
}

function JobRow({
  run,
  j,
  f,
  meId,
  live,
  onTick,
  onOpen,
}: {
  run: HouseRunState
  j: HouseJobState
  f: ReturnType<typeof useFamily>
  meId: MemberId
  live: boolean
  onTick: () => void
  onOpen: () => void
}) {
  const owner = j.status === 'todo' ? j.assignee : (j.doneBy ?? j.assignee)
  const m = owner ? f.members[owner] : undefined
  const waiting = jobWaiting(run, j)
  const child = m?.role === 'child' && j.job.coins > 0
  return (
    <li className={`house-job ${j.status}`}>
      <CheckCircle
        done={j.status === 'done'}
        pending={j.status === 'skipped'}
        onClick={onTick}
        label={`${j.status === 'todo' ? 'Tick' : 'Open'} ${j.job.title}`}
        disabled={!live && j.status === 'todo'}
      />
      <button type="button" className="house-job-body" onClick={onOpen}>
        <span className="house-job-title">{j.job.title}</span>
        <small className="muted">
          {j.status === 'skipped' ? 'Skipped' : j.status === 'done' ? `Done${m && owner !== meId ? ` by ${m.name}` : ''}` : `${j.job.minutes} min`}
          {waiting && j.status === 'todo' ? ` · after "${waiting.job.title}"` : ''}
          {j.job.link === 'plants' && j.job.plantIds?.length ? ` · ${j.job.plantIds.length} plant${j.job.plantIds.length === 1 ? '' : 's'}` : ''}
        </small>
      </button>
      {child && j.status === 'todo' && <Coins n={j.job.coins} tone="xp" />}
      {m ? <Avatar m={m} size={24} /> : j.status === 'todo' ? <span className="pill">Free</span> : null}
    </li>
  )
}

function JobSheet({ run, j, people, onClose }: { run: HouseRunState; j: HouseJobState; people: Member[]; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const todo = j.status === 'todo'
  const [by, setBy] = useState<MemberId>(j.assignee && run.people.includes(j.assignee) ? j.assignee : me.id)
  const plants = (j.job.plantIds ?? []).map((id) => livePlants(f).find((p) => p.plantId === id)).filter((p): p is NonNullable<typeof p> => !!p)
  const addToList = () => {
    if (!j.job.shopName) return
    act(P.addToList(me.id, f, MAIN_LIST, [{ name: j.job.shopName }]))
    toast(`${j.job.shopName} added to the shopping list.`)
  }
  return (
    <>
      <p className="muted small">
        {j.job.roomEmoji} {j.job.roomName} · {j.job.minutes} min{j.job.coins > 0 ? ` · ${j.job.coins} coins for a child` : ''}
      </p>
      {j.job.notes && <p className="note">{j.job.notes}</p>}
      {plants.length > 0 && <p className="note">Plants to water: {plants.map((p) => `${p.emoji ?? '🪴'} ${p.name}`).join(', ')}. Ticking this counts as watering them.</p>}
      {j.job.link === 'dog-water' && <p className="note">Ticking this also logs the dog's water.</p>}
      {j.job.link === 'machine' && <p className="note">This starts or finishes a wash: the machine takes a while, so something comes back to it later.</p>}
      {j.job.link === 'shopping' && j.job.shopName && (
        <button type="button" className="btn small ghost block" onClick={addToList}>
          <Icon name="bag" size={16} /> Add {j.job.shopName} to the shopping list
        </button>
      )}

      {todo ? (
        <>
          <div className="field">
            <span>Done by</span>
            <MemberChips members={people} value={[by]} onChange={(v) => v[0] && setBy(v[0])} size="small" />
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                const evs = H.tickHouseJob(me.id, f, run.id, j.job.jobId, 'done', by)
                if (evs.length) act(evs)
                onClose()
              }}
            >
              <Icon name="check" size={18} /> Done
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const evs = H.tickHouseJob(me.id, f, run.id, j.job.jobId, 'skipped')
                if (evs.length) act(evs)
                onClose()
              }}
            >
              Skip it
            </button>
          </div>
          <div className="field">
            <span>Give it to someone else</span>
            <MemberChips
              members={people}
              value={j.assignee ? [j.assignee] : []}
              onChange={(v) => {
                if (v[0]) act(H.assignJobs(me.id, run.id, [{ jobId: j.job.jobId, to: v[0] }]))
                onClose()
              }}
              size="small"
            />
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                act(H.assignJobs(me.id, run.id, [{ jobId: j.job.jobId, to: undefined }]))
                onClose()
              }}
            >
              Put it up for grabs
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="note">
            {j.status === 'done' ? 'Done' : 'Skipped'}
            {j.doneBy ? ` by ${f.members[j.doneBy]?.name ?? 'someone'}` : ''}.
          </p>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              act(H.untickHouseJob(me.id, f, run.id, j.job.jobId))
              onClose()
            }}
          >
            <Icon name="undo" size={16} /> Undo
          </button>
        </>
      )}
    </>
  )
}
