/**
 * Where everything lives: the tab bar for each role, which screens take the whole display or hide the + button, and
 * the full list of features. One table, so a feature can't exist without a way to reach it, and the tabs, the More
 * hub, the Settings screen and the search box at the top of More all read the same entries.
 *
 * Calm navigation (0.18): More keeps to about eight entries; setup and admin live in Settings; anything already on a
 * tab or inside another screen is still found by search. The order of entries is fixed by this file and never by the
 * family's data: a count can appear beside an entry, but nothing moves.
 */
import { bornBabies, expectedBabies } from '@/family/arrival/arrival'
import { looksAfterOf } from '@/family/care'
import { startOfWeek, weekday, ymdOf } from '@/family/dates'
import { rankIdeas } from '@/family/ideas'
import { duePlants, livePlants } from '@/family/plants'
import { MAIN_LIST, itemsOf, liveLists } from '@/family/shopping'
import { assistantUrl, pendingProposals } from '@/family/travel/assistant'
import { isThisWeeksReady } from '@/family/travel/roundTable'
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
export const FULLSCREEN = ['/play', '/parent', '/dev', '/timer', '/spelling/play', '/run', '/vault', '/week', '/summit', '/round-table', '/welcome', '/house/run', '/house/start', '/checkin']

/** Screens with their own big add buttons (Care) or nothing to add (Learn, More). */
export const NO_ADD = ['/house', '/care', '/project', '/learn', '/skills', '/rewards', '/news', '/spelling', '/baby', '/school', '/shop', '/more', '/settings', '/travel', '/assistant']

// ------------------------------------------------------------------ the feature list (More, Settings, search)

export interface FeatureCtx {
  f: FamilyState
  me: Member
  now: number
  /** StudyQuest updates not yet seen (needs the learner state, so the screen works it out). */
  news: number
}

/** Where a group is listed: the More hub, the Settings screen, or only in search (it's on a tab, or inside another
 * screen, already). */
export type Hub = 'more' | 'settings' | 'search'

export type GroupId = 'kids' | 'week' | 'home' | 'care' | 'help' | 'comfort' | 'family' | 'phones' | 'start' | 'elsewhere'

export const GROUPS: Record<GroupId, { title: string; sub?: string; hub: Hub }> = {
  kids: { title: 'The children', sub: 'Checking, school, learning and coins', hub: 'more' },
  week: { title: 'Our week', sub: 'What’s on, and planning it together', hub: 'more' },
  home: { title: 'Around the house', sub: 'Lists, meals and routines', hub: 'more' },
  care: { title: 'Care', sub: 'Who and what depends on us', hub: 'more' },
  help: { title: 'Settings and help', hub: 'more' },
  comfort: { title: 'Comfort', hub: 'settings' },
  family: { title: 'The family', sub: 'Who’s who, daily rhythms, coins and the other home', hub: 'settings' },
  phones: { title: 'Phones and data', sub: 'Sharing, backups, keys and the home server', hub: 'settings' },
  start: { title: 'Help and updates', hub: 'settings' },
  elsewhere: { title: 'Elsewhere', hub: 'search' },
}

/** Which groups each role sees, in order (each screen shows the ones for its hub). */
export const GROUP_ORDER: Record<Role, GroupId[]> = {
  parent: ['kids', 'week', 'help', 'comfort', 'family', 'phones', 'start', 'elsewhere'],
  child: ['week', 'home', 'care', 'help', 'comfort', 'start', 'elsewhere'],
}

