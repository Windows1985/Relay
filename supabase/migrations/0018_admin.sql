-- Admin panel for a single designated account. The flag lives on profiles;
-- clients cannot set it because the profiles UPDATE grant is already
-- column-scoped to (username, motion_denied) — see 0014.
alter table public.profiles add column is_admin boolean not null default false;
update public.profiles set is_admin = true where username = 'test1';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Open a chosen game in one of the admin's own groups right now, ignoring
-- the nightly window and the mode's min_players/requires gates (it's for
-- testing). Today's existing round is replaced only when p_replace is
-- true — deleting it cascades its submissions/votes/reports.
create or replace function public.admin_open_round(p_group_id uuid, p_mode_id text, p_replace boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
  m public.modes;
  roster uuid[];
  n int;
  local_date_val date;
  existing uuid;
  prompt_id_val uuid;
  new_round_id uuid;
  app_url text;
  webhook_secret text;
begin
  if not public.is_admin() then raise exception 'Not an admin'; end if;
  if not public.is_group_member(p_group_id) then raise exception 'Not a member of that group'; end if;

  select * into g from public.groups where id = p_group_id;
  select * into m from public.modes where id = p_mode_id;
  if m.id is null then raise exception 'Unknown mode'; end if;

  local_date_val := (now() at time zone g.tz)::date;
  select id into existing from public.rounds where group_id = p_group_id and local_date = local_date_val;
  if existing is not null then
    if not p_replace then raise exception 'ROUND_EXISTS'; end if;
    delete from public.rounds where id = existing;
  end if;

  select array_agg(user_id) into roster from public.memberships where group_id = p_group_id;
  n := coalesce(array_length(roster, 1), 0);
  select id into prompt_id_val from public.prompts where mode_id = p_mode_id order by random() limit 1;

  insert into public.rounds (group_id, mode_id, prompt_id, local_date, opens_at, votes_close_at, roster, allowed_misses)
  values (
    p_group_id, p_mode_id, prompt_id_val, local_date_val, now(),
    case when m.needs_vote then ((local_date_val + 1) + time '12:00') at time zone g.tz else null end,
    roster, greatest(1, n / 4)
  )
  returning id into new_round_id;

  select value into app_url from public.app_settings where key = 'app_url';
  select value into webhook_secret from public.app_settings where key = 'webhook_secret';
  if app_url is not null and webhook_secret is not null then
    perform net.http_post(
      url := app_url || '/api/push/open',
      headers := jsonb_build_object('content-type', 'application/json', 'x-relay-secret', webhook_secret),
      body := jsonb_build_object('round_id', new_round_id)
    );
  end if;

  return new_round_id;
end;
$$;

-- Push a round forward without waiting: reveal it if it hasn't revealed,
-- otherwise close voting; then run tick() immediately so settlement
-- happens now rather than on the next cron minute.
create or replace function public.admin_advance_round(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
begin
  if not public.is_admin() then raise exception 'Not an admin'; end if;
  select * into r from public.rounds where id = p_round_id;
  if r.id is null then raise exception 'Round not found'; end if;
  if not public.is_group_member(r.group_id) then raise exception 'Not a member of that group'; end if;

  if r.reveal_at is null then
    update public.rounds set reveal_at = now() where id = p_round_id;
  elsif r.settled_at is null and r.votes_close_at is not null and r.votes_close_at > now() then
    update public.rounds set votes_close_at = now() where id = p_round_id;
  end if;

  perform public.tick();
end;
$$;

-- Own any cosmetic for free (streak-gated ones included). No ledger entry.
create or replace function public.admin_grant_cosmetic(p_cosmetic_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not an admin'; end if;
  if not exists (select 1 from public.cosmetics where id = p_cosmetic_id) then raise exception 'Unknown cosmetic'; end if;
  insert into public.owned_cosmetics (user_id, cosmetic_id) values (auth.uid(), p_cosmetic_id)
  on conflict do nothing;
end;
$$;
