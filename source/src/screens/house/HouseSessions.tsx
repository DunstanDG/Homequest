import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as H from '@/family/house/actions'
import { houseHelpers, houseHasCleaner, liveHouseRooms, liveHouseTypes, planSetup, setupMinutes, DEPTH_LABEL, hasHouse } from '@/family/house/house'
import { activeHouseRun, allHouseRuns, houseProgress } from '@/family/house/run'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { ago, fmtDuration, friendlyDay, ymdOf } from '@/family/dates'
import { describeRecurrence } from '@/family/recur'
import type { HouseDepth, HouseTypeEvent, MemberId, Recurrence, Ymd } from '@/family/types'
import { RepeatPicker, initialRepeat, repeatToRecur, type RepeatState } from '@/screens/family/shared'
import { MemberChips, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { fmtClock } from '@/family/timers'
import { BoardSheet } from './BoardSheet'

/** Shown on Plan › Sessions and Today when a family session is under way. */
export function HouseBanner({ runId }: { runId: string }) {
  const nav = useNavigate()
  const f = useFamily()
  const now = useNow(1000)
  const run = allHouseRuns(f).find((r) => r.id === runId)
  if (!run) return null
  const p = houseProgress(run, now)
  return (
    <button type="button" className={`card run-banner house-banner${run.status === 'paused' ? ' paused' : ''}`} onClick={() => nav(`/house/run/${run.id}`)}>
      <span className="plan-emoji">{run.emoji ?? '🏠'}</span>
      <div className="grow">
        <strong>{run.title}</strong>
        <p className="muted small">
          {run.status === 'paused' ? 'Paused' : `${run.people.length} taking part`} · {p.done + p.skipped} of {p.total} jobs
        </p>
      </div>
      <span className="run-banner-clock">{fmtClock(p.elapsedSec)}</span>
      <Icon name="chevron" size={18} />
    </button>
  )
}

/** Family sessions: the whole household doing a lot of small jobs at once (a house clean-up, a garden day). */
export function HouseSessions() {
  const nav = useNavigate()
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(30_000)
  const today = ymdOf(now)
  const parent = me.role === 'parent'
  const types = liveHouseTypes(f)
  const live = activeHouseRun(f, now)
  const [edit, setEdit] = useState<{ type?: HouseTypeEvent } | undefined>()
  const [board, setBoard] = useState(false)

  // First visit by a parent: add the starter rooms and jobs (the same events on every phone, so it happens once).
  useEffect(() => {
    if (parent && !hasHouse(f)) {
      const seed = H.seedHouse(me.id, f)
      if (seed.length) act(seed)
    }
  }, [parent, f, me.id, act])

  const people = houseHelpers(f)
  return (
    <section className="house-sessions" aria-label="Family sessions">
      <SectionHead
        title="Family sessions"
        sub="Everyone pitches in: pick who, which rooms, which jobs."
        action={
          parent ? (
            <button type="button" className="btn small" onClick={() => setEdit({})}>
              <Icon name="plus" size={16} /> New
            </button>
          ) : undefined
        }
      />
      {live && <HouseBanner runId={live.id} />}
      {types.length === 0 && (
        <div className="card callout">
          <Icon name="home" size={26} />
          <div>
            <h3>No family sessions yet</h3>
            <p className="muted">{parent ? 'Make one, such as a house clean or a garden day.' : 'A parent can set these up.'}</p>
          </div>
        </div>
      )}
      {types.map((t) => {
        const rooms = planSetup(f, { depth: t.depth, rooms: t.rooms, skipRoomIds: t.skipRoomIds, skipJobIds: t.skipJobIds }, today)
        const mins = setupMinutes(rooms)
        const together = t.memberIds?.length || people.length || 1
        const last = allHouseRuns(f).find((r) => r.typeId === t.typeId && r.status === 'done')
        const sched = t.date ? [t.recur ? describeRecurrence(t.recur) : friendlyDay(t.date, today), t.startAt].filter(Boolean).join(' · ') : ''
        return (
          <article key={t.typeId} className="card session-card">
            <div className="session-top">
              <span className="plan-emoji">{t.emoji ?? '🏠'}</span>
              <div className="grow">
                <strong>{t.name}</strong>
                <p className="muted small">
                  {DEPTH_LABEL[t.depth]} · {roomsLabel(rooms.filter((r) => r.included && r.jobs.some((j) => j.on)).length)} · about {fmtDuration(Math.max(1, Math.ceil(mins / together)))} each
                </p>
                {sched && <p className="muted small">🗓️ {sched}</p>}
                {last && <p className="muted small">Last done {ago(last.endedTs ?? last.startedTs, now)}</p>}
              </div>
            </div>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={() => nav(live ? `/house/run/${live.id}` : `/house/start/${t.typeId}`)}>
                <Icon name="play" size={18} /> {live ? 'Open the running one' : 'Set up & start'}
              </button>
              {parent && (
                <button type="button" className="btn ghost" onClick={() => setEdit({ type: t })}>
                  <Icon name="pencil" size={16} /> Edit
                </button>
              )}
            </div>
          </article>
        )
      })}
      <div className="btn-row house-links">
        <Link to="/house/rooms" className="btn small ghost">
          <Icon name="settings" size={16} /> Rooms & jobs ({liveHouseRooms(f).length})
        </Link>
        <button type="button" className="btn small ghost" onClick={() => setBoard(true)}>
          <Icon name="checklist" size={16} /> Board for the week
        </button>
      </div>
      {parent && (
        <label className="switch-row">
          <input type="checkbox" className="switch" checked={houseHasCleaner(f)} onChange={(e) => act(H.setHouseCleaner(me.id, e.target.checked))} />
          <span>
            We have a cleaner
            <small className="muted">Jobs a cleaner usually does (floors, dusting, bathrooms) are left out by default.</small>
          </span>
        </label>
      )}
      {edit && <TypeEditor key={edit.type?.typeId ?? 'new'} type={edit.type} today={today} onClose={() => setEdit(undefined)} />}
      <BoardSheet open={board} onClose={() => setBoard(false)} />
    </section>
  )
}

const roomsLabel = (n: number) => `${n} room${n === 1 ? '' : 's'}`

type RoomsRule = 'indoor' | 'outdoor' | 'quick' | 'pick'

function TypeEditor({ type, today, onClose }: { type?: HouseTypeEvent; today: Ymd; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = houseHelpers(f)
  const rooms = liveHouseRooms(f)
  const [name, setName] = useState(type?.name ?? '')
  const [emoji, setEmoji] = useState(type?.emoji ?? '🏠')
  const [depth, setDepth] = useState<HouseDepth>(type?.depth ?? 'standard')
  const [rule, setRule] = useState<RoomsRule>(Array.isArray(type?.rooms) ? 'pick' : ((type?.rooms as 'indoor' | 'outdoor' | 'quick' | undefined) ?? 'indoor'))
  const [picked, setPicked] = useState<string[]>(Array.isArray(type?.rooms) ? type!.rooms : rooms.filter((r) => !r.outdoor).map((r) => r.roomId))
  const [who, setWho] = useState<MemberId[]>(type?.memberIds ?? [])
  const [scheduled, setScheduled] = useState(!!type?.date)
  const [date, setDate] = useState<string>(type?.date ?? today)
  const [startAt, setStartAt] = useState(type?.startAt ?? '')
  const [rep, setRep] = useState<RepeatState>(initialRepeat(type?.recur))
  const [confirm, setConfirm] = useState(false)
  const skipped = (type?.skipRoomIds?.length ?? 0) + (type?.skipJobIds?.length ?? 0)
  const [clear, setClear] = useState(false)
  const roomsValue = useMemo<HouseTypeEvent['rooms']>(() => (rule === 'pick' ? picked : rule), [rule, picked])

  const save = () => {
    if (!name.trim()) return toast('Give it a name.')
    if (rule === 'pick' && !picked.length) return toast('Choose at least one room.')
    const d = (date || today) as Ymd
    const recur: Recurrence | undefined = scheduled ? repeatToRecur(rep, d, type?.recur) : undefined
    act(
      H.saveType(me.id, {
        typeId: type?.typeId,
        name,
        emoji: emoji.trim() || undefined,
        depth,
        rooms: roomsValue,
        skipRoomIds: clear ? undefined : type?.skipRoomIds,
        skipJobIds: clear ? undefined : type?.skipJobIds,
        memberIds: who.length ? who : undefined,
        date: scheduled ? d : undefined,
        startAt: scheduled ? startAt || undefined : undefined,
        recur,
        exdates: scheduled ? type?.exdates : undefined,
        order: type?.order,
      }),
    )
    toast(type ? 'Saved.' : 'Family session added.')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={type ? 'Edit family session' : 'New family session'}>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} aria-label="Icon" />
        </label>
        <label className="field grow">
          <span>Name</span>
          <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Saturday tidy" />
        </label>
      </div>
      <div className="field">
        <span>How deep?</span>
        <Seg<HouseDepth>
          label="Depth"
          value={depth}
          onChange={setDepth}
          options={[
            { id: 'quick', label: 'Quick tidy' },
            { id: 'standard', label: 'Standard' },
            { id: 'deep', label: 'Deep clean' },
          ]}
        />
        <small className="muted">Quick covers the everyday jobs; standard adds the weekly ones; deep adds the big, rare ones.</small>
      </div>
      <div className="field">
        <span>Which rooms?</span>
        <div className="chips">
          {(
            [
              ['indoor', 'All indoor rooms'],
              ['outdoor', 'Garden'],
              ['quick', 'Quick-tidy rooms'],
              ['pick', 'Choose rooms'],
            ] as [RoomsRule, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className={`chip small${rule === id ? ' selected' : ''}`} onClick={() => setRule(id)}>
              {label}
            </button>
          ))}
        </div>
        {rule === 'pick' && (
          <div className="chips">
            {rooms.map((r) => (
              <button
                key={r.roomId}
                type="button"
                className={`chip small${picked.includes(r.roomId) ? ' selected' : ''}`}
                onClick={() => setPicked(picked.includes(r.roomId) ? picked.filter((x) => x !== r.roomId) : [...picked, r.roomId])}
              >
                {r.emoji} {r.name}
              </button>
            ))}
          </div>
        )}
        {rule !== 'pick' && <small className="muted">Rooms you add later join automatically.</small>}
      </div>
      <div className="field">
        <span>Who usually takes part?</span>
        <MemberChips members={people} value={who} onChange={setWho} multi everyone={{ label: 'Everyone', active: who.length === 0, onToggle: () => setWho([]) }} size="small" />
      </div>
      {skipped > 0 && !clear && (
        <p className="note">
          Always leaving out {type?.skipRoomIds?.length ?? 0} room{(type?.skipRoomIds?.length ?? 0) === 1 ? '' : 's'} and {type?.skipJobIds?.length ?? 0} job
          {(type?.skipJobIds?.length ?? 0) === 1 ? '' : 's'}.{' '}
          <button type="button" className="link-btn" onClick={() => setClear(true)}>
            Put them all back
          </button>
        </p>
      )}
      <label className="switch-row">
        <input type="checkbox" className="switch" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} />
        <span>Put it on the calendar</span>
      </label>
      {scheduled && (
        <>
          <div className="row-fields">
            <label className="field grow">
              <span>Starts on</span>
              <input type="date" className="tbox" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field grow">
              <span>At (optional)</span>
              <input type="time" className="tbox" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </label>
          </div>
          <RepeatPicker value={rep} onChange={setRep} allowSchool={false} />
          <p className="note">It shows on the calendar, and on Today with a Start button on that day only.</p>
        </>
      )}
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={save}>
          Save
        </button>
        {type &&
          (confirm ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                act(H.deleteType(me.id, type))
                toast('Deleted.')
                onClose()
              }}
            >
              Really delete
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>
              <Icon name="trash" size={16} /> Delete
            </button>
          ))}
      </div>
    </Sheet>
  )
}
