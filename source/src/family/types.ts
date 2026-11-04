/**
 * The family layer's event types and projected state.
 *
 * Same idea as the learning engine: the ONLY source of truth is the append-only event log.
 * Everything below (members, calendar, tasks, trackers, coins, shop...) is a fold over that log,
 * so syncing is still "copy the events the other side hasn't got".
 *
 * Conventions:
 *  - Every event's `learnerId` (from EventBase) is the ACTING MEMBER: whoever tapped the button.
 *  - "Upsert" events (member, cal, task, treat, idea) carry a full copy of the entity; the latest one wins.
 *  - Dates are local calendar days 'YYYY-MM-DD' and times are local wall-clock 'HH:mm'. The family is in one time zone,
 *    so we never convert; that keeps "Thursday 15:05" meaning Thursday 15:05 on every phone.
 *  - Nothing is ever deleted. "Delete" is an upsert with deleted:true, and "undo" is a `void` event.
 */
import type { EventBase } from '@/engine/types'
import type { SchoolPack } from './school/types'
import type { TravelEvent, TravelState, TripSpec } from './travel/types'

export type MemberId = string
export type MemberRole = 'parent' | 'child' | 'baby' | 'pet'
export type Ymd = string // 'YYYY-MM-DD'
export type Hm = string // 'HH:mm'

// ------------------------------------------------------------------ recurrence

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  /** Every N days/weeks/months/years. Default 1. */
  interval?: number
  /** For weekly: 0 = Monday ... 6 = Sunday. Default: the weekday of the first date. */
  byWeekday?: number[]
  /** Only on days the school is open (needs a school pack for the member). */
  schoolDaysOnly?: boolean
  /** Only in school Week A or Week B. */
  schoolWeek?: 'A' | 'B'
  /** Only on days with no school: weekends and school holidays (the opposite of `schoolDaysOnly`). Without a school pack, Saturday and Sunday. */
  offDaysOnly?: boolean
  /** Last date it can happen (inclusive). */
  until?: Ymd
}

// ---------------------------------------------------------------------- events

export interface MemberEvent extends EventBase {
  type: 'member'
  memberId: MemberId
  name: string
  role: MemberRole
  colour: string
  emoji?: string
  active: boolean
  birthday?: Ymd
  dueDate?: Ymd
  dayOne?: Ymd
  /** Pets only. */
  petKind?: string
  petPlan?: { walksPerDay: number; mealsPerDay: number }
  /** Children only: which kinds of care they help with (see looksAfterOf for the default when unset). */
  looksAfter?: CareDuty[]
}

/** What a child can help look after: shows those jobs on their Today and scopes their Care screen. */
export type CareDuty = 'pets' | 'plants' | 'baby'

export type CalCategory = 'family' | 'school' | 'activity' | 'appointment' | 'social' | 'work' | 'meal' | 'other'

export interface CalEvent extends EventBase {
  type: 'cal'
  calId: string
  title: string
  date: Ymd
  /** Multi-day events (holiday, trip). Inclusive. */
  endDate?: Ymd
  allDay: boolean
  start?: Hm
  end?: Hm
  /** Who is involved. Empty + `everyone` = whole family. */
  members: MemberId[]
  everyone?: boolean
  category: CalCategory
  location?: string
  notes?: string
  /** Does this block the people involved (so nobody plans something on top)? Timed events do by default. */
  busy: boolean
  /** "I need a hand": a lift, cover, someone to be there. */
  help?: { note: string }
  recur?: Recurrence
  /** Dates to skip in a repeating series. */
  exdates?: Ymd[]
  /** Set by the household that owns this event to share its full detail (title, notes, location) with a
   * linked co-parent household. Everything else about a shared child's calendar only ever crosses as
   * busy/free (see family/coparent.ts). Meaningless (and ignored) for a member with no active co-parent link. */
  shareDetail?: boolean
  /** How the people involved get there, planned by the home server (see family/travel). */
  trip?: TripSpec
  /** Ring the speakers this many minutes before the start (or, with a trip, before leave-by). */
  alarmMin?: number
  deleted?: boolean
}

/** Someone volunteers (or withdraws) for a "needs help" event on a given day. */
export interface HelpEvent extends EventBase {
  type: 'help'
  calId: string
  date: Ymd
  offer: boolean
}

/**
 * A one-off edit or cancellation laid on top of a school-timetable-derived agenda item (a lesson, club,
 * school-event or closure block) for one specific day - "this Tuesday's maths is moved to the hall" or "PE
 * club is cancelled this week". Nothing about these items syncs live from an external source (the school
 * pack is a manually-imported timetable, not a feed), so there is no reason they should be any less editable
 * than a plain calendar event - this is how that edit is recorded without hand-copying the whole timetable
 * into persisted events. Keyed by the AgendaItem's own `key` (stable per date + source + identity), so it
 * naturally applies to exactly the one occurrence it was made for. The underlying timetable entry is
 * untouched - this only ever affects the one day it names, and "reset to default" is just deleting it.
 */
export interface CalOverrideEvent extends EventBase {
  type: 'cal-override'
  /** The AgendaItem.key this overrides, e.g. `lesson:childId:2026-09-29:3`. */
  itemKey: string
  cancelled?: boolean
  title?: string
  start?: Hm
  end?: Hm
  location?: string
  notes?: string
  /** true once a parent clears the override, back to whatever the timetable/school pack says by default. */
  cleared?: boolean
}

export type TaskKind = 'homework' | 'chore' | 'routine' | 'study' | 'other'
export type DayPart = 'morning' | 'day' | 'afternoon' | 'evening' | 'any'

