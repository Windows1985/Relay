-- Equipping isn't a plain RLS-covered profile update: it must verify the
-- caller actually owns the cosmetic, which an UPDATE policy on profiles
-- can't check against a different table's rows without a function anyway,
-- so this follows buy_cosmetic's existing RPC convention.
create or replace function public.equip_cosmetic(p_cosmetic_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cosmetics;
begin
  select * into c from public.cosmetics where id = p_cosmetic_id;
  if c.id is null then raise exception 'Unknown cosmetic'; end if;

  if not exists (select 1 from public.owned_cosmetics where user_id = auth.uid() and cosmetic_id = p_cosmetic_id) then
    raise exception 'You do not own this cosmetic';
  end if;

  if c.kind = 'colour' then
    update public.profiles set equipped_colour = p_cosmetic_id where id = auth.uid();
  else
    update public.profiles set equipped_anim = p_cosmetic_id where id = auth.uid();
  end if;
end;
$$;

-- The profiles UPDATE RLS policy has no column granularity ("own row" is
-- the whole check), so without this a client could set equipped_colour/
-- equipped_anim directly to any cosmetic id, owned or not, bypassing
-- equip_cosmetic's ownership check entirely. A column-level REVOKE alone
-- is not enough here: Postgres's table-level UPDATE grant (from Supabase's
-- default schema grants) still permits updating any column regardless of a
-- column-specific revoke, since column grants only matter for a role that
-- lacks table-level UPDATE in the first place. So this revokes UPDATE
-- entirely and re-grants it scoped to just the columns clients touch
-- directly; equipped_colour/equipped_anim become writable only by
-- SECURITY DEFINER functions (which run as the table owner).
revoke update on public.profiles from authenticated;
grant update (username, motion_denied) on public.profiles to authenticated;