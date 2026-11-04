# D: Calmer notifications

Reminders are now **few, bundled and predictable**, and they stop when someone says they're overwhelmed.

## What changed

**`supabase/functions/_shared/notifyPlan.ts`** is a pure planner (`planMember`) with no I/O. `send-notifications/index.ts` is the I/O shell around it. For each family and then each person (all of their devices together) it does this:

| Rule | Behaviour |
| --- | --- |
| **Urgent kinds** | Tags starting `med:` (next safe dose), `feed:` (feed due) and `sleep:` (baby still asleep) go out immediately, one message each. They ignore the cap, the pause, the morning summary and the no-repeat rule, and are not counted. Everything else (`task:`, `event:`, `hw:`, `checkin:`) is non-urgent. |
| **Bundling** | Whatever is due now, plus anything due in the next 10 minutes, goes out as one message: "3 things coming up" / "Walk Biscuit, Pack school bag, Piano at 16:15" (up to 5 listed, then "and N more"). A single item is sent exactly as written. Items use their `label` (new, optional) and fall back to the body. |
| **Daily cap** | Non-urgent *messages* (a bundle counts as one) per person per **local** day. Default 6 for children, 10 for adults. The choices in the app are 3, 6, 10 and 15. Over the cap, items wait for the next tick. An item more than 6 hours past its time is no longer useful and is let go (`skipped = 'stale'`), not sent late. Counts live in `notification_counts`, so they are right across runs. |
| **Morning summary** | Per person and per device: "One summary in the morning" at a chosen time (default 07:30). Until then, individual non-urgent items are held. At that time, one message "Today: N things" lists the items due that local day. They are marked `summarised` and never sent again. Items created *after* the summary go out normally (bundled, capped). The summary counts as one message. |
| **"I'm overwhelmed"** | The function reads the latest `calm-pause` event per member (`events`, service role, newest `ts` wins) and treats `until > now` as paused. While paused, non-urgent items are **held, not sent**. After the pause ends, they are sent gently as one bundle if still fresh (under 6 hours old), otherwise let go quietly. Urgent kinds are never held. I chose "hold, then drop if stale" over a special next-morning message: no extra, surprising ping. |
| **No nagging children** | A person whose subscription has `prefs.child = true` is never sent a second reminder with the same tag within 20 hours (`skipped = 'repeat'`), unless a parent switched on "Repeat reminders for children" (`push_subscriptions.repeat_kids`, saved on every device of the family). The main source of repeats was the apps re-queuing a calendar/task reminder after the first was sent (the fall-back "at the start time" reminder). The homework and check-in schedulers send once per piece or day, so they needed no change beyond the copy. |

Rows for "everyone" (`member_id` null: tasks, calendar) are tracked per person in `scheduled_notifications.delivered_to` and finished (`sent_at`) once every person has been dealt with. So one person's pause or cap never blocks or doubles another's.

**Kinder copy.** There is no "overdue" or "due... not done" wording left. Homework: "Homework for tomorrow" / "Maths sheet is still there whenever you're ready." (for parents: "...is still waiting, if a gentle nudge would help."). Tasks and calendar items now share the title "Coming up", and calendar bodies include the time ("Piano at 16:15").

**Settings** (`Parent > Data > Notifications`, inside the "What to notify about" block once the device is on): morning summary on or off and its time, most messages a day, and for parents "Repeat reminders for children". Choices are stored on the device (`localStorage`, `hq-notify-choices`) and copied to the device's subscription row (`prefs` jsonb: `morning`, `morningAt`, `cap`, `child`, `tz`). Turning the family-wide switch on from a parent device sets `repeat_kids` for every device in the family.

## Files

New: `supabase/schema_v7.sql`, `supabase/functions/_shared/notifyPlan.ts`, `src/npm-web-push.d.ts` (types for the Deno `npm:` import), `src/storage/sendNotifications.test.ts` (runs the real function with a fake PostgREST and push service), `src/storage/schemaV7.test.ts` (PGlite).

Edited: `send-notifications/index.ts`, `src/app/push.ts`, `homeworkAlerts.ts`, `checkinReminders.ts`, `calendarReminders.ts`, `src/screens/parent/Data.tsx` (`NotificationsSection` plus its import line), and one line in `src/screens/family/shared.tsx` (task reminder wording and label).

## Deploying (for the user)

1. Run `supabase/schema_v7.sql` in the Supabase SQL editor (safe to re-run). Do this **first**. The old function and old apps keep working after it.
2. Redeploy the function: `supabase functions deploy send-notifications`. It needs v7 and says so (HTTP 500) if it hasn't been run. The secrets are unchanged.
3. Ship the app. Until step 1 has run, the app quietly skips saving the new settings and the `label` (it retries without them).
4. Each device saves its calm choices when the setting changes or when it subscribes. A device that subscribed earlier uses the defaults (no morning summary, usual cap) until someone opens the setting. A child device counts as a child only after it re-subscribes or the setting is touched on it.

## Known limits

- The pause is read from the synced `calm-pause` event written by workstream C. If it has not shipped, nothing is ever paused.
- The settings only show once a device is subscribed, which headless audit runs can't be, so the layout audit passed but didn't see them. Check at 402px and 412px with a subscribed device.
- The "repeat reminders" switch needs a parent device that has notifications on.
- A device with no person set is counted as one person with its own cap.

## Release notes (for `releases.ts`)

```ts
{
  id: '2026-11-04-calm-notifications',
  date: '2026-11-04',
  audience: 'all',
  area: 'app',
  emoji: '🔔',
  title: 'Fewer, calmer notifications',
  short: 'Calmer notifications',
  body: 'Reminders that land together now arrive as one message, there is a daily limit, and children hear about each thing once. Medicine and baby reminders still come straight away.',
  to: '/parent?tab=data',
},
{
  id: '2026-11-04-morning-summary',
  date: '2026-11-04',
  audience: 'parent',
  area: 'app',
  emoji: '🌅',
  title: 'A morning summary instead of pings',
  short: 'Morning summary',
  body: 'In Parent area, Data, Notifications you can choose one summary each morning instead of separate reminders. Reminders also wait while someone has paused with "I\'m overwhelmed".',
  to: '/parent?tab=data',
},
```
