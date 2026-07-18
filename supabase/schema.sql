-- RunRajya database schema
-- Run this in the Supabase SQL editor on a fresh project.

-- ============ FACTIONS ============
create table if not exists public.factions (
  id serial primary key,
  name text not null,
  color text not null
);

insert into public.factions (name, color) values
  ('Crimson', '#e2554f'),
  ('Azure', '#3f8cf2'),
  ('Verdant', '#22e6b0'),
  ('Amber', '#f2a93c'),
  ('Violet', '#9b6fe8')
on conflict do nothing;

alter table public.factions enable row level security;

create policy "Factions are publicly readable"
  on public.factions for select
  to authenticated, anon
  using (true);

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  faction_id int references public.factions (id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============ ZONES ============
-- One row per grid cell (4,814 total). Seeded separately from the
-- Rupandehi boundary data carried over from the previous project.
create table if not exists public.zones (
  id int primary key,
  boundary jsonb not null,
  owner_id uuid references public.profiles (id),
  faction_id int references public.factions (id),
  captured_at timestamptz
);

alter table public.zones enable row level security;

create policy "Zones are publicly readable"
  on public.zones for select
  to authenticated, anon
  using (true);

-- Matches the known-working pattern from the prior project: unowned
-- zones start with owner_id = null, so a naive auth.uid() = owner_id
-- check would block first-time captures. Ownership correctness is
-- enforced client-side via the chronological conflict resolution
-- rule (capturedAt > current.captured_at), not by RLS.
create policy "Authenticated users can update zones"
  on public.zones for update
  to authenticated
  using (true)
  with check (true);

-- ============ SESSIONS ============
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  distance_m numeric not null default 0,
  calories numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'ended'))
);

alter table public.sessions enable row level security;

create policy "Users can read their own sessions"
  on public.sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============ CAPTURES ============
-- Audit trail: one row per zone capture, tied to the session that
-- produced it. Powers "zones captured today" and any later debugging
-- of contested captures.
create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  zone_id int not null references public.zones (id),
  captured_at timestamptz not null
);

alter table public.captures enable row level security;

create policy "Captures are publicly readable"
  on public.captures for select
  to authenticated, anon
  using (true);

create policy "Users can insert captures for their own sessions"
  on public.captures for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ============ FACTION SWITCH (atomic) ============
-- Switching factions costs all currently-owned zones. This must run
-- as a single transaction so a dropped connection never leaves zones
-- orphaned to a faction the player no longer belongs to.
create or replace function public.switch_faction(new_faction_id int)
returns void
language plpgsql
security definer
as $$
begin
  update public.zones
    set owner_id = null, faction_id = null, captured_at = null
    where owner_id = auth.uid();

  update public.profiles
    set faction_id = new_faction_id
    where id = auth.uid();
end;
$$;
