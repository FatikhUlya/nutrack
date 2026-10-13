'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

import { setStorageUserId, hydrateFromSupabase } from '@/lib/database/storage';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoUser: (name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'nutrack:auth:local_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // Helper to extract AuthUser from Supabase User
  const mapSupabaseUser = (sbUser: SupabaseUser): AuthUser => {
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      displayName:
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.display_name ||
        sbUser.email?.split('@')[0] ||
        'Pengguna NUTRACK',
    };
  };

  useEffect(() => {
    if (user?.id) {
      setStorageUserId(user.id);
      hydrateFromSupabase(user.id).catch(() => {});
    } else {
      setStorageUserId('local');
    }
  }, [user]);

  useEffect(() => {
    if (configured) {
      // 1. Get current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const mapped = mapSupabaseUser(session.user);
          setUser(mapped);
          setStorageUserId(mapped.id);
          hydrateFromSupabase(mapped.id).catch(() => {});
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      // 2. Listen to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback: local session from localStorage
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(LOCAL_USER_KEY);
          if (raw) {
            setUser(JSON.parse(raw));
          }
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    }
  }, [configured]);

  // Sign In with email & password
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (configured) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { error: error.message };
        }
        return { error: null };
      } else {
        // Mock login for offline / unconfigured mode
        const demoUser: AuthUser = {
          id: `local-user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: email.split('@')[0],
        };
        setUser(demoUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        }
        return { error: null };
      }
    },
    [configured]
  );

  // Sign Up with email, password & full name
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ error: string | null; message?: string }> => {
      if (configured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (data.session) {
          return { error: null, message: 'Pendaftaran berhasil!' };
        } else {
          return {
            error: null,
            message: 'Silakan periksa email Anda untuk konfirmasi pendaftaran akun.',
          };
        }
      } else {
        // Mock sign up
        const demoUser: AuthUser = {
          id: `local-user-${Date.now()}`,
          email,
          displayName: fullName || email.split('@')[0],
        };
        setUser(demoUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        }
        return { error: null, message: 'Pendaftaran lokal berhasil!' };
      }
    },
    [configured]
  );

  // Sign Out
  const signOut = useCallback(async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  }, [configured]);

  // Quick Demo Login
  const loginAsDemoUser = useCallback((name = 'Demo User') => {
    const demoUser: AuthUser = {
      id: 'demo-user-nutrack-public',
      email: 'demo@nutrack.app',
      displayName: name,
    };
    setUser(demoUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: configured,
        signIn,
        signUp,
        signOut,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
