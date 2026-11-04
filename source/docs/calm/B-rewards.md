# B: Rewards and celebration

## What changed

- **Celebration on a tick** (`src/ui/celebrate.tsx`, `celebrateLogic.ts`, `celebrate.css`). `act` in `context.tsx` now calls
  `celebrateEvents()` after `repo.apply()`. It reacts to a `task-done`, or the `end` of a routine or session run (not
  `abandoned`), written by the phone's holder. Synced events never go through `act`. The host mounts itself on the first
  celebration (own React root on `document.body`), so no screen or `App.tsx` edit is needed. Output depends on `calm.celebrate`:
  - `full`: burst of emoji, "+20 🪙" chip floating up, `navigator.vibrate(20)`, soft WebAudio chime (skipped when
    `settings.quietTimers`). The first thing today and "everything for today done" (2+ tasks, all ticked) get a bigger burst.
  - `quiet`: small toast and a gentle haptic.
  - `off`: nothing.
  - `lowStim` or `prefers-reduced-motion`: a static toast only (no motion, sound or haptics).
  - Coins awaiting a parent check read "20 🪙 once checked". Pure decision function: `decideCelebration()` (tested).
- **Look what you did** (`rewards/DoneToday.tsx`): lists tasks, finished routines/sessions, pet and baby care logs done today by that
  person, never what is missed. Hidden until at least one thing is done. Parents also get "You've handled N things this week.
  Thank you." (from 3 things up).
- **Family goal bar** (`FamilyGoalBlock`): "🎬 Cinema trip · 340 / 500 🪙" with a bar, linking to the Shop.
- Both are Today sections (`done`, `goal`) registered in `todayLayout.ts` (so Edit Today knows them) and `Today.tsx`.
- **Start bonus** (`rewardsLogic.ts`): starting a **focus** timer on a task of 30+ minutes (task estimate or chosen length) or an
  overdue one writes a `coins` event of +5, `id = start-bonus:<member>:<day>`. Event ids are deduped by `repo.apply` and on sync,
  so only one per person per day exists, even from two phones. Hooked in `StartTimerSheet.go()` in `timers.tsx`.
- **Forgiving streaks**: Home and ParentLearn show "4 of the last 7 days ⭐", a week of dots and "Fancy a quick game?". Engine XP,
  badges and `state.streak` are untouched (Rewards.tsx and parent Overview still show best streak).
- **Shop**: a progress bar towards the next treat that can be got ("119 more coins for 🎁 Small treat"), and a "you have enough" line.

## Edits outside my files

- `src/app/context.tsx`: import of `celebrateEvents` and the `act` line only.
- `src/screens/family/Today.tsx`: import line, plus `done:` and `goal:` entries after `braindump:` in the section map.
- `src/app/todayLayout.ts`: `BlockId` gains `done` and `goal`, two `BLOCKS` entries, and they are added to the default orders
  (after `together` for adults, after `learning` for children, so the existing ordering test still holds).
- `src/ui/timers.tsx`: import, `useApp()` now also takes `repo` and `toast`, and 4 lines in `go()`.

## Release notes (for `releases.ts`)

```ts
{ id: '2026-11-04-tick-celebration', date: '2026-11-04', audience: 'all', area: 'today', emoji: '🎉', title: 'A little celebration when you tick something off', short: 'Celebrations', body: 'Ticking off a task now gives a small burst, a "+20 coins" chip and a soft chime. Prefer it quieter, or off? Change it in your calm settings. Low stimulation and reduced motion always get a calm message instead.' },
{ id: '2026-11-04-look-what-you-did', date: '2026-11-04', audience: 'all', area: 'today', emoji: '🌟', title: 'Look what you did, and a family goal bar', short: 'Done today', body: 'Today now shows what you have finished (never what is missed), a thank-you for parents each week, and your family goal bar.' },
{ id: '2026-11-04-gentle-streaks', date: '2026-11-04', audience: 'all', area: 'learn', emoji: '⭐', title: 'Gentler streaks and a bonus for getting started', short: 'Gentler streaks', body: 'StudyQuest now shows "4 of the last 7 days" instead of a streak to keep, and rest days are fine. Starting a focus timer on something big earns a small once-a-day bonus.', to: '/learn' },
```

## Notes and merge risks

- The existing app toast on ticking ("Nice one! ... coins") still shows as well; screens/A may want to drop it now there is a celebration.
- `todayLayout.ts` and `Today.tsx` may collide with A (small, adjacent lines).
- `timers.tsx` collides with C only in `StartTimerSheet`'s `go`/imports.
- The start bonus only applies via `StartTimerSheet` (purpose `focus`).
