/**
 * NUTRACK Storage Layer — Multi-Tenant & Supabase Sync
 *
 * This layer provides a typed interface for all data persistence.
 * Each authenticated user has completely isolated data partitioned by `userId`.
 * When Supabase is configured, data automatically syncs with PostgreSQL & RLS.
 *
 * NOTE: Client-side only. Always guard with typeof window !== 'undefined'.
 */

import type {
  UserProfile,
  NutritionTarget,
  FoodEntry,
  SavedFood,
  CreateFoodEntryInput,
  UpdateFoodEntryInput,
} from '@/types';
import { generateId, toDateString } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

// ─── Active User Partitioning ──────────────────────────────────────────────────

let currentUserId: string = 'local';

export function setStorageUserId(userId: string): void {
  currentUserId = userId;
}

export function getStorageUserId(): string {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('nutrack:auth:local_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.id) return parsed.id;
      }
    } catch {
      // fallback
    }
  }
  return currentUserId;
}

function getKeys(userId = getStorageUserId()) {
  const safeId = userId || 'local';
  return {
    PROFILE: `nutrack:${safeId}:profile`,
    NUTRITION_TARGETS: `nutrack:${safeId}:nutrition_targets`,
    FOOD_ENTRIES: `nutrack:${safeId}:food_entries`,
    SAVED_FOODS: `nutrack:${safeId}:saved_foods`,
  };
}

// ─── LocalStorage Helpers ──────────────────────────────────────────────────────

function readJSON<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Failed to parse key: ${key}`);
    return null;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] Failed to write key: ${key}`, e);
  }
}

function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  return readJSON<UserProfile>(getKeys().PROFILE);
}

export function saveProfile(
  data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): UserProfile {
  const userId = getStorageUserId();
  const existing = getProfile();
  const now = new Date().toISOString();
  const profile: UserProfile = {
    ...data,
    id: data.id ?? existing?.id ?? userId ?? generateId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  writeJSON(getKeys().PROFILE, profile);

  // Sync to Supabase in background if connected
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: profile.displayName,
        sex: profile.sex,
        age: profile.age,
        weight_kg: profile.weightKg,
        height_cm: profile.heightCm,
        body_fat_percent: profile.bodyFatPercent,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        updated_at: now,
      })
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to upsert profile:', error.message);
      });
  }

  return profile;
}

export function deleteProfile(): void {
  const userId = getStorageUserId();
  removeKey(getKeys().PROFILE);
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase.from('profiles').delete().eq('id', userId).then();
  }
}

export function hasProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getKeys().PROFILE) !== null;
}

// ─── Nutrition Targets ────────────────────────────────────────────────────────

export function getNutritionTargets(): NutritionTarget[] {
  return readJSON<NutritionTarget[]>(getKeys().NUTRITION_TARGETS) ?? [];
}

export function getActiveNutritionTarget(date: string): NutritionTarget | null {
  const targets = getNutritionTargets();
  if (targets.length === 0) return null;

  const applicable = targets
    .filter(t => t.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return applicable[0] ?? null;
}

export function saveNutritionTarget(
  target: Omit<NutritionTarget, 'id' | 'createdAt'>,
): NutritionTarget {
  const userId = getStorageUserId();
  const targets = getNutritionTargets();
  const now = new Date().toISOString();

  const existingIndex = targets.findIndex(
    t => t.effectiveDate === target.effectiveDate && t.userId === (target.userId || userId),
  );

  const newTarget: NutritionTarget = {
    ...target,
    userId: target.userId || userId,
    id: existingIndex >= 0 ? targets[existingIndex].id : generateId(),
    createdAt: now,
  };

  if (existingIndex >= 0) {
    targets[existingIndex] = newTarget;
  } else {
    targets.push(newTarget);
  }

  targets.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  writeJSON(getKeys().NUTRITION_TARGETS, targets);

  // Sync to Supabase
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('nutrition_targets')
      .upsert({
        id: newTarget.id,
        user_id: userId,
        effective_date: newTarget.effectiveDate,
        bmr_kcal: newTarget.bmrKcal,
        tdee_kcal: newTarget.tdeeKcal,
        calorie_target_kcal: newTarget.calorieTargetKcal,
        protein_target_g: newTarget.proteinTargetG,
        carbs_target_g: newTarget.carbsTargetG,
        fat_target_g: newTarget.fatTargetG,
        calculation_version: newTarget.calculationVersion,
        goal: newTarget.goal,
      })
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to upsert target:', error.message);
      });
  }

  return newTarget;
}

// ─── Food Entries ─────────────────────────────────────────────────────────────

export function getAllFoodEntries(): FoodEntry[] {
  return readJSON<FoodEntry[]>(getKeys().FOOD_ENTRIES) ?? [];
}

