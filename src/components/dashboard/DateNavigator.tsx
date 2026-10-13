'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { User, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, parseISO, format, isToday, startOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

interface DateNavigatorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onOpenSettings?: () => void;
}

export function DateNavigator({
  currentDate,
  onDateChange,
}: DateNavigatorProps) {
  // Generate 7-day strip for the current week based on selected date
  const weekDays = useMemo(() => {
    try {
      const parsed = parseISO(currentDate);
      const weekStart = startOfWeek(parsed, { weekStartsOn: 1 }); // Monday

      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return {
          dateStr: format(d, 'yyyy-MM-dd'),
          dayInitial: format(d, 'EEEEE', { locale: id }).toUpperCase(),
          dayNum: format(d, 'd'),
          isCurrentDay: isToday(d),
        };
      });
    } catch {
      return [];
    }
  }, [currentDate]);

  const handlePrevWeek = () => {
    try {
      const parsed = parseISO(currentDate);
      onDateChange(format(subDays(parsed, 7), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  const handleNextWeek = () => {
    try {
      const parsed = parseISO(currentDate);
      onDateChange(format(addDays(parsed, 7), 'yyyy-MM-dd'));
    } catch {
      // fallback
    }
  };

  return (
    <div className="select-none space-y-3">
      {/* Top Header: Avatar | Home Title | Settings Menu */}
      <div className="flex items-center justify-between px-1">
        {/* Profile Avatar */}
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202326] border border-[#2D3134] text-[#F4F5F6] hover:bg-[#292D30] active:scale-95 transition-all shadow-card"
          aria-label="Profil Pengguna"
        >
          <User className="h-5 w-5 text-[#A7ADB3]" />
        </Link>

        {/* Center Title - Crisp white text */}
        <h1 className="text-xl font-extrabold text-[#F4F5F6] tracking-tight">
          Home
        </h1>

        {/* More Actions / Settings */}
        <Link
          href="/stats"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#202326] text-[#A7ADB3] active:scale-95 transition-all"
          aria-label="Menu"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Link>
      </div>

      {/* Week Strip Row: Days (Dark Surface Card) */}
      <div className="flex items-center justify-between bg-[#202326] rounded-2xl px-2 py-2.5 border border-[#2D3134] shadow-card">
        <button
          type="button"
          onClick={handlePrevWeek}
          className="p-1.5 text-[#747C83] hover:text-[#F4F5F6] transition-all rounded-lg hover:bg-[#292D30]"
          aria-label="Minggu Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 flex items-center justify-around">
          {weekDays.map((item) => {
            const isSelected = item.dateStr === currentDate;

            return (
              <button
                type="button"
                key={item.dateStr}
                onClick={() => onDateChange(item.dateStr)}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#D6FF3F]/15 font-black text-[#D6FF3F]'
                    : 'text-[#A7ADB3] hover:bg-[#292D30] hover:text-[#F4F5F6]'
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase transition-colors ${
                    isSelected ? 'text-[#D6FF3F]' : 'text-[#747C83]'
                  }`}
                >
                  {item.dayInitial}
                </span>
                <span
                  className={`text-sm mt-0.5 transition-colors ${
                    isSelected ? 'font-black text-[#D6FF3F]' : 'font-bold text-[#F4F5F6]'
                  }`}
                >
                  {item.dayNum}
                </span>

                {/* Neon Lime Dot Indicator for selected day */}
                <div className="h-1.5 w-1.5 mt-1 flex items-center justify-center">
                  {isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] shadow-neon-glow" />
                  ) : item.isCurrentDay ? (
                    <span className="h-1 w-1 rounded-full bg-[#65D99A]" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNextWeek}
          className="p-1.5 text-[#747C83] hover:text-[#F4F5F6] transition-all rounded-lg hover:bg-[#292D30]"
          aria-label="Minggu Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
