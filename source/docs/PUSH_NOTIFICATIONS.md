# Push notifications

Real Web Push, delivered by the browser/OS even when HomeQuest is closed. Built on standard Web Push +
a family's own Supabase project (Edge Function + `pg_cron`), the same way sync is built on that family's own
project. **Nothing here works until a family has already set up their own Supabase project for sharing** - see
the "Sharing between your phones" section in Parent -> Data. All of the setup below (VAPID keys, schema, Edge
Function, cron) is one-time and shared by every trigger - there's nothing extra to set up per trigger.

## What triggers a notification

Each of these schedules a row in `scheduled_notifications`, tagged so a later call for the same thing
(task edited, another dose logged, another feed logged, the sleep timer stopped) replaces the pending one
instead of piling up duplicates - see `scheduleNotification`/`cancelNotification` in `src/app/push.ts`.

- **Medicine doses.** After logging a dose, a "next safe dose" reminder is scheduled for whenever that
  medicine's minimum gap has passed (`nextDoseAt`, `src/family/care.ts`).
- **Tasks and chores due.** A task with both a date and a time gets a reminder 15 minutes before it's due
  (or right at the due time if it was set with less notice than that) - see `taskReminderAt`,
  `src/family/notify.ts`. A task with only a date, or no date at all, gets no reminder - there's no natural
  moment to fire it. Editing, completing or deleting a task cancels its pending reminder.
- **Baby still asleep.** Starting a sleep timer schedules a "still asleep, worth checking in?" nudge 4 hours
  later (the same "long nap" threshold already used for the in-app toast, `LONG_SLEEP_MIN` in
  `src/family/care.ts`). Stopping or cancelling the timer before then cancels the reminder.
- **Feed due soon.** Whenever a feed is logged (bottle, breast, solids), the next "feed due" reminder is
  scheduled using the same age-based expected feed gap the "overdue" handover check already uses
  (`feedGapMs`/`nextFeedReminderAt`, `src/family/care.ts`).
- **Calendar items coming up.** Every timed (not all-day) thing the Calendar screen shows gets a reminder 30
  minutes before it starts (or right at the start time if it was saved/discovered with less notice than that) -
  not just events made through the calendar's own "+" button, but the whole school-timetable layer too (lessons,
  clubs, school events, closures) and birthdays/arrival milestones. Tasks are the one exception - they keep
  their own separate "Tasks and chores due" reminder above, with its own wording and lead time, and the everyday
  routine/meal items are left out as not really being "calendar" appointments. An all-day item, or one with no
  start time, gets no reminder, same reasoning as a task with a date but no time.

  This one works differently from the others: rather than computing a single fire time when an event is saved
  and never touching it again, `resyncCalendarReminders` (`src/app/calendarReminders.ts`) re-scans a rolling
  3-day window and queues one reminder per occurrence it finds there, each tagged with that occurrence's own
  `AgendaItem.key` (already unique per source and date) rather than one shared tag per event. It's mounted once
  near the top of the app (`useCalendarReminders`, `App.tsx`) and re-runs on mount, every 30 minutes while the
  app stays open, and whenever the family's data changes - which is what makes a *repeating* item's reminder
  keep coming back for every occurrence, not just its first, and what covers items that were never "saved" as
  their own event in the first place (a lesson, a club) at all. Deleting an event/series cancels every one of
  its still-pending occurrence reminders in one call (`cancelEventReminder`, matching by tag prefix); skipping
  just one occurrence, or cancelling one day of a timetable item via its override editor, cancels only that
  occurrence's tag.

Each of these is individually toggleable on/off, per device, in Parent -> Data -> Notifications, below the
existing enable/disable control. Turning push on for the first time turns every type on - a parent switches
specific ones off from there rather than opting in to each separately. A type switched off is checked before
its trigger schedules anything (see `notifyTypeOn`, `src/app/context.tsx`), not just hidden in the UI.

## Live "feed in progress" notification (Android)

