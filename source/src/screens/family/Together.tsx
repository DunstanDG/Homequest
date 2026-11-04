import { useMemo, useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { freeSlots, type FreeSlot } from '@/family/calendar'
import { addDays, friendlyDay, fromMin, fmtDuration, toMin } from '@/family/dates'
import { ARRIVAL_ACTIVITIES } from '@/family/arrival/pack'
import { ideaDraftFor } from '@/family/arrival/arrival'
import { IDEA_SEEDS, rankIdeas, voters, type IdeaTally } from '@/family/ideas'
import type { IdeaKind, Idea, VoteValue, Ymd } from '@/family/types'
import { Avatar, AvatarStack, ScreenHead, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { SyncDot } from '@/ui/ux'
import { uid } from '@/engine/rng'
import { HelpHead } from './calParts'
import { useToday } from './shared'

const KIND_LABEL: Record<IdeaKind, string> = { dinner: 'Dinner', outing: 'Day out', movie: 'Movie', game: 'At home', treat: 'Treat', other: 'Other' }
const VOTES: { id: Exclude<VoteValue, 'clear'>; emoji: string; label: string }[] = [
  { id: 'yes', emoji: '👍', label: 'Yes' },
  { id: 'maybe', emoji: '🤔', label: 'Maybe' },
  { id: 'no', emoji: '👎', label: 'No' },
]
/** Free times shown before "More times". */
const FIRST_SLOTS = 3

/** Agree as a family what to do: propose ideas, vote, then pick a time when everyone is free. Full screen version
 * (the app now shows this inside Calendar as "Plans & ideas" - see TogetherBody). */
export function Together() {
  const [adding, setAdding] = useState(false)
  return (
    <div className="screen together">
      <ScreenHead
        eyebrow="Plans & ideas"
        title="What shall we do?"
        right={
          <>
            <SyncDot />
            <button type="button" className="btn small" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Idea
            </button>
          </>
        }
      />
      <TogetherBody adding={adding} onAddingChange={setAdding} />
    </div>
  )
}

/** The Together content without a screen header, for embedding (Calendar → "Plans & ideas"). Pass `adding` /
 * `onAddingChange` to open the "Suggest something" sheet from a header button; without them it manages its own. */
export function TogetherBody({ adding: addingProp, onAddingChange }: { adding?: boolean; onAddingChange?: (open: boolean) => void } = {}) {
  const { act, toast } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const today = useToday()
  const [addingOwn, setAddingOwn] = useState(false)
  const adding = addingProp ?? addingOwn
  const setAdding = (v: boolean) => (onAddingChange ? onAddingChange(v) : setAddingOwn(v))
  const [planning, setPlanning] = useState<{ idea?: Idea; slot?: FreeSlot } | undefined>()
  // Which idea row is open. undefined = the default (the leading idea); null = all closed.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined)
  const [allSlots, setAllSlots] = useState(false)
  const open = rankIdeas(f, ['open'])
  const planned = rankIdeas(f, ['planned']).filter((t) => (t.idea.when?.date ?? '') >= today)
  const all = useMemo(() => voters(f), [f])
  const nowMin = new Date().getHours() * 60 + Math.ceil(new Date().getMinutes() / 15) * 15
  const slots = useMemo(
    () =>
      freeSlots(ctx, { members: all, from: today, days: 14, minMinutes: 120 })
        // Today's free time only counts from now on.
        .map((s) => (s.date === today && toMin(s.start) < nowMin ? { ...s, start: fromMin(nowMin), minutes: toMin(s.end) - nowMin } : s))
        .filter((s) => s.minutes >= 120),
    [ctx, all, today, nowMin],
  )
  const best = useMemo(() => {
    // Weekend days first, then longest gaps.
    const sorted = [...slots].sort((a, b) => Number(isWeekend(b.date)) - Number(isWeekend(a.date)) || b.minutes - a.minutes || a.date.localeCompare(b.date))
    return sorted.slice(0, 6).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  }, [slots])
  const shownSlots = allSlots ? best : best.slice(0, FIRST_SLOTS)

  const vote = (t: IdeaTally, v: Exclude<VoteValue, 'clear'>) => {
    const mineNow = f.votes[`${t.idea.id}|${me.id}`]
    act(A.castVote(me.id, t.idea.id, mineNow === v ? 'clear' : v))
  }
  const drop = (idea: Idea) => {
    act(A.updateIdea(me.id, idea, { status: 'dropped' }))
    toast('Idea removed.', { undo: () => act(A.updateIdea(me.id, { ...idea, status: 'dropped' }, { status: 'open' })) })
  }
  // The leader when the screen opened stays open while people vote, so the open row doesn't jump as the ranking moves.
  const [firstLeader] = useState(() => open[0]?.idea.id)
  const expandedId = openId === undefined ? (open.some((t) => t.idea.id === firstLeader) ? firstLeader : open[0]?.idea.id) : openId

  return (
    <div className="together-body">
      {planned.length > 0 && (
        <>
          <SectionHead title="Planned" />
          {planned.map((t) => (
            <div key={t.idea.id} className="card plan-card">
              <span className="plan-emoji">{t.idea.emoji ?? '🎉'}</span>
              <div className="grow">
                <strong>{t.idea.title}</strong>
                <p className="muted">
                  {friendlyDay(t.idea.when!.date, today)}
                  {t.idea.when!.start ? ` · ${t.idea.when!.start}` : ''}
                </p>
              </div>
              <button type="button" className="btn small ghost" onClick={() => act(A.updateIdea(me.id, t.idea, { status: 'done' }))}>
                Done
              </button>
            </div>
          ))}
        </>
      )}

      <HelpHead
        title="Ideas"
        helpId="together.votes"
        help={<p>Everyone votes 👍 🤔 👎 on each idea. The top one is the family favourite: tap any idea to see who voted and to plan it.</p>}
      />
      {open.length === 0 ? (
        <div className="empty">
          <Icon name="heart" size={32} />
          <h3>No ideas yet</h3>
          <p>Add a dinner, a day out or a film to get the votes going.</p>
          <button type="button" className="btn small" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Suggest an idea
          </button>
        </div>
      ) : (
        <ul className="idea-list">
          {open.map((t, idx) => {
            const mineNow = f.votes[`${t.idea.id}|${me.id}`]
            const leading = idx === 0 && t.score > 0
            const expanded = expandedId === t.idea.id
            const tally = VOTES.filter((v) => t[v.id].length > 0).map((v) => `${v.emoji} ${t[v.id].length}`)
            const canDrop = me.role === 'parent' || t.idea.proposedBy === me.id
            return (
              <li key={t.idea.id} className={`idea-row${leading ? ' leading' : ''}${expanded ? ' open' : ''}`}>
                <div className="ir-line">
                  <button type="button" className="ir-main" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : t.idea.id)}>
                    <span className="ir-emoji" aria-hidden="true">
                      {t.idea.emoji ?? '✨'}
                    </span>
                    <span className="ir-text">
                      <strong>{t.idea.title}</strong>
                      <small>
                        {leading && <b className="ir-lead">Leading</b>}
                        {tally.length ? tally.join('  ') : 'No votes yet'}
                        {t.waiting.length > 0 ? ` · ${t.waiting.length} to vote` : ''}
                      </small>
                    </span>
                  </button>
                  <span className="ir-votes" role="group" aria-label={`Your vote on ${t.idea.title}`}>
                    {VOTES.map((v) => (
                      <button key={v.id} type="button" className={`vote-ico v-${v.id}${mineNow === v.id ? ' on' : ''}`} aria-pressed={mineNow === v.id} aria-label={v.label} title={v.label} onClick={() => vote(t, v.id)}>
                        {v.emoji}
                      </button>
                    ))}
                  </span>
                </div>
                {expanded && (
                  <div className="ir-more">
                    <p className="muted small">
                      {KIND_LABEL[t.idea.kind]}
                      {t.idea.cost ? ` · ${t.idea.cost}` : ''} · suggested by {f.members[t.idea.proposedBy]?.name ?? 'someone'}
                    </p>
                    {t.idea.notes && <p className="muted pre">{t.idea.notes}</p>}
                    <span className="voters">
                      {VOTES.map((v) =>
                        t[v.id].length ? (
                          <span key={v.id}>
                            {v.emoji} <AvatarStack ids={t[v.id]} members={f.members} size={20} />
                          </span>
                        ) : null,
                      )}
                      {t.waiting.length > 0 && <span className="muted small">waiting: {t.waiting.map((m) => f.members[m]?.name).join(', ')}</span>}
                    </span>
                    <div className="ir-actions">
                      {canDrop ? (
                        <button type="button" className="btn small ghost" onClick={() => drop(t.idea)}>
                          <Icon name="trash" size={16} /> Remove
                        </button>
                      ) : (
                        <span />
                      )}
                      <button type="button" className="btn small primary" onClick={() => setPlanning({ idea: t.idea })}>
                        <Icon name="calendar" size={16} /> Plan it
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <HelpHead
        title="When is everyone free?"
        helpId="cal.free"
        help={<p>Gaps of two hours or more over the next two weeks when the whole family has nothing on, weekends first. Tap one to plan something then.</p>}
      />
      {best.length === 0 ? (
        <p className="note">No gaps of two hours or more where everyone is free. Try a shorter outing, or check the calendar.</p>
      ) : (
        <>
          <ul className="free-slots">
            {shownSlots.map((s) => (
              <li key={`${s.date}${s.start}`}>
                <button type="button" className="free-slot" onClick={() => setPlanning({ slot: s })}>
                  <strong>{friendlyDay(s.date, today)}</strong>
                  <span>
                    {s.start}–{s.end}
                  </span>
                  <small>{fmtDuration(s.minutes)} free</small>
                  <Icon name="chevron" size={18} />
                </button>
              </li>
            ))}
          </ul>
          {best.length > FIRST_SLOTS && (
            <button type="button" className="btn small ghost free-more" aria-expanded={allSlots} onClick={() => setAllSlots((v) => !v)}>
              {allSlots ? 'Fewer times' : `More times (${best.length - FIRST_SLOTS})`}
            </button>
          )}
        </>
      )}

      <AddIdea open={adding} onClose={() => setAdding(false)} />
      {planning && <PlanSheet open onClose={() => setPlanning(undefined)} idea={planning.idea} slot={planning.slot} onPlanned={() => toast('On the family calendar.')} />}
    </div>
  )
}

const isWeekend = (d: Ymd): boolean => {
  const w = new Date(`${d}T12:00:00Z`).getUTCDay()
  return w === 0 || w === 6
}

function AddIdea({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Suggest something">
      <AddIdeaForm onDone={onClose} />
    </Sheet>
  )
}

function AddIdeaForm({ onDone }: { onDone: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<IdeaKind>('outing')
  const [emoji, setEmoji] = useState('')
  const [cost, setCost] = useState('')
  const have = new Set(Object.values(f.ideas).filter((i) => i.status === 'open' || i.status === 'planned').map((i) => i.title.toLowerCase()))
  const [more, setMore] = useState(false)
  const addIdea = (d: ReturnType<typeof ideaDraftFor>) => {
    const now = Date.now()
    act([...A.proposeIdea(me.id, d, now), ...A.castVote(me.id, d.ideaId, 'yes', now + 1)])
    toast('Added. Everyone can vote now.')
    onDone()
  }
  const add = (t: string, k: IdeaKind, e?: string) => {
    if (!t.trim()) return
    const ideaId = uid('i')
    const now = Date.now()
    // Suggesting something counts as a "yes" from the person who suggested it.
    act([...A.proposeIdea(me.id, { ideaId, title: t.trim(), kind: k, emoji: e || undefined, cost: cost.trim() || undefined }, now), ...A.castVote(me.id, ideaId, 'yes', now + 1)])
    toast('Added. Everyone can vote now.')
    onDone()
  }
  return (
    <>
      <p className="muted">Quick picks</p>
      <div className="chips">
        {IDEA_SEEDS.filter((s) => !have.has(s.title.toLowerCase())).map((s) => (
          <button key={s.title} type="button" className="chip small" onClick={() => add(s.title, s.kind, s.emoji)}>
            {s.emoji} {s.title}
          </button>
        ))}
      </div>
      <button type="button" className="btn ghost small" onClick={() => setMore((v) => !v)}>
        {more ? 'Hide' : 'More ideas'}: autumn and new-baby weeks ({ARRIVAL_ACTIVITIES.filter((a) => !have.has(a.title.toLowerCase())).length})
      </button>
      {more && (
        <div className="chips">
          {ARRIVAL_ACTIVITIES.filter((a) => !have.has(a.title.toLowerCase())).map((a) => {
            const d = ideaDraftFor(a)
            return (
              <button key={a.id} type="button" className="chip small" title={a.what} onClick={() => addIdea(d)}>
                {d.emoji} {a.title}
              </button>
            )
          })}
        </div>
      )}
      <label className="field">
        <span>Or your own idea</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trampoline park" maxLength={60} />
      </label>
      <div className="chips">
        {(Object.keys(KIND_LABEL) as IdeaKind[]).map((k) => (
          <button key={k} type="button" className={`chip small${kind === k ? ' selected' : ''}`} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="grid2">
        <label className="field">
          <span>Emoji</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} placeholder="🎳" />
        </label>
        <label className="field">
          <span>Cost (optional)</span>
          <input className="tbox" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. about £30" maxLength={30} />
        </label>
      </div>
      <button type="button" className="btn primary big block" disabled={!title.trim()} onClick={() => add(title, kind, emoji)}>
        Suggest it
      </button>
    </>
  )
}

function PlanSheet({ open, onClose, idea, slot, onPlanned }: { open: boolean; onClose: () => void; idea?: Idea; slot?: FreeSlot; onPlanned: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={idea ? `Plan: ${idea.title}` : 'Plan something'}>
      <PlanForm idea={idea} slot={slot} onDone={() => (onPlanned(), onClose())} />
    </Sheet>
  )
}

function PlanForm({ idea, slot, onDone }: { idea?: Idea; slot?: FreeSlot; onDone: () => void }) {
  const { act } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const today = useToday()
  const open = rankIdeas(f, ['open'])
  const [pick, setPick] = useState<string | undefined>(idea?.id ?? open[0]?.idea.id)
  const [date, setDate] = useState<Ymd>(slot?.date ?? addDays(today, 1))
  const [start, setStart] = useState(slot?.start ?? '14:00')
  const [dur, setDur] = useState(120)
  const [when, setWhen] = useState<'time' | 'day'>(slot ? 'time' : 'day')
  const chosen = pick ? f.ideas[pick] : undefined
  const end = fromMin(Math.min(23 * 60 + 59, toMin(start) + dur))
  const conflicts = useMemo(() => {
    if (when !== 'time') return []
    const a = toMin(start)
    const b = a + dur
    const its = freeSlots(ctx, { members: voters(f), from: date, days: 1, minMinutes: dur, window: { start: fromMin(Math.max(0, a - 0)), end: fromMin(Math.min(1439, b)) } })
    return its.length ? [] : ['Someone is busy at that time.']
  }, [ctx, f, date, start, dur, when])

  return (
    <>
      {!idea && (
        <div className="field">
          <span>What</span>
          <div className="chips">
            {open.length === 0 && <p className="note">Add an idea first.</p>}
            {open.map((t) => (
              <button key={t.idea.id} type="button" className={`chip small${pick === t.idea.id ? ' selected' : ''}`} onClick={() => setPick(t.idea.id)}>
                {t.idea.emoji} {t.idea.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="field">
        <span>Day</span>
        <input type="date" className="tbox" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
      </label>
      <Seg
        value={when}
        onChange={setWhen}
        options={[
          { id: 'day', label: 'Any time that day' },
          { id: 'time', label: 'At a set time' },
        ]}
      />
      {when === 'time' && (
        <>
          <div className="grid2">
            <label className="field">
              <span>Starts</span>
              <input type="time" className="tbox" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <div className="field">
              <span>Lasts</span>
              <div className="chips">
                {[60, 120, 180, 240].map((m) => (
                  <button key={m} type="button" className={`chip small${dur === m ? ' selected' : ''}`} onClick={() => setDur(m)}>
                    {fmtDuration(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {conflicts.length > 0 && <p className="note warn">{conflicts[0]} You can still plan it; check the calendar first.</p>}
        </>
      )}
      <button
        type="button"
        className="btn primary big block"
        disabled={!chosen}
        onClick={() => {
          if (!chosen) return
          act(A.planIdea(me.id, chosen, when === 'time' ? { date, start, end } : { date }))
          onDone()
        }}
      >
        <Icon name="calendar" size={20} /> Put it on the calendar
      </button>
      <div className="who-row">
        {voters(f).map((id) => (
          <span key={id} className="who">
            <Avatar m={f.members[id]} size={20} /> {f.members[id]?.name}
          </span>
        ))}
      </div>
    </>
  )
}
