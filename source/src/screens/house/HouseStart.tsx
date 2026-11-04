import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as H from '@/family/house/actions'
import { ageOf, autoAssign, loadOf, roomTo } from '@/family/house/assign'
import { DEPTH_LABEL, STANDING_LABEL, houseHasCleaner, houseHelpers, monthsLabel, planSetup, type SetupJob, type SetupRoom } from '@/family/house/house'
import { activeHouseRun } from '@/family/house/run'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { fmtDuration, ymdOf } from '@/family/dates'
import type { Member, MemberId } from '@/family/types'
import { Avatar, MemberChips, ScreenHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

/**
 * Setting up a family session: who is taking part, which rooms and jobs (everything due is ticked; what was done recently, is
 * out of season, is deeper than this session or is a cleaner's job is folded away, ready to be added early), and who does what.
 * Whoever starts it confirms the suggestions - rooms go to one person each by default, and any job can be handed to anyone.
 */
export function HouseStart() {
  const { typeId } = useParams()
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const type = typeId ? f.houseTypes[typeId] : undefined
  const helpers = houseHelpers(f)
  const live = activeHouseRun(f, now)

  const [people, setPeople] = useState<MemberId[]>(() => {
    const usual = (type?.memberIds ?? []).filter((id) => helpers.some((h) => h.id === id))
    return usual.length ? usual : helpers.map((h) => h.id)
  })
  const [roomFlip, setRoomFlip] = useState<Record<string, boolean>>({})
  const [jobFlip, setJobFlip] = useState<Record<string, boolean>>({})
  const [manual, setManual] = useState<Record<string, MemberId>>({})
  const [remember, setRemember] = useState(false)
  const [giving, setGiving] = useState<{ jobId: string; title: string } | undefined>()

  const rooms = useMemo<SetupRoom[]>(() => (type ? planSetup(f, { depth: type.depth, rooms: type.rooms, skipRoomIds: type.skipRoomIds, skipJobIds: type.skipJobIds }, today) : []), [f, type, today])
  const roomOn = (r: SetupRoom) => roomFlip[r.room.roomId] ?? r.included
  const jobOn = (j: SetupJob) => jobFlip[j.job.jobId] ?? j.on
  const live2 = rooms
    .filter(roomOn)
    .map((r) => ({ ...r, jobs: r.jobs.filter(jobOn) }))
    .filter((r) => r.jobs.length)

  const assigned = useMemo(
    () =>
      autoAssign(
        f,
        people,
        live2.map((r) => ({ roomId: r.room.roomId, ownerId: r.room.ownerId, jobs: r.jobs.map((j) => ({ jobId: j.job.jobId, minutes: j.job.minutes, minAge: j.job.minAge })) })),
        today,
        manual,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, people, rooms, roomFlip, jobFlip, manual, today],
  )

  if (!type) {
    return (
      <div className="screen">
        <ScreenHead title="Family session" onBack={() => nav('/plan')} />
        <p className="note">That session isn't there any more.</p>
      </div>
    )
  }
  if (live) {
    return (
      <div className="screen">
        <ScreenHead title={type.name} onBack={() => nav('/plan')} />
        <div className="card callout">
          <Icon name="home" size={26} />
          <div>
            <h3>{live.title} is already running</h3>
            <p className="muted">Only one family session at a time. Join it, or finish it first.</p>
            <button type="button" className="btn primary small" onClick={() => nav(`/house/run/${live.id}`)}>
              Open it
            </button>
          </div>
        </div>
      </div>
    )
  }

  const members = people.map((id) => f.members[id]).filter((m): m is Member => !!m)
  const jobs = live2.flatMap((r) => r.jobs)
  const minutes = jobs.reduce((t, j) => t + j.job.minutes, 0)
  const loads = loadOf(
    jobs.map((j) => ({ jobId: j.job.jobId, minutes: j.job.minutes })),
    assigned,
  )
  const giveRoom = (r: SetupRoom, to: MemberId) => {
    const m = f.members[to]
    const next = roomTo(
      r.jobs.filter(jobOn).map((j) => ({ jobId: j.job.jobId, minAge: j.job.minAge })),
      assigned,
      to,
      m ? ageOf(m, today) : 18,
    )
    setManual((x) => ({
      ...x,
      ...Object.fromEntries(
        Object.entries(next)
          .filter(([k, v]) => v === to && r.jobs.some((j) => j.job.jobId === k))
          .map(([k, v]) => [k, v!]),
      ),
    }))
  }
  const roomPerson = (r: SetupRoom): MemberId | undefined => {
    const c: Record<string, number> = {}
    for (const j of r.jobs.filter(jobOn)) if (assigned[j.job.jobId]) c[assigned[j.job.jobId]!] = (c[assigned[j.job.jobId]!] ?? 0) + j.job.minutes
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0]
  }

  const start = () => {
    if (!jobs.length) return toast('Pick at least one job.')
    if (!people.length) return toast('Who is taking part?')
    const picked = live2.flatMap((r) => r.jobs.map((j) => ({ room: r.room, job: j.job, plantIds: j.plantIds })))
    const { runId, events } = H.startHouseRun(me.id, f, { typeId: type.typeId, title: type.name, emoji: type.emoji, people, picked, assignments: assigned, date: today }, Date.now())
    if (!events.length) return
    const out = [...events]
    if (remember) {
      const defaultOnRooms = rooms.filter((r) => r.included)
      const skipRoomIds = [
        ...new Set([...(type.skipRoomIds ?? []).filter((id) => roomFlip[id] !== true), ...defaultOnRooms.filter((r) => roomFlip[r.room.roomId] === false).map((r) => r.room.roomId)]),
      ]
      const skipJobIds = [
        ...new Set([
          ...(type.skipJobIds ?? []).filter((id) => jobFlip[id] !== true),
          ...rooms.flatMap((r) => r.jobs.filter((j) => j.standing === 'due' && jobFlip[j.job.jobId] === false).map((j) => j.job.jobId)),
        ]),
      ]
      out.push(...H.saveType(me.id, { ...type, skipRoomIds: skipRoomIds.length ? skipRoomIds : undefined, skipJobIds: skipJobIds.length ? skipJobIds : undefined, memberIds: people }, Date.now() + 50))
    }
    act(out)
    nav(`/house/run/${runId}`, { replace: true })
  }

  const jobRow = (j: SetupJob) => {
    const ticked = jobOn(j)
    const who = assigned[j.job.jobId] ? f.members[assigned[j.job.jobId]!] : undefined
    return (
      <li key={j.job.jobId} className={ticked ? '' : 'dim'}>
        <label>
          <input type="checkbox" checked={ticked} onChange={(e) => setJobFlip((x) => ({ ...x, [j.job.jobId]: e.target.checked }))} />
          <span className="grow">
            {j.job.title}
            <small className="muted">
              {j.job.minutes} min{j.standing !== 'due' ? ` · ${STANDING_LABEL[j.standing]}${j.dueInDays ? ` (due again in ${j.dueInDays} day${j.dueInDays === 1 ? '' : 's'})` : ''}` : ''}
              {j.job.months?.length ? ` · ${monthsLabel(j.job.months)}` : ''}
            </small>
          </span>
        </label>
        {ticked && who && (
          <button type="button" className="icon-btn small" aria-label={`${j.job.title}: ${who.name}. Change who does it`} onClick={() => setGiving({ jobId: j.job.jobId, title: j.job.title })}>
            <Avatar m={who} size={22} />
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="screen house-start">
      <ScreenHead title={`${type.emoji ?? '🏠'} ${type.name}`} eyebrow={`${DEPTH_LABEL[type.depth]} · set up`} onBack={() => nav('/plan')} />

      <section className="card">
        <h3>Who is taking part?</h3>
        <MemberChips members={helpers} value={people} onChange={setPeople} multi size="small" />
        {houseHasCleaner(f) && <p className="note">You've said you have a cleaner, so jobs they usually do are folded away below.</p>}
      </section>

      <section className="card house-summary" aria-label="Summary">
        <strong>
          {jobs.length} jobs · {fmtDuration(Math.max(1, minutes))} in all
        </strong>
        <div className="house-loads">
          {members.map((m) => (
            <span key={m.id} className="house-load">
              <Avatar m={m} size={20} /> {m.name} {fmtDuration(loads[m.id] ?? 0) || '0m'}
            </span>
          ))}
        </div>
      </section>

      <p className="note">Suggested by room. Change a room's person with the menu, or tap a person next to a job to hand just that one to someone else.</p>

      {rooms
        .filter((r) => r.jobs.length || roomOn(r))
        .map((r) => {
          const on = roomOn(r)
          const jobsHere = r.jobs.filter(jobOn)
          const person = roomPerson(r)
          return (
            <details key={r.room.roomId} className={`card house-room${on ? '' : ' off'}`} open={on && jobsHere.length > 0 && jobsHere.length <= 6}>
              <summary>
                <input
                  type="checkbox"
                  className="switch"
                  checked={on}
                  onChange={(e) => setRoomFlip((x) => ({ ...x, [r.room.roomId]: e.target.checked }))}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Include ${r.room.name}`}
                />
                <span className="plan-emoji">{r.room.emoji ?? '🏠'}</span>
                <span className="grow">
                  <strong>{r.room.name}</strong>
                  <small className="muted">
                    {on
                      ? `${jobsHere.length} jobs · ${fmtDuration(
                          Math.max(
                            1,
                            jobsHere.reduce((t, j) => t + j.job.minutes, 0),
                          ),
                        )}`
                      : 'Left out'}
                  </small>
                </span>
                {on && person && (
                  <select className="tbox slim house-who" value={person} aria-label={`Who does ${r.room.name}`} onClick={(e) => e.stopPropagation()} onChange={(e) => giveRoom(r, e.target.value)}>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </summary>
              {on && (
                <>
                  <ul className="house-jobs">{r.jobs.filter((j) => j.standing === 'due' || jobOn(j)).map(jobRow)}</ul>
                  {r.jobs.some((j) => j.standing !== 'due' && !jobOn(j)) && (
                    <details className="house-folded">
                      <summary>Not suggested today ({r.jobs.filter((j) => j.standing !== 'due' && !jobOn(j)).length})</summary>
                      <ul className="house-jobs">{r.jobs.filter((j) => j.standing !== 'due' && !jobOn(j)).map(jobRow)}</ul>
                    </details>
                  )}
                </>
              )}
            </details>
          )
        })}

      {me.role === 'parent' && (
        <label className="switch-row">
          <input type="checkbox" className="switch" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>
            Remember what I've left out, and who usually takes part
            <small className="muted">Next time this session starts with the same choices.</small>
          </span>
        </label>
      )}

      <div className="house-start-bar">
        <button type="button" className="btn primary block" onClick={start} disabled={!jobs.length || !people.length}>
          <Icon name="play" size={18} /> Start · {jobs.length} jobs
        </button>
      </div>

      <Sheet open={!!giving} onClose={() => setGiving(undefined)} title={giving?.title}>
        <p className="note">Who should do this one?</p>
        <MemberChips
          members={members}
          value={giving && assigned[giving.jobId] ? [assigned[giving.jobId]!] : []}
          onChange={(v) => {
            if (giving && v[0]) setManual((x) => ({ ...x, [giving.jobId]: v[0]! }))
            setGiving(undefined)
          }}
        />
      </Sheet>
    </div>
  )
}
