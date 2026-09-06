create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  motion_denied boolean not null default false,
  equipped_colour text,
  equipped_anim text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, nullif(new.raw_user_meta_data->>'username', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
