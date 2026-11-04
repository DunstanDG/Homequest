/**
 * Everything a person can DO in the family app, as functions that return the events to append.
 * Screens call these and hand the result to repo.apply(). Keeping them here (pure, no React) means the rules
 * (who needs a check, what a linked task does, how a decided idea reaches the calendar) are tested once.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent, type EventBody } from '@/engine/make'
import { hashString, uid } from '@/engine/rng'
import { tsOf, ymdOf } from './dates'
import { occursOn } from './recur'
import { petLogs } from './care'
import type {
  BabyEvent,
  CalEvent,
  CoinGoalEvent,
  CoparentLinkEvent,
  FamilyState,
  Hm,
  IdeaEvent,
  Member,
  MemberId,
  PetEvent,
  ShiftPlanEvent,
  TaskEvent,
  TimerEvent,
  TreatEvent,
  VoteValue,
  Ymd,
} from './types'
import type { SchoolPack } from './school/types'
import { DEFAULT_DAILY_CAP_XP, DEFAULT_XP_PER_COIN, suggestCoins } from './economy'

const ev = (actor: MemberId, body: EventBody, now: number, id?: string): AppEvent => makeEvent(actor, body, now, id)

export const isParent = (f: FamilyState, id: MemberId): boolean => f.members[id]?.role === 'parent'

export const MEMBER_COLOURS = ['#4cc9f0', '#f72585', '#ffc857', '#3ddc97', '#b388ff', '#ff9f68', '#7bdff2', '#ff7070']

// ---------------------------------------------------------------------- members

export function saveMember(actor: MemberId, m: Omit<Member, 'createdTs'>, now = Date.now()): AppEvent[] {
  return [
    ev(
      actor,
      {
        type: 'member',
        memberId: m.id,
        name: m.name.trim() || 'Someone',
        role: m.role,
        colour: m.colour,
        emoji: m.emoji,
        active: m.active,
        birthday: m.birthday,
        dueDate: m.dueDate,
        dayOne: m.dayOne,
        petKind: m.petKind,
        petPlan: m.petPlan,
        looksAfter: m.looksAfter,
      },
      now,
    ),
  ]
}

export const newMemberId = (): MemberId => uid('m')

/**
 * A child needs a StudyQuest profile (name and school year) before the learning games can use their id.
 * The event id is derived from the details, so saving the same name and year twice never duplicates it.
 */
export function childProfile(memberId: MemberId, name: string, year: number, now = Date.now()): AppEvent[] {
  const n = name.trim() || 'Explorer'
  return [ev(memberId, { type: 'profile', name: n, year }, now, `profile-${memberId}-${hashString(`${n}|${year}|${now}`).toString(36)}`)]
}

// --------------------------------------------------------------------- calendar

export type CalDraft = Omit<CalEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'calId'> & { calId?: string }

export function saveCal(actor: MemberId, c: CalDraft, now = Date.now()): AppEvent[] {
  const { calId, ...rest } = c
  return [ev(actor, { type: 'cal', calId: calId ?? uid('c'), ...rest }, now)]
}

export function deleteCal(actor: MemberId, existing: CalEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'cal', ...rest, deleted: true }, now)]
}

/** Cancel one occurrence of a repeating event. */
export function skipOccurrence(actor: MemberId, existing: CalEvent, date: Ymd, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'cal', ...rest, exdates: [...(existing.exdates ?? []), date] }, now)]
}

export function offerHelp(actor: MemberId, calId: string, date: Ymd, offer: boolean, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'help', calId, date, offer }, now)]
}

/** Toggle "share details with other home" on one calendar event, keeping everything else about it unchanged. Only
 * meaningful for a child with an active co-parent link, but harmless (and ignored by busyBlocksFor) otherwise. */
export function setCalShareDetail(actor: MemberId, existing: CalEvent, shareDetail: boolean, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'cal', ...rest, shareDetail }, now)]
}

/** Edit or cancel one occurrence of a school-timetable-derived agenda item (a lesson, club, school-event or
 * closure block) - the timetable itself is untouched, this just lays a one-day override on top of it. */
export function setCalOverride(
  actor: MemberId,
  itemKey: string,
  patch: { cancelled?: boolean; title?: string; start?: Hm; end?: Hm; location?: string; notes?: string },
  now = Date.now(),
): AppEvent[] {
  return [ev(actor, { type: 'cal-override', itemKey, ...patch }, now)]
}

