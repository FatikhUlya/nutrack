'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { calculateNutritionTargets } from '@/lib/nutrition/calculator';
import { formatNumber } from '@/lib/utils';
import type { UserProfile, Goal, ActivityLevel } from '@/types';
import {
  ACTIVITY_LEVEL_CONFIGS,
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
} from '@/types';
import {
  User,
  Calculator,
  Sparkles,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any> | void;
  isLoading?: boolean;
}

export function ProfileForm({ initialProfile, onSave, isLoading = false }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName ?? 'Pengguna');
  const [sex, setSex] = useState<'male' | 'female'>(initialProfile?.sex ?? 'male');
  const [age, setAge] = useState<number | string>(initialProfile?.age ?? 25);
  const [weightKg, setWeightKg] = useState<number | string>(initialProfile?.weightKg ?? 70);
  const [heightCm, setHeightCm] = useState<number | string>(initialProfile?.heightCm ?? 175);
  const [bodyFatPercent, setBodyFatPercent] = useState<number | string | undefined>(
    initialProfile?.bodyFatPercent,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel ?? 'moderate',
  );
  const [goal, setGoal] = useState<Goal>(initialProfile?.goal ?? 'maintenance');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if initialProfile loads asynchronously
  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.displayName !== undefined) setDisplayName(initialProfile.displayName);
      if (initialProfile.sex !== undefined) setSex(initialProfile.sex);
      if (initialProfile.age !== undefined) setAge(initialProfile.age);
      if (initialProfile.weightKg !== undefined) setWeightKg(initialProfile.weightKg);
      if (initialProfile.heightCm !== undefined) setHeightCm(initialProfile.heightCm);
      if (initialProfile.bodyFatPercent !== undefined) setBodyFatPercent(initialProfile.bodyFatPercent);
      if (initialProfile.activityLevel !== undefined) setActivityLevel(initialProfile.activityLevel);
      if (initialProfile.goal !== undefined) setGoal(initialProfile.goal);
    }
  }, [initialProfile]);

  // Live calculation preview
  const calculation = useMemo(() => {
    const numWeight = Number(weightKg);
    const numHeight = Number(heightCm);
    const numAge = Number(age);

    if (numWeight <= 0 || numHeight <= 0 || numAge <= 0) {
      return null;
    }
    return calculateNutritionTargets({
      sex,
      age: numAge,
      weightKg: numWeight,
      heightCm: numHeight,
      activityLevel,
      goal,
    });
  }, [sex, age, weightKg, heightCm, activityLevel, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        displayName: displayName.trim() || 'Pengguna',
        sex,
        age: Number(age) || 25,
        weightKg: Number(weightKg) || 70,
        heightCm: Number(heightCm) || 175,
        bodyFatPercent: bodyFatPercent !== undefined && bodyFatPercent !== '' ? Number(bodyFatPercent) : undefined,
        activityLevel,
        goal,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Caller shows toast error
    } finally {
      setIsSubmitting(false);
    }
  };

  const goals: Goal[] = ['cut', 'maintenance', 'lean_bulk'];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Form Controls (7 cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        <Card className="border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Profil Fisik & Biometrik</h3>
              <p className="text-xs text-text-secondary">
                Data digunakan untuk menghitung laju metabolisme basal (BMR) Anda
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nama Tampilan"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Nama Anda"
              required
            />

            {/* Sex Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Jenis Kelamin Biologis
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSex('male')}
                  className={`rounded-xl border py-2.5 px-4 text-xs font-semibold transition-all ${
                    sex === 'male'
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Pria (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setSex('female')}
                  className={`rounded-xl border py-2.5 px-4 text-xs font-semibold transition-all ${
                    sex === 'female'
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Wanita (Female)
                </button>
              </div>
            </div>

            {/* Age, Weight, Height Grid */}
            <div className="grid grid-cols-3 gap-3">
              <NumberInput
                label="Usia (thn)"
                min={15}
                max={100}
                value={age}
                onChange={val => setAge(val)}
                required
              />

              <NumberInput
                label="Berat (kg)"
                min={20}
                max={300}
                step={0.5}
                value={weightKg}
                onChange={val => setWeightKg(val)}
                required
              />

              <NumberInput
                label="Tinggi (cm)"
                min={100}
                max={250}
                value={heightCm}
                onChange={val => setHeightCm(val)}
                required
              />
            </div>

            {/* Activity Level Selector */}
            <Select
              label="Tingkat Aktivitas Harian"
              value={activityLevel}
              onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
              options={ACTIVITY_LEVEL_CONFIGS.map(c => ({
                value: c.value,
                label: `${c.label} (×${c.multiplier})`,
                description: c.description,
              }))}
            />

            {/* Goal Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Tujuan Nutrisi (Goal)
              </label>
              <div className="space-y-2">
                {goals.map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      goal === g
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border bg-surface-elevated hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${goal === g ? 'text-accent' : 'text-text-primary'}`}>
                        {GOAL_LABELS[g]}
                      </span>
                      {goal === g && <Check className="h-4 w-4 text-accent" />}
                    </div>
                    <p className="mt-1 text-[11px] text-text-secondary">
                      {GOAL_DESCRIPTIONS[g]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <Check className="h-4 w-4" /> Profil & Target tersimpan!
              </span>
            ) : (
              <span className="text-xs text-text-muted">
                Perubahan langsung memperbarui target harian.
              </span>
            )}

            <Button type="submit" variant="primary" className="font-bold" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Menyimpan ke Cloud...' : 'Simpan Profil & Perbarui Target'}
            </Button>
          </div>
        </Card>
      </form>

      {/* Right Column: Live Calculation Output Card (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="sticky top-20 border border-border bg-surface-elevated/70 p-6 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Calculator className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold text-text-primary">
              Kalkulasi Kebutuhan Nutrisi Real-time
            </h3>
          </div>

          {calculation ? (
            <div className="space-y-4">
              {/* BMI Card */}
              {calculation.bmi !== undefined && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                  <div>
                    <span className="text-xs font-bold text-text-secondary">Indeks Massa Tubuh (BMI)</span>
                    <p className="text-[10px] text-text-muted">Kategori WHO Asia-Pasifik</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-text-primary">
                      {calculation.bmi}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        calculation.bmiCategory === 'Obesitas'
                          ? 'bg-danger/20 text-danger border border-danger/30'
                          : calculation.bmiCategory === 'Overweight'
                          ? 'bg-warning/20 text-warning border border-warning/30'
                          : 'bg-success/20 text-success border border-success/30'
                      }`}
                    >
                      {calculation.bmiCategory}
                    </span>
                  </div>
                </div>
              )}

              {/* Adaptive Macro Note if Present */}
              {calculation.macroNotes && (
                <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs text-text-secondary">
                  <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{calculation.macroNotes}</span>
                </div>
              )}

              {/* Target Calorie Highlight */}
              <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Target Kalori Harian
                </span>
                <div className="mt-1 text-4xl font-black tracking-tight text-text-primary">
                  {formatNumber(Math.round(calculation.calorieTargetKcal))}
                  <span className="text-base font-normal text-text-secondary ml-1">kcal</span>
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  BMR: <strong>{formatNumber(Math.round(calculation.bmrKcal))}</strong> kcal • TDEE: <strong>{formatNumber(Math.round(calculation.tdeeKcal))}</strong> kcal
                </div>
              </div>

              {/* Macro Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-text-secondary block">
                  Rincian Makronutrien yang Direkomendasikan:
                </span>

                {/* Protein */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-protein shadow-[0_0_8px_rgba(119,183,255,0.6)]" />
                    <div>
                      <span className="text-xs font-bold text-text-primary">Protein</span>
                      <p className="text-[10px] text-text-muted">
                        {calculation.bmi && calculation.bmi >= 30
                          ? '1.5 g/kg BB (Disesuaikan untuk Obesitas)'
                          : calculation.bmi && calculation.bmi >= 25
                          ? '1.7 g/kg BB (Defisit Penurunan Lemak)'
                          : '2.0 g/kg BB (Optimal Hipertrofi)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-protein">
                      {Math.round(calculation.proteinTargetG)} g
                    </span>
                    <span className="text-[11px] text-text-muted block">
                      {Math.round(calculation.proteinTargetG * 4)} kcal
                    </span>
                  </div>
                </div>

                {/* Karbohidrat */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-carb shadow-[0_0_8px_rgba(103,232,249,0.6)]" />
                    <div>
                      <span className="text-xs font-bold text-text-primary">Karbohidrat</span>
                      <p className="text-[10px] text-text-muted">Energi harian & serat pangan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-carb">
                      {Math.round(calculation.carbsTargetG)} g
                    </span>
                    <span className="text-[11px] text-text-muted block">
                      {Math.round(calculation.carbsTargetG * 4)} kcal
                    </span>
                  </div>
                </div>

                {/* Lemak */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-fat shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
                    <div>
                      <span className="text-xs font-bold text-text-primary">Lemak Sehat</span>
                      <p className="text-[10px] text-text-muted">
                        {calculation.bmi && calculation.bmi >= 25 || goal === 'cut'
                          ? '28% dari kalori target (Optimal Defisit)'
                          : '1.08 g/kg BB (Regulasi Hormon)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-fat">
                      {Math.round(calculation.fatTargetG)} g
                    </span>
                    <span className="text-[11px] text-text-muted block">
                      {Math.round(calculation.fatTargetG * 9)} kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings if any */}
              {calculation.warnings.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 space-y-1">
                  {calculation.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-warning">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              Lengkapi data berat dan tinggi badan untuk melihat kalkulasi.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