export interface TaskEvent extends EventBase {
  type: 'task'
  taskId: string
  title: string
  assignee: MemberId
  kind: TaskKind
  part: DayPart
  /** Due date for a one-off; first date for a repeating task. No date = "whenever". */
  date?: Ymd
  time?: Hm
  minutes?: number
  /** Coins earned when it is done (and checked, if a parent has to check). */
  coins: number
  check: 'self' | 'parent'
  recur?: Recurrence
  exdates?: Ymd[]
  subject?: string
  teacher?: string
  notes?: string
  /** Homework: the day the child plans to do it (separate from `date`, the due date). It shows on their list from
   * this day, rather than only in the run-up to the due date. See family/homework.ts for how one is suggested. */
  doOn?: Ymd
  /** Homework: the day it was set (from the school list, or the day it was logged), so "has Science set anything
   * this week?" can be answered. */
  setOn?: Ymd
  /** Where it came from, e.g. 'school:sample-y8:sci-booklet-1'. Used to avoid adding the same thing twice. */
  source?: string
  /** Logging this pet action also ticks the task. */
  petLink?: { petId: MemberId; kind: PetKind }
  /** Homework a parent has marked "not needed" (missed, set in error, no longer wanted). It pays nothing, drops out of every open list,
   * alert and count, and stays here so a school-pack re-import does not add it again. `restoreHomework` clears it. */
  dropped?: { by: MemberId; at: number; why?: string }
  /** Marked by the current assignee as "could use a hand" — shows on other adults' lists until claimed. */
  helpWanted?: boolean
  /** Who held this task just before the current assignee took it over, for "picked up from X" wording. Cleared on the next reassignment. */
  handoffFrom?: MemberId
  deleted?: boolean
}

export interface TaskDoneEvent extends EventBase {
  type: 'task-done'
  taskId: string
  /** Occurrence date; for tasks with no date, 'any'. */
  date: Ymd | 'any'
  coins: number
  minutes?: number
  needsCheck: boolean
  note?: string
  /** Who the coins belong to: the assignee at the moment it was done (so reassigning the task later never moves paid coins). */
  payee?: MemberId
}

export interface TaskCheckEvent extends EventBase {
  type: 'task-check'
  taskId: string
  date: Ymd | 'any'
  decision: 'approved' | 'rejected'
  note?: string
}

export interface TimerEvent extends EventBase {
  type: 'timer'
  timerId: string
  action: 'start' | 'pause' | 'resume' | 'stop' | 'extend'
  /** start */
  memberId?: MemberId
  label?: string
  /** 0 or missing = count up. */
  plannedSec?: number
  taskId?: string
  taskDate?: Ymd | 'any'
  purpose?: 'focus' | 'walk' | 'feed' | 'sleep' | 'other'
  /** The baby or pet this timer is about. */
  subjectId?: MemberId
  side?: 'L' | 'R'
  /** extend */
  sec?: number
  /** stop */
  outcome?: 'done' | 'cancelled'
}

export type IdeaKind = 'dinner' | 'outing' | 'movie' | 'game' | 'treat' | 'other'
export interface IdeaEvent extends EventBase {
  type: 'idea'
  ideaId: string
  title: string
  kind: IdeaKind
  emoji?: string
  notes?: string
  cost?: string
  status: 'open' | 'planned' | 'done' | 'dropped'
  /** Set when the family agrees a time and it goes on the calendar. */
  calId?: string
  when?: { date: Ymd; start?: Hm; end?: Hm }
}

export type VoteValue = 'yes' | 'maybe' | 'no' | 'clear'
export interface VoteEvent extends EventBase {
  type: 'vote'
  ideaId: string
  vote: VoteValue
}

export type PetKind = 'walk' | 'feed' | 'water' | 'toilet' | 'meds' | 'groom' | 'vet' | 'note' | 'treatment' | 'output'
export interface PetEvent extends EventBase {
  type: 'pet'
  petId: MemberId
  kind: PetKind
  /** When it happened (may be earlier than when it was logged). */
  at: number
  minutes?: number
  meal?: 'breakfast' | 'dinner' | 'snack'
  poo?: boolean
  /** Walks: whether the dog weed, so the next person knows if it needs to go out again. */
  wee?: boolean
  note?: string
  /** kind 'treatment': a flea/worming (or similar) dose, e.g. Nexgard. Locks its own button for `cycleDays`. */
  treatment?: { product: string; cycleDays: number }
  /** kind 'output': an out-of-the-ordinary poo or being sick, for the vet. */
  output?: { outputKind: 'diarrhoea' | 'vomit'; firmness?: 1 | 2 | 3 | 4 | 5 }
}

/** A bag or box of food: when it was opened, and roughly how it is used up, so a run-out date can be guessed. */
export interface PetStockEvent extends EventBase {
  type: 'pet-stock'
  stockId: string
  petId: MemberId
  product: string
  /** Size of the bag/box, in grams. */
  weightG: number
  /** Usual amount fed per day, in grams (used to guess the run-out date; editable, defaults from petPlan). */
  dailyG?: number
  openedDate: Ymd
  /** Set once the shopping-list item for the next one has been added, so it is not added twice. */
  reordered?: boolean
  deleted?: boolean
}

export type BabyKind = 'feed' | 'nappy' | 'sleep' | 'growth' | 'health' | 'note' | 'medicine' | 'pump'
export interface BabyEvent extends EventBase {
  type: 'baby'
  babyId: MemberId
  kind: BabyKind
  at: number
  /** Sleep: when it ended. */
  endAt?: number
  feed?: { method: 'breast' | 'bottle' | 'solid'; side?: 'L' | 'R' | 'both'; ml?: number; minutes?: number; milk?: 'formula' | 'expressed' }
  nappy?: { wet: boolean; dirty: boolean; colour?: NappyColour }
  weightKg?: number
  tempC?: number
  /** e.g. 'Vitamin D', 'Paracetamol'. */
  health?: string
  /** kind 'medicine': a logged dose, checked against that medicine's rule (see MedRuleEvent). */
  medicine?: { name: string; mg?: number; ml?: number }
  /** kind 'pump': an expressing session. The milk goes into stock as a linked MilkStockEvent (pumpEventId). */
  pump?: { ml?: number; side?: 'L' | 'R' | 'both'; minutes?: number }
  note?: string
  /** Who actually did it, when it is not whoever's phone logged it (Edit entry > Who). */
  by?: MemberId
  /** Written by a spoken command through the log-care function (actor 'home'); the command, e.g. 'nappy-wet'. */
  voice?: string
}

export type NappyColour = 'black' | 'green' | 'yellow' | 'brown' | 'red' | 'white' | 'other'

/** A dosing rule for one medicine ("no more than N doses in 24h, at least H hours apart"). Upsert: latest wins. Seeded with
 * common UK over-the-counter defaults, but never a substitute for medical advice, and always editable. */
export interface MedRuleEvent extends EventBase {
  type: 'med-rule'
  name: string
  maxPerDay?: number
  minGapHours?: number
  deleted?: boolean
}