export interface Feature {
  id: string
  emoji: string
  label: string
  /** One line: what it is for, in the family's words. */
  desc: string
  to: string
  /** Its group, or a group per role (the shopping list is on parents' Plan tab, but in children's More). */
  group: GroupId | Partial<Record<Role, GroupId>>
  roles: Role[]
  /** For search results in "elsewhere": where it is (e.g. "Plan tab"). */
  where?: string
  /** Extra words search should match. */
  keywords?: string
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
const roundTableReady = (x: FeatureCtx) => (serverOn(x.f) && isThisWeeksReady(x.f, ymdOf(x.now), x.now) ? 1 : 0)
const pendingChecks = (f: FamilyState) => Object.values(f.done).filter((d) => d.status === 'pending').length + Object.values(f.redeems).filter((r) => r.status === 'pending').length
const toBuy = (f: FamilyState) => itemsOf(f, liveLists(f)[0]?.listId ?? MAIN_LIST).filter((i) => !i.done).length
const hasBaby = (x: FeatureCtx) => bornBabies(x.f).length + expectedBabies(x.f).length > 0
const BOTH: Role[] = ['parent', 'child']

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
    keywords: 'approvals approve check',
    badge: (x) => pendingChecks(x.f),
  },
  { id: 'school', emoji: '🏫', label: 'School and homework', desc: 'Timetable, term dates, clubs and what’s due', to: '/school', group: 'kids', roles: ['parent'] },
  { id: 'learn', emoji: '⚡', label: 'Learning', desc: 'How each child is getting on in StudyQuest, or play yourself', to: '/learn', group: 'kids', roles: ['parent'], keywords: 'studyquest games' },
  { id: 'shop', emoji: '🛍️', label: 'Coin shop and family goals', desc: 'Treats to spend coins on, and goals everyone chips in to', to: '/shop', group: 'kids', roles: ['parent'], keywords: 'rewards treats' },

  // ---- the week
  { id: 'calendar', emoji: '📅', label: 'Calendar', desc: 'Everyone’s week, school and clubs, and who is busy', to: '/calendar', group: { parent: 'elsewhere', child: 'week' }, roles: BOTH, where: 'Calendar tab', keywords: 'events diary' },
  {
    id: 'week',
    emoji: '🧭',
    label: 'Weekly plan',
    desc: 'A few short steps: things to raise, the week ahead, and this week’s 5',
    to: '/week',
    group: 'week',
    roles: BOTH,
    keywords: 'summit round table agenda raise plan the week focus',
    badge: (x) => Math.max(roundTableReady(x), roleOf(x.me) === 'parent' ? summitDue(x) : 0),
  },
  {
    id: 'ideas',
    emoji: '💡',
    label: 'Plans and ideas',
    desc: 'Suggest a day out, a film or a dinner and vote',
    to: '/calendar?v=plans',
    group: 'week',
    roles: BOTH,
    keywords: 'vote together day out',
    badge: (x) => rankIdeas(x.f).filter((t) => t.waiting.includes(x.me.id)).length,
  },
  {
    id: 'travel',
    emoji: '🚆',
    label: 'Travel and alarms',
    desc: 'Leave times, live trains, the school run and speaker alarms',
    to: '/travel',
    group: 'week',
    roles: BOTH,
    keywords: 'trains bus journey alarm',
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
    roles: BOTH,
    keywords: 'chat ask',
    show: (x) => serverOn(x.f) && (!!assistantUrl(x.f) || pendingProposals(x.f, x.now).length > 0),
    badge: (x) => pendingProposals(x.f, x.now).length,
  },

  // ---- around the house (children's More; parents have the Plan tab)
  {
    id: 'shopping',
    emoji: '🛒',
    label: 'Shopping list',
    desc: 'Grouped by aisle, with a shop mode for the supermarket',
    to: '/plan?t=shop',
    group: { parent: 'elsewhere', child: 'home' },
    roles: BOTH,
    where: 'Plan tab',
    badge: (x) => toBuy(x.f),
  },
  { id: 'plan', emoji: '🗒️', label: 'Routines, meals and projects', desc: 'Morning and bedtime routines, clean-ups, the week’s meals and big goals', to: '/plan', group: 'home', roles: ['child'], keywords: 'plan sessions brain dump' },
  { id: 'routines', emoji: '🌅', label: 'Routines', desc: 'Morning, bedtime and before-you-leave, step by step', to: '/plan?t=routines', group: 'elsewhere', roles: BOTH, where: 'Plan › Routines', keywords: 'sessions checklists morning bedtime leave' },
  { id: 'cleanups', emoji: '🧹', label: 'Clean-ups', desc: 'House clean or garden day: everyone gets a room and ticks jobs', to: '/plan?t=routines&k=cleanups', group: 'elsewhere', roles: BOTH, where: 'Plan › Routines', keywords: 'family clean-up tidy garden house' },
  { id: 'rooms', emoji: '🚪', label: 'Rooms and jobs', desc: 'The rooms in the house and the jobs in each', to: '/house/rooms', group: 'elsewhere', roles: ['parent'], where: 'Plan › Routines › Clean-ups', keywords: 'chores cleaning' },
  { id: 'focus', emoji: '⏱️', label: 'Focus sessions', desc: 'An admin hour, a tidy or homework, with the clock running', to: '/plan?t=routines&k=focus', group: 'elsewhere', roles: BOTH, where: 'Plan › Routines', keywords: 'sessions timer admin' },
  { id: 'projects', emoji: '🧩', label: 'Projects', desc: 'A big goal broken into small steps', to: '/plan?t=projects', group: 'elsewhere', roles: BOTH, where: 'Plan tab' },
  { id: 'dump', emoji: '🧠', label: 'Brain dump', desc: 'Anything half-formed, to sort out later. Can be private', to: '/plan?t=dump', group: 'elsewhere', roles: BOTH, where: 'Plan tab', keywords: 'notes thoughts ideas' },
  { id: 'meals', emoji: '🍽️', label: 'Meals', desc: 'The week’s dinners and recipes; feeds the shopping list', to: '/plan?t=meals', group: 'elsewhere', roles: BOTH, where: 'Plan tab', keywords: 'dinner recipes food' },

  // ---- care (children's More; parents have the Care tab)
  {
    id: 'baby',
    emoji: '👶',
    label: 'Baby',
    desc: 'Feeds, nappies, sleep, medicine and shifts',
    to: '/care',
    group: { parent: 'elsewhere', child: 'care' },
    roles: BOTH,
    where: 'Care tab',
    show: (x) => bornBabies(x.f).length > 0 && duty(x, 'baby'),
  },
  {
    id: 'babyplan',
    emoji: '💗',
    label: 'New-baby plan',
    desc: 'The first two weeks: checks, ideas and easy meals',
    to: '/baby',
    group: 'elsewhere',
    roles: ['parent'],
    where: 'Care tab',
    show: hasBaby,
  },
  {
    id: 'pets',
    emoji: '🐕',
    label: 'Pets',
    desc: 'Meals, walks, water, flea and worming',
    to: '/care',
    group: { parent: 'elsewhere', child: 'care' },
    roles: BOTH,
    where: 'Care tab',
    keywords: 'dog walk',
    show: (x) => pets(x.f).length > 0 && duty(x, 'pets'),
  },
  {
    id: 'plants',
    emoji: '🪴',
    label: 'Plants',
    desc: 'Who needs a water, and a watering round',
    to: '/care?s=plants',
    group: { parent: 'elsewhere', child: 'care' },
    roles: BOTH,
    where: 'Care tab',
    show: (x) => duty(x, 'plants'),
    badge: (x) => (livePlants(x.f).length ? duePlants(x.f, x.now).length : 0),
  },
  { id: 'vault', emoji: '🗂️', label: 'Vault', desc: 'Health numbers, microchip, passport dates. Hidden until tapped', to: '/vault', group: 'elsewhere', roles: ['parent'], where: 'Care tab', keywords: 'nhs passport documents' },

  // ---- the children's own things (on their tabs)
  { id: 'homework', emoji: '📚', label: 'Homework and school', desc: 'What’s due, your timetable and what to pack', to: '/school', group: 'elsewhere', roles: ['child'], where: 'Homework tab' },
  { id: 'learn-c', emoji: '⚡', label: 'StudyQuest', desc: 'Games in every subject. Points turn into coins', to: '/learn', group: 'elsewhere', roles: ['child'], where: 'Learn tab', keywords: 'learning games' },
  { id: 'skills', emoji: '🗺️', label: 'Skill map', desc: 'Every topic and how well you know it', to: '/skills', group: 'elsewhere', roles: ['child'], where: 'Learn tab' },
  { id: 'shop-c', emoji: '🛍️', label: 'Coin shop and family goals', desc: 'Spend coins on treats, or chip in to a family goal', to: '/shop', group: 'elsewhere', roles: ['child'], where: 'Shop tab', keywords: 'rewards treats' },
  { id: 'progress', emoji: '📈', label: 'Learning progress', desc: 'Topics, writing, reports and XP goals per child', to: '/parent?tab=progress', group: 'elsewhere', roles: ['parent'], where: 'Parent area' },

  // ---- the way in to Settings (More)
  { id: 'settings', emoji: '⚙️', label: 'Settings', desc: 'Comfort, the family, phones and backups, and what’s new', to: '/settings', group: 'help', roles: BOTH, keywords: 'setup admin options', badge: (x) => settingsCount(x) },

  // ---- Settings: comfort
  {
    id: 'calm',
    emoji: '🌿',
    label: 'Comfort and accessibility',
    desc: 'Fewer things at once, less movement, easier reading, and a pause for when it’s all too much',
    to: '/settings/calm',
    group: 'comfort',
    roles: BOTH,
    keywords: 'calm accessibility overwhelmed pause motion text font focus quiet',
  },

  // ---- Settings: the family
  { id: 'people', emoji: '👨‍👩‍👧', label: 'People, pets and the baby', desc: 'Add or edit the family, and who looks after what', to: '/parent?tab=family&s=people', group: 'family', roles: ['parent'], keywords: 'members children add' },
  { id: 'checkins', emoji: '🌤️', label: 'Check-ins and habits', desc: 'Wake, leave and bed times and the habits for each person', to: '/parent?tab=family&s=checkins', group: 'family', roles: ['parent'], keywords: 'routines wake bed leave' },
  { id: 'coins', emoji: '🪙', label: 'Coin rates and treats', desc: 'How XP turns into coins, and what’s in the shop', to: '/parent?tab=family&s=coins', group: 'family', roles: ['parent'], keywords: 'economy pocket money' },
  { id: 'coparent', emoji: '🏠', label: 'Co-parenting', desc: 'Share a child’s week with their other home', to: '/parent?tab=data&s=coparent', group: 'family', roles: ['parent'] },

  // ---- Settings: phones and data
  { id: 'sync', emoji: '☁️', label: 'Phones, sharing and backup', desc: 'The family code, sync, notifications and backups', to: '/parent?tab=data&s=sync', group: 'phones', roles: ['parent'], keywords: 'notifications invite code export' },
  { id: 'private', emoji: '🔑', label: 'Private keys', desc: 'Who can read private thoughts', to: '/parent?tab=data&s=private', group: 'phones', roles: ['parent'], keywords: 'privacy encryption' },
  { id: 'voice', emoji: '🗣️', label: 'Voice logging', desc: 'Log a feed or nappy by talking to the speaker', to: '/parent?tab=data&s=voice', group: 'phones', roles: ['parent'], keywords: 'alexa speaker', show: hasBaby },
  { id: 'announce', emoji: '🔊', label: 'Read-outs', desc: 'Have tasks read out loud when they’re due, on a tablet or the home speakers', to: '/settings/announcements', group: 'phones', roles: BOTH, keywords: 'announce speak speaker read aloud voice kitchen tablet tts' },
  { id: 'homeserver', emoji: '🖥️', label: 'The home server', desc: 'Travel, alarms, the round table and the family assistant at home', to: '/parent?tab=data&s=home-server', group: 'phones', roles: ['parent'], keywords: 'hermes gemini round table' },

  // ---- Settings: help and updates
  { id: 'start', emoji: '👋', label: 'Getting started', desc: 'The welcome tour and the setup checklist', to: '/parent?tab=data&s=help', group: 'start', roles: ['parent'], keywords: 'tour setup checklist help version updates' },
  { id: 'news', emoji: '✨', label: 'What’s new', desc: 'Fixes and new things in each release', to: '/news', group: 'start', roles: BOTH, keywords: 'release notes updates', badge: (x) => x.news },
  { id: 'parent', emoji: '🔒', label: 'Parent area', desc: 'All of the family’s settings in one place, behind the PIN', to: '/parent', group: 'start', roles: ['parent'], keywords: 'pin data' },
]

