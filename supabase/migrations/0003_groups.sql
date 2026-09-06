create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  tz text not null,
  window_start time not null default '19:00',
  window_end time not null default '22:00',
  streak int not null default 0,
  best_streak int not null default 0,
  freezes int not null default 0 check (freezes between 0 and 2),
  last_freeze_used_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.memberships enable row level security;

-- SECURITY DEFINER (owned by postgres, bypasses RLS internally) so this can
-- safely query memberships from within policies defined ON memberships
-- itself without recursing back into them (the classic Postgres RLS
-- self-join trap).
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create policy "members can view their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

create policy "members can update their group settings"
  on public.groups for update
  to authenticated
  using (public.is_group_member(id))
  with check (public.is_group_member(id));

create policy "members can view memberships of their groups"
  on public.memberships for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "members can leave a group"
  on public.memberships for delete
  to authenticated
  using (user_id = auth.uid());

-- 6-char upper-alnum invite code, regenerated on collision (extremely rare: 36^6).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.groups where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.create_group(p_name text, p_tz text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
begin
  insert into public.groups (name, tz, invite_code, created_by)
  values (p_name, p_tz, public.generate_invite_code(), auth.uid())
  returning * into g;

  insert into public.memberships (group_id, user_id) values (g.id, auth.uid());
  return g;
end;
$$;

create or replace function public.join_group(p_invite_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
begin
  select * into g from public.groups where invite_code = upper(p_invite_code);
  if g.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.memberships (group_id, user_id) values (g.id, auth.uid())
  on conflict do nothing;

  return g;
end;
$$;

-- Any member can leave (covered by the delete-own-row policy above).
-- Kicking someone else is creator-only; a plain RLS delete policy can't
-- express "creator OR self" cleanly against a different target row, so
-- it's an RPC instead. Takes effect at the next opens_at because tick()
-- snapshots the roster fresh each night — this just changes tomorrow's
-- snapshot.
create or replace function public.remove_member(p_group_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_creator boolean;
begin
  select (created_by = auth.uid()) into is_creator from public.groups where id = p_group_id;
  if not is_creator and auth.uid() <> p_target_user_id then
    raise exception 'Only the group creator can remove other members';
  end if;

  delete from public.memberships where group_id = p_group_id and user_id = p_target_user_id;
end;
$$;