/** Expressed milk in the fridge or freezer: 'add' when it is pumped, 'deduct' when a bottle feed uses it (oldest first). */
export interface MilkStockEvent extends EventBase {
  type: 'milk-stock'
  babyId: MemberId
  action: 'add' | 'deduct'
  ml: number
  location?: 'fridge' | 'freezer'
  /** When it was expressed (for 'add'), so oldest-first use-by ordering works. */
  expressedDate?: Ymd
  /** The feed event this deduction came from (for 'deduct'), so undoing the feed puts the milk back. */
  feedEventId?: string
  /** The pumping session this milk came from (for 'add'), so undoing the session takes it back out. */
  pumpEventId?: string
}

/** A household reference fact: NHS number, microchip, passport expiry... Upsert by key; never deleted, only replaced. */
export interface VaultEvent extends EventBase {
  type: 'vault'
  itemId: string
  memberId?: MemberId
  label: string
  value: string
  category?: string
  deleted?: boolean
}

/** One go at a feed: start (method/side), switch side, pause, resume, stop. Same shape as `run` (see routines.ts /
 * care.ts): active time excludes paused time. */
export type FeedRunAction = 'start' | 'switch' | 'pause' | 'resume' | 'stop' | 'adjust'
export interface FeedRunEvent extends EventBase {
  type: 'feedrun'
  feedRunId: string
  babyId: MemberId
  action: FeedRunAction
  /** 'start'/'switch': which side is now feeding (breast only). */
  side?: 'L' | 'R'
  /** 'pump' is an expressing session: same timer, pause and side-switching, logged as a pump entry when it stops. */
  method?: 'breast' | 'bottle' | 'pump'
  ml?: number
  milk?: 'formula' | 'expressed'
  /** 'adjust': nudge the run's recorded active time on its current side by this many seconds (+/-), for a parent
   * who started the timer late or forgot to pause/resume at the right moment. Clamped so it never goes negative. */
  deltaSec?: number
  /** Started or stopped by a spoken command (see BabyEvent.voice). */
  voice?: string
}

/** Undo: hides another event (a tracker entry or a completed task). */
export interface VoidEvent extends EventBase {
  type: 'void'
  targetId: string
}

export interface TreatEvent extends EventBase {
  type: 'treat'
  treatId: string
  title: string
  cost: number
  emoji: string
  blurb?: string
  /** Empty = anyone who earns coins. */
  forMembers?: MemberId[]
  maxPerWeek?: number
  active: boolean
  deleted?: boolean
}

export interface RedeemEvent extends EventBase {
  type: 'redeem'
  redeemId: string
  treatId: string
  memberId: MemberId
  title: string
  emoji: string
  cost: number
}

export interface RedeemStatusEvent extends EventBase {
  type: 'redeem-status'
  redeemId: string
  status: 'approved' | 'declined' | 'given' | 'cancelled'
  note?: string
}

/** A parent adding or removing coins by hand (bonus for helping, a fine, fixing a mistake). */
export interface CoinsEvent extends EventBase {
  type: 'coins'
  memberId: MemberId
  delta: number
  reason: string
}

/** How StudyQuest XP turns into coins, from `effectiveFrom` onward. Earlier days are never re-priced. */
export interface EconomyEvent extends EventBase {
  type: 'economy'
  effectiveFrom: Ymd
  xpPerCoin: number
  /** XP beyond this in one day still counts for levels but earns no more coins. */
  dailyCapXp: number
}

export interface SchoolPackEvent extends EventBase {
  type: 'school-pack'
  memberId: MemberId
  pack: SchoolPack
}

/** Correct the A/B week for one school week (e.g. after the timetable turns out different after Christmas). */
export interface SchoolWeekEvent extends EventBase {
  type: 'school-week'
  memberId: MemberId
  weekStart: Ymd
  week: 'A' | 'B'
}

export interface FamilyNameEvent extends EventBase {
  type: 'family'
  name: string
}

// ------------------------------------------------------- sessions (routines) and the brain dump
//
// In the app these are called "sessions": a list of steps done in order against the clock (a morning routine, a tidy-up,
// personal admin). In code they are `routine` (the saved plan) and `run` (one go at it), so they are not confused with the
// StudyQuest `session` event.

export interface RoutineStep {
  id: string
  title: string
  /** Planned minutes; may be a fraction (0.5 = 30 seconds). */
  minutes: number
  emoji?: string
  notes?: string
  /** The brain-dump item this step is (finishing the step ticks it off). */
  dumpId?: string
  /** The task this step is - a piece of homework in a homework session. Finishing the step ticks the task off. */
  taskId?: string
  /** The project activity this step is (see projects.ts). Finishing the step ticks the activity off. */
  activityId?: string
  /** The plant this step waters (see plants.ts). Finishing the step counts as watering it. */
  plantId?: string
  /** The personal care habit this step is (see checkin/habits.ts). Finishing the step ticks the habit for the day, the same
   * tick as in the check-in, so it is only ever counted once. */
  habitId?: string
  /** A "My habits" step: when the session starts it is replaced by the owner's habits that are due for this part of the day. */
  habitsSlot?: 'morning' | 'evening'
}

export interface RoutineEvent extends EventBase {
  type: 'routine'
  routineId: string
  title: string
  emoji?: string
  /** Who does it. Needed for it to be scheduled onto someone's day. */
  ownerId?: MemberId
  steps: RoutineStep[]
  /** "Must be done by": drives the time-left and spare-time readout. */
  finishBy?: Hm
  /** When it is meant to start, so it shows on the calendar and on Today. */
  startAt?: Hm
  /** The date (one-off) or first date (repeating). */
  date?: Ymd
  recur?: Recurrence
  exdates?: Ymd[]
  /** A task that gets ticked off when a run of this finishes (so it can pay coins). */
  taskId?: string
  /** A daily homework session: its steps are not saved here but taken, when it starts, from the owner's homework
   * planned for that day (see family/homework.ts homeworkSessionSteps). `steps` stays empty. */
  homework?: boolean
  /** A session planned from a project: its steps are not saved here but taken, when it starts, from these
   * activities (whatever of them is still to do, with their current names and times). `steps` stays empty. */
  project?: { projectId: string; activityIds: string[] }
  /** A watering session: its steps are not saved here but taken, when it starts, from the plants due a water then
   * (see plants.ts). `steps` stays empty. */
  plants?: boolean
  /** Which check-in shows this session as its routine. Set by routine setup; sessions made by hand are matched by name. */
  part?: 'morning' | 'evening'
  deleted?: boolean
}

