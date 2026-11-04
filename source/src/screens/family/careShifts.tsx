/**
 * "Who's responsible for this baby right now" (ShiftCard) and a simple forward-looking timetable of what's coming
 * up (TimetableCard), so the answer to both is a glance rather than a conversation. Kept out of Care.tsx (already
 * a big file), same idea as careWidgets.tsx.
 */
import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useFamily, useNow, useMe } from '@/app/context'
import { todayTimetable } from '@/family/care'
import { BLOCK_HOURS, DEFAULT_BLOCK_HOURS, DEFAULT_BLOCK_START, DEFAULT_DAY_START, DEFAULT_NIGHT_START, blocksOf, legacyFieldsFor, makeRota, onDutyAt, rotaReadingStart, proposeShiftPlan, rotaSummary, shiftPlanFor, spansOf } from '@/family/shifts'
import { addDays, hmOf, shortDay, startOfWeek, ymdOf } from '@/family/dates'
import type { Hm, Member, MemberId, ShiftBlock } from '@/family/types'
import { Avatar, MemberChips, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'

/** Shift rota for one baby: blocks through the day (e.g. 4-hour blocks from 22:00, taken in turns) or one day and one
 * night shift. Proposed automatically each week (last week's with the parents swapped) and confirmed - or adjusted
 * first - at the weekly summit. Covers this week and next, so planning ahead is just a toggle. */
export function ShiftCard({ baby, initialWeek = 'this' }: { baby: Member; initialWeek?: 'this' | 'next' }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const parents = Object.values(f.members).filter((m) => m.active && m.role === 'parent')
  const [which, setWhich] = useState<'this' | 'next'>(initialWeek)
  const weekOf = which === 'this' ? startOfWeek(ymdOf(now)) : addDays(startOfWeek(ymdOf(now)), 7)
  const existing = shiftPlanFor(f, baby.id, weekOf)
  const proposal = proposeShiftPlan(f, baby.id, weekOf, parents.map((p) => p.id))
  const shown = existing ?? (proposal ? { ...proposal, confirmed: false } : undefined)
  const onDuty = which === 'this' ? onDutyAt(f, baby.id, now) : undefined

  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<'blocks' | 'daynight'>('blocks')
  const [blocks, setBlocks] = useState<ShiftBlock[]>([])
  const [hours, setHours] = useState<number>(DEFAULT_BLOCK_HOURS)
  const [first, setFirst] = useState<Hm>(DEFAULT_BLOCK_START)
  const [dayParentId, setDayParentId] = useState<MemberId>('')
  const [nightParentId, setNightParentId] = useState<MemberId>('')
  const [dayStart, setDayStart] = useState(DEFAULT_DAY_START)
  const [nightStart, setNightStart] = useState(DEFAULT_NIGHT_START)

  const ids = parents.map((p) => p.id)
  const startEditing = () => {
    const b = shown?.blocks?.length ? shown.blocks : undefined
    setMode(shown && !b ? 'daynight' : 'blocks')
    const spans = b ? spansOf(b) : []
    // Show the rota from the block that starts in the evening, the way people talk about it ("10pm to 2am...").
    const firstStart = (b && rotaReadingStart(b)) ?? DEFAULT_BLOCK_START
    const len = spans.length ? Math.round(spans[0]!.minutes / 60) : DEFAULT_BLOCK_HOURS
    setFirst(firstStart)
    setHours(len)
    setBlocks(b ? spansOf(b, firstStart).map((x) => ({ start: x.start, parentId: x.parentId })) : makeRota(DEFAULT_BLOCK_START, DEFAULT_BLOCK_HOURS, ids))
    setDayParentId(shown?.dayParentId ?? ids[0] ?? '')
    setNightParentId(shown?.nightParentId ?? ids[1] ?? '')
    setDayStart(shown?.dayStart ?? DEFAULT_DAY_START)
    setNightStart(shown?.nightStart ?? DEFAULT_NIGHT_START)
    setEditing(true)
  }
  /** New length or start: rebuild the blocks, keeping whoever had the first one first. */
  const rebuild = (h: number, start: Hm) => {
    const lead = blocks[0]?.parentId ?? ids[0] ?? ''
    setBlocks(makeRota(start, h, [lead, ...ids.filter((x) => x !== lead)]))
  }
  const setBlockParent = (i: number, parentId: MemberId) => setBlocks((bs) => bs.map((b, n) => (n === i ? { ...b, parentId } : b)))

  const draft = (confirmed: boolean): A.ShiftPlanDraft | undefined => {
    if (mode === 'blocks') {
      if (!blocks.length || blocks.some((b) => !b.parentId)) return undefined
      return { babyId: baby.id, weekOf, ...legacyFieldsFor(blocks), blocks, confirmed }
    }
    if (!dayParentId || !nightParentId) return undefined
    return { babyId: baby.id, weekOf, dayParentId, nightParentId, dayStart, nightStart, confirmed }
  }
  const save = (confirmed: boolean) => {
    const d = draft(confirmed)
    if (!d) return toast('Give every shift a parent first.')
    act(A.saveShiftPlan(me.id, d))
    setEditing(false)
    toast(confirmed ? `Shifts confirmed for the week starting ${shortDay(weekOf)}.` : 'Proposal saved — confirm it once you both agree.')
  }

  const confirmShown = () => {
    if (!shown) return
    act(A.saveShiftPlan(me.id, { babyId: baby.id, weekOf, dayParentId: shown.dayParentId, nightParentId: shown.nightParentId, dayStart: shown.dayStart, nightStart: shown.nightStart, ...(shown.blocks?.length ? { blocks: shown.blocks } : {}), confirmed: true }))
    toast(`Shifts confirmed for the week starting ${shortDay(weekOf)}.`)
  }

  if (parents.length < 2) {
    return (
      <section className="card">
        <h3>Shifts</h3>
        <p className="muted">Add a second parent to split the day into shifts for {baby.name}, so each of you gets a predictable stretch of sleep.</p>
      </section>
    )
  }

  const shownBlocks = shown ? blocksOf(shown) : []
  const shownSpans = spansOf(shownBlocks)
  const from = shownSpans.length ? rotaReadingStart(shownBlocks) : undefined
  const summary = rotaSummary(shownBlocks)

  return (
    <section className="card">
      <div className="quest-top">
        <h3>Shifts</h3>
        {!editing && (
          <button type="button" className="icon-btn small" aria-label="Adjust shifts" onClick={startEditing}>
            <Icon name="pencil" size={16} />
          </button>
        )}
      </div>
      <Seg
        label="Which week"
        value={which}
        onChange={setWhich}
        options={[
          { id: 'this', label: 'This week' },
          { id: 'next', label: 'Next week' },
        ]}
      />

      {!editing && shown && (
        <>
          <p className="note">
            {which === 'this' && onDuty ? (
              <>
                <strong>{f.members[onDuty.parentId]?.name}</strong> is on now, until {onDuty.end}.
              </>
            ) : existing?.confirmed ? (
              'Confirmed.'
            ) : (
              `Proposed${existing ? '' : ' (not saved yet)'} — confirm once you both agree.`
            )}
          </p>
          <RotaStrip blocks={shownBlocks} from={from} now={which === 'this' ? hmOf(now) : undefined} />
          <div className="facts">
            {summary.map((s) => (
              <div className="glance" key={s.parentId}>
                <Avatar m={f.members[s.parentId]} size={28} />
                <div>
                  <strong>{f.members[s.parentId]?.name ?? 'Someone'}</strong>
                  <small className="muted">
                    {spansOf(shownBlocks, from)
                      .filter((x) => x.parentId === s.parentId)
                      .map((x) => `${short(x.start)}–${short(x.end)}`)
                      .join(', ')}{' '}
                    · {fmtHours(s.onMinutes)} on · longest break {fmtHours(s.longestOffMinutes)}
                  </small>
                </div>
              </div>
            ))}
          </div>
          {!existing?.confirmed && (
            <div className="btn-row">
              <button type="button" className="btn primary small" onClick={confirmShown}>
                Confirm
              </button>
              <button type="button" className="btn ghost small" onClick={startEditing}>
                Adjust first
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <>
          <Seg
            label="Kind of rota"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'blocks', label: 'Blocks' },
              { id: 'daynight', label: 'Day & night' },
            ]}
          />
          {mode === 'blocks' ? (
            <>
              <div className="field">
                <span>Each shift lasts</span>
                <div className="chips">
                  {BLOCK_HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`chip small${hours === h ? ' selected' : ''}`}
                      aria-pressed={hours === h}
                      onClick={() => {
                        setHours(h)
                        rebuild(h, first)
                      }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span>First shift starts</span>
                <input
                  type="time"
                  className="tbox slim"
                  value={first}
                  onChange={(e) => {
                    if (!e.target.value) return
                    setFirst(e.target.value)
                    rebuild(hours, e.target.value)
                  }}
                />
              </label>
              <ul className="rota-edit">
                {spansOf(blocks, blocks[0]?.start).map((x) => {
                  const i = blocks.findIndex((b) => b.start === x.start)
                  return (
                    <li key={x.start}>
                      <span className="rota-time">
                        {x.start}–{x.end}
                      </span>
                      <MemberChips members={parents} value={x.parentId ? [x.parentId] : []} onChange={(v) => setBlockParent(i, v[0] ?? '')} size="small" />
                    </li>
                  )
                })}
              </ul>
              <RotaStrip blocks={blocks} from={blocks[0]?.start} />
              <p className="muted small">
                {rotaSummary(blocks)
                  .map((s) => `${f.members[s.parentId]?.name ?? 'Someone'}: ${fmtHours(s.onMinutes)} on, longest break ${fmtHours(s.longestOffMinutes)}`)
                  .join(' · ')}
              </p>
            </>
          ) : (
            <>
              <label className="field">
                <span>Days</span>
                <MemberChips members={parents} value={dayParentId ? [dayParentId] : []} onChange={(v) => setDayParentId(v[0] ?? '')} />
              </label>
              <label className="field">
                <span>Nights</span>
                <MemberChips members={parents} value={nightParentId ? [nightParentId] : []} onChange={(v) => setNightParentId(v[0] ?? '')} />
              </label>
              <div className="chips small-gap">
                <label className="field">
                  <span>Day starts</span>
                  <input type="time" className="tbox slim" value={dayStart} onChange={(e) => setDayStart(e.target.value)} />
                </label>
                <label className="field">
                  <span>Night starts</span>
                  <input type="time" className="tbox slim" value={nightStart} onChange={(e) => setNightStart(e.target.value)} />
                </label>
              </div>
            </>
          )}
          <div className="btn-row">
            <button type="button" className="btn primary small" onClick={() => save(true)}>
              Confirm
            </button>
            <button type="button" className="btn ghost small" onClick={() => save(false)}>
              Save as proposal
            </button>
            <button type="button" className="btn ghost small" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  )
}

const short = (hm: Hm): string => (hm.endsWith(':00') ? hm.slice(0, 2) : hm)
const fmtHours = (min: number): string => (min % 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min / 60}h`)

/** The 24 hours as one bar, each shift in its parent's colour, starting from `from`. */
function RotaStrip({ blocks, from, now }: { blocks: readonly ShiftBlock[]; from?: Hm; now?: Hm }) {
  const f = useFamily()
  const spans = spansOf(blocks, from)
  if (!spans.length) return null
  const origin = spans[0]!.start
  const toM = (hm: Hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
  const nowPct = now ? (((toM(now) - toM(origin) + 1440) % 1440) / 1440) * 100 : undefined
  return (
    <div className="rota-strip" role="img" aria-label={spans.map((x) => `${x.start} to ${x.end}: ${f.members[x.parentId]?.name ?? 'someone'}`).join('; ')}>
      <div className="rota-bar">
        {spans.map((x) => (
          <span key={x.start} style={{ flex: x.minutes, background: f.members[x.parentId]?.colour ?? 'var(--surface3)' }} title={`${x.start}–${x.end}`}>
            {x.minutes >= 180 && <b>{f.members[x.parentId]?.name?.slice(0, 1)}</b>}
          </span>
        ))}
        {nowPct !== undefined && <i className="rota-now" style={{ left: `${nowPct}%` }} />}
      </div>
      <div className="rota-ticks">
        {spans.map((x) => (
          <small key={x.start} style={{ flex: x.minutes }}>
            {short(x.start)}
          </small>
        ))}
      </div>
    </div>
  )
}

/** A simple forward-looking list of expected feeds and naps/bedtime for the next little while, each tagged with
 * whoever's shift covers it (see shifts.ts's onDutyAt) - "who's responsible for the baby at a given time", made
 * concrete. Always a rough guide, same spirit as the rest of Care's age-based guidance, never a fixed schedule. */
export function TimetableCard({ baby, limit }: { baby: Member; limit?: number }) {
  const f = useFamily()
  const now = useNow(60_000)
  const [all, setAll] = useState(false)
  const items = todayTimetable(f, baby.id, now)
  if (!items.length) return null
  const today = ymdOf(now)
  const shown = limit && !all ? items.slice(0, limit) : items
  return (
    <section className="card">
      <h3>Coming up for {baby.name}</h3>
      <ul className="log-list">
        {shown.map((it, i) => {
          const duty = onDutyAt(f, baby.id, it.at)
          const tomorrow = ymdOf(it.at) !== today
          return (
            <li key={i}>
              <span className="log-time">{hmOf(it.at)}</span>
              <span className="log-what">
                {it.label}
                {tomorrow ? ' · tomorrow' : ''}
              </span>
              {duty ? (
                <small className="muted">
                  <Avatar m={f.members[duty.parentId]} size={18} /> {f.members[duty.parentId]?.name}
                </small>
              ) : (
                <small className="muted">Not planned</small>
              )}
            </li>
          )
        })}
      </ul>
      {limit && items.length > limit && (
        <button type="button" className="more-link" onClick={() => setAll((x) => !x)}>
          {all ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
      <p className="note">Rough guesses from {baby.name}'s age and recent pattern, not a fixed schedule.</p>
    </section>
  )
}
