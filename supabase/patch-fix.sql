-- ==============================================================================
-- NUTRACK — Database Patch / Fix Script
-- Jalankan ini di Supabase SQL Editor jika tabel sudah ada sebelumnya
-- dan perlu dipatch tanpa menghapus data yang ada.
-- ==============================================================================

-- Patch 1: Tambah kolom 'role' ke tabel profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Patch 2: Set user pertama (paling lama dibuat) sebagai admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1
)
AND role != 'admin';

-- Patch 3: Pastikan fungsi handle_new_user sudah up-to-date
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

-- Patch 4: Pastikan fungsi is_admin() ada
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Patch 5: Pastikan RLS policies up-to-date
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

-- Verifikasi hasil patch
SELECT id, display_name, role, created_at
FROM public.profiles
ORDER BY created_at ASC;
