import * as C from '@/family/checkin/actions'
import { configOf } from '@/family/checkin/checkin'
import { useApp, useFamily, useMe } from '@/app/context'
import { useState } from 'react'
import type { Hm, MemberId } from '@/family/types'
import { RoutineSetup } from './RoutineSetup'

/** When a person's check-ins open, and whether to send a reminder. Saved as you change it. */
export function CheckinSettings({ memberId }: { memberId: MemberId }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const c = configOf(f, memberId)
  const raw = f.checkinConfig[memberId]
  const [setup, setSetup] = useState(false)
  const save = (patch: Partial<typeof c> & Pick<NonNullable<typeof raw>, 'weekend'>) => act(C.saveCheckinConfig(me.id, memberId, { ...c, weekend: raw?.weekend, ...patch }))
  const weekend = raw?.weekend
  const setWeekend = (patch: Partial<NonNullable<typeof weekend>>) => weekend && save({ weekend: { ...weekend, ...patch } })
  const timeBox = (label: string, value: Hm, on: (v: Hm) => void) => (
    <label className="field grow">
      <span>{label}</span>
      <input type="time" className="tbox" value={value} onChange={(e) => e.target.value && on(e.target.value)} />
    </label>
  )
  return (
    <div className="checkin-settings">
      <label className="switch-row">
        <span className="sr-main">
          <strong>Morning and evening check-ins</strong>
          <small className="muted">A card on Today when each one opens.</small>
        </span>
        <input type="checkbox" className="switch" checked={c.enabled} onChange={(e) => save({ enabled: e.target.checked })} />
      </label>
      {c.enabled && (
        <>
          <div className="row-fields">
            <label className="field grow">
              <span>Morning opens</span>
              <input type="time" className="tbox" value={c.morningFrom} onChange={(e) => e.target.value && save({ morningFrom: e.target.value })} />
            </label>
            <label className="field grow">
              <span>until</span>
              <input type="time" className="tbox" value={c.morningUntil} onChange={(e) => e.target.value && save({ morningUntil: e.target.value })} />
            </label>
            <label className="field grow">
              <span>Evening opens</span>
              <input type="time" className="tbox" value={c.eveningFrom} onChange={(e) => e.target.value && save({ eveningFrom: e.target.value })} />
            </label>
          </div>
          <label className="switch-row">
            <span className="sr-main">
              <strong>Different times at the weekend</strong>
              <small className="muted">Weekends, and school holidays for a child with a school set up.</small>
            </span>
            <input
              type="checkbox"
              className="switch"
              checked={!!weekend}
              onChange={(e) => save({ weekend: e.target.checked ? { morningFrom: c.morningFrom, morningUntil: c.morningUntil, eveningFrom: c.eveningFrom } : undefined })}
            />
          </label>
          {weekend && (
            <div className="row-fields" data-testid="weekend-times">
              {timeBox('Weekend morning opens', weekend.morningFrom, (v) => setWeekend({ morningFrom: v }))}
              {timeBox('until', weekend.morningUntil, (v) => setWeekend({ morningUntil: v }))}
              {timeBox('Weekend evening opens', weekend.eveningFrom, (v) => setWeekend({ eveningFrom: v }))}
            </div>
          )}
          <label className="switch-row">
            <span className="sr-main">
              <strong>Send a reminder when each opens</strong>
              <small className="muted">A notification on their phone. It needs notifications switched on for that phone (Parent area › Data).</small>
            </span>
            <input type="checkbox" className="switch" checked={c.remind} onChange={(e) => save({ remind: e.target.checked })} />
          </label>
        </>
      )}
      <button type="button" className="btn small" onClick={() => setSetup(true)}>
        Set up morning and evening routines
      </button>
      {setup && <RoutineSetup memberId={memberId} onClose={() => setSetup(false)} />}
    </div>
  )
}
