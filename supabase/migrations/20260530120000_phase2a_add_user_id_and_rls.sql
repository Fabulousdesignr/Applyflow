-- Applyflow Phase 2A (step 1 of 2): user ownership column + secure RLS
-- Run in Supabase SQL Editor (or via Supabase CLI) BEFORE the backfill migration.
-- Does NOT delete existing rows. Rows with user_id IS NULL are hidden until backfilled.

-- ---------------------------------------------------------------------------
-- 1. Ownership column (nullable until backfill completes)
-- ---------------------------------------------------------------------------
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id
  ON public.opportunities (user_id);

COMMENT ON COLUMN public.opportunities.user_id IS
  'Owner auth.users id. Required after phase2a backfill migration.';

-- ---------------------------------------------------------------------------
-- 2. Auto-assign owner on insert (authenticated sessions only)
--    Helps Phase 2B without requiring user_id in every payload yet.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_opportunity_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunities_set_owner ON public.opportunities;

CREATE TRIGGER trg_opportunities_set_owner
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_opportunity_owner();

-- ---------------------------------------------------------------------------
-- 3. Remove permissive public policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all public operations" ON public.opportunities;

-- ---------------------------------------------------------------------------
-- 4. User-scoped RLS (authenticated role only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_select_own"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "opportunities_insert_own"
  ON public.opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "opportunities_update_own"
  ON public.opportunities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "opportunities_delete_own"
  ON public.opportunities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
