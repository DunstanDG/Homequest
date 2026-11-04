/**
 * The starter rooms and jobs for family sessions: a first catalogue the family then edits (add, rename, remove, retime).
 * Jobs are kept per room. `perChild` rooms are created once for each child. `after` names a job in the same room that
 * comes first. Minutes and minimum ages are estimates, not rules. Never put real names here: this file is public.
 */
import type { HouseDepth, HouseLink, HouseNeed } from '../types'

export interface StarterJob {
  title: string
  minutes: number
  minAge: number
  depth: HouseDepth
  resetDays: number
  months?: number[]
  requires?: HouseNeed
  link?: HouseLink
  phase: number
  after?: string
  notes?: string
  shopName?: string
  cleaner?: boolean
}

export interface StarterRoom {
  key: string
  name: string
  emoji: string
  outdoor?: boolean
  quickTidy?: boolean
  requires?: HouseNeed
  perChild?: boolean
  jobs: StarterJob[]
}

export const STARTER_ROOMS: StarterRoom[] = [
  {
    key: 'kitchen',
    name: 'Kitchen',
    emoji: '🍳',
    quickTidy: true,
    jobs: [
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Clear draining board', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy shelves', minutes: 5, minAge: 8, depth: 'standard', resetDays: 7, phase: 1 },
      { title: 'Empty dishwasher', minutes: 8, minAge: 8, depth: 'quick', resetDays: 0, phase: 2, notes: 'Remove if there is no dishwasher.' },
      { title: 'Empty washing machine', minutes: 4, minAge: 8, depth: 'standard', resetDays: 0, link: 'machine', phase: 2 },
      { title: 'Empty recycling', minutes: 3, minAge: 6, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Empty bin', minutes: 3, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Empty food recycling', minutes: 2, minAge: 6, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Discard old food in fridge', minutes: 5, minAge: 10, depth: 'standard', resetDays: 7, phase: 2, notes: 'Best just before bin day.' },
      { title: 'Wipe sides', minutes: 5, minAge: 6, depth: 'quick', resetDays: 0, phase: 3, after: 'Clear draining board' },
      { title: 'Change cloths', minutes: 1, minAge: 6, depth: 'standard', resetDays: 3, phase: 3 },
      { title: 'Clean fridge', minutes: 20, minAge: 10, depth: 'deep', resetDays: 28, phase: 3, after: 'Discard old food in fridge' },
      { title: 'Fill dishwasher', minutes: 8, minAge: 8, depth: 'quick', resetDays: 0, phase: 4, after: 'Empty dishwasher' },
      {
        title: 'Fill washing machine',
        minutes: 3,
        minAge: 8,
        depth: 'standard',
        resetDays: 0,
        link: 'machine',
        phase: 4,
        after: 'Empty washing machine',
        notes: 'Starts a wait: the finished wash needs emptying later.',
      },
      {
        title: 'Wash cloths',
        minutes: 2,
        minAge: 10,
        depth: 'standard',
        resetDays: 3,
        link: 'machine',
        phase: 4,
        after: 'Change cloths',
        notes: 'Could simply be added to the same wash as Fill washing machine.',
      },
      { title: 'Fill water filter', minutes: 2, minAge: 6, depth: 'standard', resetDays: 0, phase: 4 },
      { title: 'Change dog water', minutes: 1, minAge: 5, depth: 'quick', resetDays: 0, requires: 'dog', link: 'dog-water', phase: 4, notes: 'Ticking it logs the dog’s water.' },
      { title: 'Wipe hob and cooker top', minutes: 5, minAge: 10, depth: 'standard', resetDays: 0, phase: 3, after: 'Wipe sides', cleaner: true },
      { title: 'Clean sink and taps', minutes: 4, minAge: 8, depth: 'standard', resetDays: 0, phase: 3, after: 'Wipe sides', cleaner: true },
      { title: 'Wipe microwave inside', minutes: 4, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, cleaner: true },
      { title: 'Clean oven', minutes: 30, minAge: 18, depth: 'deep', resetDays: 90, phase: 3, notes: 'Adults only (oven cleaner).', cleaner: true },
      { title: 'Wipe cupboard fronts and handles', minutes: 8, minAge: 8, depth: 'deep', resetDays: 14, phase: 3, cleaner: true },
      { title: 'Clean dishwasher filter', minutes: 5, minAge: 14, depth: 'deep', resetDays: 30, phase: 3 },
      { title: 'Descale kettle', minutes: 5, minAge: 12, depth: 'deep', resetDays: 30, phase: 3 },
      { title: 'Clean washing machine drawer and seal', minutes: 5, minAge: 12, depth: 'deep', resetDays: 30, phase: 3 },
      { title: 'Clean tumble dryer filter', minutes: 2, minAge: 10, depth: 'standard', resetDays: 7, phase: 3, notes: 'Remove if there is no dryer.' },
      { title: 'Defrost and tidy freezer', minutes: 25, minAge: 14, depth: 'deep', resetDays: 180, phase: 3 },
      { title: 'Wash and sterilise bottles', minutes: 10, minAge: 12, depth: 'standard', resetDays: 0, requires: 'baby', phase: 3, notes: 'Only once there is a baby on bottles.' },
      { title: 'Sweep and mop floor', minutes: 12, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
    ],
  },
  {
    key: 'dining',
    name: 'Dining room',
    emoji: '🍽️',
    quickTidy: true,
    jobs: [
      { title: 'Clear table', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy sides', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Wipe table', minutes: 2, minAge: 6, depth: 'quick', resetDays: 0, phase: 3, after: 'Clear table' },
      {
        title: 'Water plants',
        minutes: 3,
        minAge: 6,
        depth: 'standard',
        resetDays: 0,
        requires: 'plants',
        link: 'plants',
        phase: 4,
        notes: 'Waters this room’s plants that are due (from the Plants tab).',
      },
      {
        title: 'Update board',
        minutes: 3,
        minAge: 8,
        depth: 'standard',
        resetDays: 0,
        link: 'board',
        phase: 4,
        notes: 'Opens this week’s dinners and plans to copy onto the whiteboard. Best after the weekly summit.',
      },
      { title: 'Wipe chairs', minutes: 3, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, cleaner: true },
      { title: 'Dust surfaces', minutes: 5, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, after: 'Tidy sides', cleaner: true },
      { title: 'Sweep or hoover floor', minutes: 6, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
    ],
  },
  {
    key: 'sitting',
    name: 'Sitting room',
    emoji: '🛋️',
    quickTidy: true,
    jobs: [
      { title: 'Make sofa', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put away throws', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy sides', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Empty bin', minutes: 2, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Collect cups and plates', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy toys, books and remotes', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Dust surfaces and TV', minutes: 6, minAge: 10, depth: 'standard', resetDays: 7, phase: 3, after: 'Tidy sides', cleaner: true },
      { title: 'Hoover floor', minutes: 8, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
      { title: 'Hoover under sofa cushions', minutes: 6, minAge: 10, depth: 'deep', resetDays: 30, phase: 5, after: 'Make sofa', cleaner: true },
      { title: 'Water plants', minutes: 3, minAge: 6, depth: 'standard', resetDays: 0, requires: 'plants', link: 'plants', phase: 4 },
    ],
  },
  {
    key: 'hall',
    name: 'Hall',
    emoji: '🚪',
    quickTidy: true,
    jobs: [
      { title: 'Tidy shoes', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy coats', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Sort post and junk mail', minutes: 3, minAge: 10, depth: 'standard', resetDays: 0, phase: 1 },
      { title: 'Wipe door handles and light switches', minutes: 3, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, cleaner: true },
      { title: 'Shake out door mat', minutes: 3, minAge: 8, depth: 'standard', resetDays: 7, phase: 5, cleaner: true },
      { title: 'Hoover and mop floor', minutes: 8, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
    ],
  },
  {
    key: 'bathroom',
    name: 'Bathroom',
    emoji: '🛁',
    jobs: [
      { title: 'Clear bath caddy', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy bottles', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy towels', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy cupboard', minutes: 5, minAge: 10, depth: 'standard', resetDays: 30, phase: 1 },
      { title: 'Empty bin', minutes: 2, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Clean shower screen', minutes: 5, minAge: 10, depth: 'standard', resetDays: 7, phase: 3, cleaner: true },
      { title: 'Clean bath', minutes: 8, minAge: 10, depth: 'standard', resetDays: 7, phase: 3, after: 'Clear bath caddy', cleaner: true },
      { title: 'Clean sink', minutes: 4, minAge: 8, depth: 'standard', resetDays: 0, phase: 3, cleaner: true },
      { title: 'Clean toilet', minutes: 6, minAge: 12, depth: 'standard', resetDays: 0, phase: 3, notes: 'Uses cleaning chemicals.', cleaner: true },
      { title: 'Clean under bath mat', minutes: 3, minAge: 10, depth: 'deep', resetDays: 14, phase: 3, cleaner: true },
      { title: 'Wash towels', minutes: 3, minAge: 10, depth: 'standard', resetDays: 7, link: 'machine', phase: 4, after: 'Tidy towels', notes: 'Starts a wait.' },
      { title: 'Fill soap', minutes: 1, minAge: 5, depth: 'quick', resetDays: 0, link: 'shopping', phase: 4, after: 'Clean sink', shopName: 'Hand soap' },
      { title: 'Fill toilet roll basket', minutes: 1, minAge: 5, depth: 'quick', resetDays: 0, link: 'shopping', phase: 4, notes: 'Top up the spare-roll basket.', shopName: 'Toilet roll' },
      { title: 'Fill toilet roll holder', minutes: 1, minAge: 5, depth: 'quick', resetDays: 0, link: 'shopping', phase: 4, shopName: 'Toilet roll' },
      { title: 'Water plants', minutes: 3, minAge: 6, depth: 'standard', resetDays: 0, requires: 'plants', link: 'plants', phase: 4 },
      { title: 'Wipe mirror and taps', minutes: 3, minAge: 8, depth: 'standard', resetDays: 0, phase: 3, cleaner: true },
      { title: 'Clear plug-hole hair', minutes: 3, minAge: 12, depth: 'standard', resetDays: 7, phase: 3, cleaner: true },
      { title: 'Mop floor', minutes: 6, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
      { title: 'Wash bath mat', minutes: 3, minAge: 10, depth: 'deep', resetDays: 14, link: 'machine', phase: 4, after: 'Clean under bath mat' },
      { title: 'Descale shower head', minutes: 5, minAge: 14, depth: 'deep', resetDays: 60, phase: 3, cleaner: true },
      { title: 'Clean extractor fan', minutes: 5, minAge: 18, depth: 'deep', resetDays: 90, phase: 3, cleaner: true },
      { title: 'Check medicine cabinet dates', minutes: 5, minAge: 18, depth: 'deep', resetDays: 90, phase: 2, notes: 'Adults only. Safety: bin anything out of date.' },
    ],
  },
  {
    key: 'child',
    name: "Child's room",
    emoji: '🧸',
    perChild: true,
    jobs: [
      { title: 'Pick up anything on floor', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put washing in basket', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put clothes away', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Clear desk', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Make bed', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1, after: 'Change bed sheets' },
      { title: 'Empty bin', minutes: 2, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Tidy toys and books', minutes: 5, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Check under the bed', minutes: 3, minAge: 6, depth: 'standard', resetDays: 14, phase: 1 },
      { title: 'Change bed sheets', minutes: 10, minAge: 12, depth: 'standard', resetDays: 14, link: 'machine', phase: 1, notes: 'Strip the bed; the sheets then join a wash. Younger children help.' },
      { title: 'Dust surfaces', minutes: 4, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, after: 'Clear desk', cleaner: true },
      { title: 'Hoover floor', minutes: 6, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
      { title: 'Sort outgrown clothes', minutes: 20, minAge: 10, depth: 'deep', resetDays: 90, months: [3, 9], phase: 1, notes: 'Seasonal wardrobe change: a good one for the Deep clean.' },
    ],
  },
  {
    key: 'parents',
    name: "Parents' room",
    emoji: '🛏️',
    jobs: [
      { title: 'Pick up anything on floor', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put laundry in basket', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put clothes away', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy sides', minutes: 4, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Tidy shelves', minutes: 5, minAge: 8, depth: 'standard', resetDays: 7, phase: 1 },
      { title: 'Make bed', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1, after: 'Change bed sheets' },
      { title: 'Empty bin', minutes: 2, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Water plants', minutes: 3, minAge: 6, depth: 'standard', resetDays: 0, requires: 'plants', link: 'plants', phase: 4 },
      { title: 'Air the room (open window)', minutes: 1, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Change bed sheets', minutes: 12, minAge: 12, depth: 'standard', resetDays: 14, link: 'machine', phase: 1 },
      { title: 'Dust surfaces', minutes: 5, minAge: 8, depth: 'standard', resetDays: 7, phase: 3, after: 'Tidy sides', cleaner: true },
      { title: 'Hoover floor', minutes: 8, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
      { title: 'Turn the mattress', minutes: 10, minAge: 18, depth: 'deep', resetDays: 180, phase: 3, after: 'Change bed sheets' },
    ],
  },
  {
    key: 'office',
    name: 'Office',
    emoji: '💻',
    jobs: [
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Put laundry in basket', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Clear desk', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Make bed', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1, notes: 'The spare or sofa bed.' },
      { title: 'Empty bin', minutes: 2, minAge: 8, depth: 'quick', resetDays: 0, phase: 2 },
      { title: 'Water plants', minutes: 3, minAge: 6, depth: 'standard', resetDays: 0, requires: 'plants', link: 'plants', phase: 4 },
      { title: 'Shred or recycle paper', minutes: 5, minAge: 10, depth: 'standard', resetDays: 7, phase: 2 },
      { title: 'File paperwork and clear in-tray', minutes: 10, minAge: 14, depth: 'standard', resetDays: 14, phase: 1 },
      { title: 'Dust desk, shelves and screens', minutes: 5, minAge: 10, depth: 'standard', resetDays: 14, phase: 3, after: 'Clear desk', cleaner: true },
      { title: 'Wipe keyboard and screen', minutes: 3, minAge: 14, depth: 'deep', resetDays: 30, phase: 3, after: 'Clear desk' },
      { title: 'Hoover floor', minutes: 6, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
    ],
  },
  {
    key: 'garden',
    name: 'Garden',
    emoji: '🌳',
    outdoor: true,
    jobs: [
      { title: 'Pick up dog mess', minutes: 5, minAge: 8, depth: 'quick', resetDays: 0, requires: 'dog', phase: 1 },
      { title: 'Pick up leaves', minutes: 15, minAge: 6, depth: 'standard', resetDays: 7, months: [9, 10, 11, 12], phase: 1 },
      { title: 'Weed', minutes: 20, minAge: 6, depth: 'standard', resetDays: 14, months: [3, 4, 5, 6, 7, 8, 9, 10], phase: 3 },
      {
        title: 'Prune plants',
        minutes: 20,
        minAge: 14,
        depth: 'standard',
        resetDays: 90,
        months: [3, 4, 10],
        phase: 3,
        notes: 'Really depends on the plant; months are a rough guide. Adults or older children (tools).',
      },
      { title: 'Water plants', minutes: 10, minAge: 6, depth: 'standard', resetDays: 0, months: [4, 5, 6, 7, 8, 9], requires: 'plants', link: 'plants', phase: 4, notes: 'Skip it if it has rained.' },
      { title: 'Oil furniture', minutes: 30, minAge: 14, depth: 'deep', resetDays: 365, months: [4, 5], phase: 3, after: 'Uncover furniture' },
      { title: 'Cover furniture', minutes: 10, minAge: 12, depth: 'standard', resetDays: 365, months: [10, 11], phase: 4, after: 'Bring cushions in', notes: 'Once a year.' },
      { title: 'Clean BBQ', minutes: 25, minAge: 14, depth: 'standard', resetDays: 90, months: [4, 9], phase: 3, notes: 'Before the season and at the end of it.' },
      { title: 'Uncover furniture', minutes: 5, minAge: 12, depth: 'standard', resetDays: 365, months: [4], phase: 1, notes: 'The spring partner of Cover furniture.' },
      { title: 'Put cushions out', minutes: 3, minAge: 5, depth: 'quick', resetDays: 365, months: [4, 5], phase: 4, after: 'Uncover furniture' },
      { title: 'Bring cushions in', minutes: 3, minAge: 5, depth: 'standard', resetDays: 365, months: [10], phase: 2 },
      { title: 'Mow the lawn', minutes: 25, minAge: 14, depth: 'standard', resetDays: 7, months: [4, 5, 6, 7, 8, 9, 10], phase: 3, notes: 'Remove if there is no lawn.' },
      { title: 'Sweep patio or decking', minutes: 10, minAge: 8, depth: 'standard', resetDays: 14, phase: 5, after: 'Pick up leaves' },
      { title: 'Refill bird feeders', minutes: 5, minAge: 6, depth: 'standard', resetDays: 7, phase: 4, notes: 'Remove if you have none.' },
      { title: 'Clear gutters', minutes: 30, minAge: 18, depth: 'deep', resetDays: 365, months: [10, 11], phase: 3, notes: 'Adults only (ladder).' },
      { title: 'Jet-wash patio', minutes: 60, minAge: 18, depth: 'deep', resetDays: 365, months: [4, 5], phase: 3 },
      { title: 'Drain and cover outside tap', minutes: 5, minAge: 18, depth: 'standard', resetDays: 365, months: [11], phase: 3, notes: 'Before the first frost.' },
      { title: 'Tidy shed or garage', minutes: 20, minAge: 10, depth: 'deep', resetDays: 90, phase: 1 },
    ],
  },
  {
    key: 'stairs',
    name: 'Stairs & landing',
    emoji: '🪜',
    jobs: [
      { title: 'Take things up and down stairs', minutes: 3, minAge: 5, depth: 'quick', resetDays: 0, phase: 1 },
      { title: 'Hoover stairs', minutes: 8, minAge: 10, depth: 'standard', resetDays: 0, phase: 5, cleaner: true },
      { title: 'Dust banister and skirting', minutes: 5, minAge: 8, depth: 'deep', resetDays: 14, phase: 3, cleaner: true },
    ],
  },
  {
    key: 'nursery',
    name: 'Nursery',
    emoji: '🍼',
    requires: 'baby',
    jobs: [
      { title: 'Pick up anything on floor', minutes: 2, minAge: 5, depth: 'quick', resetDays: 0, requires: 'baby', phase: 1 },
      {
        title: 'Restock changing station',
        minutes: 3,
        minAge: 8,
        depth: 'quick',
        resetDays: 0,
        requires: 'baby',
        link: 'shopping',
        phase: 4,
        notes: 'Nappies, wipes, cream.',
        shopName: 'Nappies and wipes',
      },
      { title: 'Empty nappy bin', minutes: 2, minAge: 10, depth: 'quick', resetDays: 0, requires: 'baby', phase: 2 },
      { title: 'Wipe changing mat and cot', minutes: 5, minAge: 10, depth: 'standard', resetDays: 7, requires: 'baby', phase: 3 },
      { title: 'Wash baby bedding and muslins', minutes: 4, minAge: 10, depth: 'standard', resetDays: 7, requires: 'baby', link: 'machine', phase: 4 },
      { title: 'Pack away outgrown baby clothes', minutes: 15, minAge: 10, depth: 'deep', resetDays: 60, requires: 'baby', phase: 1 },
    ],
  },
  {
    key: 'house',
    name: 'Whole house',
    emoji: '🏠',
    jobs: [
      { title: 'Put away clean laundry', minutes: 10, minAge: 6, depth: 'quick', resetDays: 0, phase: 4, notes: 'The step that follows every wash.' },
      { title: 'Put bins out or bring bins in', minutes: 3, minAge: 12, depth: 'standard', resetDays: 7, phase: 2, notes: 'Easiest as a weekly reminder on bin day.' },
      { title: 'Test smoke and CO alarms', minutes: 5, minAge: 14, depth: 'deep', resetDays: 30, phase: 3, notes: 'Safety. Adults or older children.' },
      { title: 'Clean windows inside', minutes: 40, minAge: 12, depth: 'deep', resetDays: 60, phase: 3, cleaner: true },
    ],
  },
]
