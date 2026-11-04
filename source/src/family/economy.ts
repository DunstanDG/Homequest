/**
 * COINS: the spendable side of the points system.
 *
 * XP (levels, badges) never goes down and is only ever earned by playing the learning games. Coins are the spendable
 * currency and come from three places:
 *   1. StudyQuest XP, converted at a rate the parent sets, with a daily cap so grinding can't buy the whole shop.
 *   2. Tasks: homework and chores. Each task carries its own coin value; if a parent has to check it, the coins
 *      show as "waiting" until they do.
 *   3. Bonuses (or fines) a parent adds by hand.
 * Spending: a purchase reserves the coins straight away; a parent approves it (coins are spent) or declines it (coins come back).
 *
 * Everything here is a pure function of the event log, so the balance on every phone is always the same.
 */
import { addDays, startOfWeek, tsOf } from './dates'
import type { EconomySetting, FamilyState, MemberId, TaskKind, Treat, Ymd } from './types'

export const DEFAULT_XP_PER_COIN = 10
export const DEFAULT_DAILY_CAP_XP = 400

export interface LearningDay {
  day: Ymd
  xp: number
  countedXp: number
  /** Coins earned that day (fractional; only whole coins are ever shown or spent). */
  coins: number
}

/** XP -> coins, day by day, using whichever setting was in force on each day. Days before the first setting earn nothing. */
export function learningDays(xpByDay: Record<Ymd, number>, economy: EconomySetting[]): LearningDay[] {
  if (!economy.length) return []
  const out: LearningDay[] = []
  for (const day of Object.keys(xpByDay).sort()) {
    const xp = xpByDay[day] ?? 0
    if (xp <= 0) continue
    let s: EconomySetting | undefined
    for (const e of economy) if (e.effectiveFrom <= day) s = e
    if (!s) continue
    const counted = Math.min(xp, s.dailyCapXp)
    out.push({ day, xp, countedXp: counted, coins: counted / s.xpPerCoin })
  }
  return out
}

/** Whole coins earned from learning so far. Uses one running total so remainders are never lost. */
export function learningCoins(xpByDay: Record<Ymd, number>, economy: EconomySetting[]): number {
  let sum = 0
  for (const d of learningDays(xpByDay, economy)) sum += d.coins
  return Math.floor(sum + 1e-9)
}

export interface Balance {
  learning: number
  tasks: number
  bonus: number
  /** Approved or handed-over purchases. */
  spent: number
  /** Purchases waiting for a parent. */
  reserved: number
  /** Task coins waiting for a parent to check. */
  waiting: number
  /** What can be spent right now. */
  available: number
  /** Everything ever earned (learning + tasks + positive bonuses). */
  lifetime: number
  /** Coins voluntarily gifted into crowdfunding goals. */
  gifted: number
  /** Coins from completing the daily trivia card. */
  trivia: number
}

/** The member a completed task pays: the person it was assigned to (a parent can tick it off on their behalf). */
const payee = (f: FamilyState, d: { taskId: string; by: MemberId; payee?: MemberId }): MemberId => d.payee ?? f.tasks[d.taskId]?.assignee ?? d.by

export function balanceFor(f: FamilyState, memberId: MemberId, xpByDay: Record<Ymd, number> = {}): Balance {
  const learning = learningCoins(xpByDay, f.economy)
  let tasks = 0
  let waiting = 0
  for (const d of Object.values(f.done)) {
    if (payee(f, d) !== memberId) continue
    if (d.status === 'approved') tasks += d.coins
    else if (d.status === 'pending') waiting += d.coins
  }
  let bonus = 0
  let bonusIn = 0
  for (const a of f.adjusts) {
    if (a.memberId !== memberId) continue
    bonus += a.delta
    if (a.delta > 0) bonusIn += a.delta
  }
  let spent = 0
  let reserved = 0
  for (const r of Object.values(f.redeems)) {
    if (r.memberId !== memberId) continue
    if (r.status === 'approved' || r.status === 'given') spent += r.cost
    else if (r.status === 'pending') reserved += r.cost
  }
  let gifted = 0
  for (const g of f.goalGifts) if (g.learnerId === memberId) gifted += g.coins
  let trivia = 0
  for (const d of Object.values(f.triviaDone)) if (d.memberId === memberId) trivia += d.coins
  return {
    learning,
    tasks,
    bonus,
    spent,
    reserved,
    waiting,
    available: learning + tasks + bonus + trivia - spent - reserved - gifted,
    lifetime: learning + tasks + bonusIn + trivia,
    gifted,
    trivia,
  }
}

/** Total coins gifted into one crowdfunding goal so far, from everyone. */
export function goalTotal(f: FamilyState, goalId: string): number {
  let sum = 0
  for (const g of f.goalGifts) if (g.goalId === goalId) sum += g.coins
  return sum
}

