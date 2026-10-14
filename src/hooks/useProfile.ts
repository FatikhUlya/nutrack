'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import * as storage from '@/lib/database/storage';
import { useAuth } from '@/context/AuthContext';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  // Load profile from local storage and authoritative Supabase
  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    // 1. Instant local cache load
    const cached = storage.getProfile(user?.id);
    if (cached) {
      setProfile(cached);
    }

    // 2. Fetch authoritative profile from Supabase if authenticated
    if (user?.id && user.id !== 'local') {
      try {
        const cloud = await storage.fetchProfileFromSupabase(user.id);
        if (cloud) {
          setProfile(cloud);
        }
      } catch (e) {
        console.warn('[useProfile] Could not fetch profile from Supabase:', e);
      }
    }

    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Listen to profile updates or Supabase hydration events
  useEffect(() => {
    const handleUpdate = () => {
      const p = storage.getProfile(user?.id);
      if (p) setProfile(p);
    };

    window.addEventListener('nutrack:profile_updated', handleUpdate);
    window.addEventListener('nutrack:hydrated', handleUpdate);

    return () => {
      window.removeEventListener('nutrack:profile_updated', handleUpdate);
      window.removeEventListener('nutrack:hydrated', handleUpdate);
    };
  }, [user?.id]);

  const saveProfile = useCallback(
    async (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const saved = await storage.saveProfile(data, user?.id);
      setProfile(saved);
      return saved;
    },
    [user?.id],
  );

  const updateProfile = useCallback(
    async (partial: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (!profile) return null;
      const saved = await storage.saveProfile({ ...profile, ...partial }, user?.id);
      setProfile(saved);
      return saved;
    },
    [profile, user?.id],
  );

  const deleteProfile = useCallback(() => {
    storage.deleteProfile();
    setProfile(null);
  }, []);

  return { profile, isLoading, saveProfile, updateProfile, deleteProfile, reload: loadProfile };
}
