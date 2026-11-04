/**
 * The order of the blocks on Today, set by each person for themselves and kept on this phone (like night mode; it
 * isn't synced). The defaults differ for adults and children; a saved layout only overrides them for whoever saved it,
 * on their own view of Today. Blocks added in later releases slot into a saved layout at their default position.
 */
import { useSyncExternalStore } from 'react'

export type BlockId = 'needs' | 'plan' | 'checkin' | 'school' | 'baby' | 'timeline' | 'todo' | 'braindump' | 'done' | 'goal' | 'week' | 'learning' | 'together' | 'care' | 'dump' | 'extras'

export interface BlockDef {
  id: BlockId
  emoji: string
  label: string
  hint: string
  /** Can't be switched off (things waiting on you shouldn't be missable). */
  pinned?: boolean
}

export const BLOCKS: Record<BlockId, BlockDef> = {
  needs: { id: 'needs', emoji: '✅', label: 'Needs you', hint: 'Things to check, help wanted, votes, plants', pinned: true },
  plan: { id: 'plan', emoji: '🗓️', label: 'Plan for today', hint: 'The home server’s plan for your day and its “on track?” questions' },
  checkin: { id: 'checkin', emoji: '🌅', label: 'Morning and evening check-in', hint: 'Look back, add what was missed, personal care, how you feel' },
  school: { id: 'school', emoji: '🎒', label: 'School and homework', hint: 'Pack for tomorrow, homework check-in' },
  baby: { id: 'baby', emoji: '👶', label: 'New-baby plan', hint: 'While the baby is due or in the first two weeks' },
  timeline: { id: 'timeline', emoji: '🕒', label: 'Now & next', hint: 'The day’s calendar, sessions and dinner' },
  todo: { id: 'todo', emoji: '☑️', label: 'To do', hint: 'Your list for today' },
  learning: { id: 'learning', emoji: '⚡', label: 'Learning', hint: 'StudyQuest today and coins' },
  together: { id: 'together', emoji: '🎉', label: 'Coming up together', hint: 'Family plans in the next few days' },
  care: { id: 'care', emoji: '🍼', label: 'Care', hint: 'Baby, pets and plants at a glance (for children: the care jobs they help with)' },
  braindump: { id: 'braindump', emoji: '🧠', label: 'Brain dump', hint: 'Open items from the brain dump, with quick add' },
  done: { id: 'done', emoji: '🌟', label: 'Look what you did', hint: 'What you have finished today (never what is missed)' },
  goal: { id: 'goal', emoji: '🎯', label: 'Family goal', hint: 'Shared progress towards a family goal' },
  week: { id: 'week', emoji: '🗓️', label: 'This week’s 5', hint: 'The five things picked in the weekly plan' },
  dump: { id: 'dump', emoji: '🧠', label: 'Evening brain dump', hint: 'The nudge to empty your head, at your set time' },
  extras: { id: 'extras', emoji: '🛒', label: 'Shopping, dinner and trivia', hint: 'Small tiles' },
}

export type LayoutKind = 'adult' | 'child'

/** The default order. A parent looking at a child's day sees Needs you first. */
export function defaultOrder(kind: LayoutKind, parentViewingChild = false): BlockId[] {
  if (kind === 'child') {
    const base: BlockId[] = ['school', 'plan', 'checkin', 'todo', 'braindump', 'care', 'timeline', 'learning', 'done', 'goal', 'week', 'needs', 'together', 'extras']
    return parentViewingChild ? ['needs', ...base.filter((b) => b !== 'needs')] : base
  }
  return ['needs', 'plan', 'checkin', 'baby', 'timeline', 'todo', 'braindump', 'together', 'week', 'done', 'goal', 'care', 'dump', 'extras']
}

export interface SavedLayout {
  order: string[]
  hidden: string[]
}

export interface Layout {
  order: BlockId[]
  hidden: Set<BlockId>
}

/**
 * Combine a saved layout with the defaults: the saved order for blocks it knows, unknown ids dropped, and any block
 * it doesn't mention (a new one) put back right after the block that comes before it in the default order.
 */
export function resolveLayout(defaults: readonly BlockId[], saved?: SavedLayout): Layout {
  if (!saved) return { order: [...defaults], hidden: new Set() }
  const known = new Set<string>(defaults)
  const order = saved.order.filter((id, i, a): id is BlockId => known.has(id) && a.indexOf(id) === i)
  defaults.forEach((id, i) => {
    if (order.includes(id)) return
    const before = defaults.slice(0, i).reverse().find((d) => order.includes(d))
    order.splice(before ? order.indexOf(before) + 1 : 0, 0, id)
  })
  const hidden = new Set(saved.hidden.filter((id): id is BlockId => known.has(id) && !BLOCKS[id as BlockId].pinned))
  return { order, hidden }
}

/** Move a block one place up (-1) or down (+1). */
export function moveBlock(order: readonly BlockId[], id: BlockId, by: -1 | 1): BlockId[] {
  const i = order.indexOf(id)
  const j = i + by
  if (i < 0 || j < 0 || j >= order.length) return [...order]
  const out = [...order]
  ;[out[i], out[j]] = [out[j]!, out[i]!]
  return out
}

// ------------------------------------------------------------------ kept on this phone, per person

const key = (memberId: string, kind: LayoutKind) => `hq.today.${memberId}.${kind}`
const listeners = new Set<() => void>()
const cache = new Map<string, SavedLayout | null>()

function read(memberId: string, kind: LayoutKind): SavedLayout | undefined {
  const k = key(memberId, kind)
  if (!cache.has(k)) {
    let v: SavedLayout | null = null
    try {
      const raw = localStorage.getItem(k)
      const p = raw ? (JSON.parse(raw) as Partial<SavedLayout>) : undefined
      if (p && Array.isArray(p.order)) v = { order: p.order.filter((x) => typeof x === 'string'), hidden: Array.isArray(p.hidden) ? p.hidden.filter((x) => typeof x === 'string') : [] }
    } catch {
      v = null
    }
    cache.set(k, v)
  }
  return cache.get(k) ?? undefined
}

export function saveLayout(memberId: string, kind: LayoutKind, layout: SavedLayout | undefined) {
  const k = key(memberId, kind)
  cache.set(k, layout ?? null)
  try {
    if (layout) localStorage.setItem(k, JSON.stringify(layout))
    else localStorage.removeItem(k)
  } catch {
    /* private mode: this visit only */
  }
  listeners.forEach((l) => l())
}

export function useSavedLayout(memberId: string, kind: LayoutKind): SavedLayout | undefined {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => read(memberId, kind),
  )
}

/** For tests. */
export const _resetLayoutCache = () => cache.clear()
