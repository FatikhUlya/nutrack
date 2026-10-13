/**
 * Zod validation schemas for NUTRACK
 * Used for form validation (frontend) and API response validation (backend)
 */

import { z } from 'zod';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Nama tidak boleh kosong')
    .max(60, 'Nama terlalu panjang')
    .trim(),
  sex: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Pilih jenis kelamin' }),
  }),
  age: z
    .number({ invalid_type_error: 'Usia harus berupa angka' })
    .int('Usia harus bilangan bulat')
    .min(15, 'Aplikasi ini ditujukan untuk usia 15 tahun ke atas')
    .max(100, 'Masukkan usia yang valid'),
  weightKg: z
    .number({ invalid_type_error: 'Berat harus berupa angka' })
    .positive('Berat harus lebih dari 0')
    .min(20, 'Berat terlalu rendah')
    .max(500, 'Masukkan berat yang valid'),
  heightCm: z
    .number({ invalid_type_error: 'Tinggi harus berupa angka' })
    .positive('Tinggi harus lebih dari 0')
    .min(50, 'Tinggi terlalu rendah')
    .max(280, 'Masukkan tinggi yang valid'),
  bodyFatPercent: z
    .number()
    .min(0, 'Body fat tidak boleh negatif')
    .max(100, 'Body fat tidak boleh melebihi 100%')
    .optional()
    .or(z.literal(undefined)),
  activityLevel: z.enum(
    ['sedentary', 'light', 'moderate', 'high', 'very_high'],
    { errorMap: () => ({ message: 'Pilih tingkat aktivitas' }) },
  ),
  goal: z.enum(['cut', 'maintenance', 'lean_bulk'], {
    errorMap: () => ({ message: 'Pilih tujuan' }),
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Food Entry ───────────────────────────────────────────────────────────────

export const foodEntrySchema = z.object({
  foodName: z
    .string()
    .min(1, 'Nama makanan tidak boleh kosong')
    .max(200, 'Nama makanan terlalu panjang')
    .trim(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Pilih kategori makan' }),
  }),
  quantity: z
    .number({ invalid_type_error: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(9999, 'Jumlah terlalu besar'),
  servingUnit: z
    .string()
    .min(1, 'Satuan tidak boleh kosong')
    .max(50, 'Satuan terlalu panjang')
    .trim(),
  weightGrams: z
    .number()
    .nonnegative('Berat tidak boleh negatif')
    .optional()
    .or(z.literal(undefined)),
  caloriesKcal: z
    .number({ invalid_type_error: 'Kalori harus berupa angka' })
    .nonnegative('Kalori tidak boleh negatif')
    .max(99999, 'Nilai kalori tidak valid'),
  proteinG: z
    .number({ invalid_type_error: 'Protein harus berupa angka' })
    .nonnegative('Protein tidak boleh negatif')
    .max(9999, 'Nilai protein tidak valid'),
  carbsG: z
    .number({ invalid_type_error: 'Karbohidrat harus berupa angka' })
    .nonnegative('Karbohidrat tidak boleh negatif')
    .max(9999, 'Nilai karbohidrat tidak valid'),
  fatG: z
    .number({ invalid_type_error: 'Lemak harus berupa angka' })
    .nonnegative('Lemak tidak boleh negatif')
    .max(9999, 'Nilai lemak tidak valid'),
  consumptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  notes: z.string().max(500, 'Catatan terlalu panjang').optional(),
});

export type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

// ─── Saved Food ───────────────────────────────────────────────────────────────

export const savedFoodSchema = z.object({
  foodName: z.string().min(1, 'Nama makanan tidak boleh kosong').max(200).trim(),
  defaultQuantity: z.number().positive('Jumlah harus lebih dari 0').max(9999),
  servingUnit: z.string().min(1, 'Satuan tidak boleh kosong').max(50).trim(),
  caloriesKcal: z.number().nonnegative().max(99999),
  proteinG: z.number().nonnegative().max(9999),
  carbsG: z.number().nonnegative().max(9999),
  fatG: z.number().nonnegative().max(9999),
  notes: z.string().max(500).optional(),
});

export type SavedFoodFormData = z.infer<typeof savedFoodSchema>;

// ─── Gemini API Response ──────────────────────────────────────────────────────

export const foodScanItemSchema = z.object({
  name: z.string().min(1).max(200),
  estimatedWeightGrams: z.number().nonnegative(),
  servingDescription: z.string().max(500),
  caloriesKcal: z.number().nonnegative(),
  proteinGrams: z.number().nonnegative(),
  carbsGrams: z.number().nonnegative(),
  fatGrams: z.number().nonnegative(),
  confidence: z.enum(['low', 'medium', 'high']),
  estimationNotes: z.string().max(500),
});

export const foodScanAnalysisSchema = z.object({
  items: z.array(foodScanItemSchema).min(1, 'Tidak ada makanan teridentifikasi'),
  overallNotes: z.array(z.string().max(500)),
});

export type FoodScanAnalysisData = z.infer<typeof foodScanAnalysisSchema>;