/** One go at a session. Append-only, like timers: start, then a step is done/skipped, pause, resume, add time, end. */
export interface RunEvent extends EventBase {
  type: 'run'
  runId: string
  action: 'start' | 'step' | 'pause' | 'resume' | 'extend' | 'end'
  // start: a snapshot, so editing the session later never rewrites what was done
  routineId?: string
  title?: string
  emoji?: string
  memberId?: MemberId
  steps?: RoutineStep[]
  finishBy?: Hm
  date?: Ymd
  // step
  stepId?: string
  status?: 'done' | 'skipped'
  // extend
  sec?: number
  // end
  outcome?: 'abandoned'
}

export type DumpPriority = 'high' | 'normal' | 'someday'

export interface DumpEvent extends EventBase {
  type: 'dump'
  itemId: string
  title: string
  notes?: string
  /** Free-text list name: Home, Admin, Errands... */
  area?: string
  ownerId?: MemberId
  minutes?: number
  priority?: DumpPriority
  status: 'open' | 'done' | 'dropped'
  /** When it was first written down (edits keep it), so the list stays in the order things were thought of. */
  created?: number
  /** Scheduled onto someone's day as this task. */
  taskId?: string
  deleted?: boolean
}

// ------------------------------------------------------------ projects
//
// A project is a high-level goal broken down into activities, level by level (by hand, or by asking Gemini to break
// one piece down further). Activities form a tree: one with children is a group, the ones without are the steps you
// actually do. `after` links siblings that must happen in order. See projects.ts.

export type ProjectSkill = 'new' | 'some' | 'experienced'

export interface ProjectEvent extends EventBase {
  type: 'project'
  projectId: string
  title: string
  /** The goal in the family's own words (what the first breakdown starts from). */
  goal: string
  /** Constraints, notes, what is already in hand. */
  context?: string
  emoji?: string
  ownerId?: MemberId
  /** The level of detail to aim for: the size of a single step, in minutes. */
  grain?: number
  /** Time available, minutes a day. */
  dailyMinutes?: number
  skill?: ProjectSkill
  status?: 'active' | 'done' | 'archived'
  created?: number
  deleted?: boolean
}

export interface ActivityEvent extends EventBase {
  type: 'activity'
  activityId: string
  projectId: string
  /** The activity this is part of (undefined = top level of the project). */
  parentId?: string
  title: string
  description?: string
  /** Planned minutes. For a group this is the estimate it had before it was broken down; its real total is its children's. */
  minutes: number
  /** Activities next to this one (same parent) that must be finished before this can start. */
  after: string[]
  /** Position among its siblings, where the order is otherwise free. */
  order: number
  /** Came from an AI breakdown (shown with a small sparkle until edited). */
  ai?: boolean
  created?: number
  deleted?: boolean
}

/** Ticking an activity off by hand (or un-ticking it). Appended, not an upsert, so it can be undone, and so another
 * phone re-saving the activity (renaming, moving) can never quietly undo a tick. See projects.ts activityTicked. */
export interface ActivityTickEvent extends EventBase {
  type: 'activity-tick'
  activityId: string
  projectId: string
  done: boolean
}

// ------------------------------------------------------------ plants

/** A house or garden plant. Upserted by plantId. */
export interface PlantEvent extends EventBase {
  type: 'plant'
  plantId: string
  name: string
  emoji?: string
  /** Where it lives ("Kitchen windowsill"). */
  room?: string
  notes?: string
  /** For later: the variety, once there is a list of plants with their own watering rules. */
  variety?: string
  deleted?: boolean
}

/** A plant was watered (at `at`, which can be earlier than the event when logged after the fact). Appended, so it can
 * be undone. Finishing a watering step in a session also counts (see plants.ts). */
export interface PlantWaterEvent extends EventBase {
  type: 'plant-water'
  plantId: string
  at: number
}

// ------------------------------------------------------------ the house: rooms, jobs and family sessions
//
// A "family session" is the whole family doing a lot of small jobs at once (a house clean-up, a garden day). The jobs
// live in rooms that the family can add to, rename and remove; a saved session type picks which rooms and how deep to
// go; a run is one go at it, with people, assignments and ticks (see family/house/).

export type HouseDepth = 'quick' | 'standard' | 'deep'
/** Something the family must have for a room or job to apply. */
export type HouseNeed = 'dog' | 'baby' | 'plants'
/** A job that ties into another part of the app. */
export type HouseLink = 'plants' | 'dog-water' | 'shopping' | 'board' | 'machine'

/** A room (or the garden). Upsert by roomId; `deleted` is the usual soft flag. */
export interface HouseRoomEvent extends EventBase {
  type: 'house-room'
  roomId: string
  name: string
  emoji?: string
  outdoor?: boolean
  /** A child's room: that child is the default helper there. */
  ownerId?: MemberId
  /** Included in a quick tidy. */
  quickTidy?: boolean
  /** Only applies when the family has this (the nursery needs a baby). */
  requires?: HouseNeed
  /** Position in the list. */
  order: number
  /** Which starter room it came from (so it can be added back). */
  starterKey?: string
  deleted?: boolean
}

/** One job in a room. Upsert by jobId. */
export interface HouseJobEvent extends EventBase {
  type: 'house-job'
  jobId: string
  roomId: string
  title: string
  minutes: number
  /** The youngest age that should be given this job (18 = adults only). */
  minAge: number
  depth: HouseDepth
  /** Days it stays "done" after someone does it; 0 = suggested every session. */
  resetDays: number
  /** Months (1 to 12) it applies in; none = all year. */
  months?: number[]
  requires?: HouseNeed
  link?: HouseLink
  /** Order inside the room: 1 clear, 2 empty, 3 clean, 4 fill and restock, 5 floors. */
  phase: number
  /** A job (in the same room) that comes first. */
  after?: string
  notes?: string
  /** What to offer to add to the shopping list (link 'shopping'). */
  shopName?: string
  /** A cleaner usually does this (left out while the family has "we have a cleaner" on). */
  cleaner?: boolean
  /** Coins a child earns for it (once a parent has checked). */
  coins?: number
  /** Position inside the room, to keep a stable order. */
  order: number
  starterKey?: string
  deleted?: boolean
}

/** A saved family session: what it is called, how deep it goes, which rooms, who usually takes part, and (optionally)
 * when it is planned. Upsert by typeId. */
