-- Spec: "Global: groups ranked by current streak length... makes the core
-- mechanic public." groups is members-only via RLS, so this is a narrow
-- SECURITY DEFINER read exposing only name+streak (never invite_code,
-- settings, or membership) for every group, ranked.
create or replace function public.global_leaderboard(p_limit int default 50)
returns table(name text, streak int)
language sql
security definer
set search_path = public
stable
as $$
  select name, streak from public.groups
  where streak > 0
  order by streak desc
  limit p_limit;
$$;

-- Weekly group leaderboard needs a GROUP BY sum PostgREST can't express
-- directly; the reset boundary (Monday 00:00 in the group's own tz) is
-- computed client-side (lib/tz.ts) and passed in, not stored.
create or replace function public.group_weekly_leaderboard(p_group_id uuid, p_since timestamptz)
returns table(user_id uuid, username text, equipped_colour text, total int)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.equipped_colour, coalesce(sum(tl.delta), 0)::int as total
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  left join public.token_ledger tl
    on tl.user_id = m.user_id and tl.group_id = p_group_id and tl.created_at >= p_since and tl.delta > 0
  where m.group_id = p_group_id and public.is_group_member(p_group_id)
  group by p.id, p.username, p.equipped_colour
  order by total desc;
$$;