Unlike everything above, this one is not a server push through `scheduled_notifications`/`pg_cron` at all - it's
a **local** notification the device shows itself, the moment a *breastfeeding* session (started from Care - a
bottle feed has no "side", so it never gets this) is live, and updates/closes as that session changes. It reuses
the "Feed due soon" toggle above rather than adding a new one.

- **Content:** `src/family/feedNotify.ts` builds the title/body and three action buttons - Switch side, Pause
  (or Resume, once paused), End - from the feed run's live state (`FeedRunState`, `src/family/care.ts`).
- **Showing/updating it:** `src/app/feedRunNotify.ts`, mounted once near the top of the app (`App.tsx`, alongside
  `useCalendarReminders`), watches the family's live feed runs and calls `registration.showNotification()` with a
  stable `feedrun:<id>` tag so a refresh replaces the same notification instead of piling up duplicates.
- **The buttons:** every platform gets the same three actions. A browser without notification action-button
  support (iOS Safari, as of writing) simply ignores `actions` per spec and shows a plain notification instead -
  there is no per-platform detection code anywhere. Tapping that plain notification opens the app to the Care
  screen (`./#/care`), same as tapping the notification body on any platform - iOS's "just open the feeding UI"
  behavior falls out of this for free, it isn't special-cased.
- **Handling a button tap:** service worker `notificationclick` (`src/sw.ts`) never opens or focuses a window for
  a button tap - the whole point is controlling the feed without switching to the app. If a tab is open anywhere,
  it forwards `{type:'feedrun-action', action, feedRunId, babyId}` to it via `postMessage`, and
  `feedRunNotify.ts`'s message listener performs the action with the exact same `careActions.ts` calls the
  in-app buttons use (`switchFeedSide`/`pauseFeedRun`/`resumeFeedRun`/`stopFeedRun`). If no tab is open, `sw.ts`
  does it headlessly: it reads this device's own `studyquest` IndexedDB store directly (same one `Repo`/
  `SyncManager` use), builds the same event(s), saves them locally and queues them in `sync.pending` (so a normal
  sync will always pick them up eventually), and makes a best-effort immediate `POST` to the family's Supabase
  `/rest/v1/events` so other phones see the change right away instead of waiting for the app to next be opened.
  Ending a feed this way also re-arms (or cancels) the "Feed due soon" reminder, same as ending one in the app.
- **Caveat:** the headless path needs the device to have a network path to the family's Supabase project at the
  moment the button is tapped. If that immediate push fails, nothing is lost - the event is already saved locally
  and queued - but other phones won't see the change until this device's app is next opened and syncs normally.

## Not built

The weekly summit has no settable day/time in the app yet (it's a checklist walked through whenever, not
something scheduled for a particular moment), so it has no reminder - there's nothing to remind about ahead
of. Presence detection and smart-speaker announcements remain out of scope, as before.

## One-time setup, per family's Supabase project

All of this happens outside the app - none of it can happen automatically from the sandbox that built this
feature, and none of it happens by itself when you deploy the site.

1. **Generate a VAPID keypair.** This identifies your app to the push services (Apple/Google/Mozilla's push
   endpoints); it is not a Supabase-specific concept.
   ```
   npx web-push generate-vapid-keys
   ```
   This prints a public and a private key. Do this once per family/app instance; don't share the private key.

2. **Public key -> the app.** Set it as a build-time env var so the client bundle can subscribe:
   ```
   VITE_VAPID_PUBLIC_KEY=<the public key>
   ```
   (Same place you'd set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, e.g. Netlify's environment variables.)
   Rebuild and redeploy the site after adding it. It's safe to ship - on its own it can't send anything.

3. **Run the schema.** Apply `supabase/schema.sql` (or just the new `push_subscriptions` /
   `scheduled_notifications` sections if you already ran the rest of it) in the project's SQL editor. This is
   additive - it does not touch `events` or `shared_busy`.

