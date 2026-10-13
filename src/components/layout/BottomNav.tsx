'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  UtensilsCrossed,
  Plus,
  Flame,
  Scan,
} from 'lucide-react';

interface BottomNavProps {
  onOpenLogModal: () => void;
  onOpenScanner: () => void;
  onOpenMealSelection: () => void;
}

export function BottomNav({
  onOpenLogModal,
  onOpenScanner,
  onOpenMealSelection,
}: BottomNavProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isStats = pathname === '/stats';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Curved Dark Bottom Navigation Bar with neon elevated shadow */}
      <div className="bg-[#17191B]/95 backdrop-blur-xl border-t border-[#2D3134] shadow-elevated rounded-t-3xl">
        <div className="flex h-16 items-center justify-around px-4 pb-safe">
          {/* 1. Diary / Home */}
          <Link
            href="/"
            className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
              isHome ? 'text-[#D6FF3F]' : 'text-[#747C83] hover:text-[#F4F5F6]'
            }`}
            aria-label="Home Diary"
          >
            <ClipboardList className="h-5 w-5" strokeWidth={isHome ? 2.5 : 2} />
            {isHome && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] shadow-neon-glow mt-0.5" />
            )}
          </Link>

          {/* 2. Meals / Food Database */}
          <button
            type="button"
            onClick={onOpenMealSelection}
            className="flex flex-col items-center justify-center p-2 rounded-2xl text-[#747C83] hover:text-[#D6FF3F] transition-all"
            aria-label="Pilih Makanan"
          >
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* 3. Center Floating FAB "+" in Electric Neon Lime */}
          <div className="relative -mt-6">
            <button
              type="button"
              onClick={onOpenLogModal}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6FF3F] text-[#17191B] shadow-neon-glow-lg active:scale-90 hover:scale-105 transition-all font-black"
              aria-label="Log Makanan / Air / Berat"
            >
              <Plus className="h-7 w-7 stroke-[3] text-[#17191B]" />
            </button>
          </div>

          {/* 4. Stats / Burned */}
          <Link
            href="/stats"
            className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
              isStats ? 'text-[#D6FF3F]' : 'text-[#747C83] hover:text-[#F4F5F6]'
            }`}
            aria-label="Statistik"
          >
            <Flame className="h-5 w-5" strokeWidth={isStats ? 2.5 : 2} />
            {isStats && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] shadow-neon-glow mt-0.5" />
            )}
          </Link>

          {/* 5. AI Scanner */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center p-2 rounded-2xl text-[#747C83] hover:text-[#D6FF3F] transition-all"
            aria-label="Buka AI Scanner"
          >
            <Scan className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </nav>
  );
}
