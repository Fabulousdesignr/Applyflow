-- Create opportunities table for Applyflow CRM
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable Row Level Security (RLS)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access their own data
-- Note: In a production team setup, you can add a user_id UUID references auth.users(id) field.
-- For a simple direct database connection bypass, we allow read/write via anon key.
CREATE POLICY "Allow all public operations" ON opportunities
    FOR ALL
    USING (true)
    WITH CHECK (true);
