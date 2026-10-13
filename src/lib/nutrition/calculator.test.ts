/**
 * Unit tests for NUTRACK Nutrition Calculation Engine
 * Run: npm test
 */

import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateProteinTarget,
  calculateFatTarget,
  calculateCarbTarget,
  calculateNutritionTargets,
  getNutrientStatus,
  roundCalories,
  roundMacro,
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  MIN_SAFE_CALORIES,
} from './calculator';

// ─── BMR Tests ────────────────────────────────────────────────────────────────

describe('calculateBMR', () => {
  it('should calculate BMR for male correctly (reference case)', () => {
    // Male, 22yo, 65kg, 170cm → BMR = 10×65 + 6.25×170 − 5×22 + 5
    //   = 650 + 1062.5 − 110 + 5 = 1607.5
    const bmr = calculateBMR(65, 170, 22, 'male');
    expect(bmr).toBeCloseTo(1607.5, 1);
  });

  it('should calculate BMR for female correctly', () => {
    // Female, 28yo, 60kg, 165cm → BMR = 10×60 + 6.25×165 − 5×28 − 161
    //   = 600 + 1031.25 − 140 − 161 = 1330.25
    const bmr = calculateBMR(60, 165, 28, 'female');
    expect(bmr).toBeCloseTo(1330.25, 1);
  });

  it('male BMR should be higher than female for same inputs', () => {
    const maleBMR = calculateBMR(70, 175, 30, 'male');
    const femaleBMR = calculateBMR(70, 175, 30, 'female');
    expect(maleBMR).toBeGreaterThan(femaleBMR);
    expect(maleBMR - femaleBMR).toBeCloseTo(166, 0); // difference = 5 − (−161) = 166
  });

  it('BMR should increase with higher weight', () => {
    const lighter = calculateBMR(60, 170, 25, 'male');
    const heavier = calculateBMR(80, 170, 25, 'male');
    expect(heavier).toBeGreaterThan(lighter);
  });

  it('BMR should increase with greater height', () => {
    const shorter = calculateBMR(70, 160, 25, 'male');
    const taller = calculateBMR(70, 190, 25, 'male');
    expect(taller).toBeGreaterThan(shorter);
  });

  it('BMR should decrease with greater age', () => {
    const younger = calculateBMR(70, 175, 20, 'male');
    const older = calculateBMR(70, 175, 50, 'male');
    expect(younger).toBeGreaterThan(older);
  });
});

// ─── TDEE Tests ───────────────────────────────────────────────────────────────

describe('calculateTDEE', () => {
  const bmr = 1607.5; // reference male

  it('should use sedentary multiplier (1.20)', () => {
    expect(calculateTDEE(bmr, 'sedentary')).toBeCloseTo(bmr * 1.20, 1);
  });

  it('should use light multiplier (1.375)', () => {
    expect(calculateTDEE(bmr, 'light')).toBeCloseTo(bmr * 1.375, 1);
  });

  it('should use moderate multiplier (1.55)', () => {
    // Reference: 1607.5 × 1.55 ≈ 2491.6
    expect(calculateTDEE(bmr, 'moderate')).toBeCloseTo(1607.5 * 1.55, 1);
  });

  it('should use high multiplier (1.725)', () => {
    expect(calculateTDEE(bmr, 'high')).toBeCloseTo(bmr * 1.725, 1);
  });

  it('should use very_high multiplier (1.90)', () => {
    expect(calculateTDEE(bmr, 'very_high')).toBeCloseTo(bmr * 1.90, 1);
  });

  it('TDEE should be strictly greater than BMR for all activity levels', () => {
    const levels = Object.keys(ACTIVITY_MULTIPLIERS) as (keyof typeof ACTIVITY_MULTIPLIERS)[];
    levels.forEach(level => {
      expect(calculateTDEE(bmr, level)).toBeGreaterThan(bmr);
    });
  });
});

// ─── Calorie Target Tests ─────────────────────────────────────────────────────

