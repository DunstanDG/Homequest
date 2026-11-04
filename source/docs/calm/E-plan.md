# E: Planning without overwhelm

## What changed

- **Plan a thing** (`/plan/new-thing`; buttons in the Plan header and on the Calendar next to "+ Event"). Eight templates
  (birthday party, holiday or trip, school trip, Christmas, new school term, visitors staying, day out, something else).
  Pick one, name it, give it a date, tick or untick steps (optional ones start unticked, and you can add your own), see
  "9 small steps, spread over the next 3 weeks. You'll only see the next one.", then **Make my plan**.
  - It creates ordinary things: a **project** (so the whole plan is viewable), one **activity** per step, one **task** per
    step dated on the day it falls (so it shows on the right person's Today when due, no coins, self-checked), and an
    **all-day calendar event** for the date (multi-day for trips, Christmas and visitors).
  - Task ids are `plan-<activityId>` with source `plan:<projectId>`. `activityTicked` (family/projects.ts) counts a ticked
    task as a ticked step, and ticking a step in the project also ticks its task.
  - Pure generator in `src/family/templates/` (data, `generateSteps`, `previewLine`, `assigneeFor`) and
    `src/family/planThing.ts` (`createPlan`). Steps are placed by offset; if some would fall in the past the whole plan is
    squeezed into the time left (order kept); at most 2 steps a day (a day only takes more if there are more steps than
    days can hold). "A parent" steps go to the planner, "a child" steps to the chosen child.
- **Brain dump: Pick 3 for this week** (`src/family/planDump.ts`, `Dump.tsx`). New default mode: this week's picks, up to
  3 things to choose from five (Show all), each put on a day this week (from Saturday, next week too) using the existing
  `scheduleDump`, and everything else in a collapsed "Saved for later (N)". "Everything" is the old full list, now showing
  about 5 items with "Show all (N)".
  - **Someday** is a view rule: `#someday` items, and open items nobody has touched for 30+ days (their latest event),
    rest in a collapsed "Someday (N)". Touching one (editing it) brings it back. No events, no nagging.
- **Projects lead with the next step.** The list card and the project screen show "Next: step (~20 min)" and **Start**
  (a one-step session). Progress is "3 of 9 steps done" and a bar; no "to go" times. "Show the whole plan" opens the full
  tree (Play several, Plan sessions, grouping, Gemini breakdown all still there).
- Gentle wording throughout ("Want to pick 3?", "Lovely.", "These are safe here").

## Edits outside my files

- `src/app/App.tsx`: one import and one route, `/plan/new-thing`.
- `src/screens/family/Calendar.tsx`: `Link` import, and a "Plan a thing" link beside "+ Event" (wrapped in a fragment).
- `src/screens/plan/Plan.tsx` header: a "Plan a thing" link in `head-actions`.
- `src/family/projects.ts`: `activityTicked` and the tree cache also look at the linked plan task.
- `src/plan.css`: rules appended under `/* E: */`, plus a header wrap rule for `.screen.plan > .screen-head`.

## Merge risks

- `Plan.tsx` header is also touched by F (entry points): both add to `head-actions`; keep both.
- `App.tsx` routes: trivial conflicts.
- `plan.css` end of file: append-only, keep all blocks.

## Release notes

```ts
{
  date: '2026-11-04',
  area: 'Plan',
  title: 'Plan a thing, one small step at a time',
  body: 'Birthdays, trips, Christmas and more now come with a gentle set of small steps. Pick one, choose a date and each step turns up on the right day, one or two at a time.',
  link: '/plan/new-thing',
},
{
  date: '2026-11-04',
  area: 'Plan',
  title: 'Pick 3 for this week',
  body: 'The brain dump now helps you choose just three things for the week. Everything else rests safely under “Saved for later”, and old things drift into “Someday” without any fuss.',
  link: '/plan?t=dump',
},
{
  date: '2026-11-04',
  area: 'Plan',
  title: 'Projects show the next step first',
  body: 'Each project leads with its next small step and a Start button. The whole plan is one tap away when you want it.',
  link: '/plan?t=projects',
},
```
