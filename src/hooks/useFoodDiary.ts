'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FoodEntry, CreateFoodEntryInput, UpdateFoodEntryInput, MealType } from '@/types';
import * as storage from '@/lib/database/storage';
import { getFoodEntriesByDateFromSupabase } from '@/lib/database/storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { today } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function useFoodDiary(date?: string) {
  const targetDate = date ?? today();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? storage.getStorageUserId();

  /**
   * reload — baca dari Supabase dulu (jika connected), fallback ke localStorage.
   * Ini menjamin data selalu sinkron lintas perangkat.
   */
  const reload = useCallback(async () => {
    if (isSupabaseConfigured() && authLoading) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && userId && userId !== 'local') {
        // Fetch langsung dari cloud — guarantees cross-device sync
        const cloudEntries = await getFoodEntriesByDateFromSupabase(userId, targetDate);
        setEntries(cloudEntries);
      } else {
        // Fallback ke localStorage jika Supabase tidak dikonfigurasi
        setEntries(storage.getFoodEntriesByDate(targetDate));
      }
    } catch {
      // Jika cloud gagal, tetap gunakan cache lokal
      setEntries(storage.getFoodEntriesByDate(targetDate));
    } finally {
      setIsLoading(false);
    }
  }, [targetDate, userId, authLoading]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(
    (input: CreateFoodEntryInput) => {
      const uid = userId || 'local';
      const entry = storage.createFoodEntry({ ...input, userId: uid });
      setEntries(prev => [...prev, entry]);
      return entry;
    },
    [userId],
  );

  const updateEntry = useCallback(
    (id: string, updates: UpdateFoodEntryInput) => {
      const updated = storage.updateFoodEntry(id, updates);
      if (updated) {
        setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
      }
      return updated;
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    const deleted = storage.deleteFoodEntry(id);
    if (deleted) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
    return deleted;
  }, []);

  // Aggregate totals
  const totals = entries.reduce(
    (acc, e) => ({
      caloriesKcal: acc.caloriesKcal + e.caloriesKcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  // Grouped by meal type
  const byMeal = entries.reduce<Record<MealType, FoodEntry[]>>(
    (acc, e) => {
      acc[e.mealType] = [...(acc[e.mealType] ?? []), e];
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] },
  );

  return {
    entries,
    totals,
    byMeal,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    reload,
  };
}
