-- HomeQuest 0.18 (calm release): calmer notifications. Run once in the Supabase SQL editor of the project the app is
-- built against (after schema.sql ... schema_v6.sql). Safe to run more than once. Run it BEFORE redeploying the
-- `send-notifications` Edge Function (the new function needs these columns and refuses to run without them).
-- The new app works with or without this file having run: it simply doesn't save the new settings until it has.
--
-- Why: a stream of single pings is stressful. The send-notifications function now bundles reminders, keeps a daily
-- count per person, can send one morning summary, stays quiet while someone has paused ("I'm overwhelmed"), and
-- never nags a child twice about the same thing. To do that across runs it needs to remember a few things:
--
--   * push_subscriptions.prefs         jsonb  per-device choices written by the app: { morning, morningAt, cap, child, tz }
--   * push_subscriptions.repeat_kids   bool   a parent allows repeat reminders for children (applied to every device
--                                             of the family; default off)
--   * scheduled_notifications.label    text   a short wording for use inside a bundle ("Piano at 16:15"); optional
--   * scheduled_notifications.delivered_to jsonb  the people (member ids) this reminder has already been dealt with
--                                             for. A reminder for "everyone" is finished once every person has been
--                                             dealt with; sent_at is then set as before.
--   * scheduled_notifications.skipped  text   why a reminder was let go instead of sent: 'stale' (too old to be useful),
--                                             'repeat' (a child was already told), 'summarised' (it was in the morning
--                                             summary). Null = it was sent in a normal message.
--   * public.notification_counts       one row per person per local day: how many non-urgent messages went out, and
--                                             whether that day's morning summary has been dealt with.
--
-- Row-level security is unchanged for the existing tables: a family can still only touch its own rows (the existing
-- policies are per row, so the new columns are covered by them). notification_counts is for the Edge Function only
-- (service role): the app can neither read nor write it.
--
-- Looking after it (SQL editor):
--   Today's counts:     select * from public.notification_counts where day = current_date order by family_key, member_id;
--   What was let go:    select tag, skipped, fire_at from public.scheduled_notifications where skipped is not null order by id desc limit 50;

alter table public.push_subscriptions
  add column if not exists prefs jsonb not null default '{}'::jsonb,
  add column if not exists repeat_kids boolean not null default false;

alter table public.scheduled_notifications
  add column if not exists label text,
  add column if not exists delivered_to jsonb not null default '[]'::jsonb,
  add column if not exists skipped text;

create table if not exists public.notification_counts (
  family_key   text    not null,
  member_id    text    not null,                -- '' for a device with no person set
  day          date    not null,                -- the person's LOCAL day (their time zone), not UTC
  sent         integer not null default 0,      -- non-urgent messages sent that day (urgent safety ones are not counted)
  summary_done boolean not null default false,  -- the morning summary for that day has been handled
  primary key (family_key, member_id, day)
);

-- Edge Function only (service role bypasses RLS). With RLS on and no policy, and no grants, the app's key sees nothing.
alter table public.notification_counts enable row level security;
revoke all on public.notification_counts from anon, authenticated;

-- Tidy-up helper (optional, never called automatically): forget counts older than two weeks.
-- delete from public.notification_counts where day < current_date - 14;