4. **Deploy the Edge Function.** From the repo, with the Supabase CLI logged in and linked to the family's
   project:
   ```
   supabase functions deploy send-notifications
   ```

5. **Set the Edge Function's secrets** (never put these in the app or the repo):
   ```
   supabase secrets set VAPID_PUBLIC_KEY=<the public key>
   supabase secrets set VAPID_PRIVATE_KEY=<the private key>
   supabase secrets set VAPID_SUBJECT=mailto:you@example.com
   supabase secrets set SERVICE_ROLE_KEY=<Project Settings -> API -> service_role key>
   ```
   Note the name is `SERVICE_ROLE_KEY`, not `SUPABASE_SERVICE_ROLE_KEY` - the Supabase CLI refuses to let you
   set any secret whose name starts with `SUPABASE_`, since that prefix is reserved for values it injects
   itself. `SUPABASE_URL` is one of those auto-provided values, so there's nothing to set for it yourself; if
   the function's logs ever say otherwise, that's worth a second look, but it shouldn't be needed.

6. **Enable `pg_cron` and `pg_net`.** In the dashboard: Database -> Extensions -> enable both. This is a
   dashboard click, not something the SQL file can do for you in every project.

7. **Schedule the cron job.** Run the commented-out `cron.schedule(...)` block at the bottom of
   `supabase/schema.sql`, filling in your project ref and service_role key. It calls the Edge Function every
   minute via `net.http_post`.

8. **Turn it on in the app.** Parent -> Data -> Notifications -> "Enable notifications on this device". This
   must be a real tap (browsers ignore permission requests not triggered by a user gesture) and requires sharing
   to already be on.

## Verify-against-current-dashboard flags

Supabase's dashboard and platform APIs change. Double-check these specifically before relying on this in
production:
- That `pg_cron` + `pg_net` are still the two extensions needed, and that `net.http_post` calling an Edge
  Function URL directly (rather than some newer built-in "scheduled function" feature) is still the recommended
  pattern.
- That `npm:web-push` still works as documented via Deno's npm compatibility layer inside a Supabase Edge
  Function's runtime - if it doesn't, swap in a Deno-native Web Push implementation.
- Exact extension names/toggles under Database -> Extensions haven't moved.

## Platform notes

- **iOS**: notifications only work for a PWA that has been added to the Home Screen (Share -> Add to Home
  Screen) - this is an Apple/Safari platform requirement, not a bug in this app. Opening HomeQuest in a normal
  Safari tab cannot request notification permission at all on iOS.
- Multiple devices can each subscribe independently; each gets its own row in `push_subscriptions` and its own
  push message.
- If a device's subscription goes stale (uninstalled, permission revoked, etc.), the push service tells the
  Edge Function with a 404/410, and that row is deleted automatically on the next cron tick.

## What's NOT built (deferred, on purpose)

Home Assistant / smart speaker announcements, presence detection, and any reminder trigger beyond the one
medicine-dose reminder above. Phase 1 is only meant to prove the push pipeline works end-to-end; more triggers
are a later phase.

## Who gets what

- **Baby care (feed due soon, still asleep, next safe dose) goes to parents only.** Each reminder is queued once per active parent, with that parent's `member_id`, tagged `<tag>:<memberId>` (`scheduleNotificationFor` in `src/app/push.ts`, recipients from `careRecipients` in `src/family/notify.ts`). The send function only delivers a reminder with a `member_id` to that member's own subscriptions, so a child's phone never gets one. Re-scheduling or cancelling clears every copy (`<tag>:*`) plus any older untargeted copy queued before this change. The service worker's headless "End" button does the same.
- **The live "feed in progress" notification** is only shown on a phone whose chosen person ("Who is this phone?") is a parent; a child's phone closes any it was already showing.
- Each phone's `member_id` is whoever was picked on "Who is this phone?" when notifications were turned on. If that changes, turn notifications off and on again on that phone.
- Homework alerts go to the child and each parent (see HOMEQUEST.md). Task and calendar reminders are still untargeted (every phone with notifications on).