export interface HouseTypeEvent extends EventBase {
  type: 'house-type'
  typeId: string
  name: string
  emoji?: string
  depth: HouseDepth
  /** 'indoor'/'outdoor': every such room, including ones added later. 'quick': the rooms marked for a quick tidy. Or a chosen list. */
  rooms: 'indoor' | 'outdoor' | 'quick' | string[]
  /** Exclusions saved for next time ("always skip the office"). */
  skipRoomIds?: string[]
  skipJobIds?: string[]
  /** Who usually takes part. */
  memberIds?: MemberId[]
  /** When it is planned: shows on the calendar, and on Today (with a Start button) that day. */
  date?: Ymd
  startAt?: Hm
  recur?: Recurrence
  exdates?: Ymd[]
  order?: number
  deleted?: boolean
}

/** Household-wide choices for family sessions. Upsert: the latest wins. */
export interface HouseConfigEvent extends EventBase {
  type: 'house-config'
  /** A cleaner does the jobs marked "cleaner does this". */
  cleaner: boolean
}

/** The snapshot of one job in a family run (so editing the catalogue later never rewrites what was done). */
export interface HouseRunJob {
  jobId: string
  roomId: string
  roomName: string
  roomEmoji?: string
  title: string
  minutes: number
  coins: number
  minAge: number
  phase: number
  after?: string
  link?: HouseLink
  shopName?: string
  notes?: string
  /** link 'plants': the plants in this room that were due a water when it started. */
  plantIds?: string[]
  /** Who it was given to when it started. */
  assignee?: MemberId
}

export interface HouseRunRoom {
  roomId: string
  name: string
  emoji?: string
}

/** One go at a family session. Append-only like runs: start, then jobs are assigned and done, people join and leave. */
export interface HouseRunEvent extends EventBase {
  type: 'house-run'
  runId: string
  action: 'start' | 'assign' | 'job' | 'join' | 'leave' | 'pause' | 'resume' | 'end'
  // start
  typeId?: string
  title?: string
  emoji?: string
  date?: Ymd
  people?: MemberId[]
  rooms?: HouseRunRoom[]
  jobs?: HouseRunJob[]
  // assign / join / leave
  assignments?: { jobId: string; to?: MemberId }[]
  // join / leave
  memberId?: MemberId
  // job
  jobId?: string
  status?: 'done' | 'skipped'
  /** Who did it, when that is not whoever tapped (ticking for a child). */
  by?: MemberId
  /** Other events appended with it that an undo must also undo (a pet's water). */
  linked?: string[]
  // end
  outcome?: 'abandoned'
}

// ------------------------------------------------------------ morning and evening check-ins and personal care habits
//
// Each person (parents and children) has a morning and an evening check-in: a look back over what was done, a quick way to add
// things that were not tracked, their personal care habits, and how they are. A parent can fill one in for a child.

export type HabitWhen = 'morning' | 'evening' | 'either'

/** A personal care habit (meditate, moisturise, cut nails). Upsert by habitId. Belongs to one person. */
export interface HabitEvent extends EventBase {
  type: 'habit'
  habitId: string
  memberId: MemberId
  title: string
  emoji?: string
  /** Which check-in it appears in. */
  when: HabitWhen
  /** Every N days (1 = daily, 14 = fortnightly), counted from when it was last done. */
  everyDays: number
  /** Only on these weekdays instead (0 = Monday ... 6 = Sunday). */
  weekdays?: number[]
  order: number
  /** Which suggestion it came from. */
  starterKey?: string
  /** Part of the "before you leave" checklist (bag packed, keys...): the last group of the morning check-in. */
  leaving?: boolean
  deleted?: boolean
}

/** A habit done (appended, so it can be undone). `date` is the day it counts for, which can be earlier than `at`. */
export interface HabitDoneEvent extends EventBase {
  type: 'habit-done'
  habitId: string
  memberId: MemberId
  date: Ymd
  at: number
}

export type CheckinPart = 'morning' | 'evening'

/** A finished check-in, with how the person is. Upsert by `${memberId}|${date}|${part}`; latest wins. */
export interface CheckinEvent extends EventBase {
  type: 'checkin'
  memberId: MemberId
  date: Ymd
  part: CheckinPart
  /** 1 (rough) to 5 (great). */
  mood?: number
  /** Evening: what was behind the mood, in their own words. Same visibility as the mood. */
  why?: string
  note?: string
}

/** Someone holds a copy of this member's private key, so a lost phone can be restored. Public on purpose: it carries only a
 * fingerprint of the key, never the key. Upsert by `${memberId}|${holder}`; `removed` withdraws it. */
export interface KeyCopyEvent extends EventBase {
  type: 'key-copy'
  memberId: MemberId
  holder: MemberId
  fp: string
  removed?: boolean
}

/** Voice logging defaults, read by the log-care function: what "bottle" logs and the family's time zone. Latest wins. */
export interface VoiceConfigEvent extends EventBase {
  type: 'voice-config'
  bottleMl: number
  milk: 'formula' | 'expressed'
  tz: string
}

/** When a person's check-ins open, and whether to nudge them. Upsert by memberId. */
export interface CheckinConfigEvent extends EventBase {
  type: 'checkin-config'
  memberId: MemberId
  enabled: boolean
  morningFrom: Hm
  morningUntil: Hm
  eveningFrom: Hm
  /** Send a reminder when each one opens. */
  remind: boolean
  /** Different times for weekends and days off school (absent = the same as the rest of the week). */
  weekend?: { morningFrom: Hm; morningUntil: Hm; eveningFrom: Hm }
}

/** The times that make up one kind of day in a person's routine plan. */
export interface RoutineDayTimes {
  wake: Hm
  /** Leaving the house (or school/work starting). Optional on days off. */
  leave?: Hm
  bed: Hm
}

/** What a person said when they set up their routines (so the setup can be opened again with the same answers).
 * The sessions, habits and check-in times it produced are ordinary events of their own. Upsert by member. */
export interface RoutinePlanEvent extends EventBase {
  type: 'routine-plan'
  memberId: MemberId
  weekday: RoutineDayTimes
  weekend: RoutineDayTimes
  /** The "before you leave" checklist, as typed. */
  leaving: string[]
}