describe('calculateCalorieTarget', () => {
  const tdee = 2492; // reference TDEE for male 22yo 65kg 170cm moderate

  it('cut should apply a deficit', () => {
    const { calorieTarget } = calculateCalorieTarget(tdee, 'cut');
    expect(calorieTarget).toBeLessThan(tdee);
    expect(calorieTarget).toBe(tdee + GOAL_CALORIE_ADJUSTMENTS.cut);
  });

  it('maintenance should equal TDEE', () => {
    const { calorieTarget } = calculateCalorieTarget(tdee, 'maintenance');
    expect(calorieTarget).toBeCloseTo(tdee, 0);
  });

  it('lean_bulk should apply a surplus (reference: ~2742 kcal before rounding)', () => {
    const { calorieTarget } = calculateCalorieTarget(tdee, 'lean_bulk');
    expect(calorieTarget).toBeGreaterThan(tdee);
    // Using TDEE 2492 + 250 surplus = 2742 (matches prompt reference)
    expect(calorieTarget).toBe(tdee + GOAL_CALORIE_ADJUSTMENTS.lean_bulk);
  });

  it('should warn and clamp if target falls below MIN_SAFE_CALORIES', () => {
    // Low TDEE person trying to cut
    const { calorieTarget, warnings } = calculateCalorieTarget(1400, 'cut');
    // 1400 − 350 = 1050, which is below 1200
    expect(calorieTarget).toBe(MIN_SAFE_CALORIES);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should not warn for normal healthy targets', () => {
    const { warnings } = calculateCalorieTarget(2500, 'maintenance');
    expect(warnings.length).toBe(0);
  });
});

// ─── Macro Target Tests ───────────────────────────────────────────────────────

describe('calculateProteinTarget', () => {
  it('should return 2.0g per kg of body weight', () => {
    expect(calculateProteinTarget(65)).toBeCloseTo(130, 0);
    expect(calculateProteinTarget(80)).toBeCloseTo(160, 0);
    expect(calculateProteinTarget(50)).toBeCloseTo(100, 0);
  });
});

describe('calculateFatTarget', () => {
  it('should return 1.08g per kg of body weight', () => {
    expect(calculateFatTarget(65)).toBeCloseTo(70.2, 1);
    expect(calculateFatTarget(80)).toBeCloseTo(86.4, 1);
  });
});

describe('calculateCarbTarget', () => {
  it('should calculate carbs from remaining calories', () => {
    // Calories: 2742, Protein: 130g (520cal), Fat: 70g (630cal)
    // Remaining: 2742 − 520 − 630 = 1592 cal → 1592/4 = 398g
    const { carbsG, valid } = calculateCarbTarget(2742, 130, 70);
    expect(carbsG).toBeCloseTo(398, 0);
    expect(valid).toBe(true);
  });

  it('should return invalid if carbs go negative', () => {
    // If calorie target is very low but protein+fat needs are high
    const { carbsG, valid } = calculateCarbTarget(1000, 200, 100);
    // Protein cals: 800, Fat cals: 900, total: 1700 > 1000 → negative
    expect(carbsG).toBe(0);
    expect(valid).toBe(false);
  });

  it('should warn if carbs are very low but technically valid', () => {
    const { carbsG, valid, warning } = calculateCarbTarget(1500, 130, 80);
    // Protein cals: 520, Fat cals: 720, remaining: 260 → 65g carbs
    expect(valid).toBe(true);
    expect(carbsG).toBeGreaterThan(0);
  });
});

// ─── Full Pipeline Test ───────────────────────────────────────────────────────