/** Undo an override, back to whatever the school timetable says for that day by default. */
export function clearCalOverride(actor: MemberId, itemKey: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'cal-override', itemKey, cleared: true }, now)]
}

// ------------------------------------------------------------------------ tasks

export type TaskDraft = Omit<TaskEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'taskId' | 'coins' | 'check'> & { taskId?: string; coins?: number; check?: 'self' | 'parent' }

export function saveTask(actor: MemberId, t: TaskDraft, now = Date.now(), id?: string): AppEvent[] {
  const { taskId, coins, check, ...rest } = t
  return [ev(actor, { type: 'task', taskId: taskId ?? uid('t'), coins: coins ?? suggestCoins(t.kind, t.minutes), check: check ?? (t.kind === 'routine' ? 'self' : 'parent'), ...rest }, now, id)]
}

export function deleteTask(actor: MemberId, existing: TaskEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'task', ...rest, deleted: true }, now)]
}

/**
 * Tick a task off. If it needs a parent to check it and a child is ticking it, the coins wait for approval;
 * a parent ticking it off approves it straight away.
 */
export function completeTask(actor: MemberId, f: FamilyState, task: TaskEvent, date: Ymd | 'any', opts: { minutes?: number; note?: string } = {}, now = Date.now()): AppEvent[] {
  const needsCheck = task.check === 'parent' && !isParent(f, actor)
  return [ev(actor, { type: 'task-done', taskId: task.taskId, date, coins: task.coins, minutes: opts.minutes, needsCheck, note: opts.note, payee: task.assignee }, now)]
}

export function checkTask(actor: MemberId, taskId: string, date: Ymd | 'any', decision: 'approved' | 'rejected', note?: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'task-check', taskId, date, decision, note: note?.trim() || undefined }, now)]
}

/** Mark a task "could use a hand" (or clear that), without changing who it is assigned to. */
export function offerTaskHelp(actor: MemberId, existing: TaskEvent, helpWanted: boolean, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'task', ...rest, helpWanted }, now)]
}

/** Another adult picks up a task marked "could use a hand": reassigns it to them and clears the flag. Coins for
 * anything already done under the old assignee are untouched — only future completions pay the new assignee. */
export function claimTask(actor: MemberId, existing: TaskEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'task', ...rest, assignee: actor, helpWanted: false, handoffFrom: existing.assignee }, now)]
}

/** Coins a done task has actually paid out and could still be taken back, given what the child can spend right now (never below zero). */
export function takeBackAmount(d: { coins: number; status: string }, available: number): number {
  if (d.status !== 'approved') return 0
  return Math.max(0, Math.min(d.coins, available))
}

/**
 * Un-tick a task that is done. Waiting-for-check coins were never paid, so they just disappear. Approved coins are taken back,
 * but only as far as the balance allows: if some were already spent the balance stops at zero, never negative. `available` is
 * the child's spendable balance now (from `balanceFor`). Returns the events and how many coins did not come back.
 */
export function untickTask(actor: MemberId, d: { eventId: string; coins: number; status: string }, memberId: MemberId, available: number, now = Date.now()): { events: AppEvent[]; shortBy: number } {
  const events: AppEvent[] = [ev(actor, { type: 'void', targetId: d.eventId }, now)]
  if (d.status !== 'approved' || d.coins <= 0) return { events, shortBy: 0 }
  // Voiding removes all `coins`; if the balance cannot cover that, put back the shortfall so it lands on zero.
  const shortBy = Math.max(0, d.coins - Math.max(0, available))
  if (shortBy > 0) events.push(ev(actor, { type: 'coins', memberId, delta: shortBy, reason: 'Coins already spent (un-ticked task)' }, now + 1))
  return { events, shortBy }
}

/**
 * Mark a piece of homework "not needed". It pays nothing. If it had been ticked: coins still waiting for a check are cancelled,
 * and approved coins are taken back (as a negative adjustment, so the history still shows what happened) as far as the balance
 * allows, never below zero.
 */
export function dropHomework(
  actor: MemberId,
  task: TaskEvent,
  done: { eventId: string; coins: number; status: string } | undefined,
  available: number,
  why?: string,
  now = Date.now(),
): { events: AppEvent[]; takenBack: number; shortBy: number } {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = task
  const events: AppEvent[] = [ev(actor, { type: 'task', ...rest, dropped: { by: actor, at: now, why: why?.trim() || undefined } }, now)]
  let takenBack = 0
  let shortBy = 0
  if (done && done.status === 'pending') events.push(ev(actor, { type: 'void', targetId: done.eventId }, now + 1))
  else if (done && done.status === 'approved' && done.coins > 0) {
    takenBack = takeBackAmount(done, available)
    shortBy = done.coins - takenBack
    if (takenBack > 0) events.push(ev(actor, { type: 'coins', memberId: task.assignee, delta: -takenBack, reason: `Homework not needed: ${task.title}` }, now + 1))
  }
  return { events, takenBack, shortBy }
}

