# Architecture

The app is three layers, and the dependency only goes one way:

```
  content packs  ──►  engine (pure TypeScript)  ◄──  storage & sync
   (maths, german)      no React, no browser            IndexedDB, Supabase
                             ▲
                             │
                        UI: games, screens, answer widgets
```

The **engine** (`src/engine`) knows nothing about screens or browsers, which is why it can be unit tested and simulated
from the command line. **Content** (`src/content`) only produces data. The **UI** (`src/ui`, `src/games`, `src/screens`)
renders that data and feeds answers back.

## The one idea everything hangs off: an append-only event log

Everything that happens is an `AppEvent` appended to a log: an attempt, a piece of feedback, a finished session, a badge,
a "taught" note from a parent, a goal, a profile. **The log is the only source of truth.** The current state (XP, levels,
mastery per topic, badges, open reports) is a fold over the log, computed by `project()` in `src/engine/events.ts`.

This buys four things at once:

- **Sync is trivial.** Two devices merge by taking the union of events by id (`mergeEvents`). There are no conflicts to resolve, because nobody edits anything.
- **Replays are exact.** Points are stored on the events, so changing the points formula later does not rewrite history or shrink her total.
- **Tracking for you is free.** Your phone folds the same log her phone does.
- **Debugging is honest.** A backup file is a complete record; `npm run triage` and `npm run simulate` are just programs that read or write events.

## Engine

