-- Social proof on the signed-out /join page. profiles is only SELECTable by
-- authenticated users, so a logged-out visitor counts zero — this exposes the
-- count alone (no rows) to anon.
create or replace function public.player_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.profiles where username is not null;
$$;
