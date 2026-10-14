'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { setStorageUserId, hydrateFromSupabase } from '@/lib/database/storage';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null; message?: string }>;
  createAdminUser: (
    email: string,
    password: string,
    fullName: string,
    role?: 'admin' | 'user'
  ) => Promise<{ error: string | null; message?: string }>;
  loginAsDemoUser: (name?: string, role?: 'admin' | 'user') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'nutrack:auth:local_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // Helper to extract AuthUser from Supabase User and profile table
  const fetchAndMapUser = useCallback(async (sbUser: SupabaseUser): Promise<AuthUser> => {
    let role: 'admin' | 'user' = (sbUser.user_metadata?.role as 'admin' | 'user') || 'user';
    let profileDisplayName: string | undefined;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (profile?.display_name) {
        profileDisplayName = profile.display_name;
      }

      if (profile?.role) {
        role = profile.role as 'admin' | 'user';
      } else {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (count === null || count <= 1) {
          role = 'admin';
        }
      }
    } catch {
      // fallback
    }

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      displayName:
        profileDisplayName ||
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.display_name ||
        sbUser.email?.split('@')[0] ||
        'Pengguna NUTRACK',
      role,
    };
  }, []);

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
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const mapped = await fetchAndMapUser(session.user);
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
        async (_event, session) => {
          setSession(session);
          if (session?.user) {
            const mapped = await fetchAndMapUser(session.user);
            setUser(mapped);
            setStorageUserId(mapped.id);
            hydrateFromSupabase(mapped.id).catch(() => {});
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
  }, [configured, fetchAndMapUser]);

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
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
        return { error: null };
      } else {
        // Mock login
        const demoUser: AuthUser = {
          id: `local-user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: email.split('@')[0],
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
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

  // Sign Up (admin or self)
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
          return { error: null, message: 'Akun berhasil dibuat!' };
        } else {
          return {
            error: null,
            message: 'Silakan periksa email untuk konfirmasi pendaftaran akun.',
          };
        }
      } else {
        const demoUser: AuthUser = {
          id: `local-user-${Date.now()}`,
          email,
          displayName: fullName || email.split('@')[0],
          role: 'user',
        };
        setUser(demoUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        }
        return { error: null, message: 'Akun lokal berhasil dibuat!' };
      }
    },
    [configured]
  );

  // Update Password (by user)
  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ error: string | null }> => {
      if (configured) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          return { error: error.message };
        }
        return { error: null };
      } else {
        return { error: null };
      }
    },
    [configured]
  );

  // Reset Password via Email
  const resetPassword = useCallback(
    async (email: string): Promise<{ error: string | null; message?: string }> => {
      if (configured) {
        const redirectUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) {
          return { error: error.message };
        }
        return {
          error: null,
          message: `Tautan reset kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk/spam email Anda.`,
        };
      } else {
        return {
          error: null,
          message: `(Mode Lokal) Instruksi reset telah disimulasikan ke ${email}.`,
        };
      }
    },
    [configured]
  );

  // Admin Create User API call
  const createAdminUser = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: 'admin' | 'user' = 'user'
    ): Promise<{ error: string | null; message?: string }> => {
      if (configured && session?.access_token) {
        try {
          const res = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email, password, fullName, role }),
          });

          const data = await res.json();
          if (!res.ok) {
            return { error: data.error || 'Gagal membuat akun pengguna.' };
          }
          return { error: null, message: data.message };
        } catch (e: unknown) {
          const err = e as Error;
          return { error: err.message || 'Terjadi kesalahan jaringan.' };
        }
      } else {
        // Fallback for unconfigured
        return {
          error: null,
          message: `Akun untuk ${email} berhasil disimulasikan secara lokal!`,
        };
      }
    },
    [configured, session]
  );

  // Sign Out
  const signOut = useCallback(async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setStorageUserId('local');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem('nutrack:current_user_id');
    }
  }, [configured]);

  // Quick Demo Login
  const loginAsDemoUser = useCallback((name = 'Admin Demo', role: 'admin' | 'user' = 'admin') => {
    const demoUser: AuthUser = {
      id: 'demo-user-nutrack-admin',
      email: 'admin@nutrack.app',
      displayName: name,
      role,
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
        updatePassword,
        resetPassword,
        createAdminUser,
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
