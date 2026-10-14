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
  WeightEntry,
  CreateFoodEntryInput,
  UpdateFoodEntryInput,
} from '@/types';
import { generateId, toDateString, isUuid } from '@/lib/utils';
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
    WEIGHT_LOG: `nutrack:${safeId}:weight_log`,
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

  // Sync weight change to weight_log for today
  if (data.weightKg) {
    const todayStr = toDateString(new Date());
    const weightEntries = getWeightLog();
    const existingWeight = weightEntries.find((e) => e.date === todayStr);
    if (!existingWeight || existingWeight.weightKg !== data.weightKg) {
      const entryId = existingWeight && isUuid(existingWeight.id) ? existingWeight.id : generateId();
      const updatedLog: WeightEntry[] = existingWeight
        ? weightEntries.map((e) => e.date === todayStr ? { ...e, weightKg: data.weightKg, createdAt: now } : e)
        : [...weightEntries, { id: entryId, userId, date: todayStr, weightKg: data.weightKg, createdAt: now }];
      updatedLog.sort((a, b) => a.date.localeCompare(b.date));
      writeJSON(getKeys().WEIGHT_LOG, updatedLog);

      if (isSupabaseConfigured() && userId && userId !== 'local') {
        supabase
          .from('weight_log')
          .upsert({
            id: entryId,
            user_id: userId,
            date: todayStr,
            weight_kg: data.weightKg,
            created_at: now,
          })
          .then(({ error }) => {
            if (error) console.error('[Supabase] weight_log upsert from saveProfile failed:', error.message);
          });
      }
    }
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
    id: existingIndex >= 0 && isUuid(targets[existingIndex].id) ? targets[existingIndex].id : generateId(),
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

/** Fetch all data from Supabase and cache to localStorage. Called on login & page load. */
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

    // 2. Fetch Food Entries — always overwrite localStorage with cloud data
    const { data: entriesData } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .order('consumption_date', { ascending: false });

    const mappedEntries: FoodEntry[] = (entriesData ?? []).map(e => ({
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
    // Always write (even empty array) to ensure localStorage reflects cloud state
    writeJSON(getKeys(userId).FOOD_ENTRIES, mappedEntries);

    // 3. Fetch Nutrition Targets
    const { data: targetsData } = await supabase
      .from('nutrition_targets')
      .select('*')
      .eq('user_id', userId)
      .order('effective_date', { ascending: true });

    const mappedTargets: NutritionTarget[] = (targetsData ?? []).map(t => ({
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
    if (mappedTargets.length > 0) {
      writeJSON(getKeys(userId).NUTRITION_TARGETS, mappedTargets);
    }

    // 4. Fetch Saved Foods
    const { data: savedData } = await supabase
      .from('saved_foods')
      .select('*')
      .eq('user_id', userId);

    const mappedFoods: SavedFood[] = (savedData ?? []).map(f => ({
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
    if (mappedFoods.length > 0) {
      writeJSON(getKeys(userId).SAVED_FOODS, mappedFoods);
    }

    console.log(`[storage] Hydrated ${mappedEntries.length} entries, ${mappedTargets.length} targets, ${mappedFoods.length} saved foods from Supabase for user ${userId.slice(0, 8)}...`);
  } catch (err) {
    console.error('[storage] Failed to hydrate from Supabase:', err);
  }
}

/**
 * Fetch food entries directly from Supabase for a specific date.
 * Bypasses localStorage — guarantees cross-device sync.
 */
export async function getFoodEntriesByDateFromSupabase(
  userId: string,
  date: string,
): Promise<FoodEntry[]> {
  if (!isSupabaseConfigured() || !userId || userId === 'local') return [];

  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('consumption_date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const mapped: FoodEntry[] = (data ?? []).map(e => ({
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

    // Merge into localStorage cache so sync stays consistent
    const allEntries = readJSON<FoodEntry[]>(getKeys(userId).FOOD_ENTRIES) ?? [];
    const otherEntries = allEntries.filter(e => e.consumptionDate !== date);
    writeJSON(getKeys(userId).FOOD_ENTRIES, [...otherEntries, ...mapped]);

    return mapped;
  } catch (err) {
    console.error('[storage] Failed to fetch entries from Supabase:', err);
    // Fallback to localStorage
    return getFoodEntriesByDate(date);
  }
}

/**
 * Fetch daily nutrition summaries across a date range directly from Supabase,
 * ensuring statistics stay accurate across all devices.
 */
export async function getDailyNutritionForRangeFromSupabase(
  userId: string,
  startDate: string,
  endDate: string,
) {
  if (!isSupabaseConfigured() || !userId || userId === 'local') {
    return getDailyNutritionForRange(startDate, endDate);
  }

  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('consumption_date', startDate)
      .lte('consumption_date', endDate)
      .order('consumption_date', { ascending: true });

    if (error) throw error;

    const mapped: FoodEntry[] = (data ?? []).map(e => ({
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

    // Cache locally
    const allEntries = readJSON<FoodEntry[]>(getKeys(userId).FOOD_ENTRIES) ?? [];
    const datesInRange = new Set(mapped.map(m => m.consumptionDate));
    const keptEntries = allEntries.filter(e => !datesInRange.has(e.consumptionDate));
    writeJSON(getKeys(userId).FOOD_ENTRIES, [...keptEntries, ...mapped]);

    const byDate = new Map<string, FoodEntry[]>();
    mapped.forEach(e => {
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
      results.push({
        date: dateStr,
        caloriesKcal: dayEntries.reduce((s, e) => s + e.caloriesKcal, 0),
        proteinG: dayEntries.reduce((s, e) => s + e.proteinG, 0),
        carbsG: dayEntries.reduce((s, e) => s + e.carbsG, 0),
        fatG: dayEntries.reduce((s, e) => s + e.fatG, 0),
        entryCount: dayEntries.length,
      });
      current.setDate(current.getDate() + 1);
    }

    return results;
  } catch (err) {
    console.error('[storage] Failed to fetch date range from Supabase:', err);
    return getDailyNutritionForRange(startDate, endDate);
  }
}


// ─── Weight Log ────────────────────────────────────────────────────────────────

export function getWeightLog(userId?: string): WeightEntry[] {
  return readJSON<WeightEntry[]>(getKeys(userId).WEIGHT_LOG) ?? [];
}

export function saveWeightEntry(weightKg: number, date?: string, notes?: string): WeightEntry {
  const userId = getStorageUserId();
  const dateStr = date ?? toDateString(new Date());
  const now = new Date().toISOString();
  const entries = getWeightLog();

  // Upsert: satu entri per hari
  const existingIndex = entries.findIndex((e) => e.date === dateStr);
  const entry: WeightEntry = {
    id: existingIndex >= 0 && isUuid(entries[existingIndex].id) ? entries[existingIndex].id : generateId(),
    userId,
    date: dateStr,
    weightKg,
    notes,
    createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : now,
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  writeJSON(getKeys().WEIGHT_LOG, entries);

  // Sync to Supabase
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    supabase
      .from('weight_log')
      .upsert({
        id: entry.id,
        user_id: userId,
        date: entry.date,
        weight_kg: weightKg,
        notes,
        created_at: entry.createdAt,
      })
      .then(({ error }) => {
        if (error) console.error('[Supabase] weight_log upsert failed:', error.message);
      });
  }

  // Also update profile current weight
  const profile = getProfile();
  if (profile) {
    saveProfile({ ...profile, weightKg });
  }

  return entry;
}

export async function getWeightLogFromSupabase(userId: string, limit = 365): Promise<WeightEntry[]> {
  if (!isSupabaseConfigured() || !userId || userId === 'local') {
    return getWeightLog();
  }
  try {
    const { data, error } = await supabase
      .from('weight_log')
      .select('id, user_id, date, weight_kg, notes, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) return getWeightLog();

    const mapped: WeightEntry[] = (data as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      weightKg: r.weight_kg,
      notes: r.notes,
      createdAt: r.created_at,
    }));

    // Cache locally
    writeJSON(getKeys(userId).WEIGHT_LOG, mapped);
    return mapped;
  } catch (err) {
    console.error('[storage] Failed to fetch weight log from Supabase:', err);
    return getWeightLog();
  }
}

// ─── Wipe All Data for Current User ──────────────────────────────────────────


export async function clearAllData(): Promise<void> {
  const userId = getStorageUserId();

  // Bersihkan semua local cache data nutrack (kecuali auth info)
  if (typeof window !== 'undefined') {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nutrack:') && !k.startsWith('nutrack:auth:')) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  // Jika akun terhubung ke Supabase, bersihkan juga data food_entries & targets cloud
  if (isSupabaseConfigured() && userId && userId !== 'local') {
    try {
      await Promise.all([
        supabase.from('food_entries').delete().eq('user_id', userId),
        supabase.from('nutrition_targets').delete().eq('user_id', userId),
        supabase.from('saved_foods').delete().eq('user_id', userId),
      ]);
    } catch (e) {
      console.error('[storage] Gagal menghapus data dari Supabase:', e);
    }
  }
}
