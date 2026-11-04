import { useMemo, useState } from 'react'
import { HelpHead } from '@/ui/ux'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { useApp, useFamily, useMe } from '@/app/context'
import { usePrivacy } from '@/app/usePrivacy'
import { PrivateKeys } from '@/screens/family/PrivateKeys'
import { addDays, fmtDuration, friendlyDay, ymdOf } from '@/family/dates'
import { areasOf, dumpList, dumpMeta, dumpState, dumpTotals, parseDump } from '@/family/dump'
import { liveRoutines } from '@/family/routines'
import type { DumpEvent, DumpPriority, MemberId, Ymd } from '@/family/types'
import { Avatar, CheckCircle, MemberChips, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { cancelTaskReminder, usePeople } from '@/screens/family/shared'

/** The brain dump: get everything out of your head without deciding when. Later, drop things onto a day or into a session. */
export function Dump() {
  const nav = useNavigate()
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople()
  const [text, setText] = useState('')
  const [area, setArea] = useState<string>('')
  const [mineOnly, setMineOnly] = useState(false)
  const [q, setQ] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [open, setOpen] = useState<string | undefined>()
  const [making, setMaking] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [privNew, setPrivNew] = useState(false)
  const [keys, setKeys] = useState(false)
  const privacy = usePrivacy()

  const items = dumpList(f, { area: area || undefined, ownerId: mineOnly ? me.id : undefined, q })
  const finished = dumpList(f, { show: 'done' })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30)
  const areas = areasOf(f)
  const totals = useMemo(() => dumpTotals(f, items), [f, items])
  const parsed = useMemo(() => parseDump(text, people), [text, people])
  const opened = open ? f.dump[open] : undefined

  const add = () => {
    if (!parsed.length) return
    if (privNew && !privacy.ok) return setKeys(true)
    act(
      P.addDump(
        me.id,
        parsed.map((p) => (privNew ? { ...p, private: true, ownerId: undefined } : p)),
      ),
    )
    toast(`Added ${parsed.length} thing${parsed.length === 1 ? '' : 's'}${privNew ? ' (private)' : ''}.`)
    setText('')
  }

  const tick = (d: DumpEvent) => {
    // If it is on someone's day as a task, that task is ticked off with it (and the tick undone with it).
    const t = d.taskId ? f.tasks[d.taskId] : undefined
    const date = t?.date ?? 'any'
    const taskEvs = t && !t.deleted && !f.done[`${t.taskId}|${date}`] ? A.completeTask(me.id, f, t, date, { minutes: d.minutes }) : []
    act([...P.saveDump(me.id, d, { status: 'done' }), ...taskEvs])
    toast(`Done: ${d.title}`, { undo: () => act([...P.saveDump(me.id, d, { status: d.status }, Date.now() + 1), ...P.undoEvents(me.id, taskEvs, Date.now() + 2)]) })
    if (t) void cancelTaskReminder(sync, t.taskId)
  }
  const putBack = (d: DumpEvent) => {
    const now = Date.now()
    act([...(d.taskId ? P.unscheduleDump(me.id, f, d, now) : []), ...P.saveDump(me.id, { ...d, taskId: undefined }, { status: 'open' }, now + 2)])
  }

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const chosen = items.filter((d) => picked.includes(d.itemId))

  return (
    <>
      <HelpHead title="Brain dump" helpId="plan.dump" help="Write it all down, one per line. Sort it out later. Mark things private and nobody else sees them." />

      <div className="card dump-capture">
        <textarea
          className="tbox"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Book the boiler service\nSort the loft ~1h\nCall the council #admin !'}
          aria-label="Things to do"
        />
        <p className="note">
          Optional extras: <code>#list</code> <code>~15</code> minutes <code>@name</code> <code>!</code> important <code>#someday</code>
        </p>
        {parsed.length > 0 && (
          <ul className="dump-preview">
            {parsed.slice(0, 6).map((p, i) => (
              <li key={i}>
                <strong>{p.title}</strong>
                <span className="muted small">
                  {[p.area, p.minutes ? `~${p.minutes} min` : '', p.ownerId ? f.members[p.ownerId]?.name : '', p.priority === 'high' ? 'important' : p.priority === 'someday' ? 'someday' : '']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
            {parsed.length > 6 && <li className="muted small">…and {parsed.length - 6} more</li>}
          </ul>
        )}
        <div className="row-fields">
          <button type="button" className={`chip small${privNew ? ' selected' : ''}`} aria-pressed={privNew} onClick={() => (!privNew && !privacy.ok ? setKeys(true) : setPrivNew(!privNew))}>
            🔒 Private
          </button>
          <button type="button" className="link-btn" onClick={() => setKeys(true)}>
            Private key
          </button>
        </div>
        {privNew && <p className="note">Only you will see these, on any of your phones that have your key.</p>}
        <button type="button" className="btn primary block" onClick={add} disabled={!parsed.length}>
          <Icon name="plus" size={18} /> Add {parsed.length > 1 ? `${parsed.length} things` : 'to the list'}
        </button>
      </div>

      <div className="chips scroll-chips" role="group" aria-label="Lists">
        <button type="button" className={`chip small${!area ? ' selected' : ''}`} onClick={() => setArea('')}>
          Everything
        </button>
        {areas
          .filter((a) => a.count > 0 || a.name === area)
          .map((a) => (
            <button key={a.name} type="button" className={`chip small${area === a.name ? ' selected' : ''}`} onClick={() => setArea(area === a.name ? '' : a.name)}>
              {a.name} <b>{a.count}</b>
            </button>
          ))}
        <button type="button" className={`chip small${mineOnly ? ' selected' : ''}`} onClick={() => setMineOnly(!mineOnly)}>
          Just mine
        </button>
      </div>

      <div className="row-between">
        <input className="tbox slim grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search the list" />
        <button type="button" className={`btn small${selecting ? ' primary' : ' ghost'}`} onClick={() => (setSelecting(!selecting), setPicked([]))}>
          {selecting ? 'Cancel' : 'Select'}
        </button>
      </div>

      {items.length > 0 && (
        <p className="note">
          {totals.count} thing{totals.count === 1 ? '' : 's'}
          {totals.minutes ? ` · about ${fmtDuration(totals.minutes)}` : ''}
          {totals.minutes && totals.unestimated ? ` (${totals.unestimated} with no time guess)` : ''}
        </p>
      )}

      {items.length === 0 && (
        <div className="empty">
          <Icon name="checklist" size={32} />
          <h3>{q || area || mineOnly ? 'Nothing matches' : 'Your head is clear'}</h3>
          <p>{q || area || mineOnly ? 'Try another list, or clear the search.' : 'Type things above as they occur to you.'}</p>
        </div>
      )}

      <ul className="dump-list">
        {items.map((d) => {
          const st = dumpState(f, d)
          const task = d.taskId ? f.tasks[d.taskId] : undefined
          const on = picked.includes(d.itemId)
          return (
            <li key={d.itemId} className={`dump-row${on ? ' picked' : ''}${d.priority === 'someday' ? ' someday' : ''}`}>
              {selecting ? <CheckCircle done={on} onClick={() => toggle(d.itemId)} label={`Select ${d.title}`} /> : <CheckCircle done={false} onClick={() => tick(d)} label={`Mark ${d.title} done`} />}
              <button type="button" className="dump-main" onClick={() => (selecting ? toggle(d.itemId) : setOpen(d.itemId))}>
                <strong>
                  {d.priv && (
                    <span className="flag" role="img" aria-label="Private">
                      🔒{' '}
                    </span>
                  )}
                  {d.priority === 'high' && (
                    <span className="flag" aria-label="Important">
                      ❗
                    </span>
                  )}
                  {d.title}
                </strong>
                <small className="muted">
                  {[dumpMeta(d, f.members), st === 'scheduled' && task?.date ? `📅 ${friendlyDay(task.date, ymdOf(Date.now()))}` : '', d.priority === 'someday' ? '💤 someday' : '']
                    .filter(Boolean)
                    .join(' · ') || ' '}
                </small>
              </button>
              {d.ownerId && <Avatar m={f.members[d.ownerId]} size={24} />}
            </li>
          )
        })}
      </ul>

      {selecting && (
        <div className="select-bar">
          <span>{picked.length} selected</span>
          <button type="button" className="btn primary small" disabled={!picked.length} onClick={() => setMaking(true)}>
            <Icon name="timer" size={16} /> Make a session
          </button>
        </div>
      )}

      {finished.length > 0 && (
        <>
          <button type="button" className="link-btn wide" onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Hide' : 'Show'} finished ({finished.length})
          </button>
          {showDone && (
            <ul className="dump-list finished">
              {finished.map((d) => (
                <li key={d.itemId} className="dump-row done">
                  <span className="dump-main">
                    <strong>{d.title}</strong>
                    <small className="muted">{dumpState(f, d) === 'dropped' ? 'dropped' : 'done'}</small>
                  </span>
                  <button type="button" className="btn small ghost" onClick={() => putBack(d)}>
                    Put back
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {opened && <ItemSheet key={opened.itemId} item={opened} onClose={() => setOpen(undefined)} onKeys={() => setKeys(true)} />}
      {keys && <PrivateKeys onClose={() => setKeys(false)} />}
      {making && (
        <MakeSession
          items={chosen}
          onClose={() => setMaking(false)}
          onMade={(runId) => {
            setMaking(false)
            setSelecting(false)
            setPicked([])
            if (runId) nav(`/run/${runId}`)
            else toast('Session saved. Find it under Sessions.')
          }}
        />
      )}
    </>
  )
}

function ItemSheet({ item, onClose, onKeys }: { item: DumpEvent; onClose: () => void; onKeys: () => void }) {
  const { act, toast } = useApp()
  const privacy = usePrivacy()
  const [askPrivate, setAskPrivate] = useState(false)
  const f = useFamily()
  const me = useMe()!
  const people = usePeople()
  const today = ymdOf(Date.now())
  const [title, setTitle] = useState(item.title)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [area, setArea] = useState(item.area ?? '')
  const [minutes, setMinutes] = useState(item.minutes ? String(item.minutes) : '')
  const [priority, setPriority] = useState<DumpPriority>(item.priority ?? 'normal')
  const [owner, setOwner] = useState<MemberId | ''>(item.ownerId ?? '')
  const [day, setDay] = useState<Ymd | ''>('')
  const st = dumpState(f, item)
  const task = item.taskId ? f.tasks[item.taskId] : undefined
  const isPrivate = !!item.priv
  const routines = liveRoutines(f).filter((r) => !r.homework && !r.project && (!isPrivate || r.priv === me.id))
  const areas = areasOf(f)

  const save = () => {
    act(
      P.saveDump(me.id, item, {
        title,
        notes: notes.trim() || undefined,
        area: area.trim() || undefined,
        minutes: Number(minutes) || undefined,
        priority: priority === 'normal' ? undefined : priority,
        ownerId: owner || undefined,
      }),
    )
    onClose()
  }
  const schedule = (date: Ymd) => {
    const assignee = isPrivate ? me.id : owner || me.id
    const patch = {
      title,
      notes: notes.trim() || undefined,
      area: area.trim() || undefined,
      minutes: Number(minutes) || undefined,
      priority: priority === 'normal' ? undefined : priority,
      ownerId: owner || undefined,
    }
    act(P.scheduleDump(me.id, f, item, { date, assignee, patch }))
    toast(`On ${f.members[assignee]?.name ?? 'your'}'s list for ${friendlyDay(date, today)}.`)
    onClose()
  }
  /** Drop or delete an item, taking its scheduled task off the day too so it does not linger on someone's list. */
  const retire = (kind: 'drop' | 'delete') => {
    const now = Date.now()
    const un = item.taskId ? P.unscheduleDump(me.id, f, item, now) : []
    const base = { ...item, taskId: undefined }
    act([...un, ...(kind === 'delete' ? P.deleteDump(me.id, base, now + 2) : P.saveDump(me.id, base, { status: 'dropped' }, now + 2))])
    if (kind === 'drop') toast('Dropped. You can put it back from Finished.')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title="Thing to do">
      <label className="field">
        <span>What</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea className="tbox" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="row-fields">
        <label className="field grow">
          <span>List</span>
          <input className="tbox" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Home, Admin…" list="dump-areas" />
          <datalist id="dump-areas">
            {areas.map((a) => (
              <option key={a.name} value={a.name} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Minutes</span>
          <input className="tbox" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ width: 90 }} />
        </label>
      </div>
      <div className="field">
        <span>How much does it matter?</span>
        <Seg
          value={priority}
          onChange={setPriority}
          options={[
            { id: 'high', label: 'Important' },
            { id: 'normal', label: 'Normal' },
            { id: 'someday', label: 'Someday' },
          ]}
        />
      </div>
      <div className="field">
        <span>Private</span>
        {isPrivate ? (
          <>
            <p className="note">🔒 Only you can see this, and anything made from it.</p>
            <button type="button" className="btn small ghost" onClick={() => (act(P.makeDumpShared(me.id, f, item)), toast('Now shared with the family.'), onClose())}>
              Share it with the family instead
            </button>
          </>
        ) : askPrivate ? (
          <div className="card callout">
            <p>This swaps it for a private copy. The shared copy comes off everyone’s list, but it stays in the family’s stored history, so someone who looked in the database could still find it.</p>
            <div className="btn-row">
              <button type="button" className="btn small primary" onClick={() => (act(P.makeDumpPrivate(me.id, f, item)), toast('Made private.'), onClose())}>
                Make it private
              </button>
              <button type="button" className="btn small ghost" onClick={() => setAskPrivate(false)}>
                Keep it shared
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn small ghost" onClick={() => (privacy.ok ? setAskPrivate(true) : onKeys())}>
            🔒 Make this private
          </button>
        )}
      </div>
      {!isPrivate && (
        <div className="field">
          <span>Whose job?</span>
          <MemberChips members={people} value={owner ? [owner] : []} onChange={(v) => setOwner(v[0] ?? '')} everyone={{ label: 'Anyone', active: !owner, onToggle: () => setOwner('') }} size="small" />
        </div>
      )}
      <button type="button" className="btn primary block" onClick={save}>
        Save
      </button>

      <h3 className="sheet-sub">Get it done</h3>
      {st === 'scheduled' && task?.date ? (
        <div className="card callout">
          <Icon name="calendar" size={22} />
          <div>
            <p>
              On {f.members[task.assignee]?.name}'s list for <strong>{friendlyDay(task.date, today)}</strong>.
            </p>
            <button type="button" className="btn small ghost" onClick={() => (act(P.unscheduleDump(me.id, f, item)), onClose())}>
              Take it off that day
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chips">
            {([0, 1, 2] as const).map((n) => (
              <button key={n} type="button" className="chip small" onClick={() => schedule(addDays(today, n))}>
                {n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : friendlyDay(addDays(today, 2), today)}
              </button>
            ))}
            <input type="date" className="tbox slim" value={day} min={today} onChange={(e) => setDay(e.target.value)} aria-label="Pick a day" />
            <button type="button" className="chip small selected" disabled={!day} onClick={() => day && schedule(day)}>
              Set day
            </button>
          </div>
        </>
      )}
      {routines.length > 0 && (
        <>
          <p className="note">Or add it to a session:</p>
          <div className="chips">
            {routines.map((r) => {
              const has = r.steps.some((s) => s.dumpId === item.itemId)
              return (
                <button
                  key={r.routineId}
                  type="button"
                  className="chip small"
                  disabled={has}
                  onClick={() => {
                    act(P.addDumpToRoutine(me.id, r, [item]))
                    toast(`Added to ${r.title}.`)
                    onClose()
                  }}
                >
                  {r.emoji} {r.title}
                  {has ? ' ✓' : ''}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="btn-row">
        <button type="button" className="btn ghost" onClick={() => retire('drop')}>
          Not doing this
        </button>
        <button type="button" className="btn danger" onClick={() => retire('delete')}>
          <Icon name="trash" size={16} /> Delete
        </button>
      </div>
    </Sheet>
  )
}

function MakeSession({ items, onClose, onMade }: { items: DumpEvent[]; onClose: () => void; onMade: (runId?: string) => void }) {
  const { act } = useApp()
  const me = useMe()!
  const [title, setTitle] = useState('Jobs to do')
  const minutes = items.reduce((s, d) => s + (d.minutes ?? 5), 0)
  const make = (startNow: boolean) => {
    const now = Date.now()
    const made = P.sessionFromDump(me.id, items, { title: title.trim() || 'Jobs to do', ownerId: me.id }, now)
    act(made.events)
    if (!startNow) return onMade()
    // Start with the steps that were just saved (their ids link each step back to its list item).
    const saved = made.events[0]
    const steps = saved && saved.type === 'routine' ? saved.steps : []
    const run = P.startRun(me.id, me.id, { routineId: made.routineId, title: title.trim() || 'Jobs to do', emoji: '📝', steps }, now + 5)
    act(run.events)
    onMade(run.runId)
  }
  return (
    <Sheet open onClose={onClose} title="Make a session">
      <p className="muted">
        {items.length} things · about {fmtDuration(minutes)} (anything with no guess counts as 5 minutes). Ticking a step off ticks it off your list too.
      </p>
      <label className="field">
        <span>Name</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <ol className="mini-steps">
        {items.map((d) => (
          <li key={d.itemId}>
            {d.title} <small className="muted">{d.minutes ?? 5} min</small>
          </li>
        ))}
      </ol>
      <button type="button" className="btn primary big block" onClick={() => make(true)}>
        <Icon name="play" size={20} /> Start now
      </button>
      <button type="button" className="btn block" onClick={() => make(false)}>
        Save for later
      </button>
    </Sheet>
  )
}
