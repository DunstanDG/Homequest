-- StudyQuest sync schema (run once in the Supabase SQL editor of a NEW project you own).
--
-- Model: one append-only table of events. Everyone who knows the "family key" (part of the family
-- code the parent creates) can read and add that family's events. The public anon key on its own can
-- read nothing, because every policy demands the matching x-family-key header.
--
-- The family key is effectively a password: use the app's "new family code" button (random, 128 bit),
-- don't reuse it elsewhere, and rotate it (new code, re-pair devices) if it leaks.

create table if not exists public.events (
  seq         bigint generated always as identity primary key,  -- server order; used as the sync cursor
  id          text        not null unique,                       -- client-generated event id (idempotent inserts)
  family_key  text        not null,
  learner_id  text        not null,
  ts          bigint      not null,                              -- client timestamp (ms)
  type        text        not null,
  body        jsonb       not null,                              -- the full event
  created_at  timestamptz not null default now()
);

create index if not exists events_family_seq on public.events (family_key, learner_id, seq);

alter table public.events enable row level security;

-- Header the client sends on every request.
create or replace function public.request_family_key() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-family-key', '')
$$;

drop policy if exists "family can read its events" on public.events;
create policy "family can read its events" on public.events
  for select to anon
  using (family_key = public.request_family_key() and length(family_key) >= 16);

drop policy if exists "family can add events" on public.events;
create policy "family can add events" on public.events
  for insert to anon
  with check (family_key = public.request_family_key() and length(family_key) >= 16);

-- No update or delete policies: the log is append-only from the app's point of view.
revoke all on public.events from anon;
grant select, insert on public.events to anon;

