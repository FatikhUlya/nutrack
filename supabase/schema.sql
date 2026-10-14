-- ==============================================================================
-- NUTRACK — Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- Jalankan script ini di menu "SQL Editor" pada Supabase Dashboard Anda.
-- Script ini aman dijalankan berulang kali (Idempotent).
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Terkoneksi langsung ke auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  sex TEXT CHECK (sex IN ('male', 'female')),
  age INTEGER,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  body_fat_percent NUMERIC,
  activity_level TEXT DEFAULT 'moderate',
  goal TEXT DEFAULT 'maintenance',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom role ada jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- 3. Nutrition Targets Table
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  effective_date DATE NOT NULL,
  bmr_kcal NUMERIC NOT NULL,
  tdee_kcal NUMERIC NOT NULL,
  calorie_target_kcal NUMERIC NOT NULL,
  protein_target_g NUMERIC NOT NULL,
  carbs_target_g NUMERIC NOT NULL,
  fat_target_g NUMERIC NOT NULL,
  calculation_version TEXT DEFAULT '1.0',
  goal TEXT DEFAULT 'maintenance',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Food Entries Table (Buku Harian Makanan)
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consumption_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  serving_unit TEXT NOT NULL DEFAULT 'porsi',
  weight_grams NUMERIC,
  calories_kcal NUMERIC NOT NULL,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  ai_estimated BOOLEAN DEFAULT FALSE,
  estimation_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Saved Foods Table (Database Makanan Favorit)
CREATE TABLE IF NOT EXISTS public.saved_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  default_quantity NUMERIC DEFAULT 1,
  serving_unit TEXT DEFAULT 'porsi',
  calories_kcal NUMERIC NOT NULL,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper Function: Cek apakah user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. Row Level Security (RLS) — Menjamin isolasi data total per pengguna!
-- User hanya bisa mengelola datanya sendiri, kecuali Admin yang bisa melihat profil pengguna.
-- ==============================================================================

-- RLS Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id OR public.is_admin());

-- RLS Nutrition Targets
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own nutrition targets" ON public.nutrition_targets;
DROP POLICY IF EXISTS "Users can insert own nutrition targets" ON public.nutrition_targets;
DROP POLICY IF EXISTS "Users can update own nutrition targets" ON public.nutrition_targets;
DROP POLICY IF EXISTS "Users can delete own nutrition targets" ON public.nutrition_targets;

CREATE POLICY "Users can view own nutrition targets" ON public.nutrition_targets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition targets" ON public.nutrition_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition targets" ON public.nutrition_targets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition targets" ON public.nutrition_targets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Food Entries
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can insert own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can update own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can delete own food entries" ON public.food_entries;

CREATE POLICY "Users can view own food entries" ON public.food_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food entries" ON public.food_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food entries" ON public.food_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food entries" ON public.food_entries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Saved Foods
ALTER TABLE public.saved_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saved foods" ON public.saved_foods;
DROP POLICY IF EXISTS "Users can insert own saved foods" ON public.saved_foods;
DROP POLICY IF EXISTS "Users can update own saved foods" ON public.saved_foods;
DROP POLICY IF EXISTS "Users can delete own saved foods" ON public.saved_foods;

CREATE POLICY "Users can view own saved foods" ON public.saved_foods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved foods" ON public.saved_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved foods" ON public.saved_foods
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved foods" ON public.saved_foods
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. Trigger Otomatis: Buat Profil saat User Baru Terdaftar
-- Akun pertama otomatis menjadi Admin. Akun berikutnya menjadi User biasa.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  -- Cek apakah ini user pertama di database
  SELECT (COUNT(*) = 0) INTO is_first FROM public.profiles;

  INSERT INTO public.profiles (id, display_name, role, sex, age, weight_kg, height_cm, activity_level, goal)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_first THEN 'admin' ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'user') END,
    'male',
    25,
    65,
    170,
    'moderate',
    'maintenance'
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexing
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries (user_id, consumption_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_targets_user ON public.nutrition_targets (user_id, effective_date);
CREATE INDEX IF NOT EXISTS idx_saved_foods_user ON public.saved_foods (user_id);

-- 6. Weight Log Table (Riwayat Berat Badan)
CREATE TABLE IF NOT EXISTS public.weight_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- RLS Weight Log
ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own weight log" ON public.weight_log;
DROP POLICY IF EXISTS "Users can insert own weight log" ON public.weight_log;
DROP POLICY IF EXISTS "Users can update own weight log" ON public.weight_log;
DROP POLICY IF EXISTS "Users can delete own weight log" ON public.weight_log;

CREATE POLICY "Users can view own weight log" ON public.weight_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight log" ON public.weight_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight log" ON public.weight_log
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight log" ON public.weight_log
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_log_user_date ON public.weight_log (user_id, date);