export function restoreHomework(actor: MemberId, task: TaskEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, dropped: _d, ...rest } = task
  return [ev(actor, { type: 'task', ...rest }, now)]
}

export function undo(actor: MemberId, targetId: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'void', targetId }, now)]
}

// ------------------------------------------------------------------------ timers

export interface StartTimer {
  memberId: MemberId
  label: string
  plannedSec?: number
  taskId?: string
  taskDate?: Ymd | 'any'
  purpose?: TimerEvent['purpose']
  subjectId?: MemberId
  side?: 'L' | 'R'
}

export function startTimer(actor: MemberId, t: StartTimer, now = Date.now()): { timerId: string; events: AppEvent[] } {
  const timerId = uid('tm')
  return { timerId, events: [ev(actor, { type: 'timer', timerId, action: 'start', ...t }, now)] }
}

export const pauseTimer = (actor: MemberId, timerId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'timer', timerId, action: 'pause' }, now)]
export const resumeTimer = (actor: MemberId, timerId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'timer', timerId, action: 'resume' }, now)]
export const extendTimer = (actor: MemberId, timerId: string, sec: number, now = Date.now()): AppEvent[] => [ev(actor, { type: 'timer', timerId, action: 'extend', sec }, now)]
export const cancelTimer = (actor: MemberId, timerId: string, now = Date.now()): AppEvent[] => [ev(actor, { type: 'timer', timerId, action: 'stop', outcome: 'cancelled' }, now)]

/**
 * Stop a timer for good. Depending on what it was for, this also does the paperwork:
 *  - focus timer linked to a task: ticks the task off (with the minutes it really took)
 *  - walk timer: logs the walk
 *  - sleep timer: logs the sleep
 *  - breastfeed timer: logs the feed with side and minutes
 */
export function finishTimer(actor: MemberId, f: FamilyState, timerId: string, elapsedMs: number, opts: { markDone?: boolean } = {}, now = Date.now()): AppEvent[] {
  const t = f.timers[timerId]
  // Timers are shared: if another phone already finished or cancelled this one, do nothing (no second log, no second payout).
  if (t && t.status !== 'running' && t.status !== 'paused') return []
  const out: AppEvent[] = [ev(actor, { type: 'timer', timerId, action: 'stop', outcome: 'done' }, now)]
  if (!t) return out
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000))
  const startedAt = now - elapsedMs
  if (t.purpose === 'focus' && t.taskId && opts.markDone !== false) {
    const task = f.tasks[t.taskId]
    if (task) out.push(...completeTask(actor, f, task, t.taskDate ?? task.date ?? 'any', { minutes }, now))
  } else if (t.purpose === 'walk' && t.subjectId) out.push(...logPet(actor, f, { petId: t.subjectId, kind: 'walk', at: startedAt, minutes }, now))
  else if (t.purpose === 'sleep' && t.subjectId) out.push(...logBaby(actor, { babyId: t.subjectId, kind: 'sleep', at: startedAt, endAt: now }, now))
  else if (t.purpose === 'feed' && t.subjectId) out.push(...logBaby(actor, { babyId: t.subjectId, kind: 'feed', at: startedAt, feed: { method: 'breast', side: t.side, minutes } }, now))
  return out
}

// ---------------------------------------------------------------------- trackers

export type PetDraft = Omit<PetEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'>
export type BabyDraft = Omit<BabyEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'>

/** Log a dog action. If someone has a task like "Walk Alfie" today, logging the walk ticks it off too. */
export function logPet(actor: MemberId, f: FamilyState, d: PetDraft, now = Date.now()): AppEvent[] {
  const out: AppEvent[] = [ev(actor, { type: 'pet', ...d }, now)]
  const today = ymdOf(d.at)
  for (const t of Object.values(f.tasks)) {
    if (t.deleted || !t.petLink || t.petLink.petId !== d.petId || t.petLink.kind !== d.kind || t.assignee !== actor) continue
    const key = `${t.taskId}|${t.recur ? today : (t.date ?? 'any')}`
    if (f.done[key]) continue
    // A repeating task only counts on the days it actually happens (not on a skipped or off day).
    if (t.recur && (!t.date || !occursOn(t.recur, t.date, today) || (t.exdates ?? []).includes(today))) continue
    if (t.recur ? true : !t.date || t.date <= today) out.push(...completeTask(actor, f, t, t.recur ? today : (t.date ?? 'any'), { minutes: d.minutes }, now))
  }
  return out
}

