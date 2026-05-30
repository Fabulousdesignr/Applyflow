-- Applyflow opportunities table (canonical reference — post Phase 2A)
-- For existing projects, run supabase/migrations/*.sql in order instead of re-running this whole file.

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    country TEXT,
    company_type TEXT CHECK (company_type IN ('AI Startup', 'SaaS', 'Fintech', 'Agency', 'No-Code Studio', 'Reddit')),
    company_size TEXT,
    remote_status TEXT,
    global_remote_friendly TEXT,
    mid_entry_friendly TEXT,
    ai_workflow_mentioned TEXT,
    key_tools_mentioned TEXT,
    salary_estimate TEXT,
    date_posted TEXT,
    hiring_freshness TEXT,
    wat_compatibility TEXT,
    career_page TEXT,
    application_link TEXT,
    linkedin_page TEXT,
    founder_hr_name TEXT,
    outreach_method TEXT,
    why_i_have_a_chance TEXT,
    portfolio_advice TEXT,
    application_emphasis TEXT,
    status TEXT DEFAULT 'Not Started',
    priority TEXT DEFAULT 'Medium',
    notes TEXT,
    follow_up_date DATE,
    applied_date DATE,
    interview_stage TEXT DEFAULT '',
    compatibility_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities (user_id);

-- Auto-assign auth.uid() on insert when user_id omitted (authenticated clients)
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

DROP TRIGGER IF EXISTS trg_opportunities_set_owner ON opportunities;

CREATE TRIGGER trg_opportunities_set_owner
  BEFORE INSERT ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_opportunity_owner();

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_select_own"
  ON opportunities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "opportunities_insert_own"
  ON opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "opportunities_update_own"
  ON opportunities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "opportunities_delete_own"
  ON opportunities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
