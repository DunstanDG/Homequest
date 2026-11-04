import { useMemo, useState } from 'react'
import * as P from '@/family/planActions'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { bornBabies, expectedBabies } from '@/family/arrival/arrival'
import { addDays, dayName, dayOfMonth, friendlyDay, monthName, startOfWeek, ymdOf } from '@/family/dates'
import { ARRIVAL_RECIPES, CALENDAR_SLOTS, SLOTS, SLOT_INFO, STARTER_RECIPES, lastPlanned, liveRecipes, mealAt, mealTimesOf, mealWindow, missingRecipes, quickPicks, suggestMeals, weekDates } from '@/family/meals'
import { busyEvenings } from '@/family/planning'
import { makeRng } from '@/engine/rng'
import { AISLES, DIETARY_TAGS, dietaryTagsOf, ingredientText, liveLists, parseIngredients } from '@/family/shopping'
import type { DietaryTag, MealPlanEvent, MealSlot, MemberId, RecipeEvent, Ymd } from '@/family/types'
import { Avatar, MemberChips, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { upcomingWeekAnchor, usePeople } from '@/screens/family/shared'
import { FromPlanSheet } from './Shopping'
import { MealRatingCard } from './MealRatingCard'

/** Meals: plan the week, keep the recipes you cook, and turn the plan into a shopping list. */
export function Meals() {
  const [view, setView] = useState<'week' | 'recipes'>('week')
  return (
    <>
      <Seg
        value={view}
        onChange={setView}
        options={[
          { id: 'week', label: 'The week' },
          { id: 'recipes', label: 'Recipes' },
        ]}
      />
      {view === 'week' ? <Week /> : <Recipes />}
    </>
  )
}

function Week() {
  const f = useFamily()
  const ctx = useCalCtx()
  const today = ymdOf(Date.now())
  const [weekStart, setWeekStart] = useState<Ymd>(startOfWeek(upcomingWeekAnchor(today)))
  const [editing, setEditing] = useState<{ date: Ymd; slot: MealSlot; existing?: MealPlanEvent } | undefined>()
  const [suggesting, setSuggesting] = useState(false)
  const [shopping, setShopping] = useState(false)
  const dates = weekDates(weekStart)
  const me = useMe()!
  const rateWho = usePeople().filter((p) => (p.role === 'parent' || p.role === 'child') && (me.role === 'parent' || p.id === me.id))
  const cooks = useMemo(() => Object.values(f.members).filter((m) => m.active && m.role === 'parent').map((m) => m.id), [f.members])
  const busy = useMemo(() => busyEvenings(ctx, dates, cooks), [ctx, dates, cooks])
  const recipes = liveRecipes(f)
  const emptyNights = dates.filter((d) => d >= today && !mealAt(f, d, 'dinner')).length
  const thisWeek = startOfWeek(today)
  const label = weekStart === thisWeek ? 'This week' : weekStart === addDays(thisWeek, 7) ? 'Next week' : `Week of ${dayOfMonth(weekStart)} ${monthName(weekStart)}`

  return (
    <>
      <div className="row-between week-nav">
        <button type="button" className="icon-btn" aria-label="Earlier week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <Icon name="back" />
        </button>
        <strong>{label}</strong>
        <button type="button" className="icon-btn" aria-label="Later week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <Icon name="chevron" />
        </button>
      </div>

      {rateWho.length > 0 && (
        <>
          <MealRatingCard date={today} people={rateWho} now={Date.now()} />
          <MealRatingCard date={addDays(today, -1)} people={rateWho} now={Date.now()} hideDone />
        </>
      )}

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => setSuggesting(true)} disabled={!recipes.length || !emptyNights}>
          <Icon name="sparkle" size={16} /> Suggest dinners
        </button>
        <button type="button" className="btn" onClick={() => setShopping(true)}>
          <Icon name="bag" size={16} /> Shop list
        </button>
      </div>
      {!recipes.length && <p className="note">Add some recipes first (the Recipes tab has a starter set) and the planner can suggest dinners for you.</p>}

      {dates.map((d) => {
        const past = d < today
        const snack = mealAt(f, d, 'snack')
        return (
          <article key={d} className={`card meal-day${d === today ? ' today' : ''}${past ? ' past' : ''}`}>
            <div className="meal-head">
              <strong>
                {dayName(d)} <span className="muted">{dayOfMonth(d)} {monthName(d)}</span>
              </strong>
              {d === today && <span className="pill tone-accent">Today</span>}
              {busy.has(d) && !past && <span className="pill tone-warn" title="Someone is out or busy around tea time">Busy evening</span>}
            </div>
            {CALENDAR_SLOTS.map((slot) => {
              const m = mealAt(f, d, slot)
              return m ? (
                <MealLine key={slot} m={m} onOpen={() => setEditing({ date: d, slot, existing: m })} />
              ) : (
                <MealSlotEmpty key={slot} date={d} slot={slot} past={past} onMore={() => setEditing({ date: d, slot })} />
              )
            })}
            {snack ? (
              <MealLine m={snack} onOpen={() => setEditing({ date: d, slot: 'snack', existing: snack })} />
            ) : (
              <div className="meal-more">
                <button type="button" className="chip small ghost" onClick={() => setEditing({ date: d, slot: 'snack' })}>
                  + Snack
                </button>
              </div>
            )}
          </article>
        )
      })}

      {editing && <MealSheet key={`${editing.date}${editing.slot}`} date={editing.date} slot={editing.slot} existing={editing.existing} busy={busy.has(editing.date)} onClose={() => setEditing(undefined)} />}
      {suggesting && <SuggestSheet dates={dates} onClose={() => setSuggesting(false)} busy={busy} />}
      {shopping && <FromPlanSheet listId={liveLists(f)[0]!.listId} onClose={() => setShopping(false)} />}
    </>
  )
}

