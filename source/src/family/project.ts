import type { AppEvent } from '@/engine/types'
import { validatePack } from './school/school'
import { applyTravelEvent, isTravelEvent } from './travel/fold'
import { emptyTravel } from './travel/types'
import type { FamilyState, Redeem, TaskDone, TimerState } from './types'

export function emptyFamily(): FamilyState {
  return {
    name: 'Our family',
    members: {},
    cal: {},
    help: {},
    calOverrides: {},
    tasks: {},
    done: {},
    timers: {},
    ideas: {},
    votes: {},
    pets: [],
    babies: [],
    petStock: {},
    medRules: {},
    milkStock: [],
    vault: {},
    feedRuns: {},
    voided: {},
    doneByEvent: {},
    heldChecks: {},
    heldRedeems: {},
    treats: {},
    redeems: {},
    adjusts: [],
    economy: [],
    routines: {},
    runs: {},
    dump: {},
    projects: {},
    activities: {},
    activityTicks: {},
    plants: {},
    plantWaters: {},
    houseRooms: {},
    houseJobs: {},
    houseTypes: {},
    houseRuns: {},
    habits: {},
    habitDone: {},
    checkins: {},
    checkinConfig: {},
    routinePlans: {},
    keyCopies: {},
    recipes: {},
    meals: {},
    mealRatings: {},
    shopLists: {},
    shopItems: {},
    shopHistory: {},
    schools: {},
    weekFix: {},
    comments: {},
    summits: {},
    weekFocus: {},
    dumpPromptSettings: {},
    calmPauses: {},
    announced: {},
    announcers: {},
    triviaDone: {},
    goals: {},
    goalGifts: [],
    coparentLinks: {},
    shiftPlans: {},
    hwCheckins: {},
    travel: emptyTravel(),
    eventCount: 0,
  }
}

const closeSegment = (t: TimerState, ts: number): TimerState => {
  const segs = t.segments.map((s, i) => (i === t.segments.length - 1 && s.to == null ? { from: s.from, to: Math.max(s.from, ts) } : s))
  return { ...t, segments: segs }
}

/**
 * Fold ONE event into the family state. Pure: returns a new object (sharing untouched parts).
 * Learning events (attempt, session...) are ignored here; they belong to the learner projection.
 */
