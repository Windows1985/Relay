-- Two new mechanics, five new prompt games, and the two motion games that
-- now have real implementations behind them (they were parked inactive while
-- they both silently rendered Shake).
insert into public.modes (id, input_type, scoring, target, duration_ms, needs_vote, min_players, requires, decay, active) values
  ('hold_button', 'timing', 'auto_target', 8000, null, false, 3, 'none',   'evergreen', true),
  ('memory',      'timing', 'auto_high',   null, null, false, 3, 'none',   'evergreen', true),
  ('blue_thing',  'photo',  'vote',        null, null, true,  4, 'camera', 'evergreen', true),
  ('oldest_thing','photo',  'vote',        null, null, true,  4, 'camera', 'evergreen', true),
  ('your_view',   'photo',  'vote',        null, null, true,  4, 'camera', 'evergreen', true),
  ('worst_advice','text',   'vote',        null, null, true,  4, 'none',   'decaying',  true),
  ('hot_take',    'text',   'vote',        null, null, true,  4, 'none',   'decaying',  true)
on conflict (id) do nothing;

update public.modes set active = true where id in ('flip', 'circle_trace');

insert into public.prompts (mode_id, text) values
  ('worst_advice', 'Give the worst possible advice to someone starting a new job.'),
  ('worst_advice', 'Worst possible thing to say on a first date.'),
  ('worst_advice', 'Give terrible advice for surviving a horror film.'),
  ('hot_take', 'Post your most indefensible food opinion.'),
  ('hot_take', 'Name something everyone loves that is actually bad.'),
  ('hot_take', 'What is the most overrated thing in the world?'),
  ('best_ending', 'I knew it was over when...'),
  ('best_ending', 'My most useless talent is...'),
  ('best_ending', 'The worst thing I have ever eaten was...'),
  ('most_likely', 'Most likely to get lost in their own neighbourhood'),
  ('most_likely', 'Most likely to start a cult'),
  ('most_likely', 'Most likely to cry at an advert'),
  ('most_likely', 'Most likely to be late to their own wedding'),
  ('closest_colour', '#2ECC71'), ('closest_colour', '#E91E63'), ('closest_colour', '#00BCD4');

-- Current body of tick(): SETTLE delegates to settle_round() (0021); OPEN and
-- REVEAL are unchanged from 0010. REVEAL still covers the window-close path,
-- which no submission can trigger.
create or replace function public.tick(p_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  r record;
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
  app_url text;
  webhook_secret text;
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
      update public.rounds set reveal_at = p_at where id = r.id and reveal_at is null;
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
  for r in select id from public.rounds where reveal_at is not null and settled_at is null loop
    perform public.settle_round(r.id, p_at);
  end loop;
end;
$$;

-- Current body of submit_round(): reveals (and settles auto-scored rounds) the
-- moment the roster is complete, and returns that so the client can route to
-- the reveal. Includes range guards for hold_button and memory.
drop function if exists public.submit_round(uuid, jsonb, text);

create function public.submit_round(p_round_id uuid, p_payload jsonb, p_photo_path text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
  m public.modes;
  val numeric;
  max_val numeric;
  submitted_count int;
  just_revealed boolean := false;
begin
  select * into r from public.rounds where id = p_round_id;
  if r.id is null then raise exception 'Round not found'; end if;
  if not (auth.uid() = any(r.roster)) then raise exception 'Not on this round''s roster'; end if;
  if r.reveal_at is not null then raise exception 'Round already revealed'; end if;

  select * into m from public.modes where id = r.mode_id;

  if m.input_type in ('motion','timing') then
    val := (p_payload->>'value')::numeric;
    if val is null then raise exception 'Missing value'; end if;
    max_val := case m.id
      when 'shake' then 500
      when 'tap_fast' then 300
      when 'stop10' then 60000
      when 'reaction' then 60000
      when 'flip' then 300
      when 'circle_trace' then 100
      when 'hold_button' then 60000
      when 'memory' then 50
      else 100000
    end;
    if val < 0 or val > max_val then raise exception 'Value out of range'; end if;
  elsif m.input_type = 'name_pick' then
    if not ((p_payload->>'target')::uuid = any(r.roster)) then
      raise exception 'Target must be on the roster';
    end if;
  end if;

  insert into public.submissions (round_id, user_id, payload, score, photo_path)
  values (p_round_id, auth.uid(), p_payload, val, p_photo_path)
  on conflict (round_id, user_id) do update set
    payload = excluded.payload, score = excluded.score, photo_path = excluded.photo_path;

  -- Everyone in? Reveal immediately rather than waiting for the next tick.
  select count(*) into submitted_count from public.submissions
  where round_id = p_round_id and user_id = any(r.roster);

  if submitted_count >= array_length(r.roster, 1) then
    update public.rounds set reveal_at = now() where id = p_round_id and reveal_at is null;
    if found then
      just_revealed := true;
      -- Auto-scored rounds have nothing to wait for, so settle now too.
      -- Voted rounds stay open until votes_close_at, per spec.
      if not m.needs_vote then
        perform public.settle_round(p_round_id, now());
      end if;
    end if;
  end if;

  return just_revealed;
end;
$$;