export const logBaby = (actor: MemberId, d: BabyDraft, now = Date.now()): AppEvent[] => [ev(actor, { type: 'baby', ...d }, now)]

/** Correct a logged baby entry's time (and, for a feed or sleep, its duration) by voiding the old one and logging a
 * fresh copy with the changed fields - everything else about the entry carries over unchanged. Used both for a
 * parent fixing a mistake and for correcting an auto-closed feed run's guessed time (see careActions.ts's
 * autoCloseFeedRun) once they realise what actually happened. */
export function editBaby(actor: MemberId, existing: BabyEvent, patch: Partial<BabyDraft>, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId, v: _v, type: _t, ...rest } = existing
  // The corrected copy is logged by whoever edits it, so keep crediting the person who did it (a voice entry nobody has claimed stays unclaimed).
  const by = existing.by ?? (existing.voice ? undefined : learnerId)
  return [ev(actor, { type: 'void', targetId: existing.id }, now), ev(actor, { type: 'baby', ...rest, ...(by ? { by } : {}), ...patch }, now + 1)]
}

/** Same idea as editBaby, for a dog log entry. */
export function editPet(actor: MemberId, existing: PetEvent, patch: Partial<PetDraft>, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'void', targetId: existing.id }, now), ev(actor, { type: 'pet', ...rest, ...patch }, now + 1)]
}

/** Convenience: when did this last happen, so a caller can warn about a double entry. */
export const lastPetAt = (f: FamilyState, petId: MemberId, kind: PetEvent['kind']): number | undefined => petLogs(f, petId).find((l) => l.kind === kind)?.at

// ------------------------------------------------------------------ family plans

export function proposeIdea(
  actor: MemberId,
  d: Omit<IdeaEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'ideaId' | 'status'> & { ideaId?: string; status?: IdeaEvent['status'] },
  now = Date.now(),
): AppEvent[] {
  const { ideaId, status, ...rest } = d
  return [ev(actor, { type: 'idea', ideaId: ideaId ?? uid('i'), status: status ?? 'open', ...rest }, now)]
}

export const castVote = (actor: MemberId, ideaId: string, vote: VoteValue, now = Date.now()): AppEvent[] => [ev(actor, { type: 'vote', ideaId, vote }, now)]

export function updateIdea(
  actor: MemberId,
  existing: FamilyState['ideas'][string],
  patch: Partial<Pick<IdeaEvent, 'status' | 'title' | 'notes' | 'cost' | 'when' | 'calId'>>,
  now = Date.now(),
): AppEvent[] {
  return [
    ev(
      actor,
      {
        type: 'idea',
        ideaId: existing.id,
        title: existing.title,
        kind: existing.kind,
        emoji: existing.emoji,
        notes: existing.notes,
        cost: existing.cost,
        status: existing.status,
        calId: existing.calId,
        when: existing.when,
        ...patch,
      },
      now,
    ),
  ]
}

/** The family agrees: put the winning idea on the calendar for everyone and mark it planned. */
export function planIdea(actor: MemberId, existing: FamilyState['ideas'][string], when: { date: Ymd; start?: string; end?: string }, now = Date.now()): AppEvent[] {
  const calId = existing.calId ?? uid('c')
  const timed = !!when.start
  const cal = ev(
    actor,
    {
      type: 'cal',
      calId,
      title: `${existing.emoji ? `${existing.emoji} ` : ''}${existing.title}`,
      date: when.date,
      allDay: !timed,
      start: when.start,
      end: when.end,
      members: [],
      everyone: true,
      category: existing.kind === 'dinner' ? 'meal' : 'family',
      busy: timed,
      notes: existing.notes,
    },
    now,
  )
  return [cal, ...updateIdea(actor, existing, { status: 'planned', calId, when }, now + 1)]
}

// -------------------------------------------------------------------- coins/shop

export function saveTreat(actor: MemberId, t: Omit<TreatEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'treatId'> & { treatId?: string }, now = Date.now()): AppEvent[] {
  const { treatId, ...rest } = t
  return [ev(actor, { type: 'treat', treatId: treatId ?? uid('tr'), ...rest }, now)]
}

