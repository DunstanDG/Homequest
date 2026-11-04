# A. Calm Today and tasks (0.18)

## What changed

**Focus modes on Today** (`useCalm().focus`; children default to `'one'`, adults to `'three'`).
- A small "One thing · Three · Everything" control under To do, saved with `useCalm().set({ focus })`. It applies to
  your own list only: looking at someone else's day (a parent checking a child's) always shows everything.
- **One thing:** a single **Next up** card with Start (the existing focus timer sheet), Done and **Not now**. Not now
  stores nothing: the item is skipped for the rest of this visit (per person and day, in memory) and the next one
  shows. When everything has been skipped: "That's everything for now. Have a rest." with "Show me one again".
  A quiet **See everything** link shows the full list, with "Back to one thing" at the end.
- **Three:** the first three in Next up order, then "N more when you're ready" (tap to reveal, along with Done).
- **Everything:** the list as before, grouped by part of the day.
- Next up order (`nextUpOrder` in `src/family/calmToday.ts`): something timed and current first (the task's own time,
  or its time in the home server's day plan), then due soonest (from before, today's, planned for today), then the
  current part of the day (a morning job at 4pm waits behind the afternoon's), then the shortest.

**Paused** (`useCalm().paused`, the "I'm overwhelmed" pause from workstream C). Your own Today shows only the running
timers and session, "Taking it easy today. Here's just one thing, if you want it.", the Next up card and **Back to
normal** (`resume()`). Needs you, the day/week switch, member chips, banners, counts and warnings are hidden.

**Progress that only counts up.** "1 of 12 done" is now "3 done today" with a small ring that fills a third with each
thing ticked off (full at three, never goes back). With nothing done yet it says "Ready when you are".

**Kind wording for things from before.**
- No red borders and no "N days late" anywhere a task row is shown (`TaskLine` in `shared.tsx`): it says "from
  before", and the row is neutral (`.task-line.from-before`). Today groups them as **Still to do**; so does the
  School › Homework list.
- The parent homework card says "3 from before · 1 to re-plan · 3 this week · 2 without a day yet · 1 to check", with
  no "Look" pill. The summit's homework step says "From before:".
- "Try again" (a parent sent it back) is now "Have another go", in amber, not red.

**Fresh start** (`src/family/freshStart.ts`, tested in `freshStart.test.ts`).
- Everything left over (one-offs past their day, homework past its due day, homework planned for a day that's gone)
  is spread over the days from today: at most 2 a day per person, homework first, then the shortest.
- It writes ordinary events only: a task re-save with a new `date`; for homework past due, `doOn` = the new day and
  `date` = the day after (so it shows on that day, not today, since planned homework shows from the day before it's
  due); for homework only behind plan, just `doOn` (never past the due day).
- When a **parent** runs it, chores 28+ days past their day and not edited for 28 days wait for **Someday** instead:
  back on their brain-dump item (`unscheduleDump`, priority `someday`) or, if they never came from the dump, the task
  is deleted and a someday dump item takes its place (owned by the assignee). Homework never goes to Someday.
- It always shows a summary first: "Move 3 things to this week?", one line per day, then "Yes, do that" / "Not now".
- Buttons: Today (Still to do, and a quiet line in One/Three modes), School › Homework, the parent homework card and
  the summit homework step (homework only on those three).

**Brain dump privacy for children.** On a child's Today (their own, or a parent looking at it) the Brain dump block
shows only items assigned to that child or written by them (`dumpForViewer` in `calmToday.ts`, tested). For a child
the "See all" link to Plan › Brain dump is hidden, because that screen (workstream E) doesn't filter yet.

**Warnings by audience.** In the day plan (`dayPlan.tsx`) children never see clash or overload warnings. A tight gap
("only 5 min between Chess club and the walk home") is put calmly instead: "Chess club runs close to walk home: Sam
and Alex know." (the family's parents, by name, at runtime). Parents still see the warnings as before.

**First, then (children).** Above a child's list: "First: Empty the dishwasher → Then: free time at 17:00 🎮". First is
the Next up item; Then is the next free time in the day plan, falling back to "something you enjoy 🌟". In One-thing
mode it's part of the Next up card.

**Needs you (parents).** The three most important rows (approvals first), then "N more" to unfold.

**Wording.** "Ready to start? Start a timer", "for today / for tomorrow / in 3 days", "was planned for Mon", "pick a
day?", "doing it today", "No homework right now. Enjoy the break.", "Any homework from Science this week?", "Want to
have a quick look on MCAS?".

## Files

- New: `src/family/freshStart.ts` (+ test), `src/family/calmToday.ts` (+ test), `src/screens/family/calmParts.tsx`
  (Next up card, ring, focus control, First/Then strip, Fresh start button and sheet).
- Owned: `Today.tsx`, `homeworkCards.tsx`, `School.tsx`, `agenda.tsx` (one pill), `shared.tsx` (`TaskLine` wording and
  class only), `family.css` (new rules at the end under `/* A: */`).
- Outside the ownership table (nobody owns them; small edits): `todayParts.tsx` (Needs you shows 3, then "N more"),
  `dayPlan.tsx` (warnings by audience).

## For the merge

- **Plan › Brain dump** (`src/screens/plan/Dump.tsx`, workstream E) should filter for children the same way:
  `dumpForViewer(f, items, me.id)` from `@/family/calmToday`. Once it does, the "See all" link on a child's Today can
  come back (`BrainDumpBlock` in `Today.tsx`).
- **Synced pause:** Today reads `useCalm().paused` (this phone). If workstream C folds `calm-pause` events into family
  state, `paused` in `Today.tsx` could also check the viewer's synced pause.
- `.task-line.overdue` and `.overdue .tl-main small` in `family.css` are now unused (`TaskLine` no longer sets the
  class); left in place to keep the diff small.

## Release notes

```ts
  {
    id: '2026-11-04-calm-today-focus',
    date: '2026-11-04',
    audience: 'all',
    area: 'today',
    emoji: '🌿',
    title: 'Today can show just one thing at a time',
    short: 'One thing at a time',
    body: 'Pick "One thing", "Three" or "Everything" under To do. One thing shows a single Next up card with Start, Done and Not now, and the count only goes up: "3 done today".',
    to: '/',
  },
  {
    id: '2026-11-04-fresh-start',
    date: '2026-11-04',
    audience: 'all',
    area: 'today',
    emoji: '✨',
    title: 'Fresh start for things from before',
    short: 'Fresh start',
    body: 'Nothing is "late" any more. Things from before sit under Still to do, and Fresh start spreads them over the next few days, no more than two a day, after showing you the plan first.',
    to: '/',
  },
  {
    id: '2026-11-04-child-today-calmer',
    date: '2026-11-04',
    audience: 'parent',
    area: 'today',
    emoji: '🧒',
    title: "Children's Today is calmer",
    short: "Calmer child's Today",
    body: "Children now see only their own brain-dump items, no clash or overload warnings (a tight gap is put kindly, and says you know), and a First, then card: the one thing to do, then free time.",
    needs: 'children',
  },
```
