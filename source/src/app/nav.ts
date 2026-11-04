/**
 * Where everything lives: the tab bar for each role, which screens take the whole display or hide the + button, and
 * the full list of features the More hub shows. One table, so a feature can't exist without a way to reach it, and
 * the tabs, the hub (and later search or the tour) all read the same entries.
 */
import { bornBabies, expectedBabies } from '@/family/arrival/arrival'
import { looksAfterOf } from '@/family/care'
import { startOfWeek, weekday, ymdOf } from '@/family/dates'
import { rankIdeas } from '@/family/ideas'
import { duePlants, livePlants } from '@/family/plants'
import { MAIN_LIST, itemsOf, liveLists } from '@/family/shopping'
import { assistantUrl, pendingProposals } from '@/family/travel/assistant'
import { isThisWeeksReady, rtSettingsOf } from '@/family/travel/roundTable'
import { ringingNow, serverOn } from '@/family/travel/travel'
import type { FamilyState, Member } from '@/family/types'
import type { IconName } from '@/ui/icons'

export type Role = 'parent' | 'child'
export const roleOf = (m: Member): Role => (m.role === 'parent' ? 'parent' : 'child')

// ------------------------------------------------------------------ tabs

export interface TabDef {
  to: string
  label: string
  icon: IconName
  /** Other paths that count as being "in" this tab (so it stays highlighted). */
  also?: string[]
}

const TODAY: TabDef = { to: '/', label: 'Today', icon: 'home' }
const CALENDAR: TabDef = { to: '/calendar', label: 'Calendar', icon: 'calendar' }
const MORE: TabDef = { to: '/more', label: 'More', icon: 'grid' }

/** Parents run the house: the week, the lists and care up front; the children's side (learning, school, approvals,
 * the shop) and settings are one tap away in More. Children get their own day, homework, games and coins up front;
 * the dog, the plants, the calendar and family lists are in More. */
export function tabsFor(role: Role): TabDef[] {
  if (role === 'parent')
    return [TODAY, CALENDAR, { to: '/plan', label: 'Plan', icon: 'checklist', also: ['/project', '/run', '/house'] }, { to: '/care', label: 'Care', icon: 'hand', also: ['/baby', '/vault'] }, MORE]
  return [
    TODAY,
    { to: '/school', label: 'Homework', icon: 'school' },
    { to: '/learn', label: 'Learn', icon: 'bolt', also: ['/skills', '/rewards', '/spelling', '/play'] },
    { to: '/shop', label: 'Shop', icon: 'bag' },
    MORE,
  ]
}