export function redeemTreat(actor: MemberId, memberId: MemberId, t: { id: string; title: string; emoji: string; cost: number }, now = Date.now()): { redeemId: string; events: AppEvent[] } {
  const redeemId = uid('r')
  return { redeemId, events: [ev(actor, { type: 'redeem', redeemId, treatId: t.id, memberId, title: t.title, emoji: t.emoji, cost: t.cost }, now)] }
}

export const decideRedeem = (actor: MemberId, redeemId: string, status: 'approved' | 'declined' | 'given' | 'cancelled', note?: string, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'redeem-status', redeemId, status, note: note?.trim() || undefined }, now),
]

export const adjustCoins = (actor: MemberId, memberId: MemberId, delta: number, reason: string, now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'coins', memberId, delta, reason: reason.trim() }, now),
]

export function setEconomy(actor: MemberId, s: { effectiveFrom: Ymd; xpPerCoin?: number; dailyCapXp?: number }, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'economy', effectiveFrom: s.effectiveFrom, xpPerCoin: s.xpPerCoin ?? DEFAULT_XP_PER_COIN, dailyCapXp: s.dailyCapXp ?? DEFAULT_DAILY_CAP_XP }, now)]
}

// ------------------------------------------------------------------------ school

export const importSchoolPack = (actor: MemberId, memberId: MemberId, pack: SchoolPack, now = Date.now()): AppEvent[] => [ev(actor, { type: 'school-pack', memberId, pack }, now)]

export const fixSchoolWeek = (actor: MemberId, memberId: MemberId, weekStart: Ymd, week: 'A' | 'B', now = Date.now()): AppEvent[] => [
  ev(actor, { type: 'school-week', memberId, weekStart, week }, now),
]

/**
 * Turn the pack's set homework into tasks on the child's list. Ids are derived from the pack and the homework key, so adding
 * them twice (or from two phones) gives the same event and never a duplicate.
 */
export function addPackHomework(actor: MemberId, f: FamilyState, memberId: MemberId, pack: SchoolPack, now = Date.now()): AppEvent[] {
  const out: AppEvent[] = []
  for (const h of pack.homework) {
    const taskId = `hw-${pack.id}-${h.key}-${memberId}`
    if (f.tasks[taskId]) continue
    out.push(
      ...saveTask(
        actor,
        {
          taskId,
          title: h.title,
          assignee: memberId,
          kind: 'homework',
          part: 'any',
          date: h.due,
          minutes: h.minutes ?? 30,
          subject: h.subject,
          teacher: h.teacher,
          notes: h.notes,
          source: `school:${pack.id}:${h.key}`,
        },
        tsOf(pack.generatedOn, '12:00'),
        `seed-${taskId}`,
      ),
    )
  }
  void now
  return out
}

/** Record the after-school "any homework?" check-in for one child and day: which of that day's subjects set nothing,
 * and how many pieces were added. Upsert by child and date, so answering again just replaces it. */
export function homeworkCheckin(actor: MemberId, f: FamilyState, memberId: MemberId, date: Ymd, none: string[], added: number, now = Date.now()): AppEvent[] {
  const prev = f.hwCheckins[`${memberId}|${date}`]
  const merged = [...new Set([...(prev?.none ?? []), ...none])]
  return [ev(actor, { type: 'homework-checkin', memberId, date, none: merged, added: (prev?.added ?? 0) + added }, now)]
}

/** Set (or clear) the day a piece of homework is planned for, leaving everything else about it as it is. */
export function planHomework(actor: MemberId, existing: TaskEvent, doOn: Ymd | undefined, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'task', ...rest, doOn }, now)]
}

/** "No homework was set for this subject" from the weekly nudge, outside the after-school check-in. Merged into that
 * day's record, which stays partial (so the full check-in still shows) unless the full one was already done. */
export function markNoHomework(actor: MemberId, f: FamilyState, memberId: MemberId, date: Ymd, subject: string, now = Date.now()): AppEvent[] {
  const prev = f.hwCheckins[`${memberId}|${date}`]
  const none = [...new Set([...(prev?.none ?? []), subject])]
  return [ev(actor, { type: 'homework-checkin', memberId, date, none, added: prev?.added ?? 0, partial: prev ? prev.partial : true }, now)]
}

// ------------------------------------------------------------------------ comments (calendar events / tasks)