// ------------------------------------------------------------ meals and shopping

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Aisle = 'produce' | 'bakery' | 'meat' | 'dairy' | 'frozen' | 'cupboard' | 'drinks' | 'baby' | 'household' | 'pet' | 'other'

export interface Ingredient {
  name: string
  qty?: number
  unit?: string
  aisle?: Aisle
  /** A staple most kitchens have (salt, oil): left out of the shopping list unless chosen. */
  pantry?: boolean
}

export interface RecipeEvent extends EventBase {
  type: 'recipe'
  recipeId: string
  title: string
  emoji?: string
  servings?: number
  minutes?: number
  meal?: MealSlot | 'any'
  ingredients: Ingredient[]
  method?: string
  notes?: string
  tags?: string[]
  /** Where it came from, e.g. 'arrival:M-B1', so seeding never duplicates. */
  source?: string
  deleted?: boolean
}

export interface MealPlanEvent extends EventBase {
  type: 'meal'
  planId: string
  date: Ymd
  slot: MealSlot
  recipeId?: string
  title: string
  servings?: number
  cookId?: MemberId
  notes?: string
  /** The ingredients have been added to a shopping list. */
  shopped?: boolean
  /** This meal's own time on the calendar. Without one it follows the family's meal times (see MealTimesEvent). */
  start?: Hm
  end?: Hm
  deleted?: boolean
}

/** When breakfast, lunch and dinner usually are, for the calendar. One per family (upsert, latest wins). Snacks have no time. */
export interface MealTimesEvent extends EventBase {
  type: 'meal-times'
  breakfast: { start: Hm; end: Hm }
  lunch: { start: Hm; end: Hm }
  dinner: { start: Hm; end: Hm }
}

/**
 * One person's rating of one planned meal: 1 = not for me, 2 = fine, 3 = loved it. Optional for everyone; nobody who does not
 * vote counts. Upsert by member and meal. `key` is the recipe id, or the lower-cased title for something with no recipe, so a
 * meal rated this week is recognised when it comes round again.
 */
export interface MealRatingEvent extends EventBase {
  type: 'meal-rating'
  planId: string
  memberId: MemberId
  /** Rated by (a parent may rate for a young child). The event's own `learnerId` says who tapped; this is who it is about. */
  rating: 1 | 2 | 3
  key: string
  title: string
  recipeId?: string
  date: Ymd
  slot: MealSlot
  /** Taken back. */
  cleared?: boolean
}

export interface ShopListEvent extends EventBase {
  type: 'shop-list'
  listId: string
  name: string
  emoji?: string
  deleted?: boolean
}

