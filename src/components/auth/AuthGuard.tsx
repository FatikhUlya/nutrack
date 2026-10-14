'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Activity } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      router.replace(hash ? `/login${hash}` : '/login');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121416] flex flex-col items-center justify-center text-[#F4F5F6]">
        <div className="relative flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-[#D6FF3F] text-[#17191B] flex items-center justify-center shadow-[0_0_30px_rgba(214,255,63,0.4)] animate-pulse">
            <Activity className="h-8 w-8 stroke-[2.8]" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#D6FF3F] animate-pulse">
          Memuat NUTRACK...
        </p>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
