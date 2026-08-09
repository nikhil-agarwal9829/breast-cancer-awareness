-- Phase 2 Migration: User Profiles, Campaigns, Community Groups

-- 1. Extend existing tables to track user_id
ALTER TABLE risk_assessments ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE donations ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE contact_messages ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. User Profiles Table (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    target_amount numeric,
    current_amount numeric DEFAULT 0,
    image_url text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns are viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Community Groups
CREATE TABLE IF NOT EXISTS public.community_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    category text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are viewable by everyone" ON public.community_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.community_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. User Group Memberships (Join Group)
CREATE TABLE IF NOT EXISTS public.user_groups (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, group_id)
);
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships are viewable by everyone" ON public.user_groups FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.user_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.user_groups FOR DELETE USING (auth.uid() = user_id);

-- 6. Insert some sample Campaigns
INSERT INTO public.campaigns (title, description, target_amount, current_amount, image_url)
VALUES 
  ('Pink October Fundraiser', 'Help us provide free screenings for underprivileged women this October.', 10000, 2500, 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074'),
  ('Support Care Packages', 'Sponsor care packages for patients undergoing chemotherapy.', 5000, 1200, 'https://images.unsplash.com/photo-1576089172869-4f5f6f315620')
ON CONFLICT DO NOTHING;

-- 7. Insert some sample Community Groups
INSERT INTO public.community_groups (name, description, category)
VALUES
  ('Survivors Circle', 'Connect with fellow survivors, share your journey, and inspire others.', 'support'),
  ('Caregivers Support', 'A space for family and friends to share experiences and find guidance.', 'support'),
  ('Newly Diagnosed', 'Get support and information during your initial journey.', 'support')
ON CONFLICT DO NOTHING;