/** A comment thread scoped strictly to one target (a calendar event or task id) — never shown anywhere else. */
export function addComment(actor: MemberId, targetId: string, text: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'comment', commentId: uid('cm'), targetId, text: text.trim() }, now)]
}

export function editComment(actor: MemberId, commentId: string, targetId: string, text: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'comment', commentId, targetId, text: text.trim() }, now)]
}

export function deleteComment(actor: MemberId, commentId: string, targetId: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'comment', commentId, targetId, text: '', deleted: true }, now)]
}

// ------------------------------------------------------------------------ weekly summit

/** Marks the guided weekly planning session done for the given ISO week key (e.g. '2026-W39'). */
export function completeSummit(actor: MemberId, weekKey: string, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'summit', weekKey }, now)]
}

// ------------------------------------------------------------------------ scheduled brain dumps

export function saveDumpPromptSetting(actor: MemberId, memberId: MemberId, enabled: boolean, time: Hm, lastSeen?: Ymd, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'dump-prompt-setting', memberId, enabled, time, lastSeen }, now)]
}

/** Records that today's end-of-day prompt was shown (and dismissed or acted on), so it doesn't repeat today. */
export function markDumpPromptSeen(actor: MemberId, f: FamilyState, memberId: MemberId, date: Ymd, now = Date.now()): AppEvent[] {
  const cur = f.dumpPromptSettings[memberId]
  return [ev(actor, { type: 'dump-prompt-setting', memberId, enabled: cur?.enabled ?? true, time: cur?.time ?? '20:00', lastSeen: date }, now)]
}

// ------------------------------------------------------------------------ daily trivia

/** Logs today's trivia card as done for a member, paying a small fixed reward once per day. */
export function completeTrivia(actor: MemberId, memberId: MemberId, date: Ymd, coins: number, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'trivia-done', memberId, date, coins }, now)]
}

// ------------------------------------------------------------------------ family crowdfunding goals

export type CoinGoalDraft = Omit<CoinGoalEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'goalId'> & { goalId?: string }

export function saveCoinGoal(actor: MemberId, g: CoinGoalDraft, now = Date.now()): AppEvent[] {
  const { goalId, ...rest } = g
  return [ev(actor, { type: 'coin-goal', goalId: goalId ?? uid('goal'), ...rest }, now)]
}

export function deleteCoinGoal(actor: MemberId, existing: CoinGoalEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'coin-goal', ...rest, deleted: true }, now)]
}

/** A member gives some of their own available coins to a shared goal. Immediate — no parent approval, since it's
 * spending their own balance on something they chose, same as a treat. */
export function giftToCoinGoal(actor: MemberId, goalId: string, coins: number, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'coin-goal-gift', giftId: uid('gift'), goalId, coins }, now)]
}

// ------------------------------------------------------------------------ co-parenting (shared child, separate households)

export type CoparentLinkDraft = Omit<CoparentLinkEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v' | 'linkId' | 'linkKey'> & {
  linkId?: string
  /** Only needed when creating a brand-new link; an existing link keeps its key. */
  linkKey?: string
}

export function saveCoparentLink(actor: MemberId, d: CoparentLinkDraft, now = Date.now()): AppEvent[] {
  const { linkId, linkKey, ...rest } = d
  return [ev(actor, { type: 'coparent-link', linkId: linkId ?? uid('cl'), linkKey: linkKey ?? newLinkKey(), ...rest }, now)]
}

export function deleteCoparentLink(actor: MemberId, existing: CoparentLinkEvent, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, ...rest } = existing
  return [ev(actor, { type: 'coparent-link', ...rest, deleted: true }, now)]
}

const newLinkKey = (): string => {
  const arr = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr)
  else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
  return [...arr]
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}

// ------------------------------------------------------------------------ night/day care shifts

export type ShiftPlanDraft = Omit<ShiftPlanEvent, 'type' | 'id' | 'ts' | 'day' | 'learnerId' | 'v'>

/** Save (or re-save) a week's day/night shift plan - upsert by babyId+weekOf, latest wins, same convention as
 * saveCoparentLink. Used both to store a freshly proposed plan (confirmed: false, from shifts.ts's
 * proposeShiftPlan) and, once a parent accepts it or edits it first, to save it again with confirmed: true. */
export function saveShiftPlan(actor: MemberId, d: ShiftPlanDraft, now = Date.now()): AppEvent[] {
  return [ev(actor, { type: 'shift-plan', ...d }, now)]
}
