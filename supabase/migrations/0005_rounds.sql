create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  mode_id text not null references public.modes(id),
  prompt_id uuid references public.prompts(id),
  local_date date not null,
  opens_at timestamptz not null,
  reveal_at timestamptz,
  votes_close_at timestamptz,
  settled_at timestamptz,
  reminder_sent_at timestamptz,
  roster uuid[] not null,
  allowed_misses int not null,
  winner_id uuid references public.profiles(id),
  streak_survived boolean,
  freeze_used_by uuid references public.profiles(id),
  unique (group_id, local_date)
);

create table public.submissions (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  score numeric,
  photo_path text,
  submitted_at timestamptz not null default now(),
  hidden boolean not null default false,
  primary key (round_id, user_id)
);

create table public.votes (
  round_id uuid not null references public.rounds(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (round_id, voter_id),
  check (voter_id <> target_user_id)
);

create table public.reports (
  round_id uuid not null references public.rounds(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (round_id, target_user_id)
);

alter table public.rounds enable row level security;
alter table public.submissions enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;

-- Who has submitted (not what), so "3/6 played" works before reveal without
-- leaking payloads. security_invoker is required: without it a view runs
-- with its creator's privileges (postgres, via migrations) and silently
-- bypasses RLS on the underlying table for every caller.
create view public.round_progress with (security_invoker = true) as
  select round_id, user_id from public.submissions;
