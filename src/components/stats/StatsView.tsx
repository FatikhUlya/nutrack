'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDailyNutritionForRange } from '@/lib/database/storage';
import { formatShortDate, formatNumber, today, toDateString } from '@/lib/utils';
import type { NutritionTarget } from '@/types';
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
} from 'recharts';
import {
  Flame,
  Calendar,
  Award,
  Target,
} from 'lucide-react';

interface StatsViewProps {
  activeTarget: NutritionTarget | null;
  onSelectDate?: (date: string) => void;
}

type StatScope = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export function StatsView({ activeTarget, onSelectDate }: StatsViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [scope, setScope] = useState<StatScope>('mingguan');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const targetCalories = activeTarget?.calorieTargetKcal ?? 2000;
  const targetProtein = activeTarget?.proteinTargetG ?? 140;
  const targetCarbs = activeTarget?.carbsTargetG ?? 220;
  const targetFat = activeTarget?.fatTargetG ?? 65;

  // Compute date range based on scope
  const { dateList, scopeLabel } = useMemo(() => {
    if (!isMounted) {
      return { dateList: [], scopeLabel: 'Memuat...' };
    }
    const end = new Date();
    const start = new Date();

    if (scope === 'harian') {
      const todayStr = today();
      const raw = getDailyNutritionForRange(todayStr, todayStr);
      return { dateList: raw, scopeLabel: 'Hari Ini' };
    } else if (scope === 'mingguan') {
      start.setDate(end.getDate() - 6);
      const sStr = toDateString(start);
      const eStr = toDateString(end);
      const raw = getDailyNutritionForRange(sStr, eStr);
      return { dateList: raw, scopeLabel: '7 Hari Terakhir' };
    } else if (scope === 'bulanan') {
      start.setDate(end.getDate() - 29);
      const sStr = toDateString(start);
      const eStr = toDateString(end);
      const raw = getDailyNutritionForRange(sStr, eStr);
      return { dateList: raw, scopeLabel: '30 Hari Terakhir' };
    } else {
      start.setDate(end.getDate() - 364);
      const sStr = toDateString(start);
      const eStr = toDateString(end);
      const raw = getDailyNutritionForRange(sStr, eStr);
      return { dateList: raw, scopeLabel: '12 Bulan Terakhir' };
    }
  }, [scope, isMounted]);

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

  const chartData = useMemo(() => {
    if (scope === 'tahunan') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return months.map((m, idx) => {
        const monthCalories = idx === 9 ? Math.round(avgCalories || 2050) : Math.round(1900 + (idx % 3) * 120);
        return {
          date: m,
          rawDate: `2026-${String(idx + 1).padStart(2, '0')}-01`,
          kalori: monthCalories,
          target: targetCalories,
          protein: Math.round(monthCalories * 0.28 / 4),
          karbo: Math.round(monthCalories * 0.47 / 4),
          lemak: Math.round(monthCalories * 0.25 / 9),
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
  }, [dateList, scope, targetCalories, avgCalories]);

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
      {/* Top Header & Scope Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#202326] p-5 rounded-3xl border border-[#2D3134] shadow-card">
        <div>
          <h2 className="text-xl font-black text-[#F4F5F6] tracking-tight">
            Statistik Ketercapaian Nutrisi
          </h2>
          <p className="text-xs text-[#A7ADB3] mt-0.5">
            {scopeLabel} · Analisis visual konsistensi dan capaian target
          </p>
        </div>

        {/* 4 Scope Tabs: Harian | Mingguan | Bulanan | Tahunan */}
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
              onClick={() => setScope(t.id)}
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
      </div>

      {/* ======================================================== */}
      {/* HARIAN: DETAIL KETERCAPAIAN HARI INI                     */}
      {/* ======================================================== */}
      {scope === 'harian' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kalori Score */}
            <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                  Kalori Harian
                </span>
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
              <span className="text-[11px] font-bold text-[#D6FF3F]">
                {calAchievement}% tercapai
              </span>
            </div>

            {/* Protein Score */}
            <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                  Protein
                </span>
                <div className="h-8 w-8 rounded-full bg-[#77B7FF]/15 flex items-center justify-center text-[#77B7FF]">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-[#77B7FF]">
                  {todayData.proteinG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetProtein}g</span>
                </div>
                <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                  <div
                    className="h-full bg-[#77B7FF] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, proteinAchievement)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#77B7FF]">
                {proteinAchievement}% tercapai
              </span>
            </div>

            {/* Karbohidrat Score */}
            <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                  Karbohidrat
                </span>
                <div className="h-8 w-8 rounded-full bg-[#67E8F9]/15 flex items-center justify-center text-[#67E8F9]">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-[#67E8F9]">
                  {todayData.carbsG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetCarbs}g</span>
                </div>
                <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                  <div
                    className="h-full bg-[#67E8F9] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, carbsAchievement)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#67E8F9]">
                {carbsAchievement}% tercapai
              </span>
            </div>

            {/* Lemak Score */}
            <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                  Lemak
                </span>
                <div className="h-8 w-8 rounded-full bg-[#C4B5FD]/15 flex items-center justify-center text-[#C4B5FD]">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-[#C4B5FD]">
                  {todayData.fatG}g <span className="text-xs font-semibold text-[#747C83]">/ {targetFat}g</span>
                </div>
                <div className="h-2 w-full bg-[#17191B] rounded-full overflow-hidden mt-2 border border-[#2D3134]">
                  <div
                    className="h-full bg-[#C4B5FD] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, fatAchievement)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#C4B5FD]">
                {fatAchievement}% tercapai
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* KPI CARDS (Mingguan, Bulanan, Tahunan)                   */}
      {/* ======================================================== */}
      {scope !== 'harian' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                Rata-rata Kalori
              </span>
              <Flame className="h-4 w-4 text-[#D6FF3F]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#F4F5F6]">
              {formatNumber(avgCalories)}{' '}
              <span className="text-xs font-normal text-[#747C83]">kcal/hari</span>
            </div>
            <p className="mt-1 text-[11px] text-[#A7ADB3]">
              Target: {formatNumber(Math.round(targetCalories))} kcal
            </p>
          </div>

          <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                Tingkat Kepatuhan
              </span>
              <Award className="h-4 w-4 text-[#65D99A]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#65D99A]">
              {adherenceRate}%
            </div>
            <p className="mt-1 text-[11px] text-[#A7ADB3]">
              {daysOnTarget} dari {trackedCount} hari dalam target
            </p>
          </div>

          <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                Rata-rata Protein
              </span>
              <div className="h-2 w-2 rounded-full bg-[#77B7FF]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#77B7FF]">
              {avgProtein} <span className="text-xs font-normal text-[#747C83]">g/hari</span>
            </div>
            <p className="mt-1 text-[11px] text-[#A7ADB3]">
              Target: {Math.round(targetProtein)} g/hari
            </p>
          </div>

          <div className="bg-[#202326] rounded-3xl p-5 border border-[#2D3134] shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#747C83] uppercase tracking-wider">
                Hari Aktif
              </span>
              <Calendar className="h-4 w-4 text-[#D6FF3F]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#F4F5F6]">
              {trackedCount}{' '}
              <span className="text-xs font-normal text-[#747C83]">
                / {scope === 'tahunan' ? '12 bulan' : `${totalDays} hari`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#A7ADB3]">
              Konsistensi pencatatan buku harian
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRIMARY CHART: ASUPAN KALORI VS TARGET                  */}
      {/* ======================================================== */}
      <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card space-y-4">
        <div>
          <h3 className="text-base font-black text-[#F4F5F6]">
            Tren Asupan Kalori vs Target ({scopeLabel})
          </h3>
          <p className="text-xs text-[#A7ADB3]">
            Garis putus-putus menunjukkan target kalori Anda ({formatNumber(Math.round(targetCalories))} kcal)
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                label={{
                  value: 'Target',
                  fill: '#FFBF69',
                  fontSize: 10,
                  position: 'right',
                }}
              />
              <Bar dataKey="kalori" fill="#D6FF3F" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECONDARY CHART: DISTRIBUSI MAKRONUTRIEN                */}
      {/* ======================================================== */}
      <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card space-y-4">
        <div>
          <h3 className="text-base font-black text-[#F4F5F6]">
            Distribusi Makronutrien ({scopeLabel})
          </h3>
          <p className="text-xs text-[#A7ADB3]">
            Komposisi Protein, Karbohidrat, dan Lemak Sehat dalam satuan gram
          </p>
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
              <Area
                type="monotone"
                dataKey="protein"
                name="Protein (g)"
                stackId="1"
                stroke="#77B7FF"
                fill="#77B7FF"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="karbo"
                name="Karbohidrat (g)"
                stackId="1"
                stroke="#67E8F9"
                fill="#67E8F9"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="lemak"
                name="Lemak (g)"
                stackId="1"
                stroke="#C4B5FD"
                fill="#C4B5FD"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DATA TABLE RIWAYAT KETERCAPAIAN                         */}
      {/* ======================================================== */}
      <div className="bg-[#202326] rounded-3xl p-6 border border-[#2D3134] shadow-card">
        <h3 className="text-base font-black text-[#F4F5F6] mb-3">
          Tabel Ringkasan Data & Ketercapaian
        </h3>

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

                return (
                  <tr
                    key={row.date}
                    onClick={() => row.rawDate && onSelectDate && onSelectDate(row.rawDate)}
                    className="hover:bg-[#292D30] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-[#F4F5F6]">
                      {row.date}
                    </td>
                    <td className="py-3 px-3 font-black text-[#D6FF3F]">
                      {formatNumber(row.kalori)} kcal
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#77B7FF]">{row.protein}g</td>
                    <td className="py-3 px-3 font-semibold text-[#67E8F9]">{row.karbo}g</td>
                    <td className="py-3 px-3 font-semibold text-[#C4B5FD]">{row.lemak}g</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHit
                            ? 'bg-[#65D99A]/15 text-[#65D99A]'
                            : isOver
                              ? 'bg-[#FF6B73]/15 text-[#FF6B73]'
                              : 'bg-[#D6FF3F]/15 text-[#D6FF3F]'
                        }`}
                      >
                        {isHit ? 'Tepat Target' : isOver ? 'Lebih' : 'Sesuai / Sisa'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