export interface LedgerEntry {
  ts: number
  label: string
  delta: number
  kind: 'learn' | 'task' | 'bonus' | 'spend' | 'gift' | 'trivia'
  /** For entries that are not final yet. */
  state?: 'waiting' | 'reserved'
}

/** Newest-first history that adds up to the balance. */
export function ledgerFor(f: FamilyState, memberId: MemberId, xpByDay: Record<Ymd, number> = {}): LedgerEntry[] {
  const out: LedgerEntry[] = []
  let cum = 0
  for (const d of learningDays(xpByDay, f.economy)) {
    const before = Math.floor(cum + 1e-9)
    cum += d.coins
    const gained = Math.floor(cum + 1e-9) - before
    if (gained > 0) out.push({ ts: tsOf(d.day, '23:59'), label: `StudyQuest (${d.xp} XP${d.countedXp < d.xp ? `, ${d.countedXp} counted` : ''})`, delta: gained, kind: 'learn' })
  }
  for (const d of Object.values(f.done)) {
    if (payee(f, d) !== memberId || d.status === 'rejected') continue
    out.push({ ts: d.checkTs ?? d.ts, label: f.tasks[d.taskId]?.title ?? 'Task', delta: d.coins, kind: 'task', state: d.status === 'pending' ? 'waiting' : undefined })
  }
  for (const a of f.adjusts) if (a.memberId === memberId) out.push({ ts: a.ts, label: a.reason || (a.delta >= 0 ? 'Bonus' : 'Adjustment'), delta: a.delta, kind: 'bonus' })
  for (const r of Object.values(f.redeems)) {
    if (r.memberId !== memberId) continue
    if (r.status === 'approved' || r.status === 'given') out.push({ ts: r.decidedTs ?? r.ts, label: r.title, delta: -r.cost, kind: 'spend' })
    else if (r.status === 'pending') out.push({ ts: r.ts, label: r.title, delta: -r.cost, kind: 'spend', state: 'reserved' })
  }
  for (const g of f.goalGifts) {
    if (g.learnerId !== memberId) continue
    out.push({ ts: g.ts, label: f.goals[g.goalId]?.title ? `Gift to ${f.goals[g.goalId]!.title}` : 'Goal gift', delta: -g.coins, kind: 'gift' })
  }
  for (const d of Object.values(f.triviaDone)) {
    if (d.memberId !== memberId) continue
    out.push({ ts: d.ts, label: 'Daily trivia', delta: d.coins, kind: 'trivia' })
  }
  return out.filter((e) => e.delta !== 0).sort((a, b) => b.ts - a.ts)
}

export type CanRedeem = { ok: true } | { ok: false; reason: string }

export function canRedeem(f: FamilyState, memberId: MemberId, treat: Treat, available: number, today: Ymd): CanRedeem {
  if (treat.deleted || !treat.active) return { ok: false, reason: 'Not available right now' }
  if (treat.forMembers.length && !treat.forMembers.includes(memberId)) return { ok: false, reason: 'Not for you' }
  if (available < treat.cost) return { ok: false, reason: `${treat.cost - available} more coins to go` }
  if (treat.maxPerWeek) {
    const from = startOfWeek(today)
    const to = addDays(from, 6)
    const n = Object.values(f.redeems).filter((r) => r.treatId === treat.id && r.memberId === memberId && r.status !== 'declined' && r.status !== 'cancelled' && tsOf(from) <= r.ts && r.ts < tsOf(addDays(to, 1))).length
    if (n >= treat.maxPerWeek) return { ok: false, reason: `Limit reached this week (${treat.maxPerWeek})` }
  }
  return { ok: true }
}

/** Sensible starting coin value for a new task. */
export function suggestCoins(kind: TaskKind, minutes?: number): number {
  const m = minutes ?? 0
  switch (kind) {
    case 'homework':
      return m >= 60 ? 30 : m >= 30 || m === 0 ? 20 : 10
    case 'study':
      return 10
    case 'chore':
      return m >= 30 ? 20 : m >= 15 ? 10 : 5
    case 'routine':
      return 2
    default:
      return 5
  }
}

export const TREAT_SEEDS: { title: string; cost: number; emoji: string; blurb?: string; maxPerWeek?: number }[] = [
  { title: 'Extra 30 minutes of screen time', cost: 40, emoji: '📱', maxPerWeek: 3 },
  { title: 'Stay up 30 minutes later (weekend)', cost: 50, emoji: '🌙', maxPerWeek: 1 },
  { title: "Choose tonight's dinner", cost: 60, emoji: '🍝' },
  { title: 'Choose the family movie', cost: 80, emoji: '🎬' },
  { title: 'Ice cream trip', cost: 100, emoji: '🍦' },
  { title: 'Bake cookies together', cost: 100, emoji: '🍪' },
  { title: 'Pick the family day out', cost: 300, emoji: '🎡' },
  { title: 'Small treat (up to £5)', cost: 250, emoji: '🎁' },
]