export const groupOf = (it: Feature, role: Role): GroupId | undefined => (typeof it.group === 'string' ? it.group : it.group[role])

type Shown = Feature & { count: number }

/** Every entry this person can reach, by group in their order. Groups with nothing in them are left out. */
function grouped(x: FeatureCtx, hub: Hub): { group: GroupId; items: Shown[] }[] {
  const role = roleOf(x.me)
  return GROUP_ORDER[role]
    .filter((group) => GROUPS[group].hub === hub)
    .map((group) => ({
      group,
      items: FEATURES.filter((it) => it.roles.includes(role) && groupOf(it, role) === group && (!it.show || it.show(x))).map((it) => ({ ...it, count: it.badge?.(x) ?? 0 })),
    }))
    .filter((g) => g.items.length > 0)
}

/** The More hub: a short list in fixed groups. */
export const hubFor = (x: FeatureCtx) => grouped(x, 'more')

/** The Settings screen (/settings). */
export const settingsFor = (x: FeatureCtx) => grouped(x, 'settings')

/** What's waiting inside Settings (so the Settings entry in More can carry the count). */
const settingsCount = (x: FeatureCtx) => settingsFor(x).reduce((n, g) => n + g.items.reduce((m, i) => m + i.count, 0), 0)

/** For the More tab's dot: anything in the hub with a count. */
export const hubHasNews = (x: FeatureCtx) => hubFor(x).some((g) => g.items.some((i) => i.count > 0 && i.id !== 'shopping' && i.id !== 'plants'))

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")

