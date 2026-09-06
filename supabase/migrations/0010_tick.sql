create table public.app_settings (key text primary key, value text);
alter table public.app_settings enable row level security;
-- No policies at all: unreachable via PostgREST/anon/authenticated. Only
-- SECURITY DEFINER functions owned by postgres (tick, and later the push
-- sender if it moves server-side) can read it. Simpler than Supabase Vault
-- for a value whose only job is authenticating our own DB->API webhook.
insert into public.app_settings (key, value) values ('app_url', null), ('webhook_secret', null);

create or replace function public.tick(p_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  r record;
  m public.modes;
  local_ts timestamp;
  local_date_val date;
  local_time_val time;
  roster uuid[];
  n int;
  motion_ok boolean;
  eligible_mode text;
  eligible_prompt uuid;
  new_round_id uuid;
  submitted_count int;
  misses int;
  winner uuid;
  survived boolean;
  used_by uuid;
  app_url text;
  webhook_secret text;
  gate record;
begin
  select value into app_url from public.app_settings where key = 'app_url';
  select value into webhook_secret from public.app_settings where key = 'webhook_secret';

  -- OPEN --------------------------------------------------------------
  for g in select * from public.groups loop
    local_ts := p_at at time zone g.tz;
    local_date_val := local_ts::date;
    local_time_val := local_ts::time;

    if local_time_val >= g.window_start and not exists (
      select 1 from public.rounds where group_id = g.id and local_date = local_date_val
    ) then
      select array_agg(user_id) into roster from public.memberships where group_id = g.id;
      n := coalesce(array_length(roster, 1), 0);

      if n >= 3 then
        motion_ok := not exists (select 1 from public.profiles where id = any(roster) and motion_denied);

        select id into eligible_mode from public.modes
        where active and min_players <= n and (requires <> 'motion' or motion_ok)
          and id not in (
            select mode_id from public.rounds where group_id = g.id order by local_date desc limit 5
          )
        order by random() limit 1;

        if eligible_mode is null then
          select id into eligible_mode from public.modes
          where active and min_players <= n and (requires <> 'motion' or motion_ok)
          order by random() limit 1;
        end if;

        if eligible_mode is not null then
          select id into eligible_prompt from public.prompts where mode_id = eligible_mode order by random() limit 1;

          insert into public.rounds (group_id, mode_id, prompt_id, local_date, opens_at, votes_close_at, roster, allowed_misses)
          values (
            g.id, eligible_mode, eligible_prompt, local_date_val,
            (local_date_val + g.window_start) at time zone g.tz,
            case when (select needs_vote from public.modes where id = eligible_mode)
              then ((local_date_val + 1) + time '12:00') at time zone g.tz
              else null end,
            roster, greatest(1, n / 4)
          )
          returning id into new_round_id;

          if app_url is not null and webhook_secret is not null then
            perform net.http_post(
              url := app_url || '/api/push/open',
              headers := jsonb_build_object('content-type', 'application/json', 'x-relay-secret', webhook_secret),
              body := jsonb_build_object('round_id', new_round_id)
            );
          end if;
        end if;
      end if;
    end if;
  end loop;

  -- REVEAL --------------------------------------------------------------
  for r in
    select rd.*, gr.window_end as g_window_end, gr.tz as g_tz
    from public.rounds rd join public.groups gr on gr.id = rd.group_id
    where rd.reveal_at is null
  loop
    select count(*) into submitted_count from public.submissions
    where round_id = r.id and user_id = any(r.roster);

    local_time_val := (p_at at time zone r.g_tz)::time;

    if submitted_count >= array_length(r.roster, 1) or local_time_val >= r.g_window_end then
      update public.rounds set reveal_at = p_at where id = r.id;
    elsif r.reminder_sent_at is null and local_time_val >= (r.g_window_end - interval '2 hours')::time then
      update public.rounds set reminder_sent_at = p_at where id = r.id;
      if app_url is not null and webhook_secret is not null then
        perform net.http_post(
          url := app_url || '/api/push/reminder',
          headers := jsonb_build_object('content-type', 'application/json', 'x-relay-secret', webhook_secret),
          body := jsonb_build_object('round_id', r.id, 'not_played', array_length(r.roster, 1) - submitted_count)
        );
      end if;
    end if;
  end loop;

  -- SETTLE --------------------------------------------------------------
  for r in select * from public.rounds where reveal_at is not null and settled_at is null loop
    select * into m from public.modes where id = r.mode_id;
    if m.needs_vote and (r.votes_close_at is null or p_at < r.votes_close_at) then
      continue;
    end if;

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
  end loop;
end;
$$;

select cron.schedule('relay-tick', '* * * * *', $$select public.tick()$$);