| File | Job |
| --- | --- |
| `types.ts` | All shared types: skills, items, answers, events, state. Read this first. |
| `skillGraph.ts` | Topics as nodes with prerequisites; ancestors, descendants, cycle checks. Cross-subject prerequisites are allowed. |
| `mastery.ts` | Ability per topic on a 1-5 scale, updated Elo-style after each answer. A forgetting curve (stability grows with each success) says when a topic is due for revision. Tiers: new, learning, developing, secure, mastered. |
| `planner.ts` | Picks the next question. Categories: frontier (this year's work), review (due), gap-probe (a prerequisite that might be the real problem), fluency (Sprint), focus, diagnostic. Chooses difficulty so she succeeds about 70% of the time. |
| `session.ts` | One play session. `next()` asks the planner and generates an item, `submit()` judges, updates mastery and awards XP, `flag()` records feedback, `finish()` summarises. Every game drives this. |
| `judge.ts` | Marks answers: numeric (with tolerance and fractions), algebra (equivalence is tested by substituting many values, and a question can demand a form, so `2(x+3)` is recognised as equal to `2x+6` but marked "equivalent, but multiply out the brackets" when the question asks for expanded form), choice, order, match, text. Also `solutionFor(item)` for tests and the gallery. |
| `points.ts` | The single XP currency: base by difficulty, first-time-right, combo, hints, retries, daily bonus, session completion, feedback thanks. Level `L` needs `50 * (L-1) * L` total XP. |
| `badges.ts` | Badge definitions as pure functions of state. |
| `report.ts` | Turns feedback into text and Markdown for parents and for whoever fixes content. |
| `registry.ts` | Holds the subject packs, merges their graphs, and regenerates any item from its id. |

### Reproducible items

Questions are generated, not stored. Each item id is `generatorId@difficulty#seed`, for example
`maths.ct.radius@1#1861532182`. The same id always regenerates the identical question from the current content. So a
flagged report says exactly what she saw, the triage script can re-check it, and you can paste an id into a chat with
Claude and say "fix this generator".

### How difficulty scales to find revision areas

Each skill has its own ability estimate, and questions are chosen just above or below it. Two mechanisms make the
"built on previous years" idea real:

1. **Inferred floor.** If she does well on a hard skill, its prerequisites are assumed to be at least reasonably known, so they are not re-tested pointlessly.
2. **Gap probing.** If she struggles on a skill, the planner walks down its prerequisite chain and slips in easy checks on the topics underneath. The Gap Finder game does this as a deliberate staircase: test Year 8 topics, and step down through Year 7, 6, 5 building blocks wherever one fails.

The maths pack includes Year 4-6 "foundation" skills for exactly this. Those are additions beyond the syllabus you attached.

## Content packs

A `SubjectPack` is `{ id, name, color, skills, generators, version }`. Skills say what exists and what depends on what.
Generators (`ItemGenerator`) make questions for a skill across a difficulty range. Everything else, including the skill map, the
planner, the parent Topics screen and the gap finder, works from that data. See ADDING_A_SUBJECT.md.

Item kinds: `numeric` (one or more boxes, optional template such as `( _ , _ )`), `expr` (algebra), `choice`, `order`,
`match`, `text`. Prompts use a small markup: `{a|b}` for a fraction, `^{x}` for a power, `_{x}` for a subscript.
Figures are a typed union rendered as SVG by `src/ui/figures`: coordinate grid, bar chart, scatter, number line, shapes,
angles, Venn, table.

`src/content/quality.ts` audits generators (empty prompts, duplicate options, an answer that does not judge as correct,
absurd numbers). It runs inside `npm test`, so a broken generator fails the build.

## Storage and sync

- `storage/local.ts`: IndexedDB through idb-keyval, with an in-memory fallback if the browser blocks it.
- `storage/repo.ts`: holds the event log, projects state, exposes a subscribe/snapshot pair for React (`useSyncExternalStore`), keeps a queue of events not yet sent.
- `storage/sync.ts` and `storage/supabase.ts`: a `SyncAdapter` interface (pull from a cursor, push idempotently) and a Supabase implementation using plain `fetch` to PostgREST. No SDK.
- `storage/pairing.ts`: the family code, `sq1.<learnerId>.<secret>`. The secret is sent as an `x-family-key` header and the database policy only shows rows whose key matches.
- `storage/backup.ts`: export and import a JSON backup, validated.

Local-first means the app never waits on the network. Sync failures show as a status in the parent area and retry.

## UI notes worth knowing

- Games are shells over a `Session`. `GameDef` in `src/games/types.ts` describes a game; most share `QuestionGame` with a different `shell`. A very different game supplies its own `Component` and still calls the same `Session` methods, so points, progress and feedback come free. `GameDef.defaultFocus` lets a game lock itself to particular skill(s) (e.g. Equation Defence and times tables) without needing a `?focus=` in the URL - see `launchFrom` in `src/screens/Play.tsx`.
- `Session` normally shows one question at a time (`next()`/`current`/`submit()`). Equation Defence needed several questions live at once (falling meteors), so `Session` also has `spawn()`/`resolve()`/`openCount`: independent of the single-question API, they let a game hold multiple in-flight questions and resolve each one exactly once - correctly, wrongly, or (via `resolve(slotId, undefined)`) unanswered, which still scores as a real wrong attempt rather than being silently dropped. `length` is a total budget across every `spawn()` call, same as it caps `next()` calls - it is not a concurrency limit, so a game managing several open slots throttles its own concurrency (Equation Defence caps at 3 open meteors) rather than relying on the engine to do it.
- Answer widgets render their keypad and Check button into a fixed footer through a portal (`ui/foot.tsx`), so the keypad never covers the question and the page never jumps.
- The answer input logic is plain functions in `ui/inputLogic.ts` with tests.
- HashRouter is used so the app works from any static host without server rewrites.
- Not in React StrictMode: the question screen's first-question effect assumes a single run.

## Decisions and their reasons

- **No backend of our own.** A family app should not need hosting, accounts or a privacy policy. The parent's own Supabase project is optional and holds only first names and answers.
- **Generated questions over a question bank.** Endless variety, difficulty on demand, and any report can be reproduced. The cost is that each generator needs careful writing; the audit and the gallery exist to keep that honest.
- **One currency.** Separate scores per game make games compete; one XP total makes any game worth playing.
- **Points pay for growth.** Stretch questions, remembering a topic after a break, bouncing back after a rough patch, a new personal best on a topic and a daily habit all add bonuses, while piles of easy repeats on one topic pay less. The streak survives one missed day. Every award is a list of named parts that she sees on the summary screen, so there is no hidden maths. (Tuning numbers live at the top of `engine/points.ts`.)
- **Co-parenting is per-child, busy/free-by-default, and never a third backend.** Two separated households each run their own separate copy of HomeQuest — own family, own event log, own optional Supabase project. A child who splits time between both needs the two calendars to line up, without either household getting a window into the other's whole life. The model:
  - **Scoped to one child.** A `CoparentLinkEvent` (`family/types.ts`) names exactly one local child. Linking that child never exposes a sibling — `busyBlocksFor` (`family/coparent.ts`) walks that child's own agenda items only, the same items `itemsOn` already computes for the calendar, and drops anything not naming that child.
  - **Busy/free by default, opt-in detail per event.** The derived `BusyBlock[]` a household publishes carries no title or notes unless the source event is a plain calendar event with `shareDetail: true` (a field on `CalEvent`, toggled per event by the household that owns it) — that is the only way full detail ever crosses. School/club/closure items are the one exception: since they are already public facts, `busyBlocksFor` always labels them ("School", "Football club") rather than reducing them to an anonymous block. A parent's own personal event detail is never shared at all — only the fact that the shared child's time is booked, exactly as far as the child's own agenda already reflects it.
  - **Not the event log.** The append-only `events` table is one all-or-nothing log per family; filtering it row-by-row for a subset of one child's data would mean rebuilding replay semantics around partial logs. Instead, each household computes a small, derived `BusyBlock[]` snapshot locally (never a fold input, never replayed) and republishes the whole snapshot for a link whenever local state changes. A `shared_busy` table (`supabase/schema.sql`) holds two rows per link — one per household, keyed by `(link_key, household_slot)` — RLS-scoped by a link secret (`x-link-key`) exactly like the family log is scoped by the family key (a holder of a link's key may read or write either of that link's two rows, but nothing outside it), but it is a separate table with separate policies, and the `events` table and its policies are untouched.
  - **Decentralized, one shared project per link, no relay.** There is still no backend of our own — just, for a given link, ONE of the two households' own Supabase projects (in practice, whichever one creates the link) hosts both sides' rows, rather than each household needing its own. A household publishes its own blocks to its own slot's row and reads the other household's blocks from the other slot, both in that same project, using a link code (`hqc2.<url+anonKey+linkKey+householdSlot, base64url>`, `family/coparent.ts` `linkCodeFor`/`parseLinkCode` — same idea as the existing `hq1.` family code in `storage/pairing.ts`) that the creating parent generates and the other pastes in once; no code needs to travel the other way, and the redeeming household needs no Supabase project of its own for this link. `storage/coparentSync.ts` is the plain-fetch PostgREST transport (push our slot, pull the other slot, same project either way) and `app/coparentSyncManager.ts` is the debounced-republish/poll loop that drives it, modelled on `SyncManager` but entirely independent of it. The pulled snapshot is foreign, derived data, so it lives in local KV storage, never in the event log.
  - **Rewards and coins need no special-case code.** They already can't pool across households, because each household is a fully separate app instance with its own event log and its own optional Supabase project — the coin economy (`family/economy.ts`) only ever folds over its own family's events. The co-parenting mechanism above adds no shared table, no shared identifier and no code path that touches coins or XP, so there is nothing to keep separate that is not separate already.
