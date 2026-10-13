/**
 * NUTRACK Storage Layer — localStorage abstraction
 *
 * This layer provides a typed interface for all data persistence.
 * Currently backed by localStorage; swap the implementation for
 * Supabase/backend without touching any UI code.
 *
 * NOTE: This is client-side only. Always guard with typeof window !== 'undefined'.
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

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  PROFILE: 'nutrack:profile',
  NUTRITION_TARGETS: 'nutrack:nutrition_targets',
  FOOD_ENTRIES: 'nutrack:food_entries',
  SAVED_FOODS: 'nutrack:saved_foods',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return readJSON<UserProfile>(KEYS.PROFILE);
}

export function saveProfile(
  data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): UserProfile {
  const existing = getProfile();
  const now = new Date().toISOString();
  const profile: UserProfile = {
    ...data,
    id: data.id ?? existing?.id ?? generateId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  writeJSON(KEYS.PROFILE, profile);
  return profile;
}

export function deleteProfile(): void {
  removeKey(KEYS.PROFILE);
}

export function hasProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.PROFILE) !== null;
}

// ─── Nutrition Targets ────────────────────────────────────────────────────────

export function getNutritionTargets(): NutritionTarget[] {
  return readJSON<NutritionTarget[]>(KEYS.NUTRITION_TARGETS) ?? [];
}

export function getActiveNutritionTarget(date: string): NutritionTarget | null {
  const targets = getNutritionTargets();
  if (targets.length === 0) return null;

  // Find the most recent target with effectiveDate ≤ requested date
  const applicable = targets
    .filter(t => t.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return applicable[0] ?? null;
}

export function saveNutritionTarget(
  target: Omit<NutritionTarget, 'id' | 'createdAt'>,
): NutritionTarget {
  const targets = getNutritionTargets();
  const now = new Date().toISOString();

  // Check if a target already exists for this effectiveDate
  const existingIndex = targets.findIndex(
    t => t.effectiveDate === target.effectiveDate && t.userId === target.userId,
  );

  const newTarget: NutritionTarget = {
    ...target,
    id: existingIndex >= 0 ? targets[existingIndex].id : generateId(),
    createdAt: now,
  };

  if (existingIndex >= 0) {
    targets[existingIndex] = newTarget;
  } else {
    targets.push(newTarget);
  }

  // Sort chronologically
  targets.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  writeJSON(KEYS.NUTRITION_TARGETS, targets);
  return newTarget;
}

// ─── Food Entries ─────────────────────────────────────────────────────────────

export function getAllFoodEntries(): FoodEntry[] {
  return readJSON<FoodEntry[]>(KEYS.FOOD_ENTRIES) ?? [];
}

export function getFoodEntriesByDate(date: string): FoodEntry[] {
  const entries = getAllFoodEntries();
  return entries
    .filter(e => e.consumptionDate === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createFoodEntry(input: CreateFoodEntryInput & { userId: string }): FoodEntry {
  const entries = getAllFoodEntries();
  const now = new Date().toISOString();
  const entry: FoodEntry = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  entries.push(entry);
  writeJSON(KEYS.FOOD_ENTRIES, entries);
  return entry;
}

export function updateFoodEntry(id: string, updates: UpdateFoodEntryInput): FoodEntry | null {
  const entries = getAllFoodEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return null;

  const updated: FoodEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  entries[index] = updated;
  writeJSON(KEYS.FOOD_ENTRIES, entries);
  return updated;
}

export function deleteFoodEntry(id: string): boolean {
  const entries = getAllFoodEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  writeJSON(KEYS.FOOD_ENTRIES, filtered);
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
  return readJSON<SavedFood[]>(KEYS.SAVED_FOODS) ?? [];
}

export function createSavedFood(
  input: Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt'>,
): SavedFood {
  const foods = getSavedFoods();
  const now = new Date().toISOString();
  const food: SavedFood = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  foods.push(food);
  writeJSON(KEYS.SAVED_FOODS, foods);
  return food;
}

export function updateSavedFood(
  id: string,
  updates: Partial<Omit<SavedFood, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): SavedFood | null {
  const foods = getSavedFoods();
  const index = foods.findIndex(f => f.id === id);
  if (index === -1) return null;

  const updated: SavedFood = {
    ...foods[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  foods[index] = updated;
  writeJSON(KEYS.SAVED_FOODS, foods);
  return updated;
}

export function deleteSavedFood(id: string): boolean {
  const foods = getSavedFoods();
  const filtered = foods.filter(f => f.id !== id);
  if (filtered.length === foods.length) return false;
  writeJSON(KEYS.SAVED_FOODS, filtered);
  return true;
}

// ─── Wipe All Data (for testing / account deletion) ──────────────────────────

export function clearAllData(): void {
  Object.values(KEYS).forEach(removeKey);
}
