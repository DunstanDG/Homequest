import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as H from '@/family/house/actions'
import { DEPTH_LABEL, liveHouseJobs, liveHouseRooms, monthsLabel, orderJobs, resetLabel } from '@/family/house/house'
import { useApp, useFamily, useMe } from '@/app/context'
import { fmtDuration } from '@/family/dates'
import type { HouseDepth, HouseJobEvent, HouseLink, HouseNeed, HouseRoomEvent } from '@/family/types'
import { Avatar, ScreenHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PHASES: [number, string][] = [
  [1, 'Clear first'],
  [2, 'Empty'],
  [3, 'Clean'],
  [4, 'Fill & restock'],
  [5, 'Floors last'],
]
const LINKS: [HouseLink | '', string][] = [
  ['', 'Nothing special'],
  ['plants', 'Waters the plants in the room'],
  ['dog-water', "Logs the dog's water"],
  ['shopping', 'Offers to add to the shopping list'],
  ['board', 'Update the board'],
  ['machine', 'Washing machine (starts a wait)'],
]

/** Rooms and the jobs in them: the family's own list. Add, rename, retime or remove anything; starter rooms can be added back. */
export function HouseCatalog() {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const parent = me.role === 'parent'
  const rooms = liveHouseRooms(f)
  const removed = Object.values(f.houseRooms).filter((r) => r.deleted)
  const missing = H.missingStarterRooms(f)
  const [room, setRoom] = useState<{ room?: HouseRoomEvent } | undefined>()
  const [openId, setOpenId] = useState<string | undefined>()
  const [job, setJob] = useState<{ roomId: string; job?: HouseJobEvent } | undefined>()

  return (
    <div className="screen house-catalog">
      <ScreenHead
        title="Rooms & jobs"
        eyebrow="Family sessions"
        onBack={() => nav('/plan')}
        right={
          parent ? (
            <button type="button" className="btn small" onClick={() => setRoom({})}>
              <Icon name="plus" size={16} /> Room
            </button>
          ) : undefined
        }
      />
      {!parent && <p className="note">Only a parent can change these.</p>}
      {rooms.length === 0 && (
        <div className="card callout">
          <Icon name="home" size={26} />
          <div>
            <h3>No rooms yet</h3>
            {parent && (
              <button type="button" className="btn primary small" onClick={() => act(H.seedHouse(me.id, f))}>
                Add the starter list
              </button>
            )}
          </div>
        </div>
      )}
      {rooms.map((r) => {
        const jobs = orderJobs(liveHouseJobs(f, r.roomId))
        const open = openId === r.roomId
        const owner = r.ownerId ? f.members[r.ownerId] : undefined
        return (
          <section key={r.roomId} className="card house-room-card">
            <header>
              <button type="button" className="house-room-head" onClick={() => setOpenId(open ? undefined : r.roomId)} aria-expanded={open}>
                <span className="plan-emoji">{r.emoji ?? '🏠'}</span>
                <span className="grow">
                  <strong>{r.name}</strong>
                  <small className="muted">
                    {jobs.length} jobs ·{' '}
                    {fmtDuration(
                      Math.max(
                        1,
                        jobs.reduce((t, j) => t + j.minutes, 0),
                      ),
                    )}
                    {r.outdoor ? ' · outdoors' : ''}
                    {r.quickTidy ? ' · in quick tidies' : ''}
                  </small>
                </span>
                {owner && <Avatar m={owner} size={22} />}
                <Icon name="chevron" size={16} />
              </button>
            </header>
            {open && (
              <>
                <ul className="house-jobs">
                  {jobs.map((j) => (
                    <li key={j.jobId}>
                      <button type="button" className="house-job-body" onClick={() => parent && setJob({ roomId: r.roomId, job: j })} disabled={!parent}>
                        <span className="house-job-title">{j.title}</span>
                        <small className="muted">
                          {j.minutes} min · {DEPTH_LABEL[j.depth]} · {resetLabel(j.resetDays)}
                          {j.months?.length ? ` · ${monthsLabel(j.months)}` : ''}
                          {j.cleaner ? ' · cleaner' : ''}
                          {j.requires ? ` · needs a ${j.requires === 'plants' ? 'plant' : j.requires}` : ''}
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
                {parent && (
                  <div className="btn-row">
                    <button type="button" className="btn small" onClick={() => setJob({ roomId: r.roomId })}>
                      <Icon name="plus" size={16} /> Job
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setRoom({ room: r })}>
                      <Icon name="pencil" size={16} /> Edit room
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )
      })}

      {parent && (missing.length > 0 || removed.length > 0) && (
        <section className="card">
          <h3>Add back</h3>
          {missing.length > 0 && (
            <>
              <p className="note">Starter rooms you don't have yet.</p>
              <div className="chips">
                {missing.map((m) => (
                  <button key={`${m.key}-${m.childId ?? ''}`} type="button" className="chip small" onClick={() => act(H.seedHouse(me.id, f))}>
                    + {m.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {removed.length > 0 && (
            <>
              <p className="note">Rooms you removed (their jobs come back with them).</p>
              <div className="chips">
                {removed.map((r) => (
                  <button key={r.roomId} type="button" className="chip small" onClick={() => (act(H.restoreRoom(me.id, r)), toast(`${r.name} is back.`))}>
                    + {r.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {room && <RoomEditor key={room.room?.roomId ?? 'new'} room={room.room} onClose={() => setRoom(undefined)} />}
      {job && <JobEditor key={job.job?.jobId ?? 'new'} roomId={job.roomId} job={job.job} onClose={() => setJob(undefined)} />}
    </div>
  )
}

function RoomEditor({ room, onClose }: { room?: HouseRoomEvent; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [name, setName] = useState(room?.name ?? '')
  const [emoji, setEmoji] = useState(room?.emoji ?? '🏠')
  const [outdoor, setOutdoor] = useState(!!room?.outdoor)
  const [quick, setQuick] = useState(!!room?.quickTidy)
  const [owner, setOwner] = useState(room?.ownerId ?? '')
  const [confirm, setConfirm] = useState(false)
  const kids = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  return (
    <Sheet open onClose={onClose} title={room ? 'Edit room' : 'New room'}>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} aria-label="Icon" />
        </label>
        <label className="field grow">
          <span>Name</span>
          <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Utility room" />
        </label>
      </div>
      <label className="switch-row">
        <input type="checkbox" className="switch" checked={outdoor} onChange={(e) => setOutdoor(e.target.checked)} />
        <span>It's outdoors (garden, shed, garage)</span>
      </label>
      <label className="switch-row">
        <input type="checkbox" className="switch" checked={quick} onChange={(e) => setQuick(e.target.checked)} />
        <span>Include in a quick tidy</span>
      </label>
      {kids.length > 0 && (
        <label className="field">
          <span>A child's own room? They are given it by default.</span>
          <select className="tbox" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">No one in particular</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!name.trim()) return toast('Give it a name.')
            act(
              H.saveRoom(me.id, f, {
                ...(room ?? {}),
                roomId: room?.roomId,
                name,
                emoji: emoji.trim() || undefined,
                outdoor: outdoor || undefined,
                quickTidy: quick || undefined,
                ownerId: owner || undefined,
                requires: room?.requires,
                starterKey: room?.starterKey,
              }),
            )
            onClose()
          }}
        >
          Save
        </button>
        {room &&
          (confirm ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                act(H.deleteRoom(me.id, room))
                toast(`${room.name} removed. You can add it back below.`)
                onClose()
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
    </Sheet>
  )
}

function JobEditor({ roomId, job, onClose }: { roomId: string; job?: HouseJobEvent; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [title, setTitle] = useState(job?.title ?? '')
  const [minutes, setMinutes] = useState(String(job?.minutes ?? 5))
  const [minAge, setMinAge] = useState(String(job?.minAge ?? 6))
  const [depth, setDepth] = useState<HouseDepth>(job?.depth ?? 'standard')
  const [reset, setReset] = useState(String(job?.resetDays ?? 0))
  const [months, setMonths] = useState<number[]>(job?.months ?? [])
  const [needs, setNeeds] = useState<HouseNeed | ''>(job?.requires ?? '')
  const [link, setLink] = useState<HouseLink | ''>(job?.link ?? '')
  const [phase, setPhase] = useState(job?.phase ?? 3)
  const [cleaner, setCleaner] = useState(!!job?.cleaner)
  const [coins, setCoins] = useState(job?.coins != null ? String(job.coins) : '')
  const [shop, setShop] = useState(job?.shopName ?? '')
  const [notes, setNotes] = useState(job?.notes ?? '')
  const [confirm, setConfirm] = useState(false)
  return (
    <Sheet open onClose={onClose} title={job ? 'Edit job' : 'New job'}>
      <label className="field">
        <span>What needs doing</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wipe skirting boards" />
      </label>
      <div className="row-fields">
        <label className="field grow">
          <span>Minutes</span>
          <input className="tbox" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field grow">
          <span>Youngest age</span>
          <input className="tbox" inputMode="numeric" value={minAge} onChange={(e) => setMinAge(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <div className="field">
        <span>Goes in</span>
        <Seg<HouseDepth>
          label="Depth"
          value={depth}
          onChange={setDepth}
          options={[
            { id: 'quick', label: 'Every tidy' },
            { id: 'standard', label: 'Standard' },
            { id: 'deep', label: 'Deep only' },
          ]}
        />
      </div>
      <label className="field">
        <span>Stays done for (days). 0 means it is suggested every time.</span>
        <input className="tbox" inputMode="numeric" value={reset} onChange={(e) => setReset(e.target.value.replace(/\D/g, ''))} />
      </label>
      <div className="field">
        <span>Only in these months (none ticked = all year)</span>
        <div className="chips">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              type="button"
              className={`chip small${months.includes(i + 1) ? ' selected' : ''}`}
              onClick={() => setMonths(months.includes(i + 1) ? months.filter((x) => x !== i + 1) : [...months, i + 1].sort((a, b) => a - b))}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Order in the room</span>
        <select className="tbox" value={phase} onChange={(e) => setPhase(Number(e.target.value))}>
          {PHASES.map(([n, label]) => (
            <option key={n} value={n}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Only applies if the family has</span>
        <select className="tbox" value={needs} onChange={(e) => setNeeds(e.target.value as HouseNeed | '')}>
          <option value="">Nothing in particular</option>
          <option value="dog">A dog</option>
          <option value="baby">A baby</option>
          <option value="plants">Plants</option>
        </select>
      </label>
      <label className="field">
        <span>Ties into the app</span>
        <select className="tbox" value={link} onChange={(e) => setLink(e.target.value as HouseLink | '')}>
          {LINKS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {link === 'shopping' && (
        <label className="field">
          <span>What to add to the list</span>
          <input className="tbox" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="e.g. Hand soap" />
        </label>
      )}
      <label className="switch-row">
        <input type="checkbox" className="switch" checked={cleaner} onChange={(e) => setCleaner(e.target.checked)} />
        <span>A cleaner usually does this</span>
      </label>
      <label className="field">
        <span>Coins a child earns (blank = a small amount by length)</span>
        <input className="tbox" inputMode="numeric" value={coins} onChange={(e) => setCoins(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="field">
        <span>Note</span>
        <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!title.trim()) return toast('What needs doing?')
            act(
              H.saveJob(me.id, f, {
                jobId: job?.jobId,
                roomId,
                title,
                minutes: Number(minutes) || 5,
                minAge: Number(minAge) || 0,
                depth,
                resetDays: Number(reset) || 0,
                months: months.length ? months : undefined,
                requires: needs || undefined,
                link: link || undefined,
                phase,
                after: job?.after,
                cleaner: cleaner || undefined,
                coins: coins === '' ? undefined : Number(coins),
                shopName: link === 'shopping' && shop.trim() ? shop.trim() : undefined,
                notes: notes.trim() || undefined,
                starterKey: job?.starterKey,
              }),
            )
            onClose()
          }}
        >
          Save
        </button>
        {job &&
          (confirm ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                act(H.deleteJob(me.id, job))
                onClose()
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
    </Sheet>
  )
}
