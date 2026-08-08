# RunRajya 2.0

> **Rupandehi is your playing field. Run to capture territory.**

RunRajya 2.0 is a full-stack, offline-first, location-based gamified tactical fitness web application. It projects a digital $500\text{m} \times 500\text{m}$ grid of $5,212$ active coordinate cells over the official geographic boundary of the **Rupandehi District of Nepal**. 

Players run, walk, or jog as Solo Explorers or align with one of **five competitive regional factions**, capturing coordinate cells in real-time, accumulating active metrics, and climbing sector leaderboards.

---

## 🚀 Live Links & Resources

* **Production URL:** [run-rajya2-0.vercel.app](https://run-rajya2-0.vercel.app)
* **GitHub Repository:** [github.com/shibakarki/RunRajya2.0](https://github.com/shibakarki/RunRajya2.0)
* **Primary Playing Field:** Rupandehi District, Nepal (`27.55° N, 83.43° E`)

---

## 🛠️ Key Technical Features

### 1. High-Performance Geospatial Rendering
* **Local 5x5 Grid Filtering:** Instead of attempting to render thousands of SVG coordinate polygons simultaneously (which crashes mobile web engines), the map layer sorts adjacent cells by distance from the player and renders only the **25 closest cells (5x5 grid)** plus any globally claimed sector. This delivers a highly fluid $60\text{ FPS}$ experience on mobile browsers.
* **Geospatial Bounding Box Queries (RPC):** The frontend completely bypasses heavy pre-downloads, requesting only adjacent cells within a $4\text{km} \times 4\text{km}$ radius centered around the user's coordinate stream.
* **Inverted Polygon Masking:** Incorporates a custom-parsed GIS outline of Rupandehi, applying a mathematical SVG mask that darkens the outside world by $65\%$, isolating the district limits.
* **Zero-Dependency Landing Preview:** The Home page map utilizes a pure SVG vector representation, maintaining 100% geographic aspect ratios with zero package overhead.

### 2. Gamified Conquest Challenge System
* **Unclaimed Zones:** Capturing an unowned, neutral grey cell is instant upon physical entry.
* **Contested Zones:** Entering a cell owned by an opposing faction triggers a **Conquest Challenge**. To successfully overwrite ownership on the database, the challenger **must run a minimum of 150 meters** during their active session. Failing to complete the distance before leaving the cell or ending the session leaves ownership with the original holder.
* **Faction-Themed Grids:** Captured cells dynamically paint themselves according to the player's active faction theme color (instead of a static green).

### 3. Resilient Offline-First Data Layer
* **IndexedDB Cache (`RunRajyaOfflineDB` v3):** Tracks unsynced session traces, local capture queues, and cached grid segments entirely on-device, bypassing network roundtrips.
* **Self-Healing Caching:** Bypasses local stores and downloads a fresh grid from Supabase if the device's cache contains a corrupted or incomplete cell count ($<4000$ cells).
* **Chronological Conflict Resolution:** When going online, background synchronization workers flush local queues. Contested claims resolve chronologically: if a local capture's timestamp is newer than the database's current state, it overwrites; older, obsolete claims are discarded.

### 4. Native Hardware Integrations
* **Dual-Wake-Lock:** Combines the HTML5 Screen Wake Lock API with a looping $1\text{px}$ muted silent WebM video fallback to prevent operating systems from sleeping screens mid-run.
* **Absolute Orientation Beacon:** Employs absolute device orientation magnetometer angles (`deviceorientationabsolute` / `webkitCompassHeading`) to dynamically rotate the contrast player indicator. iOS Safari permission constraints are bypassed via a universal document tap listener.
* **GPS Gate:** Restricts session starting unless a high-precision lock ($<80\text{m}$) is achieved, incorporating a $15\text{ km/h}$ velocity limit check as an anti-cheat speed cap.
* **Touch-Safe Pocket Lock:** Prevents accidental pocket inputs during runs via an absolute `touch-action: none` overlay featuring an iOS-style slide-to-unlock gesture.

---

## 📐 Faction Division

Players can align with one of five distinct competitive sectors of Rupandehi:
1. **Lumbini Guardians** (Saffron/Gold): Defenders of the sacred birthplace.
2. **Devdaha Dynasty** (Blue): Strategists representing ancient maternal roots.
3. **Tilaurakot Sentinels** (Green): Resilient protectors of historic ruins.
4. **Siddharth Force** (Red): High-energy, progressive forward division.
5. **Manimukunda Warriors** (Purple): Defensive forest-hill fortress division.

---

## 💻 Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, React Router v6
* **Database & BaaS:** Supabase, PostgreSQL
* **Mapping Engine:** Leaflet, React-Leaflet
* **Offline Caching:** HTML5 Geolocation API, IndexedDB API
* **Deployment & Hosting:** GitHub, Vercel

---

## 🗄️ Database Schema & SQL Migrations

Paste this script into your Supabase SQL Editor to establish your database layout:

```sql
-- Create Factions Table
create table if not exists public.factions (
  id integer primary key,
  name text not null,
  color text not null
);

-- Seed Factions (1-5)
insert into public.factions (id, name, color) values
  (1, 'Lumbini Guardians', '#EAB308'),
  (2, 'Devdaha Dynasty', '#3B82F6'),
  (3, 'Tilaurakot Sentinels', '#10B981'),
  (4, 'Siddharth Force', '#EF4444'),
  (5, 'Manimukunda Warriors', '#A855F7')
on conflict (id) do update 
set name = excluded.name, color = excluded.color;

-- Create Profiles Table (faction_id linked as integer)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  faction_id integer references public.factions(id),
  daily_target_m integer default 5000
);

-- Create Zones Table (faction_id linked as integer)
create table if not exists public.zones (
  id integer primary key,
  boundary jsonb not null,
  owner_id uuid references public.profiles(id) on delete set null,
  faction_id integer references public.factions(id) on delete set null,
  captured_at timestamptz
);

-- Create Sessions Table
create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_m numeric default 0,
  calories numeric default 0,
  duration_s integer default 0,
  status text not null
);

-- Create Captures Table
create table if not exists public.captures (
  id bigserial primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  zone_id integer references public.zones(id) on delete cascade not null,
  captured_at timestamptz not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.zones enable row level security;
alter table public.sessions enable row level security;
alter table public.captures enable row level security;

-- Establish RLS Policies
create policy "Public Profiles can be viewed by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Zones can be viewed by everyone" on public.zones for select using (true);
create policy "Authenticated users can capture unclaimed or older zones" on public.zones for update using (auth.role() = 'authenticated');
create policy "Sessions can be viewed by everyone" on public.sessions for select using (true);
create policy "Users can insert their own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their own sessions" on public.sessions for update using (auth.uid() = user_id);
create policy "Captures can be viewed by everyone" on public.captures for select using (true);
create policy "Users can insert captures for their active sessions" on public.captures for insert with check (
  exists (select 1 from public.sessions where id = session_id and user_id = auth.uid())
);

-- Trigger Function: Initialize Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  selected_faction integer;
  meta_faction text;
begin
  meta_faction := new.raw_user_meta_data->>'faction_id';
  begin
    selected_faction := meta_faction::integer;
  exception when others then
    selected_faction := 1;
  end;
  if not exists (select 1 from public.factions where id = selected_faction) then
    selected_faction := null;
  end if;
  insert into public.profiles (id, name, faction_id, daily_target_m)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Explorer'),
    selected_faction,
    coalesce((new.raw_user_meta_data->>'daily_target_m')::integer, 5000)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Secure Atomic Faction Reset RPC Function
create or replace function public.switch_faction_atomic(target_user_id uuid, new_faction integer)
returns void as $$
begin
  if auth.uid() <> target_user_id then
    raise exception 'Unauthorized modification request.';
  end if;
  update public.profiles set faction_id = new_faction where id = target_user_id;
  update public.zones set owner_id = null, faction_id = null, captured_at = null where owner_id = target_user_id;
end;
$$ language plpgsql security definer;

-- Geospatial Bounding Box Fetch RPC Function
create or replace function public.get_local_zones(user_lat numeric, user_lng numeric, range_deg numeric)
returns setof public.zones as $$
begin
  return query
  select * from public.zones
  where exists (
    select 1 from jsonb_to_recordset(boundary) as x(lat numeric, lng numeric)
    where abs(x.lat - user_lat) <= range_deg and abs(x.lng - user_lng) <= range_deg
  );
end;
$$ language plpgsql security definer;