export function getFoodEntriesByDate(date: string): FoodEntry[] {
  const entries = getAllFoodEntries();
  return entries
    .filter(e => e.consumptionDate === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createFoodEntry(input: CreateFoodEntryInput & { userId: string }): FoodEntry {
  const userId = getStorageUserId();
  const entries = getAllFoodEntries();
  const now = new Date().toISOString();
  const entry: FoodEntry = {
    ...input,
    userId: input.userId || userId,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  entries.push(entry);
  writeJSON(getKeys().FOOD_ENTRIES, entries);

  // Sync to Supabase
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('food_entries')
      .insert({
        id: entry.id,
        user_id: userId,
        consumption_date: entry.consumptionDate,
        meal_type: entry.mealType,
        food_name: entry.foodName,
        quantity: entry.quantity,
        serving_unit: entry.servingUnit,
        weight_grams: entry.weightGrams,
        calories_kcal: entry.caloriesKcal,
        protein_g: entry.proteinG,
        carbs_g: entry.carbsG,
        fat_g: entry.fatG,
        source: entry.source,
        ai_estimated: entry.aiEstimated,
        estimation_notes: entry.estimationNotes,
        notes: entry.notes,
      })
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to insert food entry:', error.message);
      });
  }

  return entry;
}

export function updateFoodEntry(id: string, updates: UpdateFoodEntryInput): FoodEntry | null {
  const userId = getStorageUserId();
  const entries = getAllFoodEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return null;

  const updated: FoodEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  entries[index] = updated;
  writeJSON(getKeys().FOOD_ENTRIES, entries);

  // Sync to Supabase
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('food_entries')
      .update({
        food_name: updated.foodName,
        quantity: updated.quantity,
        serving_unit: updated.servingUnit,
        weight_grams: updated.weightGrams,
        calories_kcal: updated.caloriesKcal,
        protein_g: updated.proteinG,
        carbs_g: updated.carbsG,
        fat_g: updated.fatG,
        notes: updated.notes,
        updated_at: updated.updatedAt,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to update entry:', error.message);
      });
  }

  return updated;
}

export function deleteFoodEntry(id: string): boolean {
  const userId = getStorageUserId();
  const entries = getAllFoodEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  writeJSON(getKeys().FOOD_ENTRIES, filtered);

  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to delete entry:', error.message);
      });
  }

  return true;
}

export function getFoodEntryById(id: string): FoodEntry | null {
  return getAllFoodEntries().find(e => e.id === id) ?? null;
}

// ─── Daily Nutrition Aggregation ──────────────────────────────────────────────

export function getDailyNutritionForDate(date: string) {
  const entries = getFoodEntriesByDate(date);
  return entries.reduce(
    (acc, e) => ({
      caloriesKcal: acc.caloriesKcal + e.caloriesKcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
      entryCount: acc.entryCount + 1,
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
  );
}

export function getDailyNutritionForRange(startDate: string, endDate: string) {
  const allEntries = getAllFoodEntries();
  const byDate = new Map<string, typeof allEntries>();

  allEntries
    .filter(e => e.consumptionDate >= startDate && e.consumptionDate <= endDate)
    .forEach(e => {
      const arr = byDate.get(e.consumptionDate) ?? [];
      arr.push(e);
      byDate.set(e.consumptionDate, arr);
    });

  const results = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = toDateString(current);
    const dayEntries = byDate.get(dateStr) ?? [];
    const hasData = dayEntries.length > 0;

    results.push({
      date: dateStr,
      caloriesKcal: dayEntries.reduce((s, e) => s + e.caloriesKcal, 0),
      proteinG: dayEntries.reduce((s, e) => s + e.proteinG, 0),
      carbsG: dayEntries.reduce((s, e) => s + e.carbsG, 0),
      fatG: dayEntries.reduce((s, e) => s + e.fatG, 0),
      entryCount: dayEntries.length,
      hasData,
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}

// ─── Saved Foods ──────────────────────────────────────────────────────────────

export function getSavedFoods(): SavedFood[] {
  return readJSON<SavedFood[]>(getKeys().SAVED_FOODS) ?? [];
}

export function createSavedFood(
  input: Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt'>,
): SavedFood {
  const userId = getStorageUserId();
  const foods = getSavedFoods();
  const now = new Date().toISOString();
  const food: SavedFood = {
    ...input,
    userId: input.userId || userId,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  foods.push(food);
  writeJSON(getKeys().SAVED_FOODS, foods);

  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('saved_foods')
      .insert({
        id: food.id,
        user_id: userId,
        food_name: food.foodName,
        default_quantity: food.defaultQuantity,
        serving_unit: food.servingUnit,
        calories_kcal: food.caloriesKcal,
        protein_g: food.proteinG,
        carbs_g: food.carbsG,
        fat_g: food.fatG,
        notes: food.notes,
      })
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to insert saved food:', error.message);
      });
  }

  return food;
}

export function updateSavedFood(
  id: string,
  updates: Partial<Omit<SavedFood, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): SavedFood | null {
  const userId = getStorageUserId();
  const foods = getSavedFoods();
  const index = foods.findIndex(f => f.id === id);
  if (index === -1) return null;

  const updated: SavedFood = {
    ...foods[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  foods[index] = updated;
  writeJSON(getKeys().SAVED_FOODS, foods);

  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('saved_foods')
      .update({
        food_name: updated.foodName,
        default_quantity: updated.defaultQuantity,
        serving_unit: updated.servingUnit,
        calories_kcal: updated.caloriesKcal,
        protein_g: updated.proteinG,
        carbs_g: updated.carbsG,
        fat_g: updated.fatG,
        notes: updated.notes,
        updated_at: updated.updatedAt,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to update saved food:', error.message);
      });
  }

  return updated;
}

export function deleteSavedFood(id: string): boolean {
  const userId = getStorageUserId();
  const foods = getSavedFoods();
  const filtered = foods.filter(f => f.id !== id);
  if (filtered.length === foods.length) return false;
  writeJSON(getKeys().SAVED_FOODS, filtered);

  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('saved_foods')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('[Supabase] Failed to delete saved food:', error.message);
      });
  }

  return true;
}

