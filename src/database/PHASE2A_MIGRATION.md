# Phase 2A — User ownership + RLS (database only)

This phase prepares Supabase so every opportunity belongs to one `auth.users` row. **No frontend changes** — apply these SQL migrations in the Supabase project, then complete Phase 2B in the app.

## What changes

| Item | Before | After |
|------|--------|--------|
| `opportunities.user_id` | — | `UUID` → `auth.users(id)` |
| RLS | `USING (true)` (public) | `auth.uid() = user_id` per operation |
| Legacy rows | Shared / anonymous | Assigned to a chosen owner (backfill) |

## Migration order (required)

1. **`supabase/migrations/20260530120000_phase2a_add_user_id_and_rls.sql`**
   - Adds nullable `user_id`, index, owner trigger
   - Drops `"Allow all public operations"`
   - Creates SELECT / INSERT / UPDATE / DELETE policies for `authenticated`

2. **`supabase/migrations/20260530120001_phase2a_backfill_and_enforce_not_null.sql`**
   - Set `owner_id` in the `DO` block to your Supabase Auth user UUID
   - Backfills `user_id IS NULL` rows (no deletes)
   - Sets `user_id NOT NULL`

Run step 1 in **SQL Editor** (or `supabase db push` if using CLI). Run step 2 only after you have your user UUID.

## Backfill options (existing rows)

Ownership cannot be inferred from current data (no `user_id`, anon-key era). Safe choices:

| Option | Action | Risk |
|--------|--------|------|
| **A — Recommended (solo)** | Assign all `NULL` rows to your primary login UUID | Low; one owner keeps CRM history |
| **B — Staged** | Run step 1 only; leave rows `NULL` until you assign per user | Rows invisible under RLS until updated |
| **C — Multi-user later** | Export orphans, backfill per UUID manually | More work; no data loss if you only UPDATE |

**Do not** `DELETE` legacy rows to “clean up.”

### Find your owner UUID

Supabase Dashboard → **Authentication** → **Users** → copy **User UID** for the account that should own existing pipeline data.

### One-off backfill (alternative to step 2 file)

```sql
UPDATE public.opportunities
SET user_id = 'YOUR-USER-UUID-HERE'
WHERE user_id IS NULL;

ALTER TABLE public.opportunities
  ALTER COLUMN user_id SET NOT NULL;
```

## Validation (after both steps)

```sql
-- Should be 0
SELECT COUNT(*) FROM public.opportunities WHERE user_id IS NULL;

-- Policies (expect 4 user-scoped + RLS enabled)
SELECT polname, cmd, roles
FROM pg_policies
WHERE tablename = 'opportunities';

-- Orphan policy should be gone
-- (no row named "Allow all public operations")
```

Test as **authenticated** user in SQL editor (`set request.jwt.claim.sub` is not needed if using Dashboard with user context; for app, Phase 2B will send the session JWT).

## Expected impact before Phase 2B

- **Anon-key REST** (current `db.js`) will **not** read/write `opportunities` under new RLS — expected until the app uses the user session token.
- **localStorage** in the browser is unchanged.
- Run migrations on **staging/production** Supabase when ready; repo files are the source of truth.

## Canonical schema

`src/database/schema.sql` reflects the post–Phase 2A shape for new greenfield installs.
