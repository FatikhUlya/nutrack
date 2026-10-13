'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import * as storage from '@/lib/database/storage';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProfile(storage.getProfile());
    setIsLoading(false);
  }, []);

  const saveProfile = useCallback(
    (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const saved = storage.saveProfile(data);
      setProfile(saved);
      return saved;
    },
    [],
  );

  const updateProfile = useCallback(
    (partial: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (!profile) return;
      const saved = storage.saveProfile({ ...profile, ...partial });
      setProfile(saved);
      return saved;
    },
    [profile],
  );

  const deleteProfile = useCallback(() => {
    storage.deleteProfile();
    setProfile(null);
  }, []);

  return { profile, isLoading, saveProfile, updateProfile, deleteProfile };
}
