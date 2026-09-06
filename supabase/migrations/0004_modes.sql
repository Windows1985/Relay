create table public.modes (
  id text primary key,
  input_type text not null check (input_type in ('motion','timing','photo','text','name_pick')),
  scoring text not null check (scoring in ('auto_high','auto_low','auto_target','vote','tally')),
  target numeric,
  duration_ms int,
  needs_vote boolean not null default false,
  min_players int not null default 3,
  requires text not null default 'none' check (requires in ('motion','camera','none')),
  decay text not null default 'evergreen' check (decay in ('evergreen','decaying')),
  active boolean not null default true
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  mode_id text not null references public.modes(id) on delete cascade,
  text text not null
);

alter table public.modes enable row level security;
alter table public.prompts enable row level security;

create policy "modes readable by any authenticated user"
  on public.modes for select to authenticated using (true);
create policy "prompts readable by any authenticated user"
  on public.prompts for select to authenticated using (true);

-- Launch 10, one per (input_type x scoring) combination in the spec, plus
-- the other 7 spec games seeded inactive (decay/selection ignores them
-- until a later content update flips `active`).
insert into public.modes (id, input_type, scoring, target, duration_ms, needs_vote, min_players, requires, decay, active) values
  ('shake',          'motion',    'auto_high',   null,   15000, false, 3, 'motion', 'evergreen', true),
  ('stop10',         'timing',    'auto_target', 10000,  null,  false, 3, 'none',   'evergreen', true),
  ('tap_fast',       'timing',    'auto_high',   null,   10000, false, 3, 'none',   'evergreen', true),
  ('reaction',       'timing',    'auto_low',    null,   null,  false, 3, 'none',   'evergreen', true),
  ('closest_colour', 'photo',     'vote',        null,   null,  true,  4, 'camera', 'evergreen', true),
  ('shoes',          'photo',     'vote',        null,   null,  true,  4, 'camera', 'evergreen', true),
  ('ugliest',        'photo',     'vote',        null,   null,  true,  4, 'camera', 'evergreen', true),
  ('best_ending',    'text',      'vote',        null,   null,  true,  4, 'none',   'decaying',  true),
  ('one_lie',        'text',      'vote',        null,   null,  true,  4, 'none',   'decaying',  true),
  ('most_likely',    'name_pick', 'tally',       null,   null,  false, 4, 'none',   'decaying',  true),
  -- seeded, inactive: rest of the spec's library
  ('flip',           'motion',    'auto_high',   null,   20000, false, 3, 'motion', 'evergreen', false),
  ('circle_trace',   'motion',    'auto_high',   null,   null,  false, 3, 'motion', 'evergreen', false),
  ('wrong_place',    'photo',     'vote',        null,   null,  true,  4, 'camera', 'evergreen', false),
  ('damp',           'photo',     'vote',        null,   null,  true,  4, 'camera', 'evergreen', false),
  ('guess_poster',   'text',      'vote',        null,   null,  true,  4, 'none',   'decaying',  false),
  ('no_phone',       'name_pick', 'tally',       null,   null,  false, 4, 'none',   'decaying',  false),
  ('lying',          'name_pick', 'tally',       null,   null,  false, 4, 'none',   'decaying',  false);

insert into public.prompts (mode_id, text) values
  ('closest_colour', '#FF5733'), ('closest_colour', '#33FF57'), ('closest_colour', '#3357FF'),
  ('closest_colour', '#F1C40F'), ('closest_colour', '#8E44AD'), ('closest_colour', '#1ABC9C'),
  ('best_ending', 'The last thing I googled was...'),
  ('best_ending', 'If I had a warning label it would say...'),
  ('best_ending', 'My villain origin story starts with...'),
  ('most_likely', 'Most likely to become famous for the wrong reason'),
  ('most_likely', 'Most likely to survive a zombie apocalypse'),
  ('most_likely', 'Most likely to text back a week later');
