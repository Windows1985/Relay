create table public.token_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  delta int not null,
  reason text not null,
  round_id uuid references public.rounds(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cosmetics (
  id text primary key,
  kind text not null check (kind in ('colour','anim')),
  price int,
  streak_gate int,
  css jsonb not null,
  check ((price is null) <> (streak_gate is null))
);

create table public.owned_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_id text not null references public.cosmetics(id),
  -- Tracks which group's streak earned a gated cosmetic, so breaking one
  -- group's streak only revokes what that group granted (cosmetics are
  -- global per user per spec, but a 30/100-day item is a specific group's
  -- achievement — the exact mechanic is explicitly "deferred, not decided"
  -- in relay-spec.md; this is the minimal reasonable interpretation).
  granted_by_group uuid references public.groups(id),
  primary key (user_id, cosmetic_id)
);

create table public.freeze_purchases (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.token_ledger enable row level security;
alter table public.cosmetics enable row level security;
alter table public.owned_cosmetics enable row level security;
alter table public.freeze_purchases enable row level security;

create policy "cosmetics readable by any authenticated user"
  on public.cosmetics for select to authenticated using (true);
create policy "owned cosmetics readable by any authenticated user"
  on public.owned_cosmetics for select to authenticated using (true);
create policy "users see their own token ledger"
  on public.token_ledger for select to authenticated using (user_id = auth.uid());
create policy "members see their group's freeze purchases"
  on public.freeze_purchases for select to authenticated using (public.is_group_member(group_id));

create view public.token_balances with (security_invoker = true) as
  select user_id, coalesce(sum(delta), 0) as balance
  from public.token_ledger group by user_id;

-- Prices are illustrative per spec's "cheap ~2 days play, top tier ~3-4
-- weeks" guidance (win = 10 tokens/night); exact ladder is explicitly
-- deferred in relay-spec.md and can change without a migration.
insert into public.cosmetics (id, kind, price, css) values
  ('colour_solid_red',    'colour', 20,  '{"color":"#ef4444"}'),
  ('colour_solid_blue',   'colour', 20,  '{"color":"#3b82f6"}'),
  ('colour_gradient_sunset', 'colour', 60,  '{"gradient":["#ef4444","#f59e0b"]}'),
  ('colour_gradient_ocean',  'colour', 60,  '{"gradient":["#06b6d4","#3b82f6"]}'),
  ('colour_rainbow',      'colour', 140, '{"rainbow":true}'),
  ('colour_chrome',       'colour', 200, '{"chrome":true}'),
  ('colour_glitch',       'colour', 280, '{"glitch":true}'),
  ('anim_pop',            'anim',   20,  '{"animation":"pop"}'),
  ('anim_fade_up',        'anim',   20,  '{"animation":"fade-up"}'),
  ('anim_slide_in',       'anim',   40,  '{"animation":"slide-in"}'),
  ('anim_shake',          'anim',   60,  '{"animation":"shake"}'),
  ('anim_typewriter',     'anim',   80,  '{"animation":"typewriter"}');

insert into public.cosmetics (id, kind, streak_gate, css) values
  ('colour_streak_30',  'colour', 30,  '{"gradient":["#fbbf24","#f97316"],"glow":true}'),
  ('colour_streak_100', 'colour', 100, '{"chrome":true,"glow":true}');

create or replace function public.buy_cosmetic(p_cosmetic_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cosmetics;
  bal numeric;
begin
  select * into c from public.cosmetics where id = p_cosmetic_id;
  if c.id is null then raise exception 'Unknown cosmetic'; end if;
  if c.price is null then raise exception 'Not purchasable'; end if;

  if exists (select 1 from public.owned_cosmetics where user_id = auth.uid() and cosmetic_id = p_cosmetic_id) then
    raise exception 'Already owned';
  end if;

  select coalesce(sum(delta), 0) into bal from public.token_ledger where user_id = auth.uid();
  if bal < c.price then raise exception 'Not enough tokens'; end if;

  insert into public.owned_cosmetics (user_id, cosmetic_id) values (auth.uid(), p_cosmetic_id);
  insert into public.token_ledger (user_id, delta, reason) values (auth.uid(), -c.price, 'shop_purchase:' || p_cosmetic_id);
end;
$$;

-- ponytail: flat 40-token freeze price (~4 nights of winning); the buyer's
-- own balance funds a shared group asset. Upgrade to a variable/decaying
-- price only if playtesting shows 40 is off.
create or replace function public.buy_freeze(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bal numeric;
  freeze_price constant int := 40;
begin
  if not public.is_group_member(p_group_id) then raise exception 'Not a member'; end if;

  if (select freezes from public.groups where id = p_group_id) >= 2 then
    raise exception 'Group already holds the maximum freezes';
  end if;

  select coalesce(sum(delta), 0) into bal from public.token_ledger where user_id = auth.uid();
  if bal < freeze_price then raise exception 'Not enough tokens'; end if;

  insert into public.token_ledger (user_id, group_id, delta, reason) values (auth.uid(), p_group_id, -freeze_price, 'freeze_purchase');
  insert into public.freeze_purchases (group_id, user_id) values (p_group_id, auth.uid());
  update public.groups set freezes = freezes + 1 where id = p_group_id;
end;
$$;
