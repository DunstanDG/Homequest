import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as P from '@/family/planActions'
import { useApp, useFamily, useMe } from '@/app/context'
import { addDays, friendlyDay, shortDay, startOfWeek, ymdOf } from '@/family/dates'
import { ingredientsFor } from '@/family/meals'
import { AISLES, MAIN_LIST, formatQty, groupByAisle, itemsOf, listText, liveLists, mergeDuplicates, nameKey, nearDuplicates, regulars, type DupGroup } from '@/family/shopping'
import type { AppEvent } from '@/engine/types'
import type { Aisle, MemberId, ShopItemEvent, Ymd } from '@/family/types'
import { CheckCircle, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { useWakeLock } from '@/ui/timers'
import { upcomingWeekAnchor } from '@/screens/family/shared'

const load = (k: string): boolean => {
  try {
    return localStorage.getItem(k) === '1'
  } catch {
    return false
  }
}
const save = (k: string, v: boolean) => {
  try {
    localStorage.setItem(k, v ? '1' : '0')
  } catch {
    /* fine */
  }
}

const TIMES = ['', 'once', 'twice', 'three times', 'four times']
const times = (n: number) => TIMES[n] ?? `${n} times`

/** The events that fold a near-duplicate group into one item: an edit of the kept one, a remove of the others. */
function mergeEvents(actor: MemberId, group: readonly ShopItemEvent[], now = Date.now()): AppEvent[] {
  const plan = mergeDuplicates(group)
  if (!plan) return []
  return [...P.editItem(actor, plan.keep, plan.patch, now), ...plan.remove.flatMap((r, n) => P.removeItem(actor, r, now + 1 + n))]
}

/** Shopping lists, laid out in the order you walk round the shop. */
export function Shopping() {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [params, setParams] = useSearchParams()
  const lists = liveLists(f)
  const [listId, setListId] = useState(lists[0]!.listId)
  const list = lists.find((l) => l.listId === listId) ?? lists[0]!
  const items = itemsOf(f, list.listId)
  const [text, setText] = useState('')
  const [shopMode, setShopMode] = useState(() => params.get('shop') === '1' || load('hq.shopmode'))
  const [edit, setEdit] = useState<ShopItemEvent | undefined>()
  const [listSheet, setListSheet] = useState<'new' | 'edit' | undefined>()
  const [fromPlan, setFromPlan] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set()) // this visit only: a folded aisle shouldn't hide things on the next trip
  const [basketOpen, setBasketOpen] = useState(false)
  const [notNow, setNotNow] = useState<Set<string>>(new Set())
  useWakeLock(shopMode)
  useEffect(() => save('hq.shopmode', shopMode), [shopMode])

  // Opened from a "go shopping" link (?shop=1): straight into shop mode. The flag is then dropped from the address so
  // turning shop mode off is not undone by a re-render, and the choice is remembered like the switch.
  const shopParam = params.get('shop')
  useEffect(() => {
    if (shopParam !== '1') return
    setShopMode(true)
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.delete('shop')
        return next
      },
      { replace: true },
    )
  }, [shopParam, setParams])

  const today = ymdOf(Date.now())
  const waiting = useMemo(() => ingredientsFor(f, today, addDays(startOfWeek(today), 13)), [f, today])
  const usuals = regulars(f, list.listId, 10)
  const ticked = items.filter((i) => i.done).sort((a, b) => a.name.localeCompare(b.name))
  const groups = groupByAisle(items.filter((i) => !i.done))
  const dups = nearDuplicates(items).filter((g) => !notNow.has(g.key))

  const toggleAisle = (aisle: string) =>
    setCollapsed((s) => {
      const next = new Set(s)
      if (next.has(aisle)) next.delete(aisle)
      else next.add(aisle)
      return next
    })

  const add = () => {
    if (!text.trim()) return
    act(P.addTextToList(me.id, f, list.listId, text))
    setText('')
    setCollapsed(new Set()) // so whatever was just added is visible
  }
  const tick = (i: ShopItemEvent) => act(P.tickItem(me.id, i, !i.done))
  const merge = (g: DupGroup) => {
    act(mergeEvents(me.id, g.items))
    toast(`Merged ${g.name}.`)
  }
  const share = async () => {
    const body = listText(list.name, items)
    try {
      if (navigator.share) await navigator.share({ title: list.name, text: body })
      else {
        await navigator.clipboard.writeText(body)
        toast('List copied.')
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <>
      <SectionHead
        title={`${list.emoji ?? '🛒'} ${list.name}`}
        action={
          <button type="button" className="icon-btn" aria-label="List options" onClick={() => setListSheet('edit')}>
            <Icon name="more" />
          </button>
        }
      />

      <div className="chips scroll-chips" role="group" aria-label="Lists">
        {lists.map((l) => (
          <button key={l.listId} type="button" className={`chip small${l.listId === list.listId ? ' selected' : ''}`} onClick={() => setListId(l.listId)}>
            {l.emoji ?? '🛒'} {l.name}
          </button>
        ))}
        <button type="button" className="chip small" onClick={() => setListSheet('new')}>
          <Icon name="plus" size={14} /> List
        </button>
      </div>

      <form
        className="add-bar shop-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input className="tbox" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add something, e.g. 2 tins tomatoes" aria-label="Add to the list" enterKeyHint="done" />
        <button type="submit" className="btn primary" disabled={!text.trim()} aria-label="Add">
          <Icon name="plus" size={20} />
        </button>
      </form>

      {usuals.length > 0 && (
        <div className="chips scroll-chips usuals" role="group" aria-label="Usual things">
          {usuals.map((u) => (
            <button key={u.name} type="button" className="chip small" onClick={() => act(P.addToList(me.id, f, list.listId, [{ name: u.name, unit: u.unit, aisle: u.aisle }]))}>
              + {u.name}
            </button>
          ))}
        </div>
      )}

      {waiting.plans.length > 0 && list.listId === lists[0]!.listId && (
        <button type="button" className="card callout link-card" onClick={() => setFromPlan(true)}>
          <Icon name="calendar" size={24} />
          <div className="grow">
            <h3>{waiting.plans.length} planned meal{waiting.plans.length === 1 ? '' : 's'} to shop for</h3>
            <p className="muted">Add what you need for them ({waiting.needs.length} things).</p>
          </div>
          <Icon name="chevron" size={18} />
        </button>
      )}

      {dups.length > 0 && (
        <div className="card callout shop-dups" role="status">
          <Icon name="info" size={22} />
          <ul className="grow">
            {dups.map((g) => (
              <li key={g.key} className="shop-dup">
                <span className="grow">
                  <strong>{g.name}</strong> is on the list {times(g.items.length)} — merge?
                </span>
                <span className="shop-dup-actions">
                  <button type="button" className="btn small primary" onClick={() => merge(g)}>
                    Merge
                  </button>
                  <button type="button" className="btn small ghost" aria-label={`Keep ${g.name} separate`} onClick={() => setNotNow((s) => new Set(s).add(g.key))}>
                    Keep
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <Icon name="bag" size={32} />
          <h3>Nothing on the list</h3>
          <p>Type above, tap something you buy a lot, or add the week's meals.</p>
        </div>
      ) : (
        <>
          <div className="row-between shop-tools">
            <label className="switch-row compact">
              <input type="checkbox" className="switch" checked={shopMode} onChange={(e) => setShopMode(e.target.checked)} />
              <span>Shop mode</span>
            </label>
            <span className="note">
              {ticked.length} of {items.length} in the basket
            </span>
          </div>
          <Bar value={items.length ? ticked.length / items.length : 0} tone="good" label="Basket progress" />

          <div className={`shop-list${shopMode ? ' big' : ''}`}>
            {groups.length === 0 && <p className="note center shop-all-got">Everything is in the basket. 🎉</p>}
            {groups.map((g) => {
              const shut = collapsed.has(g.aisle)
              return (
                <section key={g.aisle} className={`aisle${shut ? ' shut' : ''}`}>
                  <h3>
                    <button type="button" className="aisle-head" aria-expanded={!shut} onClick={() => toggleAisle(g.aisle)}>
                      <span aria-hidden="true">{g.emoji}</span> {g.label} <small>{g.items.length}</small>
                      <Icon name="chevron" size={16} />
                    </button>
                  </h3>
                  {!shut && (
                    <ul>
                      {g.items.map((i) => (
                        <ShopRow key={i.itemId} i={i} onTick={() => tick(i)} onOpen={() => (shopMode ? tick(i) : setEdit(i))} />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
            {ticked.length > 0 && (
              <section className={`aisle basket${basketOpen ? '' : ' shut'}`}>
                <div className="basket-head">
                  <h3>
                    <button type="button" className="aisle-head" aria-expanded={basketOpen} onClick={() => setBasketOpen((o) => !o)}>
                      <span aria-hidden="true">🧺</span> In the basket <small>{ticked.length}</small>
                      <Icon name="chevron" size={16} />
                    </button>
                  </h3>
                  <button type="button" className="btn small" onClick={() => (act(P.clearTicked(me.id, items)), toast(`Cleared ${ticked.length}.`))}>
                    <Icon name="check" size={14} /> Clear ticked
                  </button>
                </div>
                {basketOpen && (
                  <ul>
                    {ticked.map((i) => (
                      <ShopRow key={i.itemId} i={i} onTick={() => tick(i)} onOpen={() => (shopMode ? tick(i) : setEdit(i))} />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="btn-row">
            <button type="button" className="btn ghost" onClick={share}>
              <Icon name="share" size={16} /> Send list
            </button>
          </div>
        </>
      )}

      {edit && <ItemSheet key={edit.itemId} item={edit} onClose={() => setEdit(undefined)} />}
      {listSheet && <ListSheet mode={listSheet} list={listSheet === 'edit' ? list : undefined} onClose={() => setListSheet(undefined)} onMade={(id) => setListId(id)} />}
      {fromPlan && <FromPlanSheet listId={list.listId} onClose={() => setFromPlan(false)} />}
    </>
  )
}

function ShopRow({ i, onTick, onOpen }: { i: ShopItemEvent; onTick: () => void; onOpen: () => void }) {
  const qty = formatQty(i.qty, i.unit)
  return (
    <li className={`shop-row${i.done ? ' done' : ''}`}>
      <CheckCircle done={i.done} onClick={onTick} label={`${i.done ? 'Put back' : 'Got'} ${i.name}`} />
      <button type="button" className="shop-main" onClick={onOpen}>
        <span className="shop-name">{i.name}</span>
        {(qty || i.note) && <small className="muted">{[qty, i.note].filter(Boolean).join(' · ')}</small>}
      </button>
    </li>
  )
}

function ItemSheet({ item, onClose }: { item: ShopItemEvent; onClose: () => void }) {
  const { act } = useApp()
  const me = useMe()!
  const [name, setName] = useState(item.name)
  const [qty, setQty] = useState(item.qty != null ? String(item.qty) : '')
  const [unit, setUnit] = useState(item.unit ?? '')
  const [aisle, setAisle] = useState<Aisle>(item.aisle)
  const [note, setNote] = useState(item.note ?? '')
  return (
    <Sheet open onClose={onClose} title="Edit item">
      <label className="field">
        <span>Item</span>
        <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="row-fields">
        <label className="field grow">
          <span>How many</span>
          <input className="tbox" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, '').slice(0, 6))} />
        </label>
        <label className="field grow">
          <span>Unit</span>
          <input className="tbox" value={unit} onChange={(e) => setUnit(e.target.value.slice(0, 10))} placeholder="g, tins, bag…" />
        </label>
      </div>
      <label className="field">
        <span>Note</span>
        <input className="tbox" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. the seeded one" />
      </label>
      <div className="field">
        <span>Where in the shop</span>
        <div className="chips">
          {AISLES.map((a) => (
            <button key={a.id} type="button" className={`chip small${aisle === a.id ? ' selected' : ''}`} onClick={() => setAisle(a.id)}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="btn primary block"
        onClick={() => {
          act(P.editItem(me.id, item, { name, qty: Number(qty) > 0 ? Number(qty) : undefined, unit: unit.trim() || undefined, aisle, note: note.trim() || undefined }))
          onClose()
        }}
      >
        Save
      </button>
      <button type="button" className="btn danger block" onClick={() => (act(P.removeItem(me.id, item)), onClose())}>
        <Icon name="trash" size={16} /> Remove
      </button>
    </Sheet>
  )
}

function ListSheet({ mode, list, onClose, onMade }: { mode: 'new' | 'edit'; list?: { listId: string; name: string; emoji?: string }; onClose: () => void; onMade: (id: string) => void }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [name, setName] = useState(list?.name ?? '')
  const [emoji, setEmoji] = useState(list?.emoji ?? '🛒')
  const [sure, setSure] = useState(false)
  const existing = list ? f.shopLists[list.listId] : undefined
  return (
    <Sheet open onClose={onClose} title={mode === 'new' ? 'New list' : 'List options'}>
      <div className="row-fields">
        <label className="field emoji-field">
          <span>Icon</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} />
        </label>
        <label className="field grow">
          <span>Name</span>
          <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Costco, Chemist, Party" />
        </label>
      </div>
      <button
        type="button"
        className="btn primary block"
        disabled={!name.trim()}
        onClick={() => {
          const id = list?.listId ?? undefined
          const evs = P.saveList(me.id, { listId: id, name, emoji: emoji.trim() || undefined })
          act(evs)
          const made = evs[0]
          if (made && made.type === 'shop-list') onMade(made.listId)
          onClose()
        }}
      >
        Save
      </button>
      {mode === 'edit' && list && list.listId !== MAIN_LIST && existing && (
        <button type="button" className="btn danger block" onClick={() => (sure ? (act(P.deleteList(me.id, existing)), onMade(MAIN_LIST), onClose()) : setSure(true))}>
          <Icon name="trash" size={16} /> {sure ? 'Tap again to delete this list' : 'Delete list'}
        </button>
      )}
    </Sheet>
  )
}

/** Work out what the planned meals need and add it (skipping anything you already have). */
export function FromPlanSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const lists = liveLists(f)
  const today = ymdOf(Date.now())
  const start = startOfWeek(upcomingWeekAnchor(today))
  const [range, setRange] = useState<'this' | 'next' | 'both'>(start > startOfWeek(today) ? 'next' : 'this')
  const [target, setTarget] = useState(listId)
  const [skip, setSkip] = useState<Set<string>>(new Set())
  const from: Ymd = range === 'next' ? addDays(startOfWeek(today), 7) : today
  const to: Ymd = range === 'this' ? addDays(startOfWeek(today), 6) : addDays(startOfWeek(today), 13)
  const ps = ingredientsFor(f, from, to)
  const chosen = ps.needs.filter((n) => !skip.has(nameKey(n.name)))
  const flip = (name: string) =>
    setSkip((s) => {
      const k = nameKey(name)
      const next = new Set(s)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  return (
    <Sheet open onClose={onClose} title="Shop for the meals">
      <Seg
        value={range}
        onChange={(r) => (setRange(r), setSkip(new Set()))}
        options={[
          { id: 'this', label: 'This week' },
          { id: 'next', label: 'Next week' },
          { id: 'both', label: 'Both' },
        ]}
      />
      {ps.plans.length === 0 ? (
        <p className="note">Nothing to add: every meal in these days is already on a list, or has no recipe. Plan some meals first.</p>
      ) : (
        <>
          <p className="muted">
            {ps.plans.length} meal{ps.plans.length === 1 ? '' : 's'}: {ps.plans.map((m) => `${shortDay(m.date).split(' ')[0]} ${m.title}`).join(', ')}
          </p>
          <p className="note">Untick anything you already have. Salt, oil and other cupboard basics are left off.</p>
          <ul className="need-list">
            {ps.needs.map((n) => {
              const on = !skip.has(nameKey(n.name))
              return (
                <li key={`${n.name}|${n.unit ?? ''}`}>
                  <label className="need-row">
                    <input type="checkbox" checked={on} onChange={() => flip(n.name)} />
                    <span className={on ? '' : 'struck'}>{n.name}</span>
                    <small className="muted">{formatQty(n.qty, n.unit)}</small>
                  </label>
                </li>
              )
            })}
          </ul>
          {ps.bare.length > 0 && <p className="note">No ingredients for: {ps.bare.map((m) => m.title).join(', ')}.</p>}
          {lists.length > 1 && (
            <div className="chips">
              {lists.map((l) => (
                <button key={l.listId} type="button" className={`chip small${target === l.listId ? ' selected' : ''}`} onClick={() => setTarget(l.listId)}>
                  {l.emoji} {l.name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn primary big block"
            disabled={!chosen.length && !ps.plans.length}
            onClick={() => {
              const r = P.addPlanToList(me.id, f, target, from, to, Date.now(), { skip })
              act(r.events)
              toast(`Added ${r.lines} thing${r.lines === 1 ? '' : 's'} to the list.`)
              onClose()
            }}
          >
            Add {chosen.length} to the list
          </button>
        </>
      )}
      <p className="note center">{friendlyDay(from, today)} to {friendlyDay(to, today)}</p>
    </Sheet>
  )
}
