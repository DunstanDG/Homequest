/**
 * "Plan a thing" templates: a handful of sensible steps for events that tend to feel like a mountain. Each step says how
 * many days before the date it is best done, roughly how long it takes, and who it suits. Nothing here is personal.
 */
import type { CalCategory } from '../types'

export type Who = 'parent' | 'child' | 'anyone'

export interface TemplateStep {
  id: string
  title: string
  /** Days before the date it is best done (0 = on the day, negative = after it). */
  offset: number
  minutes: number
  who?: Who
  /** Left unticked until someone wants it. */
  optional?: boolean
}

export interface PlanTemplate {
  id: string
  title: string
  emoji: string
  blurb: string
  /** What to call the thing by default ("Birthday party"). */
  defaultName: string
  category: CalCategory
  /** The event runs for this many days from the date (1 = just that day). */
  days: number
  steps: TemplateStep[]
}

const s = (id: string, title: string, offset: number, minutes: number, who?: Who, optional?: boolean): TemplateStep => ({ id, title, offset, minutes, who, optional })

export const TEMPLATES: PlanTemplate[] = [
  {
    id: 'birthday',
    title: 'Birthday party',
    emoji: '🎂',
    blurb: 'Guests, food, cake and a goody bag or two.',
    defaultName: 'Birthday party',
    category: 'social',
    days: 1,
    steps: [
      s('b1', 'Pick a date, place and a rough guest list', 28, 20, 'parent'),
      s('b2', 'Book the venue or check the garden plan', 25, 15, 'parent'),
      s('b3', 'Send the invitations', 21, 20, 'parent'),
      s('b4', 'Choose a theme and a few games', 14, 20, 'anyone'),
      s('b5', 'Order or plan the cake', 10, 15, 'parent'),
      s('b6', 'Chase replies and note any allergies', 7, 15, 'parent'),
      s('b7', 'Buy the food, decorations and party bags', 4, 45, 'parent'),
      s('b8', 'Wrap the presents', 2, 15, 'anyone'),
      s('b9', 'Bake or collect the cake and set up', 1, 40, 'parent'),
      s('b10', 'Write the thank-you notes', -3, 20, 'child', true),
    ],
  },
  {
    id: 'trip',
    title: 'Holiday or trip away',
    emoji: '🧳',
    blurb: 'Booking, packing and the bits that are easy to forget.',
    defaultName: 'Trip away',
    category: 'family',
    days: 5,
    steps: [
      s('t1', 'Check passports, cards and insurance', 35, 15, 'parent'),
      s('t2', 'Book the travel and where you are staying', 30, 30, 'parent'),
      s('t3', 'Sort time off and the school or work letters', 21, 15, 'parent'),
      s('t4', 'Plan a few things to do', 14, 25, 'anyone'),
      s('t5', 'Arrange pet or plant care', 10, 10, 'parent'),
      s('t6', 'Write a packing list', 5, 15, 'anyone'),
      s('t7', 'Buy anything missing (sun cream, adaptors)', 4, 30, 'parent'),
      s('t8', 'Pick favourite things to take in the car or on the plane', 3, 10, 'child'),
      s('t9', 'Do the laundry for packing', 2, 20, 'parent'),
      s('t10', 'Pack the bags', 1, 40, 'anyone'),
      s('t11', 'Lock up, bins out, and last check', 0, 15, 'parent'),
    ],
  },
  {
    id: 'school-trip',
    title: 'School trip',
    emoji: '🚌',
    blurb: 'Forms, money, packed lunch and a bag ready by the door.',
    defaultName: 'School trip',
    category: 'school',
    days: 1,
    steps: [
      s('s1', 'Sign the consent form', 14, 5, 'parent'),
      s('s2', 'Pay for the trip', 12, 5, 'parent'),
      s('s3', 'Check what to wear and bring', 5, 10, 'anyone'),
      s('s4', 'Sort any medication and allergy details', 4, 10, 'parent'),
      s('s5', 'Buy packed lunch things', 2, 15, 'parent'),
      s('s6', 'Pack the bag', 1, 15, 'child'),
      s('s7', 'Make the packed lunch', 0, 10, 'parent'),
    ],
  },
  {
    id: 'christmas',
    title: 'Christmas',
    emoji: '🎄',
    blurb: 'Presents, food and visits, spread out so December stays friendly.',
    defaultName: 'Christmas',
    category: 'family',
    days: 3,
    steps: [
      s('c1', 'Decide the budget and who to buy for', 49, 20, 'parent'),
      s('c2', 'Ask for wish lists', 42, 15, 'anyone'),
      s('c3', 'Order the main presents', 35, 45, 'parent'),
      s('c4', 'Plan the days: who is where, and when', 28, 25, 'parent'),
      s('c5', 'Write and send the cards', 21, 30, 'anyone'),
      s('c6', 'Plan the food and book the delivery slot', 18, 25, 'parent'),
      s('c7', 'Buy the stocking fillers', 14, 40, 'parent'),
      s('c8', 'Wrap the presents', 5, 45, 'anyone'),
      s('c9', 'Make the last food shop', 3, 45, 'parent'),
      s('c10', 'Tidy up and make beds for guests', 2, 30, 'anyone', true),
      s('c11', 'Do a few jobs ahead of the day', 1, 30, 'anyone'),
    ],
  },
  {
    id: 'term',
    title: 'New school term',
    emoji: '🎒',
    blurb: 'Uniform, kit, timetables and a gentle return to routines.',
    defaultName: 'New term',
    category: 'school',
    days: 1,
    steps: [
      s('n1', 'Check the term dates and any letters', 14, 15, 'parent'),
      s('n2', 'Look over uniform and shoes', 12, 20, 'parent'),
      s('n3', 'Order or buy what is needed', 10, 30, 'parent'),
      s('n4', 'Sort stationery and the school bag', 5, 20, 'child'),
      s('n5', 'Add clubs and pick-ups to the calendar', 4, 20, 'parent'),
      s('n6', 'Ease bedtime back to school time', 3, 10, 'anyone'),
      s('n7', 'Lay out tomorrow’s clothes and bag', 1, 10, 'child'),
    ],
  },
  {
    id: 'visitors',
    title: 'Visitors staying',
    emoji: '🛏️',
    blurb: 'A bed, some food in, and time to enjoy them.',
    defaultName: 'Visitors staying',
    category: 'family',
    days: 3,
    steps: [
      s('v1', 'Confirm dates and any needs (food, access, pets)', 14, 10, 'parent'),
      s('v2', 'Decide who sleeps where', 10, 10, 'parent'),
      s('v3', 'Plan a couple of meals and things to do', 7, 20, 'anyone'),
      s('v4', 'Wash the bedding and clear a bit of space', 3, 30, 'parent'),
      s('v5', 'Do the food shop', 2, 40, 'parent'),
      s('v6', 'Freshen the bathroom and put out towels', 1, 20, 'anyone'),
    ],
  },
  {
    id: 'day-out',
    title: 'Day out',
    emoji: '🌳',
    blurb: 'A simple plan so the day itself is easy.',
    defaultName: 'Day out',
    category: 'family',
    days: 1,
    steps: [
      s('d1', 'Pick the place and check opening times', 7, 15, 'anyone'),
      s('d2', 'Book tickets or a table if needed', 5, 10, 'parent'),
      s('d3', 'Check the weather and how to get there', 2, 10, 'parent'),
      s('d4', 'Plan snacks and lunch', 1, 15, 'parent'),
      s('d5', 'Pack the bag and charge the phones', 1, 15, 'anyone'),
    ],
  },
  {
    id: 'other',
    title: 'Something else',
    emoji: '✨',
    blurb: 'Start blank and add your own small steps.',
    defaultName: 'My plan',
    category: 'other',
    days: 1,
    steps: [s('o1', 'Decide what a good result looks like', 14, 10, 'anyone'), s('o2', 'Make a list of what is needed', 10, 15, 'anyone'), s('o3', 'Do the first small thing', 7, 20, 'anyone')],
  },
]

export const templateById = (id: string): PlanTemplate | undefined => TEMPLATES.find((t) => t.id === id)
