-- HomeQuest 0.17: one shared project for every family, by invitation. Run once in the Supabase SQL editor of the project
-- the app is built against (after schema.sql ... schema_v4.sql). Safe to run more than once.
--
-- Why: the app now has this project's URL and public key built in, so a new family never has to set up Supabase. The
-- catch is that anyone who finds the app could then start storing data here. This file closes that: a family can only
-- write once its family key is on the approved list, and the only way onto the list (other than you, in this editor) is
-- a one-time invite code made by a family that is already on it.
--
-- What it does
--   * public.families           approved family keys. Everyone already syncing is added (nobody is cut off).
--   * public.family_invites     one-time invite codes: who made it, when it runs out, who used it.
--   * events / push_subscriptions / scheduled_notifications: adding rows now also needs an approved family key.
--     Reading is unchanged (a family could only ever read its own rows).
--   * Three functions the app calls:
--       family_status()                 -> { approved, open_invites }   for the x-family-key header
--       create_family_invite()          -> { code, expires_at }          approved families only, up to 5 open at once
--       redeem_family_invite(code)      -> { ok, error? }                approves the caller's family key
--   * shared_busy (co-parent busy/free) is left as it is: it is keyed by a link secret, not a family.
--
-- Run this BEFORE deploying the 0.17 app is not required: until these functions exist the app turns sharing on without
-- an invite, exactly as before. Once this has run, a new family needs an invite.
--
-- Looking after it (SQL editor):
--   Who is approved:     select family_key, approved_at, note, invited_by from public.families order by approved_at;
--   Open invites:        select code, created_by, expires_at from public.family_invites where used_at is null and expires_at > now();
--   Approve by hand:     insert into public.families (family_key, note) values ('<middle part of their hq1. code>', 'Name');
--   Remove a family:     delete from public.families where family_key = '<key>';   -- stops new writes; their rows stay
--                        (also delete from public.events where family_key = '<key>'; to remove their data)
--   Stop all invites:    update public.family_invites set expires_at = now() where used_at is null;

-- gen_random_bytes (invite codes) lives in pgcrypto: on by default in Supabase, in the extensions schema.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.families (
  family_key  text primary key check (length(family_key) >= 16),
  approved_at timestamptz not null default now(),
  invited_by  text,           -- family_key of the family whose invite was used (null = added by hand or grandfathered)
  note        text
);

create table if not exists public.family_invites (
  code        text primary key,
  created_by  text not null references public.families (family_key) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  used_by     text,
  used_at     timestamptz
);

-- Nobody reads or writes these through the API directly: only through the functions below.
alter table public.families enable row level security;
alter table public.family_invites enable row level security;
revoke all on public.families from anon, authenticated;
revoke all on public.family_invites from anon, authenticated;

-- Everyone already using the project is approved.
insert into public.families (family_key, note)
  select distinct family_key, 'already syncing' from public.events where length(family_key) >= 16
  on conflict do nothing;
do $$ begin
  if to_regclass('public.push_subscriptions') is not null then
    insert into public.families (family_key, note)
      select distinct family_key, 'already syncing' from public.push_subscriptions where length(family_key) >= 16
      on conflict do nothing;
  end if;
  if to_regclass('public.scheduled_notifications') is not null then
    insert into public.families (family_key, note)
      select distinct family_key, 'already syncing' from public.scheduled_notifications where length(family_key) >= 16
      on conflict do nothing;
  end if;
end $$;

-- Is this key approved? security definer so policies can ask without anon being able to read the table.
create or replace function public.family_approved(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.families where family_key = k)
$$;
revoke all on function public.family_approved(text) from public;
grant execute on function public.family_approved(text) to anon, authenticated;

-- ------------------------------------------------------------------ writes need an approved family

drop policy if exists "family can add events" on public.events;
create policy "family can add events" on public.events
  for insert to anon
  with check (
    family_key = public.request_family_key() and length(family_key) >= 16
    and public.family_approved(family_key)
    and (owner_key is null or length(owner_key) >= 32)
  );

do $$ begin
  if to_regclass('public.push_subscriptions') is not null then
    drop policy if exists "family can manage its push subscriptions" on public.push_subscriptions;
    create policy "family can manage its push subscriptions" on public.push_subscriptions
      for all to anon
      using (family_key = public.request_family_key() and length(family_key) >= 16)
      with check (family_key = public.request_family_key() and length(family_key) >= 16 and public.family_approved(family_key));
  end if;
  if to_regclass('public.scheduled_notifications') is not null then
    drop policy if exists "family can add its scheduled notifications" on public.scheduled_notifications;
    create policy "family can add its scheduled notifications" on public.scheduled_notifications
      for insert to anon
      with check (family_key = public.request_family_key() and length(family_key) >= 16 and public.family_approved(family_key));
  end if;
end $$;

-- ------------------------------------------------------------------ the app's three calls

create or replace function public.family_status() returns json
language plpgsql stable security definer set search_path = public as $$
declare k text := public.request_family_key();
begin
  return json_build_object(
    'approved', length(k) >= 16 and public.family_approved(k),
    'open_invites', (select count(*) from public.family_invites where created_by = k and used_at is null and expires_at > now())
  );
end $$;

create or replace function public.create_family_invite() returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  k text := public.request_family_key();
  c text;
begin
  if length(k) < 16 or not public.family_approved(k) then
    return json_build_object('ok', false, 'error', 'not_approved');
  end if;
  if (select count(*) from public.family_invites where created_by = k and used_at is null and expires_at > now()) >= 5 then
    return json_build_object('ok', false, 'error', 'too_many');
  end if;
  -- hqi. + 12 characters from an alphabet without look-alikes (0/o, 1/l/i): about 60 bits.
  c := 'hqi.' || (
    select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + (get_byte(b, i) % 31), 1), '' order by i)
    from (select gen_random_bytes(12) as b) r, generate_series(0, 11) i
  );
  insert into public.family_invites (code, created_by) values (c, k);
  return json_build_object('ok', true, 'code', c, 'expires_at', now() + interval '14 days');
end $$;

create or replace function public.redeem_family_invite(invite text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  k text := public.request_family_key();
  inv public.family_invites%rowtype;
begin
  if length(k) < 16 then return json_build_object('ok', false, 'error', 'bad_family_key'); end if;
  if public.family_approved(k) then return json_build_object('ok', true, 'already', true); end if;
  select * into inv from public.family_invites where code = lower(trim(invite)) for update;
  if not found then return json_build_object('ok', false, 'error', 'unknown'); end if;
  if inv.used_at is not null then return json_build_object('ok', false, 'error', 'used'); end if;
  if inv.expires_at <= now() then return json_build_object('ok', false, 'error', 'expired'); end if;
  update public.family_invites set used_by = k, used_at = now() where code = inv.code;
  insert into public.families (family_key, invited_by) values (k, inv.created_by) on conflict do nothing;
  return json_build_object('ok', true);
end $$;

revoke all on function public.family_status() from public;
revoke all on function public.create_family_invite() from public;
revoke all on function public.redeem_family_invite(text) from public;
grant execute on function public.family_status() to anon;
grant execute on function public.create_family_invite() to anon;
grant execute on function public.redeem_family_invite(text) to anon;
