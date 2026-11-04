-- HomeQuest 0.9: private events. Run once in the Supabase SQL editor of the project you already use (after schema.sql / schema_v2.sql).
--
-- What it does: an event can now be stored with an `owner_key` (a random secret that belongs to one family member and lives
-- on that person's phone). Rows with an owner_key are only returned to a request that presents the same key in an
-- `x-member-key` header, so the rest of the family's phones never download them. Everything else works as before.
--
-- Run this BEFORE deploying the 0.9 app. Until the app sees the column it keeps the "Private" switch off.
-- Note: you, as the owner of the Supabase project, can still read every row in the dashboard.

alter table public.events add column if not exists owner_key text;

create or replace function public.request_member_key() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-member-key', '')
$$;

drop policy if exists "family can read its events" on public.events;
create policy "family can read its events" on public.events
  for select to anon
  using (
    family_key = public.request_family_key() and length(family_key) >= 16
    and (owner_key is null or owner_key = public.request_member_key())
  );

drop policy if exists "family can add events" on public.events;
create policy "family can add events" on public.events
  for insert to anon
  with check (
    family_key = public.request_family_key() and length(family_key) >= 16
    and (owner_key is null or length(owner_key) >= 32)
  );

grant select, insert on public.events to anon;
