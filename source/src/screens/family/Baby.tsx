import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { activitiesOnDay, arrivalDayOn, arrivalIdeaId, dayOneOf, focusOnDay, ideaDraftFor, isExpecting, notesFor, whoFor } from '@/family/arrival/arrival'
import { ARRIVAL_DAYS, ARRIVAL_MEALS, type ArrivalActivity, type ArrivalMeal } from '@/family/arrival/pack'
import { addDays, daysBetween, fromMin, longDay, toMin, ymdOf } from '@/family/dates'
import type { Member } from '@/family/types'
import { Avatar, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { MemberSheet } from './People'

type Tab = 'plan' | 'meals'

/** The new-baby plan: two weeks of things to do, the checks that fall in week one, and easy meals. Starts from the birth date. */
export function Baby() {
  const f = useFamily()
  const me = useMe()!
  const nav = useNavigate()
  const now = useNow(60_000)
  const today = ymdOf(now)
  const babies = Object.values(f.members).filter((m) => m.active && m.role === 'baby')
  const [sel, setSel] = useState<string | undefined>(babies[0]?.id)
  const baby = babies.find((b) => b.id === sel) ?? babies[0]
  const [tab, setTab] = useState<Tab>('plan')
  const [editing, setEditing] = useState<{ id?: string } | null>(null)
  const [arrived, setArrived] = useState(false)
  const isParent = me.role === 'parent'
  const expecting = !!baby && isExpecting(baby)
  const dayNow = baby && !expecting ? arrivalDayOn(baby, today) : undefined
  const dayOne = baby ? dayOneOf(baby) : undefined
  const daysToGo = baby?.dueDate ? daysBetween(today, baby.dueDate) : undefined

  return (
    <div className="screen baby-plan">
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">New baby</p>
          <h1>The first two weeks</h1>
        </div>
      </header>

      {babies.length > 1 && (
        <div className="chips">
          {babies.map((b) => (
            <button key={b.id} type="button" className={`chip with-avatar${baby?.id === b.id ? ' selected' : ''}`} onClick={() => setSel(b.id)}>
              <Avatar m={b} size={24} /> {b.name}
            </button>
          ))}
        </div>
      )}

      {!baby && (
        <div className="empty">
          <Icon name="heart" size={34} />
          <h3>Expecting a baby?</h3>
          <p>Add the baby with a due date. Nothing goes on the calendar until the baby is born; then two weeks of ideas, the week-one checks and easy meals start from the birth date.</p>
          {isParent ? (
            <button type="button" className="btn primary" onClick={() => setEditing({})}>
              Add the baby
            </button>
          ) : (
            <p className="note">A parent can add the baby.</p>
          )}
        </div>
      )}

      {baby && (
        <section className="card baby-status">
          <div className="row-between">
            <div className="ag-row">
              <Avatar m={baby} size={44} />
              <div>
                <strong>{baby.name}</strong>
                {expecting ? (
                  <p className="muted">
                    Due {baby.dueDate ? longDay(baby.dueDate) : 'soon'}
                    {daysToGo !== undefined ? (daysToGo > 0 ? ` · ${daysToGo} day${daysToGo === 1 ? '' : 's'} to go` : daysToGo === 0 ? ' · today' : ` · ${-daysToGo} day${daysToGo === -1 ? '' : 's'} past`) : ''}
                  </p>
                ) : (
                  <p className="muted">
                    Born {baby.birthday ? longDay(baby.birthday) : ''}
                    {dayNow ? ` · day ${dayNow} of ${ARRIVAL_DAYS}` : dayOne && today < dayOne ? ' · plan starts soon' : ' · plan complete'}
                  </p>
                )}
              </div>
            </div>
            {isParent && (
              <button type="button" className="btn ghost small" onClick={() => setEditing({ id: baby.id })}>
                Edit
              </button>
            )}
          </div>
          {expecting && isParent && (
            <button type="button" className="btn primary big block" onClick={() => setArrived(true)}>
              <Icon name="heart" size={20} /> {baby.name === 'Baby' ? 'The baby is here!' : `${baby.name} is here!`}
            </button>
          )}
          {expecting && <p className="note">Everything below is a preview. Dates fill in and week-one checks appear on the calendar once the baby is born.</p>}
        </section>
      )}

      <Seg<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: 'plan', label: 'Day by day' },
          { id: 'meals', label: 'Easy meals' },
        ]}
      />

      {tab === 'plan' && <PlanTab baby={baby} today={today} dayNow={dayNow} />}
      {tab === 'meals' && <MealsTab today={today} />}

      <MemberSheet open={!!editing} onClose={() => setEditing(null)} member={editing?.id ? f.members[editing.id] : undefined} defaultRole="baby" onSaved={(id) => setSel(id)} />
      {baby && <ArrivedSheet open={arrived} onClose={() => setArrived(false)} baby={baby} />}
    </div>
  )
}

