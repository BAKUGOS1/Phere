-- ============ PHERE DATABASE SCHEMA ============
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- URL: https://supabase.com/dashboard/project/hrwqsgwnwpteykmigvae/sql

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wedding data table (stores all wedding data as JSONB, real-time enabled)
CREATE TABLE IF NOT EXISTS public.wedding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Deleted items table (trash bin for recovery)
CREATE TABLE IF NOT EXISTS public.deleted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('expense', 'shagun', 'lena', 'dena', 'vendor', 'guest')),
  item_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. RLS Policies for wedding_data
CREATE POLICY "Users can read own wedding data" ON public.wedding_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wedding data" ON public.wedding_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wedding data" ON public.wedding_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wedding data" ON public.wedding_data FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for deleted_items
CREATE POLICY "Users can read own deleted items" ON public.deleted_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deleted items" ON public.deleted_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own deleted items" ON public.deleted_items FOR DELETE USING (auth.uid() = user_id);

-- 8. Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.wedding_data (user_id, data)
  VALUES (NEW.id, '{"expenses":[],"shagun":[],"vendors":[],"guests":[],"lena":[],"dena":[],"settings":{"coupleName":"","weddingDate":"","totalBudget":1000000}}'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Updated_at auto-update functions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wedding_data_updated_at
  BEFORE UPDATE ON public.wedding_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 11. Enable realtime for wedding_data
ALTER PUBLICATION supabase_realtime ADD TABLE public.wedding_data;
