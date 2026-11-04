/**
 * The welcome tour (a few swipeable cards, by role) and the setup checklist that follows it for parents. The
 * checklist ticks itself off from the family's own data, so there's nothing to mark by hand.
 */
import type { FamilyState } from '@/family/types'

export interface TourCard {
  id: string
  emoji: string
  title: string
  body: string
  /** "Show me" opens this screen (and leaves the tour where it was). */
  to?: string
  /** Only when the family has a baby or a pet. */
  needsCare?: boolean
  tone: 'a' | 'b' | 'c' | 'd' | 'e'
}

export const PARENT_TOUR: TourCard[] = [
  { id: 'hello', emoji: '🏡', title: 'Welcome to HomeQuest', body: 'The family’s day in one place: plans, lists, school, care and learning. This takes a minute; skip whenever you like.', tone: 'a' },
  { id: 'today', emoji: '🏠', title: 'Today', body: 'What needs you, what’s on now and next, and your list. Tap a face at the top to see anyone else’s day.', to: '/', tone: 'b' },
  { id: 'plus', emoji: '➕', title: 'The + button', body: 'Bottom right on most screens: add a task, an event, something to buy, an idea or a brain-dump thought from anywhere.', tone: 'c' },
  { id: 'calendar', emoji: '📅', title: 'Calendar', body: 'Everyone’s plans, school and clubs together. Plans & ideas is where the family suggests things and votes.', to: '/calendar', tone: 'd' },
  { id: 'plan', emoji: '✅', title: 'Plan', body: 'Sessions with a timer, big projects in small steps, the brain dump, meals for the week and the shopping list.', to: '/plan', tone: 'e' },
  { id: 'care', emoji: '🍼', title: 'Care', body: 'The baby, the pets and the plants: feeds, walks and watering in a tap, and a dim night mode for 3am.', to: '/care', tone: 'a' },
  { id: 'more', emoji: '🧭', title: 'More', body: 'The places that aren’t on a tab: the children’s school, learning and coins, the weekly plan, and Settings at the end. The search box at the top finds anything. A count shows where something is waiting.', to: '/more', tone: 'b' },
  { id: 'setup', emoji: '🧰', title: 'Now, a few things to set up', body: 'A short checklist that ticks itself off as you go. It stays on Today until it’s done, or you hide it.', tone: 'c' },
]

export const CHILD_TOUR: TourCard[] = [
  { id: 'hello', emoji: '👋', title: 'Welcome to HomeQuest', body: 'Your jobs, homework, plans and games in one place.', tone: 'a' },
  { id: 'list', emoji: '✅', title: 'Your list', body: 'Tick things off as you do them. Jobs and homework earn coins once a grown-up has checked.', to: '/', tone: 'b' },
  { id: 'homework', emoji: '📚', title: 'Homework', body: 'Its own tab: what’s due, your timetable and what to pack.', to: '/school', tone: 'e' },
  { id: 'care', emoji: '🐕', title: 'Looking after', body: 'If you help with the dog or the plants, feed, water and walks are one tap on Today.', to: '/', tone: 'b' },
  { id: 'learn', emoji: '⚡', title: 'StudyQuest', body: 'Play short games in any subject. Every point you earn turns into coins.', to: '/learn', tone: 'c' },
  { id: 'shop', emoji: '🛍️', title: 'The coin shop', body: 'Spend your coins on treats. A grown-up says yes and hands it over.', to: '/shop', tone: 'd' },
  { id: 'plans', emoji: '🧭', title: 'More', body: 'The calendar, plans and ideas to vote on, the shopping list and everything else.', to: '/more', tone: 'e' },
  { id: 'ready', emoji: '🚀', title: 'You’re ready', body: 'The + button adds a task or an idea. Have fun!', tone: 'a' },
]

export function tourFor(role: string, hasCare: boolean): TourCard[] {
  return (role === 'child' ? CHILD_TOUR : PARENT_TOUR).filter((c) => !c.needsCare || hasCare)
}

// ------------------------------------------------------------------ setup checklist

export interface SetupStep {
  id: string
  emoji: string
  title: string
  hint: string
  to: string
  done: boolean
  optional?: boolean
}

export interface SetupFacts {
  f: FamilyState
  /** Children with a school set up. */
  schoolKids: number
  syncOn: boolean
  syncSkipped: boolean
  notificationsOn: boolean
  aiReady: boolean
}

export function setupSteps({ f, schoolKids, syncOn, syncSkipped, notificationsOn, aiReady }: SetupFacts): SetupStep[] {
  const people = Object.values(f.members).filter((m) => m.active)
  const kids = people.filter((m) => m.role === 'child')
  const steps: SetupStep[] = [
    { id: 'family', emoji: '👨‍👩‍👧', title: 'Add the family', hint: 'Children, a baby (or one on the way) and pets.', to: '/parent?tab=family', done: people.length > 1 },
  ]
  if (kids.length) steps.push({ id: 'school', emoji: '🏫', title: 'Add school', hint: 'Paste the school pack, or try the sample school.', to: '/school', done: schoolKids > 0 })
  steps.push(
    // Optional: HomeQuest works fully on one phone. Sharing needs no Supabase set-up of your own (the app has its server built
    // in); a new family just needs an invite code from one already using it.
    { id: 'sync', emoji: '☁️', title: 'Share between phones', hint: 'Optional. Turn on sharing in Data (with an invite code), then join from each phone with the family code.', to: '/parent?tab=data', done: syncOn || syncSkipped, optional: true },
    { id: 'notify', emoji: '🔔', title: 'Notifications on this phone', hint: 'Reminders for events, homework, feeds and medicine.', to: '/parent?tab=data', done: notificationsOn },
  )
  if (kids.length) steps.push({ id: 'coins', emoji: '🪙', title: 'Coins and treats', hint: 'How points and homework turn into coins, and what they can buy.', to: '/parent?tab=family', done: f.economy.length > 0 })
  steps.push(
    {
      id: 'routines',
      emoji: '🌅',
      title: 'Morning and evening routines',
      hint: 'Wake, leave and bed times for weekdays and weekends, a before-you-leave list, and the care habits. In Parent › Family, under each person’s check-ins.',
      to: '/parent?tab=family',
      done: people.filter((m) => m.role === 'parent' || m.role === 'child').every((m) => !!f.routinePlans?.[m.id]),
      optional: true,
    },
    { id: 'ai', emoji: '✨', title: 'AI breakdowns', hint: 'Let Gemini break projects into steps.', to: '/plan?t=projects', done: aiReady, optional: true },
    { id: 'plan', emoji: '🗓️', title: 'Plan something', hint: 'A first session, or dinners for the week.', to: '/plan', done: Object.values(f.routines).some((r) => !r.deleted) || Object.values(f.meals).some((m) => !m.deleted), optional: true },
  )
  return steps
}

/** Done when every required step is done (optional ones don't hold it open). */
export const setupComplete = (steps: readonly SetupStep[]) => steps.every((s) => s.done || s.optional)