/** Is `pathname` this path or somewhere under it? ('/house' covers '/house/rooms', not '/housework'.) */
export const isUnder = (pathname: string, p: string) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`))

/** The tab to highlight. Anything that isn't one of this role's tabs was reached from More, so More lights up. */
export function activeTab(tabs: readonly TabDef[], pathname: string): string {
  const hit = tabs.find((t) => [t.to, ...(t.also ?? [])].some((p) => isUnder(pathname, p)))
  return hit?.to ?? MORE.to
}

/** Screens that take the whole display (games, timers, the parent area). */
export const FULLSCREEN = ['/play', '/parent', '/dev', '/timer', '/spelling/play', '/run', '/vault', '/summit', '/round-table', '/welcome', '/house/run', '/house/start', '/checkin']

/** Screens with their own big add buttons (Care) or nothing to add (Learn, More). */
export const NO_ADD = ['/house', '/care', '/project', '/learn', '/skills', '/rewards', '/news', '/spelling', '/baby', '/school', '/shop', '/more', '/travel', '/assistant']

// ------------------------------------------------------------------ the feature list for the More hub

export interface FeatureCtx {
  f: FamilyState
  me: Member
  now: number
  /** StudyQuest updates not yet seen (needs the learner state, so the screen works it out). */
  news: number
}

export type GroupId = 'kids' | 'me' | 'week' | 'home' | 'care' | 'settings'

export const GROUPS: Record<GroupId, { title: string; sub?: string }> = {
  kids: { title: 'The children', sub: 'Checking, school, learning and coins' },
  me: { title: 'Me', sub: 'Your homework, games and coins' },
  week: { title: 'The week', sub: 'What’s on and what we’re doing together' },
  home: { title: 'Around the house', sub: 'Lists, meals, clean-ups and projects' },
  care: { title: 'Care', sub: 'Who and what depends on us' },
  settings: { title: 'Settings and help' },
}

/** Which groups each role sees, in order. */
export const GROUP_ORDER: Record<Role, GroupId[]> = {
  parent: ['kids', 'week', 'home', 'care', 'settings'],
  child: ['me', 'care', 'week', 'home', 'settings'],
}

export interface Feature {
  id: string
  emoji: string
  label: string
  /** One line: what it is for, in the family's words. */
  desc: string
  to: string
  group: GroupId
  roles: Role[]
  /** Hide it when it can't apply (no baby, no pets...). */
  show?: (x: FeatureCtx) => boolean
  /** A count worth a badge (things waiting). */
  badge?: (x: FeatureCtx) => number
}

const pets = (f: FamilyState) => Object.values(f.members).filter((m) => m.active && m.role === 'pet')
const duty = (x: FeatureCtx, d: 'pets' | 'plants' | 'baby') => looksAfterOf(x.me).has(d)
const summitDue = (x: FeatureCtx) => {
  const today = ymdOf(x.now)
  return weekday(today) >= 4 && !x.f.summits[startOfWeek(today)] ? 1 : 0
}
const pendingChecks = (f: FamilyState) => Object.values(f.done).filter((d) => d.status === 'pending').length + Object.values(f.redeems).filter((r) => r.status === 'pending').length
const toBuy = (f: FamilyState) => itemsOf(f, liveLists(f)[0]?.listId ?? MAIN_LIST).filter((i) => !i.done).length

export const FEATURES: Feature[] = [
  // ---- the children (parents)
  {
    id: 'approvals',
    emoji: '✅',
    label: 'To check',
    desc: 'Jobs, homework and treat requests waiting for a yes',
    to: '/parent?tab=approvals',
    group: 'kids',
    roles: ['parent'],
    badge: (x) => pendingChecks(x.f),
  },
  { id: 'school', emoji: '🏫', label: 'School and homework', desc: 'Timetable, term dates, clubs and what’s due', to: '/school', group: 'kids', roles: ['parent'] },
  { id: 'learn', emoji: '⚡', label: 'Learning', desc: 'How each child is getting on in StudyQuest, or play yourself', to: '/learn', group: 'kids', roles: ['parent'] },
  { id: 'progress', emoji: '📈', label: 'Learning progress', desc: 'Topics, writing, reports and XP goals per child', to: '/parent?tab=progress', group: 'kids', roles: ['parent'] },
  { id: 'shop', emoji: '🛍️', label: 'Coin shop and family goals', desc: 'Treats to spend coins on, and goals everyone chips in to', to: '/shop', group: 'kids', roles: ['parent'] },
  { id: 'coins', emoji: '🪙', label: 'Coin rates and treats', desc: 'How XP turns into coins, and what’s in the shop', to: '/parent?tab=family&s=coins', group: 'kids', roles: ['parent'] },

  // ---- me (children)
  { id: 'homework', emoji: '📚', label: 'Homework and school', desc: 'What’s due, your timetable and what to pack', to: '/school', group: 'me', roles: ['child'] },
  { id: 'learn-c', emoji: '⚡', label: 'StudyQuest', desc: 'Games in every subject. Points turn into coins', to: '/learn', group: 'me', roles: ['child'] },
  { id: 'shop-c', emoji: '🛍️', label: 'Coin shop and family goals', desc: 'Spend coins on treats, or chip in to a family goal', to: '/shop', group: 'me', roles: ['child'] },
  { id: 'skills', emoji: '🗺️', label: 'Skill map', desc: 'Every topic and how well you know it', to: '/skills', group: 'me', roles: ['child'] },

  // ---- the week
  { id: 'calendar', emoji: '📅', label: 'Calendar', desc: 'Everyone’s week, school and clubs, and who is busy', to: '/calendar', group: 'week', roles: ['parent', 'child'] },
  {
    id: 'ideas',
    emoji: '💡',
    label: 'Plans and ideas',
    desc: 'Suggest a day out, a film or a dinner and vote',
    to: '/calendar?v=plans',
    group: 'week',
    roles: ['parent', 'child'],
    badge: (x) => rankIdeas(x.f).filter((t) => t.waiting.includes(x.me.id)).length,
  },
  {
    id: 'travel',
    emoji: '🚆',
    label: 'Travel and alarms',
    desc: 'Leave times, live trains, the school run and speaker alarms',
    to: '/travel',
    group: 'week',
    roles: ['parent', 'child'],
    show: (x) => serverOn(x.f),
    badge: (x) => ringingNow(x.f, ymdOf(x.now)).length,
  },
  {
    id: 'assistant',
    emoji: '💬',
    label: 'Family assistant',
    desc: 'Ask about the day or week; add the changes it suggests',
    to: '/assistant',
    group: 'week',
    roles: ['parent', 'child'],
    show: (x) => serverOn(x.f) && (!!assistantUrl(x.f) || pendingProposals(x.f, x.now).length > 0),
    badge: (x) => pendingProposals(x.f, x.now).length,
  },
  {
    id: 'roundtable',
    emoji: '🪑',
    label: 'Round table',
    desc: 'The week ahead with the assistant: raise things, see its agenda and suggested fixes',
    to: '/round-table',
    group: 'week',
    roles: ['parent', 'child'],
    show: (x) => serverOn(x.f) && (rtSettingsOf(x.f).on || Object.keys(x.f.travel.roundTables).length > 0),
    badge: (x) => (isThisWeeksReady(x.f, ymdOf(x.now), x.now) ? 1 : 0),
  },
  { id: 'summit', emoji: '🧭', label: 'Weekly summit', desc: 'Five minutes on Friday to plan the week ahead', to: '/summit', group: 'week', roles: ['parent'], badge: summitDue },

  // ---- around the house
  {
    id: 'shopping',
    emoji: '🛒',
    label: 'Shopping list',
    desc: 'Grouped by aisle, with a shop mode for the supermarket',
    to: '/plan?t=shop',
    group: 'home',
    roles: ['parent', 'child'],
    badge: (x) => toBuy(x.f),
  },
  { id: 'meals', emoji: '🍽️', label: 'Meals', desc: 'The week’s dinners and recipes; feeds the shopping list', to: '/plan?t=meals', group: 'home', roles: ['parent', 'child'] },
  { id: 'cleanups', emoji: '🧹', label: 'Family clean-ups', desc: 'House clean or garden day: everyone gets a room and ticks jobs', to: '/plan?t=sessions', group: 'home', roles: ['parent', 'child'] },
  { id: 'rooms', emoji: '🚪', label: 'Rooms and jobs', desc: 'The rooms in the house and the jobs in each', to: '/house/rooms', group: 'home', roles: ['parent'] },
  { id: 'sessions', emoji: '⏱️', label: 'Routines and checklists', desc: 'Steps to work through with the clock running', to: '/plan?t=sessions', group: 'home', roles: ['parent', 'child'] },
  { id: 'projects', emoji: '🧩', label: 'Projects', desc: 'A big goal broken into small steps', to: '/plan?t=projects', group: 'home', roles: ['parent', 'child'] },
  { id: 'dump', emoji: '🧠', label: 'Brain dump', desc: 'Anything half-formed, to sort out later. Can be private', to: '/plan?t=dump', group: 'home', roles: ['parent', 'child'] },

  // ---- care
  {
    id: 'baby',
    emoji: '👶',
    label: 'Baby',
    desc: 'Feeds, nappies, sleep, medicine and shifts',
    to: '/care',
    group: 'care',
    roles: ['parent', 'child'],
    show: (x) => bornBabies(x.f).length > 0 && duty(x, 'baby'),
  },
  {
    id: 'babyplan',
    emoji: '💗',
    label: 'New-baby plan',
    desc: 'The first two weeks: checks, ideas and easy meals',
    to: '/baby',
    group: 'care',
    roles: ['parent'],
    show: (x) => bornBabies(x.f).length + expectedBabies(x.f).length > 0,
  },
  {
    id: 'pets',
    emoji: '🐕',
    label: 'Pets',
    desc: 'Meals, walks, water, flea and worming',
    to: '/care',
    group: 'care',
    roles: ['parent', 'child'],
    show: (x) => pets(x.f).length > 0 && duty(x, 'pets'),
  },
  {
    id: 'plants',
    emoji: '🪴',
    label: 'Plants',
    desc: 'Who needs a water, and a watering round',
    to: '/care?s=plants',
    group: 'care',
    roles: ['parent', 'child'],
    show: (x) => duty(x, 'plants'),
    badge: (x) => (livePlants(x.f).length ? duePlants(x.f, x.now).length : 0),
  },
  { id: 'vault', emoji: '🗂️', label: 'Vault', desc: 'Health numbers, microchip, passport dates. Hidden until tapped', to: '/vault', group: 'care', roles: ['parent'] },
  {
    id: 'voice',
    emoji: '🗣️',
    label: 'Voice logging',
    desc: 'Log a feed or nappy by talking to the speaker',
    to: '/parent?tab=data&s=voice',
    group: 'care',
    roles: ['parent'],
    show: (x) => bornBabies(x.f).length + expectedBabies(x.f).length > 0,
  },

  // ---- settings and help
  { id: 'people', emoji: '👨‍👩‍👧', label: 'People, pets and the baby', desc: 'Add or edit the family, and who looks after what', to: '/parent?tab=family&s=people', group: 'settings', roles: ['parent'] },
  {
    id: 'routines',
    emoji: '🌅',
    label: 'Check-ins and routines',
    desc: 'Wake, leave and bed times and the habits for each person',
    to: '/parent?tab=family&s=checkins',
    group: 'settings',
    roles: ['parent'],
  },
  { id: 'coparent', emoji: '🏠', label: 'Co-parenting', desc: 'Share a child’s week with their other home', to: '/parent?tab=data&s=coparent', group: 'settings', roles: ['parent'] },
  { id: 'sync', emoji: '☁️', label: 'Phones, sharing and backup', desc: 'The family code, sync, notifications and backups', to: '/parent?tab=data&s=sync', group: 'settings', roles: ['parent'] },
  { id: 'private', emoji: '🔑', label: 'Private keys', desc: 'Who can read private thoughts', to: '/parent?tab=data&s=private', group: 'settings', roles: ['parent'] },
  { id: 'news', emoji: '✨', label: 'What’s new', desc: 'Fixes and new things in each release', to: '/news', group: 'settings', roles: ['parent', 'child'], badge: (x) => x.news },
  { id: 'parent', emoji: '🔒', label: 'Parent area', desc: 'Everything above in one place, behind the PIN', to: '/parent', group: 'settings', roles: ['parent'] },
]

/** The features this person can see, grouped in their order. Empty groups are left out. */
export function hubFor(x: FeatureCtx): { group: GroupId; items: (Feature & { count: number })[] }[] {
  const role = roleOf(x.me)
  return GROUP_ORDER[role]
    .map((group) => ({
      group,
      items: FEATURES.filter((it) => it.group === group && it.roles.includes(role) && (!it.show || it.show(x))).map((it) => ({ ...it, count: it.badge?.(x) ?? 0 })),
    }))
    .filter((g) => g.items.length > 0)
}

/** For the More tab's dot: anything in the hub with a count. */
export const hubHasNews = (x: FeatureCtx) => hubFor(x).some((g) => g.items.some((i) => i.count > 0 && i.id !== 'shopping' && i.id !== 'plants'))
