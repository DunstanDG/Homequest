# F. Simpler navigation and one weekly plan (0.18)

The aim: the app itself shouldn't be one more thing to manage. Fewer places, fewer choices, things always in the same
place, and one short weekly script in place of three overlapping ones.

## What changed, and where things moved

### One weekly plan (`/week`)

`src/screens/family/WeekPlan.tsx`. The weekly summit (`/summit`) and the round table (`/round-table`) both redirect
here, so old links, notifications (`sw.ts` opens `#/round-table`) and release notes still land in the right place.

It's a fixed script with a step indicator ("Step 2 of 5", and a bar you can tap to jump):

1. **Things people raised.** The round table's "things to raise" box (anyone can add), then, with the home server,
   where the round table is up to: when it happens, the assistant or Gemini at work (with *Ask Gemini now*), or its
   agenda and suggested changes. Then ideas still waiting on votes (the summit's old "Anything to agree"). Parents
   get the round table settings here (when it happens and **who writes the agenda**).
2. **The week at a glance.** Seven rows, Monday to Sunday, with only what makes a day different (family events,
   school events and closures, birthdays, clean-up days; "The usual" otherwise). Then the round table's day-by-day
   view (clashes, free time, last week) when there is one, and the summit's homework step for parents.
3. **Loose ends**, kindly. "3 things from before: want to give them a fresh start?" with *Open Today*, and the brain
   dump "for whenever you're ready". No "overdue" counts. (Only open one-off tasks count; repeating and finished ones
   don't, which the old summit got wrong.)
4. **Meals** (and **Meals and nights** with a baby): nights without a dinner, then the shift rota to confirm.
5. **This week's 5.** Pick up to five things from the week's events, open tasks and the brain dump (not "someday" or
   private thoughts), or type something. Saving shows a calm card ending "These are this week. Everything else can
   wait." at the top of `/week`, and marks the week planned (the summit's existing `summit` marker, so "Needs you"
   and the Plan tab's "Plan the week" button behave as before).

Children get steps 1 and 2 ("Step 1 of 2"), and see the saved five.

**Which week.** Monday to Thursday it plans this week; from Friday, the week ahead; and once the round table has
moved on to next week (it can be set to any day), so does the plan, so its agenda matches the other steps
(`planWeekFor` in `src/family/weekPlan.ts`).

**New event: `week-focus`** `{ weekOf, items: [{ kind: 'task' | 'dump' | 'event' | 'note', ref, title }] }`, latest
wins per `weekOf` (the Monday), at most five, an empty list clears it. Type in `src/family/types.ts`, fold in
`src/family/project.ts` (`f.weekFocus`), logic and tests in `src/family/weekPlan.ts` / `weekPlan.test.ts`.

**For Today (workstream A):** `weekFocusFor(f, today)` returns the five for the week `today` is in (empty if none),
and `WeekFocusCard` (exported from `WeekPlan.tsx`) renders the same calm card. `focusItemDone(f, item)` says whether
a picked task or brain-dump item has been done since.

The summit and round table files are now the parts the plan is made of: `Summit.tsx` exports `ComingUpStep`,
`LooseEndsStep`, `HomeworkStep`, `MealsAndNightsStep` and `IdeasToAgree`; `RoundTable.tsx` exports `Agenda`, `Raise`,
`Week`, `RoundTableSettings`, `GeminiWaiting`, `RoundTableStatus` and `useRoundTableWeek`. Nothing they did has gone.

### Routines in one place (Plan › Routines)

Sessions, "Routines and checklists", "Family clean-ups" and "Rooms and jobs" are now one **Routines** area on the
Plan tab, with three sub-tabs, always in this order:

- **Routines**: morning, bedtime, before you leave. Sorted by start time, then name.
- **Clean-ups**: house and garden days for the whole family (the old "Family sessions"), with *Rooms & jobs* and the
  board for the week inside.
- **Focus**: an admin hour, a tidy, homework. Sorted by name.

The Plan tab is **Do: Routines · Projects · Brain dump** and **Home: Meals · Shopping**. `?t=routines&k=cleanups`
opens a sub-tab; old `?t=sessions` links (and a remembered "sessions" tab) open Routines. A banner for a session or
clean-up that's running shows on every sub-tab.

Saved sessions don't record their kind before 0.18, so it's worked out (`src/family/routineKind.ts`): a check-in
routine, habit steps, a watering round or a name like "morning", "bedtime", "leave" or "evening" is a routine;
homework, project sessions and everything else are focus sessions. The session editor has **Where it lives:
Routines / Focus**, saved as an optional `kind` on the `routine` event (only when it differs from the guess). There's
a new ready-made **Before we leave** routine.

Plan tab header: unchanged apart from the "Plan the week" link now going to `/week`, so adding a button there (E's
"Plan a thing") is a one-line merge.

### More down to about eight, with search, and a Settings screen

`src/app/nav.ts` is still the one table. Each group now says which screen lists it (`more`, `settings`, or
`search` only), and an entry can sit in a different group per role (the shopping list is on parents' Plan tab but in
children's More).

- **More, parents** (7, or 9 with the home server): To check, School and homework, Learning, Coin shop and family
  goals · Weekly plan, Plans and ideas (Travel and alarms, Family assistant) · Settings.
- **More, children** (7 to 10): Calendar, Weekly plan, Plans and ideas (Travel, Family assistant) · Shopping list,
  Routines, meals and projects · Baby, Pets, Plants (for what they look after) · Settings.
- **Settings** (`/settings`, `src/screens/settings/SettingsHub.tsx`): Comfort and accessibility (`/settings/calm`,
  workstream C's screen) · People, pets and the baby; Check-ins and habits; Coin rates and treats; Co-parenting ·
  Phones, sharing and backup; Private keys; Voice logging; The home server · Getting started; What's new; Parent
  area. Children see Comfort and accessibility and What's new. The Settings entry in More carries the count of what's
  waiting inside (What's new).
- **Search** (top of More and Settings) finds every destination this person can open, including ones on a tab or
  inside another screen (Calendar, Shopping, Meals, Projects, Brain dump, Routines, Clean-ups, Rooms and jobs, Focus,
  Baby, Pets, Plants, Vault, Learning progress, Skill map...), by label, description and a few extra words
  ("summit", "backup", "accessibility"), with where it lives ("Settings", "Plan › Routines").

Tabs are unchanged: parents Today, Calendar, Plan, Care, More; children Today, Homework, Learn, Shop, More.

### Things stay in the same place

Order comes from `nav.ts` and fixed step lists, never from data. Counts appear beside entries, but nothing moves. The
routine lists, the week glance (always seven rows) and the five's candidates are in a fixed order too. Tests check
that the hub's order doesn't change with data, and that search gives the same list for the same words.

## Files

New: `src/screens/family/WeekPlan.tsx`, `src/screens/settings/SettingsHub.tsx`, `src/screens/plan/Routines.tsx`,
`src/family/weekPlan.ts` (+ test), `src/family/routineKind.ts`, `src/calm-nav.css` (imported by the screens that use
it, so `main.tsx` is untouched).

Changed: `src/app/nav.ts` (+ test), `src/screens/More.tsx`, `src/screens/family/Summit.tsx`,
`src/screens/family/RoundTable.tsx`, `src/screens/plan/Plan.tsx`, `src/screens/plan/Sessions.tsx`,
`src/app/App.tsx` (routes only), `src/family/types.ts` (`WeekFocusEvent`, `RoutineEvent.kind`, `f.weekFocus`),
`src/family/project.ts` (fold), `src/family/sessionTemplates.ts` (Before we leave),
`src/screens/family/todayParts.tsx` (Needs you's summit and round table rows point at `/week`),
`src/app/onboarding/tour.ts` (the More card's text), `src/app/onboarding/onboarding.test.ts` (new routes).

## Release notes

```ts
  {
    id: '2026-11-04-weekly-plan',
    date: '2026-11-04',
    audience: 'all',
    area: 'plan',
    emoji: '🧭',
    title: 'One weekly plan, in five short steps',
    short: 'Weekly plan',
    body: 'The weekly summit and the round table are now one Weekly plan: things people raised, the week at a glance, loose ends, meals, and this week’s 5. Pick up to five things that matter; everything else can wait.',
    to: '/week',
  },
  {
    id: '2026-11-04-routines-in-one-place',
    date: '2026-11-04',
    audience: 'all',
    area: 'plan',
    emoji: '🌅',
    title: 'Routines, clean-ups and focus sessions in one place',
    short: 'Routines in one place',
    body: 'Plan › Routines has three kinds, always in the same order: Routines (morning, bedtime, before you leave), Clean-ups (with the rooms and jobs) and Focus sessions.',
    to: '/plan?t=routines',
  },
  {
    id: '2026-11-04-shorter-more',
    date: '2026-11-04',
    audience: 'all',
    area: 'app',
    emoji: '🔎',
    title: 'A shorter More, with search and a Settings screen',
    short: 'Shorter More, search',
    body: 'More now shows just a few things, always in the same place. Setting up moved to Settings, and the search box at the top finds anything.',
    to: '/more',
  },
```
