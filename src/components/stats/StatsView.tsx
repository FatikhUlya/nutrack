'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  getDailyNutritionForRange,
  getDailyNutritionForRangeFromSupabase,
  getWeightLog,
  getWeightLogFromSupabase,
} from '@/lib/database/storage';
import { formatShortDate, formatNumber, today, toDateString } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { NutritionTarget, WeightEntry } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import {
  Flame,
  Calendar,
  Award,
  Target,
  ChevronLeft,
  ChevronRight,
  Scale,
} from 'lucide-react';

interface StatsViewProps {
  activeTarget: NutritionTarget | null;
  onSelectDate?: (date: string) => void;
}

type StatScope = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

interface DailySummary {
  date: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
  hasData?: boolean;
}

// Helper: format a month index (0-11) + year to YYYY-MM-01
function monthToDateStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

interface ChartRow {
  date: string;
  rawDate: string;
  kalori: number;
  target: number;
  protein: number;
  karbo: number;
  lemak: number;
  hasData?: boolean;
  monthIndex?: number;
  year?: number;
}


// Helper: format a week start date + offset
function weekStart(baseDate: Date, offsetWeeks: number): Date {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetWeeks * 7);
  return d;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_NAMES_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function StatsView({ activeTarget, onSelectDate }: StatsViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [scope, setScope] = useState<StatScope>('mingguan');
  const [activeTab, setActiveTab] = useState<'nutrisi' | 'berat'>('nutrisi');
  const [dateList, setDateList] = useState<DailySummary[]>([]);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  // Offset: 0 = current, -1 = previous, +1 = next (capped at 0)
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);



  const targetCalories = activeTarget?.calorieTargetKcal ?? 2000;
  const targetProtein = activeTarget?.proteinTargetG ?? 140;
  const targetCarbs = activeTarget?.carbsTargetG ?? 220;
  const targetFat = activeTarget?.fatTargetG ?? 65;

  // Compute date range based on scope + offset
  const { startDateStr, endDateStr, scopeLabel, periodLabel, canGoNext } = useMemo(() => {
    const now = new Date();

    if (scope === 'harian') {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      const dateStr = toDateString(d);
      const isToday = offset === 0;
      const label = isToday
        ? 'Hari Ini'
        : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
      return {
        startDateStr: dateStr,
        endDateStr: dateStr,
        scopeLabel: 'Harian',
        periodLabel: label,
        canGoNext: offset < 0,
      };
    }

    if (scope === 'mingguan') {
      // Find Monday of "current" week, offset by N weeks
      const mon = new Date(now);
      const day = mon.getDay(); // 0=Sun, 1=Mon...
      mon.setDate(mon.getDate() - ((day + 6) % 7)); // go to Monday
      mon.setDate(mon.getDate() + offset * 7);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const isThisWeek = offset === 0;
      return {
        startDateStr: toDateString(mon),
        endDateStr: toDateString(sun),
        scopeLabel: 'Mingguan',
        periodLabel: isThisWeek ? `Minggu Ini (${fmt(mon)} – ${fmt(sun)})` : `${fmt(mon)} – ${fmt(sun)}`,
        canGoNext: offset < 0,
      };
    }

    if (scope === 'bulanan') {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return {
        startDateStr: toDateString(d),
        endDateStr: toDateString(lastDay),
        scopeLabel: 'Bulanan',
        periodLabel: label,
        canGoNext: offset < 0,
      };
    }

    // Tahunan
    const year = now.getFullYear() + offset;
    return {
      startDateStr: `${year}-01-01`,
      endDateStr: `${year}-12-31`,
      scopeLabel: 'Tahunan',
      periodLabel: `Tahun ${year}`,
      canGoNext: offset < 0,
    };
  }, [scope, offset]);

  // Load nutrition data
  const loadNutritionData = useCallback(() => {
    if (!isMounted) return;
    setDateList(getDailyNutritionForRange(startDateStr, endDateStr));
    if (user?.id) {
      getDailyNutritionForRangeFromSupabase(user.id, startDateStr, endDateStr).then((cloudData) => {
        if (cloudData) setDateList(cloudData);
      });
    }
  }, [isMounted, user?.id, startDateStr, endDateStr]);

  useEffect(() => {
    loadNutritionData();
  }, [loadNutritionData]);

  // Load weight log
  useEffect(() => {
    if (!isMounted) return;
    setWeightLog(getWeightLog());
    if (user?.id) {
      getWeightLogFromSupabase(user.id).then((data) => {
        if (data.length > 0) setWeightLog(data);
      });
    }
  }, [isMounted, user?.id]);

  // Aggregate stats
  const trackedDays = dateList.filter((d) => d.entryCount > 0);
  const totalDays = dateList.length;
  const trackedCount = trackedDays.length;

  const avgCalories =
    trackedCount > 0
      ? Math.round(trackedDays.reduce((s, d) => s + d.caloriesKcal, 0) / trackedCount)
      : 0;

  const avgProtein =
    trackedCount > 0
      ? Math.round(trackedDays.reduce((s, d) => s + d.proteinG, 0) / trackedCount)
      : 0;

  const avgCarbs =
    trackedCount > 0
      ? Math.round(trackedDays.reduce((s, d) => s + d.carbsG, 0) / trackedCount)
      : 0;

  const avgFat =
    trackedCount > 0
      ? Math.round(trackedDays.reduce((s, d) => s + d.fatG, 0) / trackedCount)
      : 0;

  const daysOnTarget = trackedDays.filter((d) => {
    const ratio = d.caloriesKcal / targetCalories;
    return ratio >= 0.9 && ratio <= 1.1;
  }).length;

  const adherenceRate =
    trackedCount > 0 ? Math.round((daysOnTarget / trackedCount) * 100) : 0;

  const todayData = dateList[dateList.length - 1] || {
    caloriesKcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    entryCount: 0,
  };

  const calAchievement = Math.min(150, Math.round((todayData.caloriesKcal / targetCalories) * 100));
  const proteinAchievement = Math.min(150, Math.round((todayData.proteinG / targetProtein) * 100));
  const carbsAchievement = Math.min(150, Math.round((todayData.carbsG / targetCarbs) * 100));
  const fatAchievement = Math.min(150, Math.round((todayData.fatG / targetFat) * 100));

  // Chart data - for yearly, group by month from real data
  const chartData = useMemo((): ChartRow[] => {
    if (scope === 'tahunan') {
      const year = parseInt(startDateStr.slice(0, 4));
      return MONTH_NAMES_SHORT.map((m, idx) => {
        const monthStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
        const monthEntries = dateList.filter((d) => d.date.startsWith(monthStr));
        const tracked = monthEntries.filter((d) => d.entryCount > 0);
        const avgKcal = tracked.length > 0
          ? Math.round(tracked.reduce((s, d) => s + d.caloriesKcal, 0) / tracked.length)
          : 0;
        return {
          date: m,
          rawDate: `${monthStr}-01`,
          monthIndex: idx,
          year,
          kalori: avgKcal,
          target: targetCalories,
          protein: tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + d.proteinG, 0) / tracked.length) : 0,
          karbo: tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + d.carbsG, 0) / tracked.length) : 0,
          lemak: tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + d.fatG, 0) / tracked.length) : 0,
          hasData: tracked.length > 0,
        };
      });
    }

    return dateList.map((d) => ({
      date: formatShortDate(d.date),
      rawDate: d.date,
      kalori: d.caloriesKcal,
      target: targetCalories,
      protein: d.proteinG,
      karbo: d.carbsG,
      lemak: d.fatG,
      hasData: d.hasData,
    }));
  }, [dateList, scope, targetCalories, startDateStr]);


  // Weight chart data filtered to visible range
  const weightChartData = useMemo(() => {
    return weightLog
      .filter((w) => w.date >= startDateStr && w.date <= endDateStr)
      .map((w) => ({
        date: formatShortDate(w.date),
        rawDate: w.date,
        berat: w.weightKg,
      }));
  }, [weightLog, startDateStr, endDateStr]);

  // Handler: yearly bar click → drill into that month
  const handleYearBarClick = (data: any) => {
    if (scope === 'tahunan' && data && data.activePayload?.length > 0) {
      const payload = data.activePayload[0].payload;
      if (payload.monthIndex !== undefined) {
        const monthOffset = (payload.year - new Date().getFullYear()) * 12 + payload.monthIndex - new Date().getMonth();
        setScope('bulanan');
        setOffset(monthOffset);
      }
    }
  };

  // Handler: monthly/weekly bar click → drill into that day
  const handleBarClick = (data: any) => {
    if ((scope === 'bulanan' || scope === 'mingguan') && data && data.activePayload?.length > 0) {
      const rawDate = data.activePayload[0].payload.rawDate;
      if (rawDate) {
        setScope('harian');
        const d1 = new Date(rawDate + 'T00:00:00');
        const d2 = new Date(today() + 'T00:00:00');
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        setOffset(diffDays);
        if (onSelectDate) onSelectDate(rawDate);
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 font-sans text-[#F4F5F6] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#202326] p-5 rounded-3xl border border-[#2D3134]">
          <div className="space-y-2">
            <div className="h-6 w-52 bg-[#292D30] rounded-xl" />
            <div className="h-3 w-40 bg-[#292D30] rounded-lg" />
          </div>
          <div className="h-10 w-64 bg-[#292D30] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#202326] rounded-3xl border border-[#2D3134]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#202326] rounded-3xl border border-[#2D3134]" />
          <div className="h-80 bg-[#202326] rounded-3xl border border-[#2D3134]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-[#F4F5F6]">
      {/* ================================================ */}
      {/* TOP HEADER: Tab Nutrisi/Berat + Scope + Nav     */}
      {/* ================================================ */}
      <div className="bg-[#202326] p-5 rounded-3xl border border-[#2D3134] shadow-card space-y-4">
        {/* Row 1: Title + Tab switcher (Nutrisi / Berat Badan) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#F4F5F6] tracking-tight">
              Statistik Ketercapaian Nutrisi
            </h2>
            <p className="text-xs text-[#A7ADB3] mt-0.5">
              {periodLabel} · Analisis visual konsistensi dan capaian target
            </p>
          </div>

          {/* Tab: Nutrisi / Berat Badan */}
          <div className="flex items-center p-1 bg-[#17191B] border border-[#2D3134] rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('nutrisi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'nutrisi'
                  ? 'bg-[#D6FF3F] text-[#17191B] font-black'
                  : 'text-[#A7ADB3] hover:text-[#F4F5F6]'
              }`}
            >
              Nutrisi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('berat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'berat'
                  ? 'bg-[#65D99A] text-[#17191B] font-black'
                  : 'text-[#A7ADB3] hover:text-[#F4F5F6]'
              }`}
            >
              <Scale className="h-3 w-3" />
              Berat Badan
            </button>
          </div>
        </div>

        {/* Row 2: Scope tabs + Period Navigator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Scope selector */}
          <div className="flex items-center p-1 bg-[#17191B] border border-[#2D3134] rounded-2xl">
            {(
              [
                { id: 'harian', label: 'Harian' },
                { id: 'mingguan', label: 'Mingguan' },
                { id: 'bulanan', label: 'Bulanan' },
                { id: 'tahunan', label: 'Tahunan' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setScope(t.id);
                  setOffset(0);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  scope === t.id
                    ? 'bg-[#D6FF3F] text-[#17191B] shadow-neon-glow font-black'
                    : 'text-[#A7ADB3] hover:text-[#F4F5F6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Period navigation arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOffset((o) => o - 1)}
              className="h-8 w-8 rounded-full bg-[#17191B] border border-[#2D3134] flex items-center justify-center text-[#A7ADB3] hover:text-[#F4F5F6] hover:border-[#D6FF3F] transition-all"
              title="Periode sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-[#F4F5F6] min-w-[120px] text-center">
              {periodLabel}
            </span>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(o + 1, 0))}
              disabled={!canGoNext}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                canGoNext
                  ? 'bg-[#17191B] border-[#2D3134] text-[#A7ADB3] hover:text-[#F4F5F6] hover:border-[#D6FF3F]'
                  : 'bg-[#17191B]/50 border-[#2D3134]/50 text-[#383D41] cursor-not-allowed'
              }`}
              title="Periode berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================ */}
      {/* TAB: BERAT BADAN                                */}
      {/* ================================================ */}
      {activeTab === 'berat' && (
        <div className="space-y-5">
          {/* Weight stats */}
          {weightLog.length > 0 && (() => {
            const inRange = weightLog.filter((w) => w.date >= startDateStr && w.date <= endDateStr);
            const latest = weightLog[weightLog.length - 1];
            const earliest = inRange[0];
            const latestInRange = inRange[inRange.length - 1];
            const change = earliest && latestInRange ? latestInRange.weightKg - earliest.weightKg : null;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                  <div className="text-xs font-bold text-[#747C83] uppercase tracking-wider mb-2">Terkini</div>
                  <div className="text-2xl font-black text-[#65D99A]">{latest.weightKg.toFixed(1)} kg</div>
                  <p className="text-[11px] text-[#A7ADB3] mt-1">{formatShortDate(latest.date)}</p>
                </div>
                {inRange.length >= 2 && (
                  <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                    <div className="text-xs font-bold text-[#747C83] uppercase tracking-wider mb-2">Perubahan</div>
                    <div className={`text-2xl font-black ${change !== null && change < 0 ? 'text-[#65D99A]' : 'text-[#FF6B73]'}`}>
                      {change !== null ? `${change > 0 ? '+' : ''}${change.toFixed(1)} kg` : '—'}
                    </div>
                    <p className="text-[11px] text-[#A7ADB3] mt-1">dalam periode ini</p>
                  </div>
                )}
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                  <div className="text-xs font-bold text-[#747C83] uppercase tracking-wider mb-2">Total Catatan</div>
                  <div className="text-2xl font-black text-[#F4F5F6]">{weightLog.length}</div>
                  <p className="text-[11px] text-[#A7ADB3] mt-1">entri berat badan</p>
                </div>
              </div>
            );
          })()}

          {/* Weight chart */}
          <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card space-y-4">
            <div>
              <h3 className="text-base font-black text-[#F4F5F6]">Tren Berat Badan ({periodLabel})</h3>
              <p className="text-xs text-[#A7ADB3]">Catat berat badan harian melalui menu Log untuk melacak perkembangan Anda</p>
            </div>

            {weightChartData.length < 2 ? (
              <div className="h-60 flex flex-col items-center justify-center gap-3 text-[#747C83]">
                <Scale className="h-10 w-10 opacity-30" />
                <p className="text-sm font-semibold text-center">
                  Belum ada data berat badan di periode ini.<br />
                  <span className="text-xs">Catat berat Anda melalui tombol Log → Berat Badan</span>
                </p>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3134" />
                    <XAxis dataKey="date" stroke="#747C83" fontSize={11} />
                    <YAxis
                      stroke="#747C83"
                      fontSize={11}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(v) => `${v}kg`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2124',
                        borderColor: '#383D41',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        fontSize: '12px',
                        color: '#F4F5F6',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: any) => [`${val} kg`, 'Berat Badan']}
                    />
                    <Line
                      type="monotone"
                      dataKey="berat"
                      stroke="#65D99A"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: '#65D99A', strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: '#D6FF3F' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Weight log table */}
          {weightLog.length > 0 && (
            <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card">
              <h3 className="text-base font-black text-[#F4F5F6] mb-3">Riwayat Berat Badan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#2D3134] text-[#747C83] uppercase tracking-wider font-extrabold">
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Berat</th>
                      <th className="py-3 px-3">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3134]">
                    {[...weightLog].reverse().slice(0, 20).map((w, i, arr) => {
                      const prev = arr[i + 1];
                      const delta = prev ? w.weightKg - prev.weightKg : null;
                      return (
                        <tr key={w.id} className="hover:bg-[#292D30] transition-colors">
                          <td className="py-3 px-3 font-bold text-[#F4F5F6]">
                            {new Date(w.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 font-black text-[#65D99A]">{w.weightKg.toFixed(1)} kg</td>
                          <td className="py-3 px-3">
                            {delta !== null ? (
                              <span className={`font-bold ${delta < 0 ? 'text-[#65D99A]' : delta > 0 ? 'text-[#FF6B73]' : 'text-[#747C83]'}`}>
                                {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                              </span>
                            ) : <span className="text-[#383D41]">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================ */}
      {/* TAB: NUTRISI                                     */}
      {/* ================================================ */}
      {activeTab === 'nutrisi' && (
        <>
          {/* HARIAN: DETAIL KETERCAPAIAN */}
          {scope === 'harian' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Kalori Score */}
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Kalori Harian</span>
                    <div className="h-8 w-8 rounded-full bg-[#D6FF3F]/15 flex items-center justify-center text-[#D6FF3F]">
                      <Flame className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black text-[#F4F5F6]">
                      {todayData.caloriesKcal} <span className="text-xs font-semibold text-[#747C83]">/ {targetCalories} kcal</span>
                    </div>
                    <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                      <div
                        className="h-full bg-[#D6FF3F] rounded-full transition-all duration-700 shadow-neon-glow"
                        style={{ width: `${Math.min(100, calAchievement)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#D6FF3F]">{calAchievement}% tercapai</span>
                </div>

                {/* Protein Score */}
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Protein</span>
                    <div className="h-8 w-8 rounded-full bg-[#77B7FF]/15 flex items-center justify-center text-[#77B7FF]">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black text-[#77B7FF]">
                      {todayData.proteinG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetProtein}g</span>
                    </div>
                    <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                      <div className="h-full bg-[#77B7FF] rounded-full transition-all duration-700" style={{ width: `${Math.min(100, proteinAchievement)}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#77B7FF]">{proteinAchievement}% tercapai</span>
                </div>

                {/* Karbohidrat Score */}
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Karbohidrat</span>
                    <div className="h-8 w-8 rounded-full bg-[#67E8F9]/15 flex items-center justify-center text-[#67E8F9]">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black text-[#67E8F9]">
                      {todayData.carbsG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetCarbs}g</span>
                    </div>
                    <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                      <div className="h-full bg-[#67E8F9] rounded-full transition-all duration-700" style={{ width: `${Math.min(100, carbsAchievement)}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#67E8F9]">{carbsAchievement}% tercapai</span>
                </div>

                {/* Lemak Score */}
                <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Lemak</span>
                    <div className="h-8 w-8 rounded-full bg-[#C4B5FD]/15 flex items-center justify-center text-[#C4B5FD]">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black text-[#C4B5FD]">
                      {todayData.fatG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetFat}g</span>
                    </div>
                    <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                      <div className="h-full bg-[#C4B5FD] rounded-full transition-all duration-700" style={{ width: `${Math.min(100, fatAchievement)}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#C4B5FD]">{fatAchievement}% tercapai</span>
                </div>
              </div>
            </div>
          )}

          {/* KPI CARDS (Mingguan, Bulanan, Tahunan) */}
          {scope !== 'harian' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Rata-rata Kalori</span>
                  <Flame className="h-4 w-4 text-[#D6FF3F]" />
                </div>
                <div className="mt-2 text-2xl font-black text-[#F4F5F6]">
                  {formatNumber(avgCalories)}{' '}
                  <span className="text-xs font-normal text-[#747C83]">kcal/hari</span>
                </div>
                <p className="mt-1 text-[11px] text-[#A7ADB3]">Target: {formatNumber(Math.round(targetCalories))} kcal</p>
              </div>

              <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Tingkat Kepatuhan</span>
                  <Award className="h-4 w-4 text-[#65D99A]" />
                </div>
                <div className="mt-2 text-2xl font-black text-[#65D99A]">{adherenceRate}%</div>
                <p className="mt-1 text-[11px] text-[#A7ADB3]">{daysOnTarget} dari {trackedCount} hari dalam target</p>
              </div>

              <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Rata-rata Protein</span>
                  <div className="h-2 w-2 rounded-full bg-[#77B7FF]" />
                </div>
                <div className="mt-2 text-2xl font-black text-[#77B7FF]">
                  {avgProtein} <span className="text-xs font-normal text-[#747C83]">g/hari</span>
                </div>
                <p className="mt-1 text-[11px] text-[#A7ADB3]">Target: {Math.round(targetProtein)} g/hari</p>
              </div>

              <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">Hari Aktif</span>
                  <Calendar className="h-4 w-4 text-[#D6FF3F]" />
                </div>
                <div className="mt-2 text-2xl font-black text-[#F4F5F6]">
                  {trackedCount}{' '}
                  <span className="text-xs font-normal text-[#747C83]">
                    / {scope === 'tahunan' ? '12 bulan' : `${totalDays} hari`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#A7ADB3]">Konsistensi pencatatan buku harian</p>
              </div>
            </div>
          )}

          {/* PRIMARY CHART: ASUPAN KALORI VS TARGET */}
          <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card space-y-4">
            <div>
              <h3 className="text-base font-black text-[#F4F5F6]">
                Tren Asupan Kalori vs Target ({periodLabel})
              </h3>
              <p className="text-xs text-[#A7ADB3]">
                {scope === 'tahunan'
                  ? 'Klik batang bulan untuk melihat detail statistik bulan tersebut'
                  : scope === 'bulanan'
                  ? 'Klik batang hari untuk melihat detail harian'
                  : 'Garis putus-putus menunjukkan target kalori Anda'}{' '}
                ({formatNumber(Math.round(targetCalories))} kcal)
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={scope === 'tahunan' ? handleYearBarClick : handleBarClick}
                  style={{ cursor: scope !== 'harian' && scope !== 'mingguan' ? 'pointer' : 'default' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3134" />
                  <XAxis dataKey="date" stroke="#747C83" fontSize={11} />
                  <YAxis stroke="#747C83" fontSize={11} domain={[0, 'dataMax + 400']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E2124',
                      borderColor: '#383D41',
                      borderRadius: '16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                      color: '#F4F5F6',
                      fontWeight: 'bold',
                    }}
                    formatter={(val: any) => [`${formatNumber(val)} kcal`, 'Kalori']}
                  />
                  <ReferenceLine
                    y={targetCalories}
                    stroke="#FFBF69"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{ value: 'Target', fill: '#FFBF69', fontSize: 10, position: 'right' }}
                  />
                  <Bar dataKey="kalori" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.kalori === 0
                            ? '#2D3134'
                            : entry.kalori > targetCalories * 1.1
                            ? '#FF6B73'
                            : entry.kalori >= targetCalories * 0.9
                            ? '#65D99A'
                            : '#D6FF3F'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend for yearly drill-down hint */}
            {scope === 'tahunan' && (
              <div className="flex items-center gap-4 text-[10px] text-[#747C83] pt-1 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#65D99A]" /> Dalam target</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#D6FF3F]" /> Di bawah target</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF6B73]" /> Melebihi target</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#2D3134]" /> Tidak ada data</span>
                <span className="ml-auto text-[#D6FF3F] font-bold">💡 Klik bulan untuk drill-down</span>
              </div>
            )}
            {scope === 'bulanan' && (
              <p className="text-[10px] text-[#D6FF3F] font-bold">
                💡 Klik batang tanggal untuk melihat detail harian
              </p>
            )}
          </div>

          {/* SECONDARY CHART: DISTRIBUSI MAKRONUTRIEN */}
          <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card space-y-4">
            <div>
              <h3 className="text-base font-black text-[#F4F5F6]">Distribusi Makronutrien ({periodLabel})</h3>
              <p className="text-xs text-[#A7ADB3]">Komposisi Protein, Karbohidrat, dan Lemak Sehat dalam satuan gram</p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3134" />
                  <XAxis dataKey="date" stroke="#747C83" fontSize={11} />
                  <YAxis stroke="#747C83" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E2124',
                      borderColor: '#383D41',
                      borderRadius: '16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                      color: '#F4F5F6',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="protein" name="Protein (g)" stackId="1" stroke="#77B7FF" fill="#77B7FF" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="karbo" name="Karbohidrat (g)" stackId="1" stroke="#67E8F9" fill="#67E8F9" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="lemak" name="Lemak (g)" stackId="1" stroke="#C4B5FD" fill="#C4B5FD" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card">
            <h3 className="text-base font-black text-[#F4F5F6] mb-3">Tabel Ringkasan Data &amp; Ketercapaian</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#2D3134] text-[#747C83] uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-3">Periode / Tanggal</th>
                    <th className="py-3 px-3">Kalori</th>
                    <th className="py-3 px-3">Protein</th>
                    <th className="py-3 px-3">Karbo</th>
                    <th className="py-3 px-3">Lemak</th>
                    <th className="py-3 px-3">Status Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3134]">
                  {chartData.map((row) => {
                    const isHit = row.kalori >= targetCalories * 0.9 && row.kalori <= targetCalories * 1.1;
                    const isOver = row.kalori > targetCalories * 1.1;
                    const isEmpty = row.kalori === 0;

                    return (
                      <tr
                        key={row.date}
                        onClick={() => {
                          if (scope === 'tahunan' && row.monthIndex !== undefined) {
                            const monthOffset = ((row.year ?? new Date().getFullYear()) - new Date().getFullYear()) * 12 + (row.monthIndex ?? 0) - new Date().getMonth();
                            setScope('bulanan');
                            setOffset(monthOffset);
                          } else if ((scope === 'bulanan' || scope === 'mingguan') && row.rawDate) {
                            setScope('harian');
                            const d1 = new Date(row.rawDate + 'T00:00:00');
                            const d2 = new Date(today() + 'T00:00:00');
                            const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
                            setOffset(diffDays);
                            if (onSelectDate) onSelectDate(row.rawDate);
                          } else if (row.rawDate && onSelectDate) {
                            onSelectDate(row.rawDate);
                          }
                        }}
                        className="hover:bg-[#292D30] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-[#F4F5F6]">{row.date}</td>
                        <td className="py-3 px-3 font-black text-[#D6FF3F]">{isEmpty ? '—' : `${formatNumber(row.kalori)} kcal`}</td>
                        <td className="py-3 px-3 font-semibold text-[#77B7FF]">{isEmpty ? '—' : `${row.protein}g`}</td>
                        <td className="py-3 px-3 font-semibold text-[#67E8F9]">{isEmpty ? '—' : `${row.karbo}g`}</td>
                        <td className="py-3 px-3 font-semibold text-[#C4B5FD]">{isEmpty ? '—' : `${row.lemak}g`}</td>
                        <td className="py-3 px-3">
                          {isEmpty ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2D3134]/50 text-[#747C83]">
                              Tidak Ada Data
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isHit
                                  ? 'bg-[#65D99A]/15 text-[#65D99A]'
                                  : isOver
                                  ? 'bg-[#FF6B73]/15 text-[#FF6B73]'
                                  : 'bg-[#D6FF3F]/15 text-[#D6FF3F]'
                              }`}
                            >
                              {isHit ? 'Tepat Target' : isOver ? 'Melebihi' : 'Kurang'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