/** An empty breakfast, lunch or dinner: one identical row each, with one-tap standbys and the meals used here lately. */
function MealSlotEmpty({ date, slot, past, onMore }: { date: Ymd; slot: MealSlot; past: boolean; onMore: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(Date.now())
  const picks = useMemo(() => quickPicks(f, slot, today), [f, slot, today])
  const w = mealTimesOf(f)[slot as 'breakfast' | 'lunch' | 'dinner']
  const plan = (title: string, recipeId?: string) => {
    const evs = P.planMeal(me.id, { date, slot, recipe: recipeId ? f.recipes[recipeId] : undefined, title })
    act(evs)
    toast(`${SLOT_INFO[slot].label}: ${title}.`)
  }
  return (
    <div className={`meal-slot-empty${past ? ' past' : ''}`}>
      <button type="button" className="meal-add" onClick={onMore}>
        <Icon name="plus" size={16} /> Plan {SLOT_INFO[slot].label.toLowerCase()} <small className="muted">{w.start}</small>
      </button>
      {!past && (
        <div className="chips quick-picks" aria-label={`Quick ${SLOT_INFO[slot].label.toLowerCase()} choices`}>
          {picks.map((p) => (
            <button key={`${p.recipeId ?? p.title}`} type="button" className="chip small" onClick={() => plan(p.title, p.recipeId)}>
              {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MealLine({ m, big, onOpen }: { m: MealPlanEvent; big?: boolean; onOpen: () => void }) {
  const f = useFamily()
  const r = m.recipeId ? f.recipes[m.recipeId] : undefined
  const cook = m.cookId ? f.members[m.cookId] : undefined
  const w = mealWindow(f, m)
  return (
    <button type="button" className={`meal-line${big ? ' big' : ''}`} onClick={onOpen}>
      <span className="meal-emoji" aria-hidden="true">
        {r?.emoji ?? SLOT_INFO[m.slot].emoji}
      </span>
      <span className="grow">
        <strong>{m.title}</strong>
        <small className="muted">
          {[SLOT_INFO[m.slot].label, w ? w.start : '', r?.minutes ? `${r.minutes} min` : '', m.shopped ? '🛒 shopped for' : ''].filter(Boolean).join(' · ') || ' '}
        </small>
      </span>
      {cook && <Avatar m={cook} size={24} />}
    </button>
  )
}

const QUICK_MEALS = ['Leftovers', 'Takeaway', 'Eating out', 'Sandwiches', 'Cereal', 'Something simple']

function MealSheet({ date, slot, existing, recipe: preset, busy, onClose }: { date?: Ymd; slot?: MealSlot; existing?: MealPlanEvent; recipe?: RecipeEvent; busy?: boolean; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople().filter((p) => p.role === 'parent' || p.role === 'child')
  const today = ymdOf(Date.now())
  const [day, setDay] = useState<Ymd>(date ?? today)
  const [sl, setSl] = useState<MealSlot>(slot ?? existing?.slot ?? 'dinner')
  const [recipeId, setRecipeId] = useState<string | undefined>(existing?.recipeId ?? preset?.recipeId)
  const [title, setTitle] = useState(existing && !existing.recipeId ? existing.title : '')
  const [servings, setServings] = useState(existing?.servings ?? preset?.servings ?? 4)
  const [cook, setCook] = useState<MemberId | ''>(existing?.cookId ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [start, setStart] = useState<string>(existing?.start ?? '')
  const [end, setEnd] = useState<string>(existing?.end ?? '')
  const [q, setQ] = useState('')
  const last = useMemo(() => lastPlanned(f, today), [f, today])
  const recipes = liveRecipes(f)
    .filter((r) => (!r.meal || r.meal === 'any' || r.meal === sl) && (!q || r.title.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (last[a.recipeId] ?? '').localeCompare(last[b.recipeId] ?? '') || a.title.localeCompare(b.title))
  const picked = recipeId ? f.recipes[recipeId] : undefined

  const save = () => {
    const now = Date.now()
    const plan = P.planMeal(me.id, { date: day, slot: sl, recipe: picked, title: picked ? undefined : title, servings, cookId: cook || undefined, notes, existing, start: sl === 'snack' ? undefined : start || undefined, end: sl === 'snack' ? undefined : end || undefined }, now + 1)
    if (!plan.length) return toast('Pick a meal or type one.')
    // Moving a meal to another day or slot clears the old spot.
    const moved = existing && (existing.date !== day || existing.slot !== sl)
    const evs = [...(moved ? P.clearMeal(me.id, existing, now) : []), ...plan]
    act(evs)
    toast(`${SLOT_INFO[sl].label} planned for ${friendlyDay(day, today)}.`)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={existing ? 'Change meal' : 'Plan a meal'}>
      {!date && (
        <label className="field">
          <span>Day</span>
          <input type="date" className="tbox" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
      )}
      <Seg value={sl} onChange={setSl} options={SLOTS.map((s) => ({ id: s, label: SLOT_INFO[s].label }))} />
      {date && (
        <p className="muted">
          {friendlyDay(day, today)}
          {busy && sl === 'dinner' ? ' · someone is busy around tea time, so something quick might suit.' : ''}
        </p>
      )}

      <label className="field">
        <span>Pick a recipe</span>
        <input className="tbox slim" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes" />
      </label>
      <ul className="pick-list">
        {recipes.length === 0 && <li className="note">No recipes for this meal yet. Type something below, or add recipes in the Recipes tab.</li>}
        {recipes.slice(0, 40).map((r) => {
          const on = recipeId === r.recipeId
          const l = last[r.recipeId]
          return (
            <li key={r.recipeId}>
              <button type="button" className={`pick-item${on ? ' on' : ''}`} onClick={() => (setRecipeId(on ? undefined : r.recipeId), setServings(r.servings ?? servings), setTitle(''))}>
                <span className="meal-emoji">{r.emoji ?? '🍽️'}</span>
                <span className="grow">
                  <strong>{r.title}</strong>
                  <small className="muted">
                    {[r.minutes ? `${r.minutes} min` : '', r.minutes && r.minutes <= 30 ? 'quick' : '', l ? `last ${friendlyDay(l, today).toLowerCase()}` : 'not had yet'].filter(Boolean).join(' · ')}
                  </small>
                </span>
                {on && <Icon name="check" size={18} />}
              </button>
            </li>
          )
        })}
      </ul>

      <label className="field">
        <span>Or just write what it is</span>
        <input className="tbox" value={title} onChange={(e) => (setTitle(e.target.value), e.target.value && setRecipeId(undefined))} placeholder="e.g. Takeaway" />
      </label>
      <div className="chips">
        {QUICK_MEALS.map((m) => (
          <button key={m} type="button" className="chip small" onClick={() => (setTitle(m), setRecipeId(undefined))}>
            {m}
          </button>
        ))}
      </div>

      <div className="row-fields">
        <div className="field">
          <span>Servings</span>
          <div className="stepper" role="group" aria-label="Servings">
            <button type="button" onClick={() => setServings(Math.max(1, servings - 1))} aria-label="Fewer">
              <Icon name="minus" size={16} />
            </button>
            <strong>{servings}</strong>
            <button type="button" onClick={() => setServings(Math.min(30, servings + 1))} aria-label="More">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="field">
        <span>Who is cooking?</span>
        <MemberChips members={people} value={cook ? [cook] : []} onChange={(v) => setCook(v[0] ?? '')} everyone={{ label: 'Not decided', active: !cook, onToggle: () => setCook('') }} size="small" />
      </div>
      {sl !== 'snack' && (
        <div className="row-fields">
          <label className="field grow">
            <span>Starts</span>
            <input type="time" className="tbox" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start time" />
          </label>
          <label className="field grow">
            <span>Ends</span>
            <input type="time" className="tbox" value={end} onChange={(e) => setEnd(e.target.value)} disabled={!start} aria-label="End time" />
          </label>
        </div>
      )}
      {sl !== 'snack' && (
        <p className="note">
          {start ? `Shown on the calendar at ${start}.` : `Left blank, it follows the family's ${SLOT_INFO[sl].label.toLowerCase()} time (${mealTimesOf(f)[sl].start}).`}
        </p>
      )}
      <label className="field">
        <span>Notes</span>
        <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. defrost the mince" />
      </label>
      <button type="button" className="btn primary big block" onClick={save}>
        Save
      </button>
      {existing && <MoveMeal existing={existing} onDone={onClose} />}
      {existing && (
        <button type="button" className="btn danger block" onClick={() => (act(P.clearMeal(me.id, existing)), onClose())}>
          <Icon name="trash" size={16} /> Clear this meal
        </button>
      )}
    </Sheet>
  )
}

/** Move a planned meal to another day (or meal). If something is planned there already, the two swap. */
function MoveMeal({ existing, onDone }: { existing: MealPlanEvent; onDone: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(Date.now())
  const days = Array.from({ length: 15 }, (_, i) => addDays(today, i))
  const [date, setDate] = useState<Ymd>(existing.date)
  const [slot, setSlot] = useState<MealSlot>(existing.slot)
  const target = mealAt(f, date, slot)
  const same = date === existing.date && slot === existing.slot
  const options = days.includes(existing.date) ? days : [existing.date, ...days]
  return (
    <details className="move-meal">
      <summary>Move to another day or meal</summary>
      <div className="row-fields">
        <label className="field grow">
          <span>Day</span>
          <select className="tbox" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Move to day">
            {options.map((d) => (
              <option key={d} value={d}>
                {friendlyDay(d, today).includes(' ') ? friendlyDay(d, today) : `${friendlyDay(d, today)} ${dayOfMonth(d)} ${monthName(d)}`}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Meal</span>
          <select className="tbox" value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)} aria-label="Move to meal">
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_INFO[s].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!same && target && <p className="note">{target.title} is planned there, so the two swap places.</p>}
      <button
        type="button"
        className="btn block"
        disabled={same}
        onClick={() => {
          act(P.moveMeal(me.id, f, existing, { date, slot }))
          toast(target ? `Swapped with ${target.title}.` : `Moved to ${friendlyDay(date, today).toLowerCase()}.`)
          onDone()
        }}
      >
        {target && !same ? 'Swap them' : 'Move it'}
      </button>
    </details>
  )
}

function SuggestSheet({ dates, busy, onClose }: { dates: Ymd[]; busy: ReadonlySet<Ymd>; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(Date.now())
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6))
  const [dropped, setDropped] = useState<Set<Ymd>>(new Set())
  const open = dates.filter((d) => d >= today)
  // Rolled once per shuffle (not on every change to the family state), so the list does not jump about under your thumb.
  const openKey = open.join()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => suggestMeals(f, open, makeRng(seed), { today, quick: busy }), [seed, openKey, today])
  const shown = all.filter((s) => !dropped.has(s.date))
  return (
    <Sheet open onClose={onClose} title="Suggested dinners">
      <p className="muted">Nothing you have already planned is changed. Meals the family liked, and ones you often have on the same day, come up more; nights when someone is busy get a quick one; anything two people have said no to is left out.</p>
      <ul className="suggest-list">
        {all.map((s) => {
          const r = s.recipeId ? f.recipes[s.recipeId] : undefined
          const off = dropped.has(s.date)
          return (
            <li key={s.date} className={off ? 'off' : ''}>
              <strong>
                {dayName(s.date)} {dayOfMonth(s.date)}
              </strong>
              <span className="grow">
                {r?.emoji ?? '🍽️'} {s.title} <small className="muted">{r?.minutes ? `${r.minutes} min` : ''}{busy.has(s.date) ? ' · busy night' : ''}</small>
                {s.why.length > 0 && <small className="muted why">{s.why.join(' · ')}</small>}
              </span>
              <button type="button" className="icon-btn small" aria-label={off ? 'Keep this night' : 'Leave this night empty'} onClick={() => setDropped((x) => { const n = new Set(x); if (n.has(s.date)) n.delete(s.date); else n.add(s.date); return n })}>
                {off ? <Icon name="undo" size={16} /> : <Icon name="x" size={16} />}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => (setSeed(seed + 1), setDropped(new Set()))}>
          <Icon name="refresh" size={16} /> Shuffle
        </button>
      </div>
      <button
        type="button"
        className="btn primary big block"
        disabled={!shown.length}
        onClick={() => {
          act(P.planSuggestions(me.id, f, shown))
          toast(`Planned ${shown.length} dinner${shown.length === 1 ? '' : 's'}.`)
          onClose()
        }}
      >
        Use these {shown.length}
      </button>
    </Sheet>
  )
}

// ------------------------------------------------------------------ recipes

const MEAL_FILTERS: { id: MealSlot | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Snack' },
]

function Recipes() {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<MealSlot | 'all'>('all')
  const [open, setOpen] = useState<{ recipe?: RecipeEvent } | undefined>()
  const list = liveRecipes(f).filter((r) => (filter === 'all' || r.meal === filter || r.meal === 'any') && (!q || `${r.title} ${(r.tags ?? []).join(' ')} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())))
  const missingStarter = missingRecipes(f, STARTER_RECIPES)
  const hasBaby = bornBabies(f).length > 0 || expectedBabies(f).length > 0
  const missingBaby = hasBaby ? missingRecipes(f, ARRIVAL_RECIPES) : []

  return (
    <>
      <SectionHead
        title="Recipes"
        action={
          <button type="button" className="btn small" onClick={() => setOpen({})}>
            <Icon name="plus" size={16} /> New
          </button>
        }
      />
      {missingStarter.length > 0 && (
        <button type="button" className="card callout link-card" onClick={() => (act(P.seedRecipes(me.id, f, STARTER_RECIPES)), toast(`Added ${missingStarter.length} recipes.`))}>
          <Icon name="book" size={24} />
          <div className="grow">
            <h3>Add {missingStarter.length} family favourites</h3>
            <p className="muted">Spag bol, fajitas, pizza night and more, with shopping lists worked out. Change or delete any.</p>
          </div>
        </button>
      )}
      {missingBaby.length > 0 && (
        <button type="button" className="card callout link-card" onClick={() => (act(P.seedRecipes(me.id, f, ARRIVAL_RECIPES)), toast(`Added ${missingBaby.length} new-baby meals.`))}>
          <Icon name="heart" size={24} />
          <div className="grow">
            <h3>Add the new-baby breakfasts and lunches</h3>
            <p className="muted">The eight one-handed meals from the arrival plan.</p>
          </div>
        </button>
      )}

      <input className="tbox slim wide" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes or ingredients" aria-label="Search recipes" />
      <div className="chips scroll-chips">
        {MEAL_FILTERS.map((m) => (
          <button key={m.id} type="button" className={`chip small${filter === m.id ? ' selected' : ''}`} onClick={() => setFilter(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">
          <Icon name="book" size={32} />
          <h3>No recipes here</h3>
          <p>Add your own, or the family favourites above.</p>
        </div>
      )}
      <ul className="recipe-list">
        {list.map((r) => (
          <li key={r.recipeId}>
            <button type="button" className="card recipe-row" onClick={() => setOpen({ recipe: r })}>
              <span className="meal-emoji big">{r.emoji ?? '🍽️'}</span>
              <span className="grow">
                <strong>{r.title}</strong>
                <small className="muted">{[r.meal && r.meal !== 'any' ? SLOT_INFO[r.meal].label : '', r.minutes ? `${r.minutes} min` : '', r.servings ? `serves ${r.servings}` : '', `${r.ingredients.length} ingredients`].filter(Boolean).join(' · ')}</small>
                {dietaryTagsOf(r.tags).length > 0 && (
                  <span className="chips" style={{ marginTop: 4 }}>
                    {dietaryTagsOf(r.tags).map((t) => (
                      <span key={t} className="chip small">
                        {DIETARY_TAGS.find((d) => d.id === t)?.label}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </li>
        ))}
      </ul>
      {open && <RecipeSheet key={open.recipe?.recipeId ?? 'new'} recipe={open.recipe} onClose={() => setOpen(undefined)} />}
    </>
  )
}

function RecipeSheet({ recipe, onClose }: { recipe?: RecipeEvent; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [title, setTitle] = useState(recipe?.title ?? '')
  const [emoji, setEmoji] = useState(recipe?.emoji ?? '🍽️')
  const [meal, setMeal] = useState<MealSlot | 'any'>(recipe?.meal ?? 'dinner')
  const [minutes, setMinutes] = useState(recipe?.minutes ? String(recipe.minutes) : '')
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [ingredients, setIngredients] = useState((recipe?.ingredients ?? []).map(ingredientText).join('\n'))
  const [method, setMethod] = useState(recipe?.method ?? '')
  const [dietary, setDietary] = useState<DietaryTag[]>(dietaryTagsOf(recipe?.tags))
  const [sure, setSure] = useState(false)
  const [planning, setPlanning] = useState(false)
  const parsed = parseIngredients(ingredients)
  const toggleDietary = (t: DietaryTag) => setDietary((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const draft = () => ({
    recipeId: recipe?.recipeId,
    title,
    emoji: emoji.trim() || undefined,
    meal,
    minutes: Number(minutes) || undefined,
    servings,
    ingredients: parsed,
    method: method.trim() || undefined,
    notes: recipe?.notes,
    tags: [...(recipe?.tags ?? []).filter((t) => !DIETARY_TAGS.some((d) => d.id === t)), ...dietary],
    source: recipe?.source,
  })
  const saveIt = () => {
    if (!title.trim()) return toast('Give it a name.')
    act(P.saveRecipe(me.id, draft()))
    toast('Recipe saved.')
    onClose()
  }
  const toList = () => {
    const entries = parsed.filter((i) => !i.pantry).map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, aisle: i.aisle }))
    act(P.addToList(me.id, f, liveLists(f)[0]!.listId, entries))
    toast(`Added ${entries.length} things to the shopping list.`)
  }

  return (
    <Sheet open onClose={onClose} title={recipe ? recipe.title : 'New recipe'}>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} />
        </label>
        <label className="field grow">
          <span>Name</span>
          <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>
      <div className="field">
        <span>Good for</span>
        <div className="chips">
          {(['dinner', 'breakfast', 'lunch', 'snack', 'any'] as const).map((m) => (
            <button key={m} type="button" className={`chip small${meal === m ? ' selected' : ''}`} onClick={() => setMeal(m)}>
              {m === 'any' ? 'Anything' : SLOT_INFO[m].label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Dietary (optional)</span>
        <div className="chips">
          {DIETARY_TAGS.map((t) => (
            <button key={t.id} type="button" className={`chip small${dietary.includes(t.id) ? ' selected' : ''}`} onClick={() => toggleDietary(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="row-fields">
        <label className="field grow">
          <span>Minutes</span>
          <input className="tbox" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        </label>
        <div className="field">
          <span>Serves</span>
          <div className="stepper" role="group" aria-label="Servings">
            <button type="button" onClick={() => setServings(Math.max(1, servings - 1))} aria-label="Fewer">
              <Icon name="minus" size={16} />
            </button>
            <strong>{servings}</strong>
            <button type="button" onClick={() => setServings(Math.min(30, servings + 1))} aria-label="More">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </div>
      <label className="field">
        <span>Ingredients, one per line ({parsed.length})</span>
        <textarea className="tbox" rows={6} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={'500g beef mince\n2 tins chopped tomatoes\n1 onion'} />
      </label>
      {parsed.length > 0 && (
        <p className="note">
          Shops as: {AISLES.filter((a) => parsed.some((i) => i.aisle === a.id)).map((a) => `${a.emoji} ${parsed.filter((i) => i.aisle === a.id).length}`).join('  ')}
          {parsed.some((i) => i.pantry) ? ` · ${parsed.filter((i) => i.pantry).length} cupboard basics left off lists` : ''}
        </p>
      )}
      <label className="field">
        <span>Method</span>
        <textarea className="tbox" rows={4} value={method} onChange={(e) => setMethod(e.target.value)} />
      </label>
      <button type="button" className="btn primary big block" onClick={saveIt}>
        Save
      </button>
      {recipe && (
        <>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setPlanning(true)}>
              <Icon name="calendar" size={16} /> Plan it
            </button>
            <button type="button" className="btn" onClick={toList}>
              <Icon name="bag" size={16} /> Add to shopping list
            </button>
          </div>
          <button type="button" className="btn danger block" onClick={() => (sure ? (act(P.deleteRecipe(me.id, recipe)), onClose()) : setSure(true))}>
            <Icon name="trash" size={16} /> {sure ? 'Tap again to delete' : 'Delete recipe'}
          </button>
        </>
      )}
      {planning && recipe && <MealSheet recipe={recipe} onClose={() => (setPlanning(false), onClose())} />}
    </Sheet>
  )
}
