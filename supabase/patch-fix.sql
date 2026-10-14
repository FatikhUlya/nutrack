-- ==============================================================================
-- NUTRACK — Database Patch / Fix Script
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard -> SQL Editor)
-- untuk menyinkronkan seluruh skema, memperbaiki RLS, dan membuat tabel baru.
-- ==============================================================================

-- 1. Tambah kolom 'role' ke tabel profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- 2. Pastikan user pertama (paling lama dibuat) di-set sebagai admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1
)
AND role != 'admin';

-- 3. Fungsi handle_new_user yang aman & dinamis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
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

-- 4. Fungsi is_admin() yang AMAN tanpa rekursi ke public.profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Cek klaim role di token JWT
  IF COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Cek ke metadata auth.users (internal Supabase, tidak memicu RLS profiles)
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      COALESCE(raw_user_meta_data->>'role', '') = 'admin'
      OR COALESCE(raw_app_meta_data->>'role', '') = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies Profiles yang aman & tidak rekursif
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- SELECT: Pemilik atau Admin
CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- INSERT: Pemilik
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Pemilik atau Admin
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- DELETE: Pemilik
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 6. Tabel weight_log (Riwayat Berat Badan)
CREATE TABLE IF NOT EXISTS public.weight_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

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

-- 7. Verifikasi Status Profil Saat Ini
SELECT id, display_name, role, weight_kg, height_cm, age, created_at, updated_at
FROM public.profiles
ORDER BY created_at ASC;
