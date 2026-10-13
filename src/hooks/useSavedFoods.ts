'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedFood } from '@/types';
import * as storage from '@/lib/database/storage';

export function useSavedFoods() {
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setSavedFoods(storage.getSavedFoods());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSavedFood = useCallback(
    (input: Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const profile = storage.getProfile();
      const userId = profile?.id ?? 'local';
      const food = storage.createSavedFood({ ...input, userId });
      setSavedFoods(prev => [...prev, food]);
      return food;
    },
    [],
  );

  const updateFood = useCallback(
    (id: string, updates: Partial<Omit<SavedFood, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
      const updated = storage.updateSavedFood(id, updates);
      if (updated) {
        setSavedFoods(prev => prev.map(f => (f.id === id ? updated : f)));
      }
      return updated;
    },
    [],
  );

  const deleteFood = useCallback((id: string) => {
    const deleted = storage.deleteSavedFood(id);
    if (deleted) {
      setSavedFoods(prev => prev.filter(f => f.id !== id));
    }
    return deleted;
  }, []);

  return {
    savedFoods,
    isLoading,
    addSavedFood,
    updateFood,
    deleteFood,
    reload,
  };
}
