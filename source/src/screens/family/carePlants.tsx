/**
 * Care › Plants: one list of every plant with when it was last watered, a 💧 to water it, and the plants due a water
 * (not watered for a week, for now) gathered at the top with "Start watering" and "Add to a session".
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import * as PL from '@/family/plantActions'
import { dayName, friendlyDay, tsOf, ymdOf, addDays } from '@/family/dates'
import { DEFAULT_WATER_EVERY_DAYS, duePlantSteps, plantsByNeed, wateredText, wateringsOf, type PlantStatus } from '@/family/plants'
import { activeRunFor, liveRoutines } from '@/family/routines'
import type { PlantEvent } from '@/family/types'
import { SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const EMOJI = ['🪴', '🌿', '🌵', '🌱', '🌸', '🌻', '🌷', '🍀', '🌳', '🎍', '🌹', '🌼']

export function PlantsPanel() {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const list = plantsByNeed(f, now)
  const due = list.filter((s) => s.due)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | undefined>()
  const [toSession, setToSession] = useState(false)
  const next = list.find((s) => !s.due)

  const water = (s: PlantStatus) => {
    const evs = PL.waterPlants(me.id, [s.plant.plantId])
    act(evs)
    toast(`Watered ${s.plant.name}.`, { undo: () => act(evs.flatMap((e) => A.undo(me.id, e.id))) })
  }

  const startNow = () => {
    const live = activeRunFor(f, me.id, Date.now())
    if (live) {
      toast('Finish or stop your current session first.')
      return nav(`/run/${live.id}`)
    }
    const { runId, events } = P.startRun(me.id, me.id, { title: 'Water the plants', emoji: '🪴', steps: duePlantSteps(f) })
    if (!events.length) return toast('No plants are due a water right now.')
    act(events)
    nav(`/run/${runId}`)
  }

  if (!list.length)
    return (
      <>
        <div className="empty">
          <span className="plant-empty" aria-hidden="true">
            🪴
          </span>
          <h3>No plants yet</h3>
          <p>Add each plant once. HomeQuest keeps track of when it was last watered and tells you when it’s due (every {DEFAULT_WATER_EVERY_DAYS} days for now).</p>
          <button type="button" className="btn primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} /> Add a plant
          </button>
        </div>
        {adding && <PlantSheet onClose={() => setAdding(false)} />}
      </>
    )

  return (
    <div className="plants">
      <section className={`card plant-due${due.length ? '' : ' all-good'}`} aria-label="Due a water">
        {due.length ? (
          <>
            <div className="plant-due-top">
              <span className="plant-due-n">{due.length}</span>
              <div className="grow">
                <strong>
                  {due.length === 1 ? 'plant is' : 'plants are'} due a water
                </strong>
                <small className="muted">Not watered for {DEFAULT_WATER_EVERY_DAYS} days or more</small>
              </div>
            </div>
            <p className="plant-due-names">{due.map((s) => `${s.plant.emoji ?? '🪴'} ${s.plant.name}`).join(' · ')}</p>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={startNow}>
                <Icon name="play" size={16} /> Start watering
              </button>
              <button type="button" className="btn" onClick={() => setToSession(true)}>
                Add to a session
              </button>
            </div>
          </>
        ) : (
          <div className="plant-due-top">
            <span className="plant-due-n ok">✓</span>
            <div className="grow">
              <strong>All watered</strong>
              {next && (
                <small className="muted">
                  Next: {next.plant.name} {next.dueOn === addDays(today, 1) ? 'tomorrow' : `on ${dayName(next.dueOn, true)}`}
                </small>
              )}
            </div>
          </div>
        )}
      </section>

      <SectionHead
        title={`All plants · ${list.length}`}
        action={
          <button type="button" className="btn small" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Add
          </button>
        }
      />
      <ul className="plant-list">
        {list.map((s) => (
          <li key={s.plant.plantId} className={s.due ? 'due' : ''}>
            <button type="button" className="plant-main" onClick={() => setOpen(s.plant.plantId)}>
              <span className="plant-emoji" aria-hidden="true">
                {s.plant.emoji ?? '🪴'}
              </span>
              <span className="grow">
                <strong>{s.plant.name}</strong>
                <small>
                  {[s.plant.room, wateredText(s)].filter(Boolean).join(' · ')}
                  {s.last && s.last.by !== me.id && f.members[s.last.by] ? ` by ${f.members[s.last.by]!.name}` : ''}
                </small>
              </span>
              {s.due && <span className="pill tone-warn">Due</span>}
            </button>
            <button type="button" className="plant-water" aria-label={`Water ${s.plant.name}`} title="Watered it" onClick={() => water(s)}>
              💧
            </button>
          </li>
        ))}
      </ul>

      {adding && <PlantSheet onClose={() => setAdding(false)} />}
      {open && f.plants[open] && <PlantSheet plant={f.plants[open]} onClose={() => setOpen(undefined)} />}
      {toSession && <AddToSessionSheet due={due.map((s) => s.plant)} onStartNow={startNow} onClose={() => setToSession(false)} />}
    </div>
  )
}

// ------------------------------------------------------------------ add / edit

const LAST: { id: string; label: string; days?: number }[] = [
  { id: 'unknown', label: 'Don’t know' },
  { id: '0', label: 'Today', days: 0 },
  { id: '1', label: 'Yesterday', days: 1 },
  { id: '3', label: '3 days ago', days: 3 },
  { id: '7', label: 'A week or more', days: 7 },
]

function PlantSheet({ plant, onClose }: { plant?: PlantEvent; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [name, setName] = useState(plant?.name ?? '')
  const [emoji, setEmoji] = useState(plant?.emoji ?? '🪴')
  const [room, setRoom] = useState(plant?.room ?? '')
  const [notes, setNotes] = useState(plant?.notes ?? '')
  const [last, setLast] = useState('unknown')
  const [earlier, setEarlier] = useState('')
  const today = ymdOf(Date.now())
  const rooms = useMemo(() => [...new Set(Object.values(f.plants).filter((p) => !p.deleted && p.room).map((p) => p.room!))].sort(), [f.plants])
  const history = plant ? wateringsOf(f, plant.plantId).slice(0, 6) : []

  const save = () => {
    if (!name.trim()) return toast('Give it a name.')
    const days = LAST.find((l) => l.id === last)?.days
    const at = !plant && days !== undefined ? (days === 0 ? Date.now() : tsOf(addDays(today, -days), '09:00')) : undefined
    act(PL.savePlant(me.id, { plantId: plant?.plantId, name, emoji, room, notes, variety: plant?.variety }, Date.now(), at).events)
    toast(plant ? 'Saved.' : `Added ${name.trim()}.`)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={plant ? plant.name : 'Add a plant'}>
      <div className="form plant-form">
        <label className="field">
          <span>Name</span>
          <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Big fern, Peace lily" maxLength={40} autoFocus={!plant} />
        </label>
        <div className="field">
          <span>Picture</span>
          <div className="chips emoji-chips">
            {EMOJI.map((e) => (
              <button key={e} type="button" className={`chip${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)} aria-label={e}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Where it lives (optional)</span>
          <input className="tbox" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Kitchen windowsill" maxLength={40} list="plant-rooms" />
          <datalist id="plant-rooms">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
        {!plant && (
          <div className="field">
            <span>Last watered</span>
            <div className="chips">
              {LAST.map((l) => (
                <button key={l.id} type="button" className={`chip small${last === l.id ? ' selected' : ''}`} onClick={() => setLast(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="field">
          <span>Notes (optional)</span>
          <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Likes a mist, keep out of direct sun" maxLength={120} />
        </label>
        <button type="button" className="btn primary block" onClick={save}>
          {plant ? 'Save' : 'Add plant'}
        </button>

        {plant && (
          <>
            <h3 className="group-title">Watering</h3>
            {history.length === 0 ? (
              <p className="note">Not watered yet.</p>
            ) : (
              <ul className="plant-history">
                {history.map((w) => (
                  <li key={w.eventId}>
                    <span>
                      💧 {friendlyDay(ymdOf(w.at), today)}
                      {f.members[w.by] ? ` · ${f.members[w.by]!.name}` : ''}
                      {w.via === 'session' ? ' · in a session' : ''}
                    </span>
                    <button type="button" className="link-btn" onClick={() => (act(A.undo(me.id, w.eventId)), toast('Removed.'))}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="row-fields">
              <input className="tbox grow" type="date" max={today} value={earlier} onChange={(e) => setEarlier(e.target.value)} aria-label="Watered on an earlier day" />
              <button
                type="button"
                className="btn small"
                disabled={!earlier}
                onClick={() => {
                  act(PL.waterPlants(me.id, [plant.plantId], Date.now(), earlier === today ? Date.now() : tsOf(earlier, '09:00')))
                  setEarlier('')
                  toast('Logged.')
                }}
              >
                Log a watering
              </button>
            </div>
            <button
              type="button"
              className="btn ghost block plant-remove"
              onClick={() => {
                const evs = PL.deletePlant(me.id, plant)
                act(evs)
                toast(`Removed ${plant.name}.`, { undo: () => act(A.undo(me.id, evs[0]!.id)) })
                onClose()
              }}
            >
              <Icon name="trash" size={16} /> Remove this plant
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ------------------------------------------------------------------ into a session

/** Put the due plants into a session: start one now, add them as steps to an existing session, or make a watering
 * session that always picks up whatever is due when it starts (schedule it from Plan › Sessions). */
