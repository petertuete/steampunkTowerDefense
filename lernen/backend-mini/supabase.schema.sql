create table if not exists public.game_runs (
  id bigint generated always as identity primary key,
  player_name text not null,
  result text not null check (result in ('won', 'lost')),
  score_points integer not null default 0,
  score_gold integer not null,
  selected_level_key text,
  selected_level_number integer,
  wave_reached integer,
  total_waves integer,
  total_kills integer not null default 0,
  total_leaks integer not null default 0,
  total_gold_earned integer not null default 0,
  total_gold_spent integer not null default 0,
  total_gold_remaining integer not null default 0,
  lives_remaining integer,
  tower_usage_by_level jsonb not null default '{}'::jsonb,
  client_version text,
  submitted_at timestamptz not null default now()
);

alter table public.game_runs
  add column if not exists score_points integer not null default 0;

create index if not exists game_runs_score_idx on public.game_runs (score_gold desc, submitted_at desc);
create index if not exists game_runs_score_points_idx on public.game_runs (score_points desc, submitted_at desc);

create table if not exists public.tower_usage_entries (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.game_runs(id) on delete cascade,
  level_key text not null,
  placement_id integer not null,
  tower_type_key text not null,
  tower_name text not null,
  grid_x integer not null,
  grid_y integer not null,
  screen_x integer,
  screen_y integer,
  placed_at_wave integer,
  sold boolean not null default false,
  sold_at_wave integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tower_usage_run_idx on public.tower_usage_entries (run_id);
create index if not exists tower_usage_level_idx on public.tower_usage_entries (level_key, tower_type_key);

alter table public.game_runs enable row level security;
alter table public.tower_usage_entries enable row level security;

drop policy if exists "deny_client_access_game_runs" on public.game_runs;
create policy "deny_client_access_game_runs"
on public.game_runs
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny_client_access_tower_usage_entries" on public.tower_usage_entries;
create policy "deny_client_access_tower_usage_entries"
on public.tower_usage_entries
for all
to anon, authenticated
using (false)
with check (false);
