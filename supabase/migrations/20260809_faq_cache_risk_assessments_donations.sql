-- Migration: Create faq_cache, risk_assessments, and donations tables
-- Run via: supabase db push, or manually in SQL Editor

-- FAQ cache for AI chat — avoids redundant AI calls for common questions
CREATE TABLE IF NOT EXISTS faq_cache (
  question text PRIMARY KEY,
  answer text NOT NULL,
  hits int DEFAULT 0
);

-- Risk assessment results logged from the ai-risk Edge Function
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  risk_level text,
  risk_percentage numeric,
  recommendations text,
  created_at timestamptz DEFAULT now()
);

-- Donation intent records (no real payment gateway yet)
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE faq_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- faq_cache: Edge Functions use service_role (bypasses RLS), admin can read
CREATE POLICY "admin read faq_cache" ON faq_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- risk_assessments: same pattern
CREATE POLICY "admin read risk_assessments" ON risk_assessments
  FOR SELECT USING (auth.role() = 'authenticated');

-- donations: public can insert (anonymous donation intent), admin can read
CREATE POLICY "public insert donations" ON donations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read donations" ON donations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add donations to realtime publication for admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