function AddToSessionSheet({ due, onStartNow, onClose }: { due: PlantEvent[]; onStartNow: () => void; onClose: () => void }) {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const sessions = liveRoutines(f).filter((r) => !r.project && !r.homework)
  const watering = sessions.filter((r) => r.plants)
  const others = sessions.filter((r) => !r.plants)
  return (
    <Sheet open onClose={onClose} title={`${due.length} plant${due.length === 1 ? '' : 's'} into a session`}>
      <button type="button" className="btn primary block" onClick={() => (onClose(), onStartNow())}>
        <Icon name="play" size={16} /> Start watering now
      </button>

      <h3 className="group-title">A watering session</h3>
      {watering.length ? (
        <p className="note">
          {watering.map((r) => `“${r.title}”`).join(', ')} already picks up every plant that’s due whenever it starts.{' '}
          <button type="button" className="link-btn" onClick={() => (onClose(), nav('/plan?t=sessions'))}>
            Open Sessions
          </button>
        </p>
      ) : (
        <>
          <p className="note">One session that always waters whatever is due when it starts. Give it a day and time in Plan › Sessions (say, Sunday mornings) and it shows on the calendar.</p>
          <button
            type="button"
            className="btn block"
            onClick={() => {
              act(PL.newWateringSession(me.id).events)
              toast('Made “Water the plants”. Give it a day in Sessions.')
              onClose()
              nav('/plan?t=sessions')
            }}
          >
            🪴 Make a watering session
          </button>
        </>
      )}

      {others.length > 0 && (
        <>
          <h3 className="group-title">Or add them to a session you have</h3>
          <ul className="plant-sessions">
            {others.map((r) => {
              const have = new Set(r.steps.map((s) => s.plantId).filter(Boolean))
              const add = due.filter((p) => !have.has(p.plantId))
              return (
                <li key={r.routineId}>
                  <button
                    type="button"
                    disabled={!add.length}
                    onClick={() => {
                      act(PL.addPlantsToRoutine(me.id, r, add))
                      toast(`Added ${add.length} plant${add.length === 1 ? '' : 's'} to ${r.title}.`)
                      onClose()
                    }}
                  >
                    <span aria-hidden="true">{r.emoji ?? '⏱️'}</span>
                    <span className="grow">
                      <strong>{r.title}</strong>
                      <small>{add.length ? `${r.steps.length} steps, + ${add.length}` : 'Already has these plants'}</small>
                    </span>
                    {add.length > 0 && <Icon name="plus" size={16} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Sheet>
  )
}