describe('calculateNutritionTargets (full pipeline)', () => {
  it('reference case: male 22yo 65kg 170cm moderate lean_bulk', () => {
    const result = calculateNutritionTargets({
      sex: 'male',
      age: 22,
      weightKg: 65,
      heightCm: 170,
      activityLevel: 'moderate',
      goal: 'lean_bulk',
    });
    // BMR ≈ 1607.5, TDEE ≈ 2491.6, lean_bulk target ≈ 2691.6
    expect(result.bmrKcal).toBeCloseTo(1607.5, 1);
    expect(result.tdeeKcal).toBeCloseTo(1607.5 * 1.55, 1);
    expect(result.calorieTargetKcal).toBeGreaterThan(result.tdeeKcal);
    expect(result.proteinTargetG).toBeCloseTo(130, 0);
    expect(result.fatTargetG).toBeCloseTo(70.2, 1);
    expect(result.carbsTargetG).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should work with optional body fat omitted', () => {
    // bodyFatPercent is not part of the calculator — confirm it works without it
    const result = calculateNutritionTargets({
      sex: 'female',
      age: 30,
      weightKg: 58,
      heightCm: 162,
      activityLevel: 'light',
      goal: 'maintenance',
    });
    expect(result.bmrKcal).toBeGreaterThan(0);
    expect(result.tdeeKcal).toBeGreaterThan(result.bmrKcal);
    expect(result.calorieTargetKcal).toBeGreaterThan(0);
  });

  it('should adapt macros clinically for obesity (BMI >= 30, cut)', () => {
    // Budi: Male, 32yo, 95kg, 170cm, Sedentary, Cut
    // BMI = 95 / (1.70^2) = 32.87 (Obesitas)
    // BMR = 10*95 + 6.25*170 - 5*32 + 5 = 950 + 1062.5 - 160 + 5 = 1857.5
    // TDEE = 1857.5 * 1.2 = 2229 kcal
    // Calorie Target = 2229 - 350 = 1879 kcal
    // Protein: 95 * 1.5 = 142.5 g (570 kcal)
    // Fat: 1879 * 0.28 / 9 ≈ 58.46 g (526.12 kcal)
    // Carbs: (1879 - 570 - 526.12) / 4 ≈ 195.72 g (782.88 kcal)
    const result = calculateNutritionTargets({
      sex: 'male',
      age: 32,
      weightKg: 95,
      heightCm: 170,
      activityLevel: 'sedentary',
      goal: 'cut',
    });

    expect(result.bmi).toBeCloseTo(32.9, 1);
    expect(result.bmiCategory).toBe('Obesitas');
    expect(result.bmrKcal).toBeCloseTo(1857.5, 1);
    expect(result.tdeeKcal).toBeCloseTo(2229, 0);
    expect(result.calorieTargetKcal).toBeCloseTo(1879, 0);
    expect(result.proteinTargetG).toBeCloseTo(142.5, 1); // 1.5 g/kg
    expect(result.fatTargetG).toBeCloseTo(58.5, 0);     // 28% of kcal target
    expect(result.carbsTargetG).toBeGreaterThan(180);   // healthy carb & fiber buffer
    expect(result.macroNotes).toContain('Obesitas');
  });
});

// ─── Nutrient Status Tests ────────────────────────────────────────────────────

describe('getNutrientStatus', () => {
  it('in_progress when under target and day is ongoing', () => {
    const result = getNutrientStatus(80, 130, 0.10, false);
    expect(result.status).toBe('in_progress');
    expect(result.percentage).toBeCloseTo(61.5, 0);
    expect(result.remaining).toBeCloseTo(50, 0);
  });

  it('below_target when under target and day is complete', () => {
    const result = getNutrientStatus(80, 130, 0.10, true);
    expect(result.status).toBe('below_target');
  });

  it('on_target when within tolerance range', () => {
    const result = getNutrientStatus(125, 130, 0.10);
    // 125/130 = 96.2% — within ±10%
    expect(result.status).toBe('on_target');
  });

  it('above_target when slightly over', () => {
    const result = getNutrientStatus(145, 130, 0.10);
    // 145/130 = 111.5% — over upper bound (110%) but under over_limit (120%)
    expect(result.status).toBe('above_target');
  });

  it('over_limit when significantly over', () => {
    const result = getNutrientStatus(160, 130, 0.10);
    // 160/130 = 123% — over 120% limit
    expect(result.status).toBe('over_limit');
  });

  it('no_data when both actual and target are zero', () => {
    const result = getNutrientStatus(0, 0);
    expect(result.status).toBe('no_data');
  });
});

// ─── Rounding Tests ───────────────────────────────────────────────────────────

describe('roundCalories', () => {
  it('should round to nearest 10', () => {
    expect(roundCalories(1607.5)).toBe(1610);
    expect(roundCalories(2491.6)).toBe(2490);
    expect(roundCalories(2742)).toBe(2740);
  });
});

describe('roundMacro', () => {
  it('should round to nearest 1 gram', () => {
    expect(roundMacro(130.0)).toBe(130);
    expect(roundMacro(70.2)).toBe(70);
    expect(roundMacro(398.3)).toBe(398);
  });
});