export type SearchHit = Shown & { where: string }

/** The search box at the top of More: every destination this person can reach (More, Settings and the ones on a tab
 * or inside another screen), by label, description and a few extra words. Every word typed has to match. Best
 * matches first (the label starting with it, then a word in the label, then anywhere), otherwise in the table's order,
 * so the same words always give the same list. */
export function searchFeatures(x: FeatureCtx, query: string): SearchHit[] {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const role = roleOf(x.me)
  const q = words.join(' ')
  const hits: { hit: SearchHit; rank: number; i: number }[] = []
  FEATURES.forEach((it, i) => {
    const group = groupOf(it, role)
    if (!group || !it.roles.includes(role) || (it.show && !it.show(x))) return
    const label = norm(it.label)
    const all = `${label} ${norm(it.desc)} ${norm(it.keywords ?? '')}`
    if (!words.every((w) => all.includes(w))) return
    const rank = label.startsWith(q) ? 0 : label.split(/[^a-z0-9']+/).some((w) => w.startsWith(words[0]!)) ? 1 : label.includes(words[0]!) ? 2 : 3
    const hub = GROUPS[group].hub
    const where = hub === 'settings' ? 'Settings' : hub === 'more' ? GROUPS[group].title : (it.where ?? '')
    hits.push({ hit: { ...it, count: it.badge?.(x) ?? 0, where }, rank, i })
  })
  return hits.sort((a, b) => a.rank - b.rank || a.i - b.i).map((h) => h.hit)
}