export interface ShopItemEvent extends EventBase {
  type: 'shop-item'
  itemId: string
  listId: string
  name: string
  qty?: number
  unit?: string
  aisle: Aisle
  note?: string
  done: boolean
  /** Meal-plan entries whose ingredients this item came from. */
  fromPlans?: string[]
  /** Dietary tags carried over from a recipe's ingredients, or set by hand. Informational only, never enforced. */
  tags?: DietaryTag[]
  deleted?: boolean
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free'

export type FamilyEvent =
  | HouseRoomEvent
  | HouseJobEvent
  | HouseTypeEvent
  | HouseConfigEvent
  | HouseRunEvent
  | PlantEvent
  | PlantWaterEvent
  | ProjectEvent
  | ActivityEvent
  | ActivityTickEvent
  | RoutineEvent
  | RunEvent
  | DumpEvent
  | RecipeEvent
  | MealPlanEvent
  | MealTimesEvent
  | MealRatingEvent
  | ShopListEvent
  | ShopItemEvent
  | MemberEvent
  | CalEvent
  | CalOverrideEvent
  | HelpEvent
  | TaskEvent
  | TaskDoneEvent
  | TaskCheckEvent
  | TimerEvent
  | IdeaEvent
  | VoteEvent
  | PetEvent
  | PetStockEvent
  | BabyEvent
  | MedRuleEvent
  | MilkStockEvent
  | VaultEvent
  | FeedRunEvent
  | VoidEvent
  | TreatEvent
  | RedeemEvent
  | RedeemStatusEvent
  | CoinsEvent
  | EconomyEvent
  | SchoolPackEvent
  | SchoolWeekEvent
  | FamilyNameEvent
  | CommentEvent
  | SummitEvent
  | DumpPromptSettingEvent
  | TriviaDoneEvent
  | CoinGoalEvent
  | CoinGoalGiftEvent
  | CoparentLinkEvent
  | ShiftPlanEvent
  | HomeworkCheckinEvent
  | HabitEvent
  | HabitDoneEvent
  | CheckinEvent
  | CheckinConfigEvent
  | RoutinePlanEvent
  | KeyCopyEvent
  | VoiceConfigEvent
  | TravelEvent

// ------------------------------------------------------------------ Tier 2 additions

/** A comment on a calendar event or task. Context-isolated: a thread is scoped strictly to its `targetId` and is
 * never shown anywhere else. Upsert by commentId so an edit replaces the text; "delete" is the usual soft flag. */
export interface CommentEvent extends EventBase {
  type: 'comment'
  commentId: string
  targetId: string
  text: string
  deleted?: boolean
}

/** Marks the weekly planning summit done for a given ISO week key (e.g. '2026-W39'). Upsert by weekKey — running it
 * again the same week just updates who/when. */
export interface SummitEvent extends EventBase {
  type: 'summit'
  weekKey: string
}

/** Per-adult setting for the end-of-day brain-dump prompt, plus the last date they were shown (and dismissed or
 * used) it, so it never nags twice in one day. Upsert by memberId. */
export interface DumpPromptSettingEvent extends EventBase {
  type: 'dump-prompt-setting'
  memberId: MemberId
  enabled: boolean
  time: Hm
  lastSeen?: Ymd
}

/** Marks today's daily trivia card done for a member, so it only ever pays out once a day. Upsert by `${memberId}|${date}`. */
export interface TriviaDoneEvent extends EventBase {
  type: 'trivia-done'
  memberId: MemberId
  date: Ymd
  coins: number
}

/** A shared family goal anyone can put coins toward (a trip, a big purchase). Upsert by goalId. */
export interface CoinGoalEvent extends EventBase {
  type: 'coin-goal'
  goalId: string
  title: string
  emoji?: string
  targetCoins: number
  deleted?: boolean
}

/** A voluntary gift of a member's own coins into a goal's pool. Append-only, like a redeem, and immediate (no parent
 * approval — it's the member spending their own balance on something they chose). */
export interface CoinGoalGiftEvent extends EventBase {
  type: 'coin-goal-gift'
  giftId: string
  goalId: string
  coins: number
}

// ------------------------------------------------------------------ co-parenting (shared child, separate households)
//
// Two households, each running its own separate copy of this app (own family, own event log, own optional
// Supabase project for their family log). A child splits time between both. `CoparentLinkEvent` records, on
// THIS household's side only, that one of our children is linked to the other household, plus the rotation
// ("whose week is it") and how to reach the ONE Supabase project this link's snapshot table lives in (not
// necessarily either household's family-sync project). See family/coparent.ts and storage/coparentSync.ts for
// the actual sharing mechanism — it is a small side snapshot table, never the event log itself, and never
// another child's data.

export type HouseholdSlot = 'a' | 'b'

export interface CoparentLinkEvent extends EventBase {
  type: 'coparent-link'
  linkId: string
  /** The local child this link is about. Sharing is scoped to exactly this one child. */
  childId: MemberId
  /** A short label for the other household ("Mum's", "Dad's"), shown in this household's UI only. */
  label: string
  /** A Monday: day 1 of the "anchor" week used to work out whose week it is (see coparent.ts isHereWeek). */
  rotationAnchorMonday: Ymd
  /** True when the anchor week is a week the child is HERE, in this household. */
  anchorHere: boolean
  /** The shared secret for this link's row pair; combined with `householdSlot` it picks which row is ours vs
   * theirs. Sent as the `x-link-key` header — RLS grants read/write to both rows for anyone holding it. */
  linkKey: string
  /** Which of the two rows for this link is ours ('a' or 'b'); the other slot is where we read their blocks
   * from. The household that creates the link is 'a'; a redeemed code hands the other household 'b'. */
  householdSlot: HouseholdSlot
  /** The ONE Supabase project this link's `shared_busy` rows live in — set once a link code is created or
   * redeemed. In practice this is whichever household created the link's own family-sync project; the other
   * household needs no Supabase project of its own for this link to work. */
  sharedUrl?: string
  sharedAnonKey?: string
  deleted?: boolean
}

// ------------------------------------------------------------------ night/day care shifts

/** Who is responsible for a baby, day vs night, for one week - so each parent gets a predictable, fair turn at
 * the harder overnight shift and can actually plan to sleep through it on their nights off. Upsert by
 * `${babyId}|${weekOf}`: latest wins, same convention as MedRuleEvent/VaultEvent. See shifts.ts for the weekly
 * propose-then-confirm workflow and for working out who's on right now. */
export interface ShiftPlanEvent extends EventBase {
  type: 'shift-plan'
  babyId: MemberId
  /** The Monday this plan covers (see dates.ts startOfWeek). */
  weekOf: Ymd
  dayParentId: MemberId
  nightParentId: MemberId
  /** Day shift runs dayStart..nightStart; night shift runs nightStart..dayStart (wrapping past midnight).
   * Defaults to 07:00 / 19:00 but can be nudged as the baby's own bedtime settles later with age. */
  dayStart: Hm
  nightStart: Hm
  /** A proposed plan (the default each new week: last week's confirmed plan with the two parents swapped) is
   * shown clearly as not-yet-agreed until a parent confirms it, typically at a weekly planning moment. */
  confirmed: boolean
  /** A rota of blocks through the day instead of one day and one night shift, e.g. 4-hour blocks from 22:00
   * (22-02, 02-06, 06-10, 10-14, 14-18, 18-22), each with its parent. Each block runs until the next one starts,
   * wrapping past midnight. When present it is what counts; dayParentId/nightParentId/dayStart/nightStart are then
   * only kept filled in for older app versions. See shifts.ts blocksOf. */
  blocks?: ShiftBlock[]
}

export interface ShiftBlock {
  start: Hm
  parentId: MemberId
}

// ------------------------------------------------------------------ homework check-in

/** A child's answer to the after-school "any homework from today's lessons?" check-in. Homework they added is
 * ordinary tasks; this records that they looked, and which subjects they said set nothing, so the app stops asking
 * and the "nothing logged for Science this week" nudge doesn't nag about a subject they've already answered for. */
export interface HomeworkCheckinEvent extends EventBase {
  type: 'homework-checkin'
  memberId: MemberId
  date: Ymd
  /** Subjects from that day's lessons the child said set no homework. */
  none: string[]
  /** How many pieces they added during the check-in (informational). */
  added: number
  /** Only a "none set" answer from the weekly nudge, not the full after-school check-in - so the check-in still
   * shows for that day. */
  partial?: boolean
}

// ------------------------------------------------------------------ projections

export interface Member {
  id: MemberId
  name: string
  role: MemberRole
  colour: string
  emoji?: string
  active: boolean
  birthday?: Ymd
  /** Baby only: expected date while the baby has not been born yet. */
  dueDate?: Ymd
  /** Baby only: the first day at home (Day 1 of the new-baby plan). Defaults to the day after the birth. */
  dayOne?: Ymd
  petKind?: string
  petPlan?: { walksPerDay: number; mealsPerDay: number }
  /** Children only: see CareDuty. */
  looksAfter?: CareDuty[]
  createdTs: number
}

export interface TaskDone {
  /** The task-done event's id (what `void` points at). */
  eventId: string
  taskId: string
  date: Ymd | 'any'
  by: MemberId
  ts: number
  coins: number
  minutes?: number
  needsCheck: boolean
  status: 'pending' | 'approved' | 'rejected'
  checkedBy?: MemberId
  checkNote?: string
  checkTs?: number
  /** Who the coins belong to (assignee when it was done). Missing on old events: fall back to the task's assignee. */
  payee?: MemberId
}

export interface TimerSegment {
  from: number
  to?: number
}
export interface TimerState {
  id: string
  memberId: MemberId
  label: string
  plannedSec: number
  extraSec: number
  taskId?: string
  taskDate?: Ymd | 'any'
  purpose: NonNullable<TimerEvent['purpose']>
  subjectId?: MemberId
  side?: 'L' | 'R'
  startedTs: number
  segments: TimerSegment[]
  status: 'running' | 'paused' | 'done' | 'cancelled'
  endedTs?: number
  startedBy: MemberId
}

export interface Idea {
  id: string
  title: string
  kind: IdeaKind
  emoji?: string
  notes?: string
  cost?: string
  status: IdeaEvent['status']
  calId?: string
  when?: IdeaEvent['when']
  proposedBy: MemberId
  createdTs: number
  updatedTs: number
}

export interface Treat {
  id: string
  title: string
  cost: number
  emoji: string
  blurb?: string
  forMembers: MemberId[]
  maxPerWeek?: number
  active: boolean
  deleted: boolean
}

export interface Redeem {
  id: string
  treatId: string
  memberId: MemberId
  title: string
  emoji: string
  cost: number
  ts: number
  status: 'pending' | 'approved' | 'declined' | 'given' | 'cancelled'
  note?: string
  decidedTs?: number
  decidedBy?: MemberId
}

export interface CoinAdjust {
  id: string
  memberId: MemberId
  delta: number
  reason: string
  ts: number
  by: MemberId
}

export interface EconomySetting {
  effectiveFrom: Ymd
  xpPerCoin: number
  dailyCapXp: number
}

export interface ShopHistory {
  name: string
  aisle: Aisle
  unit?: string
  count: number
  lastTs: number
}

export interface FamilyState {
  name: string
  members: Record<MemberId, Member>
  cal: Record<string, CalEvent>
  /** `${calId}|${date}` -> members who offered to help. */
  help: Record<string, MemberId[]>
  /** AgendaItem.key -> the latest edit/cancellation laid on top of a school-timetable-derived item for that
   * one day. Absent (or `cleared`) means "use whatever the timetable says", same as before this existed. */
  calOverrides: Record<string, CalOverrideEvent>
  tasks: Record<string, TaskEvent>
  /** `${taskId}|${date}` -> latest completion. */
  done: Record<string, TaskDone>
  timers: Record<string, TimerState>
  ideas: Record<string, Idea>
  /** `${ideaId}|${memberId}` -> vote. */
  votes: Record<string, Exclude<VoteValue, 'clear'>>
  pets: PetEvent[]
  babies: BabyEvent[]
  petStock: Record<string, PetStockEvent>
  medRules: Record<string, MedRuleEvent>
  milkStock: MilkStockEvent[]
  vault: Record<string, VaultEvent>
  /** feedRunId -> its events, oldest first (folded the same way as `runs`). */
  feedRuns: Record<string, FeedRunEvent[]>
  voided: Record<string, true>
  /** task-done event id -> `${taskId}|${date}` key, so undoing any tick clears the completion. */
  doneByEvent: Record<string, string>
  /** Parent decisions that arrived (by timestamp) before the thing they decide, kept until it shows up (phone clocks differ). */
  heldChecks: Record<string, { decision: 'approved' | 'rejected'; note?: string; by: MemberId; ts: number }>
  heldRedeems: Record<string, { status: 'approved' | 'declined' | 'given' | 'cancelled'; note?: string; by: MemberId; ts: number }[]>
  treats: Record<string, Treat>
  redeems: Record<string, Redeem>
  adjusts: CoinAdjust[]
  economy: EconomySetting[]
  routines: Record<string, RoutineEvent>
  /** runId -> its events, oldest first (a run is worked out from these when it is read; see routines.ts). */
  runs: Record<string, RunEvent[]>
  dump: Record<string, DumpEvent>
  projects: Record<string, ProjectEvent>
  activities: Record<string, ActivityEvent>
  /** activityId -> its tick events, oldest first (the latest one not undone counts). */
  activityTicks: Record<string, ActivityTickEvent[]>
  plants: Record<string, PlantEvent>
  /** plantId -> its watering events, in the order they arrived. */
  plantWaters: Record<string, PlantWaterEvent[]>
  houseRooms: Record<string, HouseRoomEvent>
  houseJobs: Record<string, HouseJobEvent>
  houseTypes: Record<string, HouseTypeEvent>
  houseConfig?: HouseConfigEvent
  /** runId -> its family-session events, oldest first (a run is worked out from these: see family/house/run.ts). */
  houseRuns: Record<string, HouseRunEvent[]>
  /** habitId -> a personal care habit. */
  habits: Record<string, HabitEvent>
  /** habitId -> when it was done (appended), oldest first. */
  habitDone: Record<string, HabitDoneEvent[]>
  /** `${memberId}|${date}|${part}` -> the finished check-in. */
  checkins: Record<string, CheckinEvent>
  /** memberId -> their check-in times. */
  checkinConfig: Record<MemberId, CheckinConfigEvent>
  /** Each person's answers from routine setup. */
  routinePlans: Record<MemberId, RoutinePlanEvent>
  /** `${memberId}|${holder}` -> who holds a copy of whose private key. */
  keyCopies: Record<string, KeyCopyEvent>
  voice?: VoiceConfigEvent
  recipes: Record<string, RecipeEvent>
  meals: Record<string, MealPlanEvent>
  /** The family's usual meal times (absent = the defaults). */
  mealTimes?: MealTimesEvent
  /** `${memberId}|${planId}` -> that person's rating of that meal. */
  mealRatings: Record<string, MealRatingEvent>
  shopLists: Record<string, ShopListEvent>
  shopItems: Record<string, ShopItemEvent>
  /** How often each thing has been added to a list (keyed by lower-case name), for the "usuals" chips. */
  shopHistory: Record<string, ShopHistory>
  schools: Record<MemberId, SchoolPack>
  /** `${memberId}|${weekStart}` -> forced week */
  weekFix: Record<string, 'A' | 'B'>
  comments: Record<string, CommentEvent>
  summits: Record<string, SummitEvent>
  dumpPromptSettings: Record<MemberId, DumpPromptSettingEvent>
  triviaDone: Record<string, TriviaDoneEvent>
  goals: Record<string, CoinGoalEvent>
  goalGifts: CoinGoalGiftEvent[]
  /** Upsert by linkId; soft-deleted (never removed) so a device that missed the delete still converges. */
  coparentLinks: Record<string, CoparentLinkEvent>
  /** `${babyId}|${weekOf}` -> that week's night/day shift plan (see shifts.ts). Upsert: latest wins. */
  shiftPlans: Record<string, ShiftPlanEvent>
  /** `${memberId}|${date}` -> that school day's "any homework?" check-in (see homework.ts). Upsert: latest wins. */
  hwCheckins: Record<string, HomeworkCheckinEvent>
  /** Places, trips, alarms and what the home server has planned (see family/travel). */
  travel: TravelState
  eventCount: number
}
