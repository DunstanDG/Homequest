# Projects (Plan > Projects)

A project is a high-level goal ("Turn the box room into a study by half term") broken down into small activities,
level by level, and worked through in sessions.

## How it works

- **Activities form a tree.** An activity with things inside it is a **group**; one without is a **step**, the thing
  you actually do (tick it off, or do it in a session). A group's time is the total of its steps.
- **Breaking down.** "Break it down with AI" asks Gemini for the first level. Any activity can then be broken down
  again ("Break down with AI" in its editor), as many levels as you like. The project's **smallest step** setting
  (10 min, 20 min, 30 min, 1 h) is the level of detail it aims for, and the "N steps are bigger than…" card breaks every
  oversized step down a level in one go (up to six at a time). Everything AI suggests carries a ✨ until you edit it.
- **Edit, add, delete.** Tap any activity to rename it, change its time or details, move it earlier or later, mark it
  done, or delete it (deleting a group deletes what's inside; anything that waited for it now waits for what it waited
  for, so the chain isn't broken). "Add" takes one activity per line (`Measure the window ~10`), optionally chained
  in that order.
- **Dependencies ("has to wait for").** Siblings can wait for each other. The wait also holds for everything inside: if
  "Decorate" waits for "Clear out the room", every step inside "Decorate" waits for every step inside "Clear out".
  Waiting activities are dimmed with 🔒 and what they wait for; links that would make a loop can't be chosen. Linked
  siblings get a coloured edge so a chain reads as one thing.
- **Grouping.** "Group…" lets you tick siblings and put them into a new group. Links between them stay; links to things
  outside move to the group. "Ungroup" (in a group's editor) does the reverse.
- **Playing.** "Play" runs the steps still to do as a session (the usual run screen with the clock), in an order that
  respects every link, for as long as you have (15 min to all of it). The ▶ on a group plays just that group.
  Finishing a step in the session ticks the activity off; undoing it in the session un-ticks it.
- **Planning sessions.** "Plan sessions" packs the remaining steps, in order, into sessions of 20–90 minutes on the
  weekdays you pick, from a start date, optionally at a time and for one person. They show on the calendar and on
  Today with a Start button. A session holds the activity ids, not copies, so it always runs with the activities as
  they are on the day (renamed, re-timed, skipped if already done, expanded if since broken down). Planning again
  replaces the planned sessions that haven't been started. Project sessions are listed in the project, not under
  Sessions.

## Turning on AI breakdowns

The prompt follows the agreed template: a system instruction (expert productivity assistant, granular actionable tasks,
realistic minutes, JSON only), then `Goal:` and `Additional Context/Constraints:` with the project's notes plus dynamic
context (time per day, experience, who's doing it as a role only, the level of detail, and for a deeper call the
bigger goal, where the piece sits and what its neighbours already cover). It asks for structured output
(`responseMimeType: application/json` + `responseSchema`) in the shape
`{ project_title, total_estimated_minutes, tasks: [{ task_id, title, description, estimated_minutes, dependencies }] }`.
Every answer is checked before anything is saved: unknown or self dependencies and any loop are dropped, minutes are
clamped to 1–600, at most 20 tasks. Names are never sent.

The prompt, schema and checks live in one file, `supabase/functions/_shared/breakdown.ts`, used by both the app and
the function.

### For the whole family (recommended): the `breakdown` Edge Function

Needs sharing (Supabase) set up already, like push notifications.

1. Get a key from Google AI Studio: https://aistudio.google.com/apikey
2. Find your family code: Parent area > Data > Show family code (it starts `hq1.`).
3. Set the secrets:

   ```
   supabase secrets set GEMINI_API_KEY=your-gemini-key
   supabase secrets set ALLOWED_FAMILY_KEYS=hq1.your-family-code
   supabase secrets set GEMINI_MODEL=gemini-3.8-flash   # optional; this is the default
   supabase secrets set GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite   # optional; the default, or "none"
   ```

   `ALLOWED_FAMILY_KEYS` is required: the public anon key lets anyone write to the events table, so "a family that
   exists" proves nothing, and without the list the function refuses every request rather than let strangers spend
   your Gemini key. Several families can share one function: separate their codes with commas.

4. Deploy it, either way:
   - **Dashboard:** Edge Functions > Deploy a new function > Via Editor. Name it exactly `breakdown`, replace the
     sample code with the whole of `breakdown-function-index.ts` (the single-file version: the shared prompt code with
     the function below it), and deploy. Then, in the function's Details, turn **off** "Verify JWT": the function checks the family code itself, and with JWT verification on, Supabase can turn the app away with a 401 before the function runs.
   - **CLI:** `supabase functions deploy breakdown` from the project folder (it bundles the `_shared/` file).

The app calls it with the family key in the `x-family-key` header. The function only answers the families in
`ALLOWED_FAMILY_KEYS`, and allows 30 breakdowns per family per 10 minutes. The Gemini key never reaches a phone.
If the model rejects the schema form, it retries once asking for plain JSON (the checks still apply).

**When Gemini is busy.** Gemini answers 503 ("The model is overloaded") at busy times; it isn't a fault in the app
or the setup, and it usually clears within seconds. The function (and the on-phone key) gives the model three goes,
about 1 and 4 seconds apart, then hands the request to the fallback model (`gemini-3.1-flash-lite`, which has its
own capacity and quota). A 429 (out of quota) goes straight to the fallback. If both are busy, the app says so and
shows **Try again**. The function's logs (Edge Functions > breakdown > Logs) record which model failed and how.

### Just on one phone

Plan > Projects > "AI breakdown settings" (parents only): paste a Gemini key. It's kept in that browser's storage
only, never synced, and calls Gemini directly from that phone. Handy for trying it out. If a key is saved there it's
used in preference to the function on that phone.

### In the demo

`?demo=1` uses a made-up sample breakdown with no network call, so the preview works anywhere.

## Where things live

- `src/family/projects.ts`: reading (the tree, play order, what's waiting, linked clusters, session steps, packing).
- `src/family/projectActions.ts`: every write (create, break down, edit, delete, group, ungroup, move, tick, plan).
- `src/app/breakdown.ts`: calling Gemini (demo sample, on-phone key, or the family function).
- `src/screens/plan/Projects.tsx` (list, new project, AI settings) and `ProjectScreen.tsx` (one project).
- `supabase/functions/breakdown/` and `supabase/functions/_shared/breakdown.ts`.
- Events: `project` and `activity` (upserts, soft-deleted); a session planned from a project is a `routine` with
  `project: { projectId, activityIds }` and no saved steps.
