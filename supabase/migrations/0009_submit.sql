-- Client is trusted for sensor values ("measured by the app" means
-- phone-measured, not self-typed); this is a range guard, not proof.
-- ponytail: add server-side timing attestation only if cheating appears.
create or replace function public.submit_round(p_round_id uuid, p_payload jsonb, p_photo_path text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
  m public.modes;
  val numeric;
  max_val numeric;
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
end;
$$;
