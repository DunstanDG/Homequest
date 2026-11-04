-- HomeQuest 0.17: the weekly round table written by Gemini (optional). Run once in the Supabase SQL editor, after
-- deploying the `round-table` Edge Function (see docs/TRAVEL_AND_ALARMS.md, "Round table with Gemini"). Safe to re-run.
--
-- When the home server writes a round table as "waiting", this trigger tells the `round-table` function straight
-- away. The function checks the family's setting and does nothing unless it says Gemini, so families on the home
-- assistant are untouched. Without this file, a parent can still tap "Ask Gemini now" on the Round table screen.
--
-- Before running it, put two values in the vault (Project Settings > Vault, or the SQL below with your own secret).
-- The secret is a long random string; set the SAME value as the function's ROUND_TABLE_HOOK_SECRET:
--
--   select vault.create_secret('<a long random string>', 'round_table_hook_secret');
--   select vault.create_secret('https://shtcvoygkvpqhymwnnge.supabase.co/functions/v1/round-table', 'round_table_function_url');
--   -- and in a terminal:  supabase secrets set ROUND_TABLE_HOOK_SECRET=<the same long random string>
--
-- Never paste the secret into this file: it is committed to the repository.

create extension if not exists pg_net with schema extensions;

create or replace function public.round_table_hook() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  secret text;
  fn_url text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'round_table_hook_secret' limit 1;
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'round_table_function_url' limit 1;
  if secret is null or fn_url is null then return new; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', secret),
    body := jsonb_build_object('family_key', new.family_key, 'weekOf', new.body ->> 'weekOf'),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- Never let a problem here stop the home server's write.
  return new;
end $$;

revoke all on function public.round_table_hook() from public, anon, authenticated;

drop trigger if exists round_table_waiting on public.events;
create trigger round_table_waiting
  after insert on public.events
  for each row
  when (new.type = 'round-table' and new.body ->> 'status' = 'waiting')
  execute function public.round_table_hook();
