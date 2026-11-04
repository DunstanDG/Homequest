import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import * as C from '@/family/checkin/actions'
import { useApp, useFamily, useMe } from '@/app/context'
import { addDays, tsOf, ymdOf } from '@/family/dates'
import { duePlants } from '@/family/plants'
import { waterPlants } from '@/family/plantActions'
import type { Member, PetKind, Ymd } from '@/family/types'
import { Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const MINUTES = [5, 10, 20, 30, 45, 60]

/**
 * "Something I did that isn't here": a free-text activity (which becomes a ticked-off task, with coins for a child if wanted),
 * a pet looked after, plants watered, or a nudge to Care for the baby. For today, or for yesterday (the morning check-in's
 * "last night").
 */
export function AddSheet({ member, defaultDay, onClose }: { member: Member; defaultDay: 'today' | 'yesterday'; onClose: () => void }) {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(Date.now())
  const [day, setDay] = useState<'today' | 'yesterday'>(defaultDay)
  const date: Ymd = day === 'today' ? today : addDays(today, -1)
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState<number | undefined>()
  const [coinsOn, setCoinsOn] = useState(false)
  const [time, setTime] = useState(defaultDay === 'today' ? new Date().toTimeString().slice(0, 5) : '20:00')
  const child = member.role === 'child'
  const pets = Object.values(f.members).filter((m) => m.active && m.role === 'pet')
  const thirsty = duePlants(f, Date.now())
  const hasBaby = Object.values(f.members).some((m) => m.active && m.role === 'baby')
  const coins = C.activityCoins(minutes)
  const at = tsOf(date, time as `${number}:${number}`)

  const add = () => {
    const evs = C.addActivity(me.id, f, { memberId: member.id, title, minutes, date, coins: child && coinsOn ? coins : 0 })
    if (!evs.length) return toast('What did you do?')
    act(evs)
    toast(child && coinsOn ? (me.role === 'parent' ? `Added. +${coins} coins.` : `Added. ${coins} coins once a parent has checked it.`) : 'Added.')
    setTitle('')
    setMinutes(undefined)
  }
  const pet = (petId: string, kind: PetKind, name: string) => {
    act(A.logPet(member.id, f, { petId, kind, at }, Date.now()))
    toast(`${name}: ${kind} logged.`)
  }

  return (
    <Sheet open onClose={onClose} title={`Add something${member.id === me.id ? '' : ` for ${member.name}`}`}>
      <div className="field">
        <span>When</span>
        <Seg<'today' | 'yesterday'>
          label="Day"
          value={day}
          onChange={(d) => {
            setDay(d)
            setTime(d === 'today' ? new Date().toTimeString().slice(0, 5) : '20:00')
          }}
          options={[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
          ]}
        />
      </div>

      <section className="card">
        <h3>Something done</h3>
        <label className="field">
          <span>What was it?</span>
          <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Helped with the shopping" onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <div className="chips">
          {MINUTES.map((m) => (
            <button key={m} type="button" className={`chip small${minutes === m ? ' selected' : ''}`} onClick={() => setMinutes(minutes === m ? undefined : m)}>
              {m} min
            </button>
          ))}
        </div>
        {child && (
          <label className="switch-row">
            <span className="sr-main">
              <strong>Earn coins</strong>
              <small className="muted">
                {coins} coins{me.role === 'parent' ? '' : ', once a parent has checked it'}
              </small>
            </span>
            <input type="checkbox" className="switch" checked={coinsOn} onChange={(e) => setCoinsOn(e.target.checked)} />
          </label>
        )}
        <button type="button" className="btn primary block" onClick={add} disabled={!title.trim()}>
          <Icon name="plus" size={16} /> Add it
        </button>
      </section>

      {(pets.length > 0 || thirsty.length > 0) && (
        <section className="card">
          <h3>Looked after</h3>
          <label className="field">
            <span>About what time?</span>
            <input type="time" className="tbox" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
          </label>
          {pets.map((p) => (
            <div key={p.id} className="field">
              <span>{p.name}</span>
              <div className="chips">
                {(['walk', 'feed', 'water'] as PetKind[]).map((k) => (
                  <button key={k} type="button" className="chip small" onClick={() => pet(p.id, k, p.name)}>
                    {k === 'walk' ? '🦮 Walked' : k === 'feed' ? '🍖 Fed' : '💧 Water'}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {thirsty.length > 0 && (
            <div className="field">
              <span>Plants watered</span>
              <div className="chips">
                {thirsty.map((s) => (
                  <button
                    key={s.plant.plantId}
                    type="button"
                    className="chip small"
                    onClick={() => {
                      act(waterPlants(member.id, [s.plant.plantId], Date.now(), at))
                      toast(`${s.plant.name} watered.`)
                    }}
                  >
                    {s.plant.emoji ?? '🪴'} {s.plant.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {hasBaby && me.role === 'parent' && (
        <button type="button" className="btn ghost block" onClick={() => nav('/care')}>
          👶 Log a feed, nappy or sleep for the baby in Care
        </button>
      )}
    </Sheet>
  )
}