/** "The baby is here": enter the birth date and the plan switches on. */
function ArrivedSheet({ open, onClose, baby }: { open: boolean; onClose: () => void; baby: Member }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const [born, setBorn] = useState(ymdOf(Date.now()))
  const [name, setName] = useState(baby.name === 'Baby' ? '' : baby.name)
  const [home, setHome] = useState('')
  return (
    <Sheet open={open} onClose={onClose} title="Welcome to the world">
      <label className="field">
        <span>Name</span>
        <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="Leave as it is until you know" maxLength={24} autoCapitalize="words" />
      </label>
      <label className="field">
        <span>Born on</span>
        <input type="date" className="tbox" value={born} max={ymdOf(Date.now())} onChange={(e) => setBorn(e.target.value)} />
      </label>
      <label className="field">
        <span>Home from hospital on (optional)</span>
        <input type="date" className="tbox" value={home} min={born} onChange={(e) => setHome(e.target.value)} />
        <p className="note">This is Day 1 of the plan. Leave it blank and Day 1 is the day after the birth.</p>
      </label>
      <button
        type="button"
        className="btn primary big block"
        disabled={!born}
        onClick={() => {
          act(A.saveMember(me.id, { ...baby, name: name.trim() || baby.name, birthday: born, dueDate: undefined, dayOne: home && home !== addDays(born, 1) ? home : undefined }))
          toast(`${name.trim() || baby.name} is here. The first two weeks are on the calendar.`)
          onClose()
        }}
      >
        <Icon name="check" size={20} /> Save
      </button>
    </Sheet>
  )
}

function PlanTab({ baby, today, dayNow }: { baby?: Member; today: string; dayNow?: number }) {
  const dayOne = baby ? dayOneOf(baby) : undefined
  const born = !!baby && !isExpecting(baby)
  return (
    <div className="plan-days">
      {Array.from({ length: ARRIVAL_DAYS }, (_, i) => i + 1).map((n) => {
        const date = born && dayOne ? addDays(dayOne, n - 1) : undefined
        const acts = activitiesOnDay(n)
        const focus = focusOnDay(n)
        const isToday = dayNow === n
        return (
          <details key={n} className={`plan-day${isToday ? ' today' : ''}`} open={isToday || (dayNow === undefined && n === 1)}>
            <summary>
              <span className="pd-n">Day {n}</span>
              <span className="pd-date muted">{date ? longDay(date) : n <= 7 ? 'Week 1' : 'Week 2'}</span>
              {isToday && <span className="pill tone-accent">Today</span>}
              {focus && <span className="pd-dot" title="A check falls on this day">🩺</span>}
            </summary>
            {focus && (
              <p className="pd-focus">
                <Icon name="check" size={16} /> <strong>Check:</strong> {focus}
              </p>
            )}
            {acts.map((a) => (
              <ActivityCard key={a.id} a={a} baby={baby} date={date} today={today} />
            ))}
          </details>
        )
      })}
    </div>
  )
}

function ActivityCard({ a, baby, date, today }: { a: ArrivalActivity; baby?: Member; date?: string; today: string }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [planning, setPlanning] = useState(false)
  const ideaId = arrivalIdeaId(a)
  const inIdeas = !!f.ideas[ideaId] && f.ideas[ideaId]!.status !== 'done'
  const calId = baby ? `cal-arr-${a.id}-${baby.id}` : undefined
  const onCal = !!calId && !!f.cal[calId] && !f.cal[calId]!.deleted
  return (
    <article className="card plan-act">
      <div className="pa-top">
        <span className="pa-env">{a.env === 'Outdoor' ? '🍂 Outdoors' : '🕯️ Indoors'}</span>
        <span className="muted small">{a.tags.join(' · ')}</span>
      </div>
      <h4>{a.title}</h4>
      <p>{a.what}</p>
      <p className="muted small">
        <strong>You'll need:</strong> {a.props.join(', ')}
      </p>
      <p className="muted small">
        <strong>Who:</strong> {a.who}
      </p>
      <div className="btn-row">
        <button type="button" className="btn small primary" disabled={!baby || !date || onCal} onClick={() => setPlanning(true)}>
          <Icon name="calendar" size={16} /> {onCal ? 'On the calendar' : 'Plan it'}
        </button>
        <button
          type="button"
          className="btn small"
          disabled={inIdeas}
          onClick={() => {
            const now = Date.now()
            act([...A.proposeIdea(me.id, ideaDraftFor(a), now), ...A.castVote(me.id, ideaId, 'yes', now + 1)])
            toast('Added to Plans & ideas. Everyone can vote.')
          }}
        >
          <Icon name="heart" size={16} /> {inIdeas ? 'In our ideas' : 'Suggest to the family'}
        </button>
      </div>
      {!date && <p className="note">You can plan it on the calendar once the baby is born.</p>}
      {planning && baby && calId && date && <PlanActivity a={a} calId={calId} date={date} today={today} onClose={() => setPlanning(false)} />}
    </article>
  )
}

const TIMES = [
  { label: 'Morning', hm: '10:00' },
  { label: 'Afternoon', hm: '15:00' },
  { label: 'Sunset', hm: '17:00' },
  { label: 'Evening', hm: '19:00' },
]

