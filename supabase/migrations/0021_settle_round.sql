-- Reveal used to wait for the next pg_cron tick, so the last player to submit
-- sat on a "waiting" screen for up to 60s after the round was actually
-- complete. The settle logic is lifted out of tick() verbatim into
-- settle_round() so submit_round can fire it immediately, with no second copy
-- of the streak/freeze/token rules to drift.
create or replace function public.settle_round(p_round_id uuid, p_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
  m public.modes;
  winner uuid;
  misses int;
  survived boolean;
  used_by uuid;
  gate record;
  app_url text;
  webhook_secret text;
begin
  -- FOR UPDATE serialises concurrent callers (two players submitting at the
  -- same instant); the second one finds settled_at set and returns, so tokens
  -- and the streak can never be awarded twice.
  select * into r from public.rounds where id = p_round_id for update;
  if r.id is null or r.reveal_at is null or r.settled_at is not null then return; end if;

  select * into m from public.modes where id = r.mode_id;
  if m.needs_vote and (r.votes_close_at is null or p_at < r.votes_close_at) then return; end if;

  select value into app_url from public.app_settings where key = 'app_url';
  select value into webhook_secret from public.app_settings where key = 'webhook_secret';

  winner := null;
  if m.scoring = 'auto_high' then
    select user_id into winner from public.submissions
    where round_id = r.id order by score desc, submitted_at asc limit 1;
  elsif m.scoring = 'auto_low' then
    select user_id into winner from public.submissions
    where round_id = r.id order by score asc, submitted_at asc limit 1;
  elsif m.scoring = 'auto_target' then
    select user_id into winner from public.submissions
    where round_id = r.id order by abs(score - m.target) asc, submitted_at asc limit 1;
  elsif m.scoring = 'vote' then
    select x.target_user_id into winner from (
      select v.target_user_id, count(*) as vote_count, min(s.submitted_at) as first_sub
      from public.votes v join public.submissions s
        on s.round_id = v.round_id and s.user_id = v.target_user_id
      where v.round_id = r.id
      group by v.target_user_id
      order by vote_count desc, first_sub asc
      limit 1
    ) x;
  elsif m.scoring = 'tally' then
    select x.target into winner from (
      select (payload->>'target')::uuid as target, count(*) as picks, min(submitted_at) as first_sub
      from public.submissions
      where round_id = r.id and not hidden and payload ? 'target'
      group by (payload->>'target')::uuid
      order by picks desc, first_sub asc
      limit 1
    ) x;
  end if;

  if winner is not null then
    update public.rounds set winner_id = winner where id = r.id;
    insert into public.token_ledger (user_id, group_id, delta, reason, round_id)
    values (winner, r.group_id, 10, 'round_win', r.id);
  end if;

  misses := array_length(r.roster, 1) - (
    select count(*) from public.submissions where round_id = r.id and user_id = any(r.roster)
  );

  if misses <= r.allowed_misses then
    survived := true;
    update public.groups set streak = streak + 1, best_streak = greatest(best_streak, streak + 1)
    where id = r.group_id;

    for gate in select * from public.cosmetics where streak_gate is not null loop
      if (select streak from public.groups where id = r.group_id) = gate.streak_gate then
        insert into public.owned_cosmetics (user_id, cosmetic_id, granted_by_group)
        select user_id, gate.id, r.group_id from public.memberships where group_id = r.group_id
        on conflict do nothing;
      end if;
    end loop;
  elsif (select freezes from public.groups where id = r.group_id) > 0
    and (
      (select last_freeze_used_at from public.groups where id = r.group_id) is null
      or (select last_freeze_used_at from public.groups where id = r.group_id) < p_at - interval '7 days'
    )
  then
    survived := true;
    select user_id into used_by from public.freeze_purchases where group_id = r.group_id order by created_at desc limit 1;
    update public.groups set freezes = freezes - 1, last_freeze_used_at = p_at where id = r.group_id;
    update public.rounds set freeze_used_by = used_by where id = r.id;
  else
    survived := false;
    update public.groups set streak = 0 where id = r.group_id;
    delete from public.owned_cosmetics
    where granted_by_group = r.group_id
      and cosmetic_id in (select id from public.cosmetics where streak_gate is not null);
  end if;

  update public.rounds set settled_at = p_at, streak_survived = survived where id = r.id;

  if m.input_type = 'photo' and app_url is not null and webhook_secret is not null then
    perform net.http_post(
      url := app_url || '/api/photos/purge',
      headers := jsonb_build_object('content-type', 'application/json', 'x-relay-secret', webhook_secret),
      body := jsonb_build_object('round_id', r.id)
    );
  end if;
end;
$$;

-- Not player-callable actions: only tick() and submit_round() (both SECURITY
-- DEFINER, owned by postgres) may settle or drive the clock.
revoke execute on function public.settle_round(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.tick(timestamptz) from public, anon, authenticated;
