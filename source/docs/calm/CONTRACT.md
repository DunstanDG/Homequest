# Calm release (0.18): who does what

The mission: **reduce stress in the family** by making tasks automated and visible, making it enjoyable and rewarding
to deal with them, supporting neurodiverse people, and keeping planning (big or small) from becoming overwhelming or
triggering.

Six workstreams run in parallel, each in its own git worktree and branch. They are merged into
`claude/practical-johnson-qi4j0r` at the end. To keep the merge clean, each one **owns** some files. Other files may get
small, surgical edits only where the brief says so.

## Shared contract (already in the base commit)

- `src/app/calm.ts`: `CalmPrefs` lives in `settings.calm` (device-local), along with `calmOf(prefs, role)`,
  `useCalm()`, `isPaused()`, `motionOk()`, `endOfToday()` and `prefersReducedMotion()`.
  - **Defaults are calm:** children see one thing at a time (`focus: 'one'`), adults three.
  - **Pausing:** `pauseUntil` is the "I'm overwhelmed" pause. While it's on, Today shows one thing, and no questions or
    reminders are pushed.
  - **Motion:** any motion or sound must check `motionOk(calm)` and `calm.celebrate`.
- **Synced pause event** (written by workstream C, read by D's server function and by Today):
  `{ type: 'calm-pause', memberId, until: number /* ms */ }`. The latest per member wins, and `until <= now` means not
  paused.
- **Ticking things off:** `A.completeTask()` writes `task-done` events. Celebrations hook in centrally, so screens don't
  need to call anything.

## Ownership

| Workstream | Owns | Small edits allowed in |
| --- | --- | --- |
| **A. Calm Today and tasks** | `src/screens/family/Today.tsx`, `agenda.tsx`, `homeworkCards.tsx`, `School.tsx`, task row wording in `shared.tsx`, new `src/family/freshStart.ts` | `family.css` (new rules at the end, under a `/* A: */` heading) |
| **B. Rewards and celebration** | new `src/ui/celebrate.tsx` and `src/screens/family/rewards/*`, `src/screens/Home.tsx` (streaks), `src/screens/learn/ParentLearn.tsx` (streaks), `src/screens/family/Shop.tsx` | `src/app/context.tsx` (only the `act` line, to hook celebrations), `Today.tsx` (only adding entries to the section list) |
| **C. Accessibility and "I'm overwhelmed"** | new `src/screens/settings/*` and `src/ui/calmShell.tsx`, `styles.css` `:root` variables plus new rules at the end, family types and fold for `calm-pause`, `src/ui/timers.tsx` (`hideCountdowns`) | `src/app/App.tsx` (mounting the shell, banner and button), `package.json` (one font package) |
| **D. Calmer notifications** | `supabase/functions/send-notifications/*`, `src/app/push.ts`, `calendarReminders.ts`, `checkinReminders.ts`, `homeworkAlerts.ts`, new `supabase/schema_v7.sql` | `src/screens/parent/Data.tsx` (inside `NotificationsSection` only) |
| **E. Planning without overwhelm** | new `src/family/templates/*` and `src/screens/plan/PlanAThing.tsx`, `src/screens/plan/Dump.tsx`, `src/screens/plan/Projects.tsx` (plus `src/screens/plan/project*`), `src/family/plan*.ts` for the dump and projects | `src/screens/plan/index` (the Plan tab header), `src/screens/family/Calendar.tsx` (one "Plan a thing" button) |
| **F. Simpler navigation and one weekly plan** | `src/app/nav.ts`, `src/screens/More.tsx`, `src/screens/family/Summit.tsx`, `src/screens/family/RoundTable.tsx`, the routines/sessions/clean-ups entry points in `src/screens/plan/` (but not Dump or Projects) | `src/app/App.tsx` (routes only) |

## Rules for every workstream

- Commit to your own branch in your own worktree. Don't push, and don't touch the repo root (the built site).
- **Don't edit `src/app/onboarding/releases.ts` or `docs/HOMEQUEST.md`.** Write user-facing release notes (1-3 entries,
  in the format of `releases.ts`) and docs in `docs/calm/<letter>-<name>.md`. They're merged in at the end.
- Keep `npx tsc --noEmit` and `npm test` passing. Add tests for new logic (vitest, `src/**/*.test.ts`, node
  environment).
- **Layout:** check new UI at 402px and 412px wide with the layout audit:
  `npm run build && npx vite preview --port <yours> &`, then `BASE=http://localhost:<yours>/ ROUTES=... npm run audit:layout`.
  The aim is no sideways scrolling and no overlaps. Use `?demo=1` (parent) and `?demo=maya` (child).
- **Wording:** UK English, plain, warm and inviting ("Ready to start?", "Want to pick one?"), never shaming. No red for
  late items, no "N days late", no "you must".
- **Never put real names** (family, school) in code: the repo is public.