function PlanActivity({ a, calId, date, today, onClose }: { a: ArrivalActivity; calId: string; date: string; today: string; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [day, setDay] = useState(date < today ? today : date)
  const [start, setStart] = useState(a.tags.includes('Nature') && a.env === 'Outdoor' ? '16:30' : a.env === 'Outdoor' ? '15:00' : '15:30')
  const [mins, setMins] = useState(a.env === 'Outdoor' ? 45 : 60)
  return (
    <Sheet open onClose={onClose} title={a.title}>
      <label className="field">
        <span>Day</span>
        <input type="date" className="tbox" value={day} onChange={(e) => setDay(e.target.value)} />
      </label>
      <div className="chips">
        {TIMES.map((t) => (
          <button key={t.hm} type="button" className={`chip small${start === t.hm ? ' selected' : ''}`} onClick={() => setStart(t.hm)}>
            {t.label} {t.hm}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Starts</span>
        <input type="time" className="tbox" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <div className="chips">
        {[30, 45, 60, 90].map((m) => (
          <button key={m} type="button" className={`chip small${mins === m ? ' selected' : ''}`} onClick={() => setMins(m)}>
            {m} min
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn primary big block"
        disabled={!start || !day}
        onClick={() => {
          const who = whoFor(f, a)
          act(A.saveCal(me.id, { calId, title: a.title, date: day, allDay: false, start, end: fromMin(Math.min(23 * 60 + 59, toMin(start) + mins)), members: who.members, everyone: who.everyone, category: a.env === 'Outdoor' ? 'activity' : 'family', busy: false, notes: notesFor(a) }))
          toast('On the calendar.')
          onClose()
        }}
      >
        <Icon name="check" size={20} /> Add to calendar
      </button>
    </Sheet>
  )
}

type MealFilter = 'all' | 'Breakfast' | 'Lunch' | 'one-hand'

function MealsTab({ today }: { today: string }) {
  const [filter, setFilter] = useState<MealFilter>('all')
  const [pick, setPick] = useState<ArrivalMeal | undefined>()
  const meals = ARRIVAL_MEALS.filter((m) => (filter === 'all' ? true : filter === 'one-hand' ? /one-handed|graze/i.test(m.style) : m.meal === filter))
  return (
    <div>
      <p className="muted">Low effort and mostly one-handed, for the parent recovering at home. Put one on the calendar for a day and it shows up in Today.</p>
      <div className="chips">
        {(
          [
            ['all', 'All'],
            ['Breakfast', 'Breakfast'],
            ['Lunch', 'Lunch'],
            ['one-hand', 'One-handed'],
          ] as [MealFilter, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" className={`chip small${filter === id ? ' selected' : ''}`} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {meals.map((m) => (
        <article key={m.id} className="card plan-act">
          <div className="pa-top">
            <span className="pa-env">{m.meal === 'Breakfast' ? '🥣 Breakfast' : '🥪 Lunch'}</span>
            <span className="muted small">{m.prep}</span>
          </div>
          <h4>{m.name}</h4>
          <p>{m.what}</p>
          <p className="muted small">
            <strong>Easy way:</strong> {m.hack}
          </p>
          <p className="muted small">
            <strong>You'll need:</strong> {m.ingredients}
          </p>
          <p className="muted small">
            {m.style} · {m.diet}
          </p>
          <button type="button" className="btn small primary" onClick={() => setPick(m)}>
            <Icon name="calendar" size={16} /> Put on the calendar
          </button>
        </article>
      ))}
      {pick && <PlanMeal meal={pick} today={today} onClose={() => setPick(undefined)} />}
    </div>
  )
}

function PlanMeal({ meal, today, onClose }: { meal: ArrivalMeal; today: string; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [day, setDay] = useState(today)
  const [start, setStart] = useState(meal.meal === 'Breakfast' ? '08:30' : '12:30')
  const parents = Object.values(f.members).filter((m) => m.active && m.role === 'parent').map((m) => m.id)
  return (
    <Sheet open onClose={onClose} title={meal.name}>
      <div className="chips">
        {[0, 1, 2].map((n) => (
          <button key={n} type="button" className={`chip small${day === addDays(today, n) ? ' selected' : ''}`} onClick={() => setDay(addDays(today, n))}>
            {n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : longDay(addDays(today, n))}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Day</span>
        <input type="date" className="tbox" value={day} onChange={(e) => setDay(e.target.value)} />
      </label>
      <label className="field">
        <span>Time</span>
        <input type="time" className="tbox" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <button
        type="button"
        className="btn primary big block"
        disabled={!day || !start}
        onClick={() => {
          act(A.saveCal(me.id, { title: meal.name, date: day, allDay: false, start, end: fromMin(toMin(start) + 30), members: parents, everyone: false, category: 'meal', busy: false, notes: `${meal.hack}\nYou'll need: ${meal.ingredients}.` }))
          toast('On the calendar.')
          onClose()
        }}
      >
        <Icon name="check" size={20} /> Add to calendar
      </button>
    </Sheet>
  )
}
