-- Applyflow Phase 2A (step 2 of 2): backfill legacy rows + enforce NOT NULL
--
-- PREREQUISITE: Run 20260530120000_phase2a_add_user_id_and_rls.sql first.
--
-- BEFORE RUNNING:
-- 1. Supabase Dashboard → Authentication → Users → copy your primary account UUID
-- 2. Replace the placeholder below (or pass via SQL variable in the editor)
--
-- SAFETY: This only UPDATEs rows where user_id IS NULL. No DELETEs.

-- >>> Replace with your auth.users UUID <<<
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

DO $$
DECLARE
  owner_id UUID := NULL; -- SET YOUR UUID HERE before running
  orphan_count INTEGER;
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION
      'Phase 2A backfill: set owner_id in this migration (auth.users UUID) before running.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = owner_id) THEN
    RAISE EXCEPTION
      'Phase 2A backfill: owner_id % does not exist in auth.users.', owner_id;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM public.opportunities
  WHERE user_id IS NULL;

  RAISE NOTICE 'Backfilling % opportunities to owner %', orphan_count, owner_id;

  UPDATE public.opportunities
  SET user_id = owner_id
  WHERE user_id IS NULL;

  IF EXISTS (SELECT 1 FROM public.opportunities WHERE user_id IS NULL) THEN
    RAISE EXCEPTION 'Phase 2A backfill: rows with NULL user_id remain.';
  END IF;
END $$;

ALTER TABLE public.opportunities
  ALTER COLUMN user_id SET NOT NULL;