// ─── Supabase Cloud Hydration / Sync ──────────────────────────────────────────

export async function hydrateFromSupabase(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !userId || userId === 'local') return;

  try {
    // 1. Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileData) {
      const mappedProfile: UserProfile = {
        id: profileData.id,
        displayName: profileData.display_name || 'Pengguna',
        sex: profileData.sex || 'male',
        age: profileData.age || 25,
        weightKg: Number(profileData.weight_kg) || 65,
        heightCm: Number(profileData.height_cm) || 170,
        bodyFatPercent: profileData.body_fat_percent ? Number(profileData.body_fat_percent) : undefined,
        activityLevel: profileData.activity_level || 'moderate',
        goal: profileData.goal || 'maintenance',
        createdAt: profileData.created_at || new Date().toISOString(),
        updatedAt: profileData.updated_at || new Date().toISOString(),
      };
      writeJSON(getKeys(userId).PROFILE, mappedProfile);
    }

    // 2. Fetch Food Entries
    const { data: entriesData } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId);

    if (entriesData && entriesData.length > 0) {
      const mappedEntries: FoodEntry[] = entriesData.map(e => ({
        id: e.id,
        userId: e.user_id,
        consumptionDate: e.consumption_date,
        mealType: e.meal_type,
        foodName: e.food_name,
        quantity: Number(e.quantity),
        servingUnit: e.serving_unit,
        weightGrams: e.weight_grams ? Number(e.weight_grams) : undefined,
        caloriesKcal: Number(e.calories_kcal),
        proteinG: Number(e.protein_g),
        carbsG: Number(e.carbs_g),
        fatG: Number(e.fat_g),
        source: e.source || 'manual',
        aiEstimated: Boolean(e.ai_estimated),
        estimationNotes: e.estimation_notes,
        notes: e.notes,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      }));
      writeJSON(getKeys(userId).FOOD_ENTRIES, mappedEntries);
    }

    // 3. Fetch Nutrition Targets
    const { data: targetsData } = await supabase
      .from('nutrition_targets')
      .select('*')
      .eq('user_id', userId);

    if (targetsData && targetsData.length > 0) {
      const mappedTargets: NutritionTarget[] = targetsData.map(t => ({
        id: t.id,
        userId: t.user_id,
        effectiveDate: t.effective_date,
        bmrKcal: Number(t.bmr_kcal),
        tdeeKcal: Number(t.tdee_kcal),
        calorieTargetKcal: Number(t.calorie_target_kcal),
        proteinTargetG: Number(t.protein_target_g),
        carbsTargetG: Number(t.carbs_target_g),
        fatTargetG: Number(t.fat_target_g),
        calculationVersion: t.calculation_version || '1.0',
        goal: t.goal || 'maintenance',
        createdAt: t.created_at,
      }));
      writeJSON(getKeys(userId).NUTRITION_TARGETS, mappedTargets);
    }

    // 4. Fetch Saved Foods
    const { data: savedData } = await supabase
      .from('saved_foods')
      .select('*')
      .eq('user_id', userId);

    if (savedData && savedData.length > 0) {
      const mappedFoods: SavedFood[] = savedData.map(f => ({
        id: f.id,
        userId: f.user_id,
        foodName: f.food_name,
        defaultQuantity: Number(f.default_quantity) || 1,
        servingUnit: f.serving_unit || 'porsi',
        caloriesKcal: Number(f.calories_kcal),
        proteinG: Number(f.protein_g),
        carbsG: Number(f.carbs_g),
        fatG: Number(f.fat_g),
        notes: f.notes,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));
      writeJSON(getKeys(userId).SAVED_FOODS, mappedFoods);
    }
  } catch (err) {
    console.error('[storage] Failed to hydrate from Supabase:', err);
  }
}

// ─── Wipe All Data for Current User ──────────────────────────────────────────

export function clearAllData(): void {
  const userId = getStorageUserId();
  Object.values(getKeys(userId)).forEach(removeKey);
}