export function applyFamilyEvent(prev: FamilyState, ev: AppEvent): FamilyState {
  switch (ev.type) {
    case 'member': {
      const old = prev.members[ev.memberId]
      return {
        ...prev,
        eventCount: prev.eventCount + 1,
        members: {
          ...prev.members,
          [ev.memberId]: {
            id: ev.memberId,
            name: ev.name,
            role: ev.role,
            colour: ev.colour,
            emoji: ev.emoji,
            active: ev.active,
            birthday: ev.birthday,
            dueDate: ev.dueDate,
            dayOne: ev.dayOne,
            petKind: ev.petKind,
            petPlan: ev.petPlan,
            looksAfter: ev.looksAfter,
            createdTs: old?.createdTs ?? ev.ts,
          },
        },
      }
    }
    case 'cal':
      return { ...prev, eventCount: prev.eventCount + 1, cal: { ...prev.cal, [ev.calId]: ev } }
    case 'cal-override':
      return { ...prev, eventCount: prev.eventCount + 1, calOverrides: { ...prev.calOverrides, [ev.itemKey]: ev } }
    case 'help': {
      const key = `${ev.calId}|${ev.date}`
      const cur = prev.help[key] ?? []
      const next = ev.offer ? (cur.includes(ev.learnerId) ? cur : [...cur, ev.learnerId]) : cur.filter((m) => m !== ev.learnerId)
      return { ...prev, eventCount: prev.eventCount + 1, help: { ...prev.help, [key]: next } }
    }
    case 'task': {
      // Moving the due date of a one-off that is already done must not let it be done (and paid) a second time.
      let done = prev.done
      const old = prev.tasks[ev.taskId]
      if (old && !old.recur && !ev.recur && (old.date ?? 'any') !== (ev.date ?? 'any')) {
        const from = `${ev.taskId}|${old.date ?? 'any'}`
        const to = `${ev.taskId}|${ev.date ?? 'any'}`
        const d = prev.done[from]
        if (d && !prev.done[to]) {
          done = { ...prev.done, [to]: { ...d, date: ev.date ?? 'any' } }
          delete done[from]
        }
      }
      return { ...prev, eventCount: prev.eventCount + 1, tasks: { ...prev.tasks, [ev.taskId]: ev }, done }
    }
    case 'task-done': {
      if (prev.voided[ev.id]) return { ...prev, eventCount: prev.eventCount + 1 }
      const key = `${ev.taskId}|${ev.date}`
      const held = prev.heldChecks[key]
      let heldChecks = prev.heldChecks
      const entry: TaskDone = {
        eventId: ev.id,
        taskId: ev.taskId,
        date: ev.date,
        by: ev.learnerId,
        ts: ev.ts,
        coins: ev.coins,
        minutes: ev.minutes,
        needsCheck: ev.needsCheck,
        status: ev.needsCheck ? 'pending' : 'approved',
        payee: ev.payee,
      }
      if (held) {
        // A parent's decision that sorted before this tick (their phone clock was behind): apply it now.
        Object.assign(entry, { status: held.decision, checkedBy: held.by, checkNote: held.note, checkTs: held.ts })
        heldChecks = { ...prev.heldChecks }
        delete heldChecks[key]
      }
      return { ...prev, eventCount: prev.eventCount + 1, done: { ...prev.done, [key]: entry }, doneByEvent: { ...prev.doneByEvent, [ev.id]: key }, heldChecks }
    }
    case 'task-check': {
      const key = `${ev.taskId}|${ev.date}`
      const d = prev.done[key]
      if (!d) return { ...prev, eventCount: prev.eventCount + 1, heldChecks: { ...prev.heldChecks, [key]: { decision: ev.decision, note: ev.note, by: ev.learnerId, ts: ev.ts } } }
      return {
        ...prev,
        eventCount: prev.eventCount + 1,
        done: { ...prev.done, [key]: { ...d, status: ev.decision, checkedBy: ev.learnerId, checkNote: ev.note, checkTs: ev.ts } },
      }
    }
    case 'timer': {
      const cur = prev.timers[ev.timerId]
      let next: TimerState | undefined
      if (ev.action === 'start') {
        if (cur) return { ...prev, eventCount: prev.eventCount + 1 }
        next = {
          id: ev.timerId,
          memberId: ev.memberId ?? ev.learnerId,
          label: ev.label ?? 'Timer',
          plannedSec: ev.plannedSec ?? 0,
          extraSec: 0,
          taskId: ev.taskId,
          taskDate: ev.taskDate,
          purpose: ev.purpose ?? 'focus',
          subjectId: ev.subjectId,
          side: ev.side,
          startedTs: ev.ts,
          segments: [{ from: ev.ts }],
          status: 'running',
          startedBy: ev.learnerId,
        }
      } else if (cur) {
        if (ev.action === 'pause' && cur.status === 'running') next = { ...closeSegment(cur, ev.ts), status: 'paused' }
        else if (ev.action === 'resume' && cur.status === 'paused') next = { ...cur, segments: [...cur.segments, { from: ev.ts }], status: 'running' }
        else if (ev.action === 'extend') next = { ...cur, extraSec: cur.extraSec + Math.max(0, ev.sec ?? 0) }
        else if (ev.action === 'stop' && (cur.status === 'running' || cur.status === 'paused'))
          next = { ...closeSegment(cur, ev.ts), status: ev.outcome === 'cancelled' ? 'cancelled' : 'done', endedTs: ev.ts }
      }
      if (!next) return { ...prev, eventCount: prev.eventCount + 1 }
      return { ...prev, eventCount: prev.eventCount + 1, timers: { ...prev.timers, [ev.timerId]: next } }
    }
    case 'idea': {
      const old = prev.ideas[ev.ideaId]
      return {
        ...prev,
        eventCount: prev.eventCount + 1,
        ideas: {
          ...prev.ideas,
          [ev.ideaId]: {
            id: ev.ideaId,
            title: ev.title,
            kind: ev.kind,
            emoji: ev.emoji,
            notes: ev.notes,
            cost: ev.cost,
            status: ev.status,
            calId: ev.calId,
            when: ev.when,
            proposedBy: old?.proposedBy ?? ev.learnerId,
            createdTs: old?.createdTs ?? ev.ts,
            updatedTs: ev.ts,
          },
        },
      }
    }
    case 'vote': {
      const key = `${ev.ideaId}|${ev.learnerId}`
      const votes = { ...prev.votes }
      if (ev.vote === 'clear') delete votes[key]
      else votes[key] = ev.vote
      return { ...prev, eventCount: prev.eventCount + 1, votes }
    }
    case 'pet':
      return { ...prev, eventCount: prev.eventCount + 1, pets: [...prev.pets, ev] }
    case 'baby':
      return { ...prev, eventCount: prev.eventCount + 1, babies: [...prev.babies, ev] }
    case 'pet-stock':
      return { ...prev, eventCount: prev.eventCount + 1, petStock: { ...prev.petStock, [ev.stockId]: ev } }
    case 'med-rule':
      return { ...prev, eventCount: prev.eventCount + 1, medRules: { ...prev.medRules, [ev.name.toLowerCase()]: ev } }
    case 'milk-stock':
      return { ...prev, eventCount: prev.eventCount + 1, milkStock: [...prev.milkStock, ev] }
    case 'vault':
      return { ...prev, eventCount: prev.eventCount + 1, vault: { ...prev.vault, [ev.itemId]: ev } }
    case 'feedrun':
      return { ...prev, eventCount: prev.eventCount + 1, feedRuns: { ...prev.feedRuns, [ev.feedRunId]: [...(prev.feedRuns[ev.feedRunId] ?? []), ev] } }
    case 'comment':
      return { ...prev, eventCount: prev.eventCount + 1, comments: { ...prev.comments, [ev.commentId]: ev } }
    case 'summit':
      return { ...prev, eventCount: prev.eventCount + 1, summits: { ...prev.summits, [ev.weekKey]: ev } }
    case 'week-focus':
      return { ...prev, eventCount: prev.eventCount + 1, weekFocus: { ...prev.weekFocus, [ev.weekOf]: ev } }
    case 'dump-prompt-setting':
      return { ...prev, eventCount: prev.eventCount + 1, dumpPromptSettings: { ...prev.dumpPromptSettings, [ev.memberId]: ev } }
    case 'calm-pause':
      return { ...prev, eventCount: prev.eventCount + 1, calmPauses: { ...prev.calmPauses, [ev.memberId]: ev } }
    case 'task-announced':
      // The first read-out counts: a second device (or the server) that got there a moment later doesn't replace it.
      if (typeof ev.key !== 'string' || prev.announced[ev.key]) return prev
      return { ...prev, eventCount: prev.eventCount + 1, announced: { ...prev.announced, [ev.key]: ev } }
    case 'announcer': {
      if (typeof ev.deviceId !== 'string') return prev
      const old = prev.announcers[ev.deviceId]
      if (old && old.ts > ev.ts) return prev
      return { ...prev, eventCount: prev.eventCount + 1, announcers: { ...prev.announcers, [ev.deviceId]: { ...ev, name: String(ev.name ?? '').slice(0, 40) || 'A device' } } }
    }
    case 'habit':
      return { ...prev, eventCount: prev.eventCount + 1, habits: { ...prev.habits, [ev.habitId]: ev } }
    case 'habit-done':
      return { ...prev, eventCount: prev.eventCount + 1, habitDone: { ...prev.habitDone, [ev.habitId]: [...(prev.habitDone[ev.habitId] ?? []), ev] } }
    case 'checkin':
      return { ...prev, eventCount: prev.eventCount + 1, checkins: { ...prev.checkins, [`${ev.memberId}|${ev.date}|${ev.part}`]: ev } }
    case 'checkin-config':
      return { ...prev, eventCount: prev.eventCount + 1, checkinConfig: { ...prev.checkinConfig, [ev.memberId]: ev } }
    case 'voice-config':
      return { ...prev, eventCount: prev.eventCount + 1, voice: ev }
    case 'key-copy':
      return { ...prev, eventCount: prev.eventCount + 1, keyCopies: { ...prev.keyCopies, [`${ev.memberId}|${ev.holder}`]: ev } }
    case 'routine-plan':
      return { ...prev, eventCount: prev.eventCount + 1, routinePlans: { ...prev.routinePlans, [ev.memberId]: ev } }
    case 'trivia-done':
      return { ...prev, eventCount: prev.eventCount + 1, triviaDone: { ...prev.triviaDone, [`${ev.memberId}|${ev.date}`]: ev } }
    case 'coin-goal':
      return { ...prev, eventCount: prev.eventCount + 1, goals: { ...prev.goals, [ev.goalId]: ev } }
    case 'coin-goal-gift':
      return { ...prev, eventCount: prev.eventCount + 1, goalGifts: [...prev.goalGifts, ev] }
    case 'coparent-link':
      return { ...prev, eventCount: prev.eventCount + 1, coparentLinks: { ...prev.coparentLinks, [ev.linkId]: ev } }
    case 'homework-checkin':
      return { ...prev, eventCount: prev.eventCount + 1, hwCheckins: { ...prev.hwCheckins, [`${ev.memberId}|${ev.date}`]: ev } }
    case 'shift-plan':
      return { ...prev, eventCount: prev.eventCount + 1, shiftPlans: { ...prev.shiftPlans, [`${ev.babyId}|${ev.weekOf}`]: ev } }
    case 'void': {
      const voided = { ...prev.voided, [ev.targetId]: true as const }
      let done = prev.done
      // Undoing any phone's tick of a task clears the completion, even if another phone's tick is the one now shown.
      const k = prev.doneByEvent[ev.targetId]
      if (k && prev.done[k]) {
        done = { ...prev.done }
        delete done[k]
      }
      return { ...prev, eventCount: prev.eventCount + 1, voided, done }
    }
    case 'treat':
      return {
        ...prev,
        eventCount: prev.eventCount + 1,
        treats: {
          ...prev.treats,
          [ev.treatId]: {
            id: ev.treatId,
            title: ev.title,
            cost: ev.cost,
            emoji: ev.emoji,
            blurb: ev.blurb,
            forMembers: ev.forMembers ?? [],
            maxPerWeek: ev.maxPerWeek,
            active: ev.active,
            deleted: !!ev.deleted,
          },
        },
      }
    case 'redeem': {
      let r: Redeem = { id: ev.redeemId, treatId: ev.treatId, memberId: ev.memberId, title: ev.title, emoji: ev.emoji, cost: ev.cost, ts: ev.ts, status: 'pending' }
      const held = prev.heldRedeems[ev.redeemId]
      let heldRedeems = prev.heldRedeems
      if (held) {
        // Parent decisions that sorted before the request (their phone clock was behind).
        for (const h of [...held].sort((a, b) => a.ts - b.ts)) {
          if (r.status === 'given') break
          if (h.status === 'cancelled' && r.status !== 'pending') continue
          r = { ...r, status: h.status, note: h.note, decidedTs: h.ts, decidedBy: h.by }
        }
        heldRedeems = { ...prev.heldRedeems }
        delete heldRedeems[ev.redeemId]
      }
      return { ...prev, eventCount: prev.eventCount + 1, redeems: { ...prev.redeems, [ev.redeemId]: r }, heldRedeems }
    }
    case 'redeem-status': {
      const r = prev.redeems[ev.redeemId]
      if (!r) {
        const cur = prev.heldRedeems[ev.redeemId] ?? []
        return { ...prev, eventCount: prev.eventCount + 1, heldRedeems: { ...prev.heldRedeems, [ev.redeemId]: [...cur, { status: ev.status, note: ev.note, by: ev.learnerId, ts: ev.ts }] } }
      }
      if (r.status === 'given') return { ...prev, eventCount: prev.eventCount + 1 }
      // A child's late "cancel" must not undo a parent's approval (that would refund coins that were already spent).
      if (ev.status === 'cancelled' && r.status !== 'pending') return { ...prev, eventCount: prev.eventCount + 1 }
      return { ...prev, eventCount: prev.eventCount + 1, redeems: { ...prev.redeems, [ev.redeemId]: { ...r, status: ev.status, note: ev.note, decidedTs: ev.ts, decidedBy: ev.learnerId } } }
    }
    case 'coins':
      return { ...prev, eventCount: prev.eventCount + 1, adjusts: [...prev.adjusts, { id: ev.id, memberId: ev.memberId, delta: ev.delta, reason: ev.reason, ts: ev.ts, by: ev.learnerId }] }
    case 'economy': {
      const rest = prev.economy.filter((e) => e.effectiveFrom !== ev.effectiveFrom)
      const economy = [...rest, { effectiveFrom: ev.effectiveFrom, xpPerCoin: ev.xpPerCoin, dailyCapXp: ev.dailyCapXp }].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
      return { ...prev, eventCount: prev.eventCount + 1, economy }
    }
    case 'routine':
      return { ...prev, eventCount: prev.eventCount + 1, routines: { ...prev.routines, [ev.routineId]: ev } }
    case 'run':
      return { ...prev, eventCount: prev.eventCount + 1, runs: { ...prev.runs, [ev.runId]: [...(prev.runs[ev.runId] ?? []), ev] } }
    case 'dump':
      return { ...prev, eventCount: prev.eventCount + 1, dump: { ...prev.dump, [ev.itemId]: ev } }
    case 'project':
      return { ...prev, eventCount: prev.eventCount + 1, projects: { ...prev.projects, [ev.projectId]: ev } }
    case 'activity':
      return { ...prev, eventCount: prev.eventCount + 1, activities: { ...prev.activities, [ev.activityId]: ev } }
    case 'activity-tick':
      return { ...prev, eventCount: prev.eventCount + 1, activityTicks: { ...prev.activityTicks, [ev.activityId]: [...(prev.activityTicks[ev.activityId] ?? []), ev] } }
    case 'house-room':
      return { ...prev, eventCount: prev.eventCount + 1, houseRooms: { ...prev.houseRooms, [ev.roomId]: ev } }
    case 'house-job':
      return { ...prev, eventCount: prev.eventCount + 1, houseJobs: { ...prev.houseJobs, [ev.jobId]: ev } }
    case 'house-type':
      return { ...prev, eventCount: prev.eventCount + 1, houseTypes: { ...prev.houseTypes, [ev.typeId]: ev } }
    case 'house-config':
      return { ...prev, eventCount: prev.eventCount + 1, houseConfig: ev }
    case 'house-run':
      return { ...prev, eventCount: prev.eventCount + 1, houseRuns: { ...prev.houseRuns, [ev.runId]: [...(prev.houseRuns[ev.runId] ?? []), ev] } }
    case 'plant':
      return { ...prev, eventCount: prev.eventCount + 1, plants: { ...prev.plants, [ev.plantId]: ev } }
    case 'plant-water':
      return { ...prev, eventCount: prev.eventCount + 1, plantWaters: { ...prev.plantWaters, [ev.plantId]: [...(prev.plantWaters[ev.plantId] ?? []), ev] } }
    case 'recipe':
      return { ...prev, eventCount: prev.eventCount + 1, recipes: { ...prev.recipes, [ev.recipeId]: ev } }
    case 'meal':
      return { ...prev, eventCount: prev.eventCount + 1, meals: { ...prev.meals, [ev.planId]: ev } }
    case 'meal-times':
      return { ...prev, eventCount: prev.eventCount + 1, mealTimes: ev }
    case 'meal-rating':
      return { ...prev, eventCount: prev.eventCount + 1, mealRatings: { ...prev.mealRatings, [`${ev.memberId}|${ev.planId}`]: ev } }
    case 'shop-list':
      return { ...prev, eventCount: prev.eventCount + 1, shopLists: { ...prev.shopLists, [ev.listId]: ev } }
    case 'shop-item': {
      const key = ev.name.trim().toLowerCase()
      const isNew = !prev.shopItems[ev.itemId]
      const h = prev.shopHistory[key]
      // Counting only the first time an item appears means ticking or editing it never inflates the "usuals".
      const shopHistory =
        isNew && !ev.deleted
          ? { ...prev.shopHistory, [key]: { name: h?.name ?? ev.name.trim(), aisle: ev.aisle, unit: ev.unit ?? h?.unit, count: (h?.count ?? 0) + 1, lastTs: ev.ts } }
          : prev.shopHistory
      return { ...prev, eventCount: prev.eventCount + 1, shopItems: { ...prev.shopItems, [ev.itemId]: ev }, shopHistory }
    }
    case 'school-pack':
      // A malformed pack (pasted by hand on some phone) is ignored everywhere rather than crashing every phone.
      if (validatePack(ev.pack)) return { ...prev, eventCount: prev.eventCount + 1 }
      return { ...prev, eventCount: prev.eventCount + 1, schools: { ...prev.schools, [ev.memberId]: ev.pack } }
    case 'school-week':
      return { ...prev, eventCount: prev.eventCount + 1, weekFix: { ...prev.weekFix, [`${ev.memberId}|${ev.weekStart}`]: ev.week } }
    case 'family':
      return { ...prev, eventCount: prev.eventCount + 1, name: ev.name }
    default:
      if (isTravelEvent(ev)) return { ...prev, eventCount: prev.eventCount + 1, travel: applyTravelEvent(prev.travel, ev) }
      return prev
  }
}

/** Replay a full event list (sorted by ts, then id, so every device converges). */
export function projectFamily(events: AppEvent[]): FamilyState {
  const sorted = [...events].sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1))
  let st = emptyFamily()
  for (const e of sorted) st = applyFamilyEvent(st, e)
  return st
}