-- ---------------------------------------------------------------------------------------------------------
-- Co-parenting: shared busy/free snapshot for ONE linked child. Unlike `events` above, which is per-family and
-- lives in each household's OWN project, a co-parent link's two rows (one per household, "slot" a/b) live
-- together in a SINGLE shared project — whichever household created the link, in practice (see
-- src/family/coparent.ts, src/screens/family/Coparenting.tsx). This is deliberately NOT part of the `events`
-- log: it is a small, derived snapshot (a `BusyBlock[]` computed locally from that household's own state),
-- republished whenever it changes.
--
-- There is no relay: both rows for a link sit in this one project, and the link's secret (`link_key`, sent as
-- the `x-link-key` header) is what scopes access — exactly like `family_key` scopes the whole `events` table
-- above to one family. Anyone holding a link's `link_key` may read BOTH of that link's rows (they need the
-- other household's slot to pull its blocks) and may insert/update EITHER slot's row for that link_key (a
-- household only ever writes its own slot in practice, enforced by the app, not by RLS — the key is what's
-- secret, the slot letter isn't). A `link_key` can never see or touch another link's rows.

create table if not exists public.shared_busy (
  link_key       text not null,
  household_slot text not null check (household_slot in ('a', 'b')),
  blocks         jsonb not null,
  updated_at     timestamptz not null default now(),
  primary key (link_key, household_slot)
);

alter table public.shared_busy enable row level security;

create or replace function public.request_link_key() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-link-key', '')
$$;

drop policy if exists "linked household can read its row" on public.shared_busy;
drop policy if exists "link holder can read both rows for its link" on public.shared_busy;
create policy "link holder can read both rows for its link" on public.shared_busy
  for select to anon
  using (link_key = public.request_link_key() and length(link_key) >= 16);

drop policy if exists "linked household can publish its row" on public.shared_busy;
drop policy if exists "link holder can publish a row for its link" on public.shared_busy;
create policy "link holder can publish a row for its link" on public.shared_busy
  for insert to anon
  with check (link_key = public.request_link_key() and length(link_key) >= 16);

drop policy if exists "linked household can update its row" on public.shared_busy;
drop policy if exists "link holder can update a row for its link" on public.shared_busy;
create policy "link holder can update a row for its link" on public.shared_busy
  for update to anon
  using (link_key = public.request_link_key() and length(link_key) >= 16)
  with check (link_key = public.request_link_key() and length(link_key) >= 16);

revoke all on public.shared_busy from anon;
grant select, insert, update on public.shared_busy to anon;

-- ---------------------------------------------------------------------------------------------------------
-- Phase 1 push notifications: real Web Push that arrives even when the app/PWA is closed. See
-- docs/PUSH_NOTIFICATIONS.md for the one-time setup this needs (VAPID keys, Edge Function deploy, pg_cron).
--
-- Two tables, same family_key scoping as `events` above:
--  - push_subscriptions: one row per device/browser that has granted notification permission.
--  - scheduled_notifications: one row per pending reminder (currently: "next safe medicine dose").
-- A pg_cron job ticks every minute and calls the `send-notifications` Edge Function, which uses the
-- Supabase SERVICE ROLE key (an Edge Function secret, never sent to any client) to read/write
-- scheduled_notifications past RLS, send the Web Push messages, and mark rows sent.

create table if not exists public.push_subscriptions (
  id          bigint generated always as identity primary key,
  family_key  text        not null,
  member_id   text        not null,
  endpoint    text        not null,
  p256dh      text        not null,
  auth        text        not null,
  created_at  timestamptz not null default now(),
  unique (family_key, endpoint)
);

create index if not exists push_subscriptions_family on public.push_subscriptions (family_key);

alter table public.push_subscriptions enable row level security;

drop policy if exists "family can manage its push subscriptions" on public.push_subscriptions;
create policy "family can manage its push subscriptions" on public.push_subscriptions
  for all to anon
  using (family_key = public.request_family_key() and length(family_key) >= 16)
  with check (family_key = public.request_family_key() and length(family_key) >= 16);

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to anon;

create table if not exists public.scheduled_notifications (
  id          bigint generated always as identity primary key,
  family_key  text        not null,
  member_id   text,                                   -- null = send to every device in the family
  fire_at     timestamptz not null,
  title       text        not null,
  body        text        not null,
  tag         text        not null,                    -- dedupe key, e.g. med:<babyId>:<ruleName>
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists scheduled_notifications_due on public.scheduled_notifications (fire_at) where sent_at is null;
create index if not exists scheduled_notifications_family_tag on public.scheduled_notifications (family_key, tag);

alter table public.scheduled_notifications enable row level security;

-- The app itself only ever inserts a fresh reminder or deletes/replaces one by tag (to supersede an earlier
-- pending reminder, e.g. a new dose logged before the old one fires) - it never needs to see rows past its own
-- inserts, and the actual "is it due, send it, mark it sent" work is done by the Edge Function using the
-- service_role key below, which bypasses RLS entirely.
drop policy if exists "family can add its scheduled notifications" on public.scheduled_notifications;
create policy "family can add its scheduled notifications" on public.scheduled_notifications
  for insert to anon
  with check (family_key = public.request_family_key() and length(family_key) >= 16);

drop policy if exists "family can read its scheduled notifications" on public.scheduled_notifications;
create policy "family can read its scheduled notifications" on public.scheduled_notifications
  for select to anon
  using (family_key = public.request_family_key() and length(family_key) >= 16);

drop policy if exists "family can delete its scheduled notifications" on public.scheduled_notifications;
create policy "family can delete its scheduled notifications" on public.scheduled_notifications
  for delete to anon
  using (family_key = public.request_family_key() and length(family_key) >= 16);

revoke all on public.scheduled_notifications from anon;
grant select, insert, delete on public.scheduled_notifications to anon;

-- ---------------------------------------------------------------------------------------------------------
-- pg_cron job: run once, per family Supabase project, AFTER deploying the `send-notifications` Edge Function.
--
-- MANUAL DASHBOARD STEPS FIRST (cannot be done from plain SQL in every Supabase project):
--   1. Database -> Extensions -> enable "pg_cron".
--   2. Database -> Extensions -> enable "pg_net" (lets Postgres make an HTTP call from a cron job).
-- Then run the block below in the SQL editor, with the two placeholders filled in:
--   <PROJECT_REF>       - your project's ref, from its URL (https://<PROJECT_REF>.supabase.co)
--   <SERVICE_ROLE_KEY>  - the project's service_role key (Project Settings -> API). This SQL statement is the
--                         one place it's ever written down outside the Edge Function's own secret - it lives
--                         in your project's database, not in the app or the repo, but treat it as sensitive.
--
-- Verify against the current Supabase dashboard before running this: the exact extension names and whether
-- `net.http_post` is still the documented way to call an Edge Function from pg_cron have both been Supabase's
-- documented approach, but platform UIs and APIs change - re-check Database -> Cron and Database -> Extensions
-- if this doesn't match what you see.
--
-- select cron.schedule(
--   'send-notifications-every-minute',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- To remove it later: select cron.unschedule('send-notifications-every-minute');
