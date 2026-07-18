# RunRajya

Location-based tactical fitness app — territory capture over a 500m grid
of Rupandehi District, Nepal.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase project URL + anon key
3. Run `supabase/schema.sql` in the Supabase SQL editor to create tables, RLS policies, and the `switch_faction` RPC
4. Seed the `zones` table from your grid-generation script (carried over from the previous project) using `src/data/rupandehi_boundary.json` as the reference boundary
5. `npm run dev`

## Structure

- `src/hooks/` — all logic, one responsibility per hook (see comment header in each file)
- `src/components/` — presentational, receive data via props/hooks
- `src/pages/` — Home, Map, Profile — compose components only
- `src/context/AuthContext.jsx` — session state + modal gating via `requireAuth()`
- `supabase/schema.sql` — full schema, RLS policies, faction-switch RPC

See `runrajya-project-plan.md` for the full architecture and scope decisions.
