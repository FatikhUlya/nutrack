'use client';

import React from 'react';

export type FoodType =
  | 'burger'
  | 'hotdog'
  | 'pizza'
  | 'donut'
  | 'cake'
  | 'popcorn'
  | 'cookies'
  | 'chicken'
  | 'rice'
  | 'salad'
  | 'steak'
  | 'fish'
  | 'apple'
  | 'egg'
  | 'water'
  | 'generic';

interface FoodIllustrationProps {
  type?: FoodType | string;
  name?: string;
  size?: number | string;
  className?: string;
}

/**
 * Resolves a food name into a standard food key for 3D illustration
 */
export function resolveFoodType(name?: string, fallback: FoodType = 'burger'): FoodType {
  if (!name) return fallback;
  const n = name.toLowerCase();

  if (n.includes('burger')) return 'burger';
  if (n.includes('hotdog') || n.includes('sosis')) return 'hotdog';
  if (n.includes('pizza')) return 'pizza';
  if (n.includes('donut') || n.includes('donat')) return 'donut';
  if (n.includes('cake') || n.includes('kue') || n.includes('tart') || n.includes('roti')) return 'cake';
  if (n.includes('popcorn')) return 'popcorn';
  if (n.includes('cookie') || n.includes('biskuit') || n.includes('kukis')) return 'cookies';
  if (n.includes('ayam') || n.includes('chicken') || n.includes('dada')) return 'chicken';
  if (n.includes('nasi') || n.includes('rice') || n.includes('bubur')) return 'rice';
  if (n.includes('salad') || n.includes('sayur') || n.includes('kangkung') || n.includes('lalapan')) return 'salad';
  if (n.includes('steak') || n.includes('daging') || n.includes('beef') || n.includes('rendang')) return 'steak';
  if (n.includes('ikan') || n.includes('salmon') || n.includes('fish')) return 'fish';
  if (n.includes('telur') || n.includes('egg') || n.includes('omelet')) return 'egg';
  if (n.includes('apel') || n.includes('apple') || n.includes('buah') || n.includes('pisang')) return 'apple';
  if (n.includes('air') || n.includes('water') || n.includes('minum')) return 'water';

  return 'generic';
}

export function FoodIllustration({
  type,
  name,
  size = 48,
  className = '',
}: FoodIllustrationProps) {
  const resolved = type ? (type as FoodType) : resolveFoodType(name);
  const px = typeof size === 'number' ? `${size}px` : size;

  switch (resolved) {
    case 'burger':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="88" rx="36" ry="7" fill="rgba(0,0,0,0.12)" />
          {/* Bottom Bun */}
          <path
            d="M 22 70 C 22 84, 78 84, 78 70 Z"
            fill="url(#bunBottomGrad)"
          />
          {/* Patty */}
          <rect x="18" y="58" width="64" height="12" rx="6" fill="url(#pattyGrad)" />
          {/* Melted Cheese */}
          <path
            d="M 20 58 L 80 58 L 74 65 L 62 60 L 52 66 L 42 60 L 32 67 L 24 60 Z"
            fill="#FBBF24"
          />
          {/* Lettuce */}
          <path
            d="M 17 55 Q 24 50 30 55 Q 38 49 46 55 Q 54 48 62 55 Q 70 49 78 55 Q 83 51 86 56 Q 80 61 74 58 Q 66 62 58 58 Q 50 63 42 58 Q 34 62 26 58 Q 20 61 17 55 Z"
            fill="#4ADE80"
          />
          {/* Tomato */}
          <ellipse cx="50" cy="48" rx="30" ry="6" fill="#EF4444" />
          {/* Top Bun */}
          <path
            d="M 20 46 C 20 18, 80 18, 80 46 Z"
            fill="url(#bunTopGrad)"
          />
          {/* Sesame Seeds */}
          <ellipse cx="38" cy="30" rx="2.5" ry="1.2" fill="#FEF3C7" transform="rotate(-15 38 30)" />
          <ellipse cx="52" cy="26" rx="2.5" ry="1.2" fill="#FEF3C7" transform="rotate(5 52 26)" />
          <ellipse cx="64" cy="32" rx="2.5" ry="1.2" fill="#FEF3C7" transform="rotate(20 64 32)" />
          <ellipse cx="45" cy="38" rx="2.5" ry="1.2" fill="#FEF3C7" transform="rotate(-5 45 38)" />
          <ellipse cx="58" cy="40" rx="2.5" ry="1.2" fill="#FEF3C7" transform="rotate(10 58 40)" />

          <defs>
            <linearGradient id="bunTopGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="60%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="bunBottomGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="pattyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'hotdog':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="85" rx="38" ry="7" fill="rgba(0,0,0,0.12)" />
          {/* Bread Base */}
          <path
            d="M 16 58 C 12 40, 32 30, 48 38 L 78 52 C 92 60, 88 78, 72 78 L 32 78 C 22 78, 16 70, 16 58 Z"
            fill="url(#hotdogBun)"
          />
          {/* Sausage */}
          <path
            d="M 14 52 C 10 42, 22 36, 32 40 L 78 58 C 88 62, 86 74, 76 72 L 28 56 C 20 54, 16 56, 14 52 Z"
            fill="url(#sausageGrad)"
          />
          {/* Mustard zigzag */}
          <path
            d="M 22 46 Q 28 42 32 48 Q 38 44 42 50 Q 48 46 54 53 Q 60 49 66 56 Q 72 52 76 58"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Bun top lip */}
          <path
            d="M 28 38 C 42 32, 70 42, 82 54 C 80 50, 68 40, 50 36 Z"
            fill="#FDE68A"
            opacity="0.8"
          />
          <defs>
            <linearGradient id="hotdogBun" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="sausageGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'pizza':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="85" rx="34" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Pizza Slice Triangle */}
          <path
            d="M 50 15 L 85 75 C 65 85, 35 85, 15 75 Z"
            fill="url(#pizzaCheese)"
          />
          {/* Crust back */}
          <path
            d="M 15 75 C 35 85, 65 85, 85 75 C 88 80, 80 88, 50 88 C 20 88, 12 80, 15 75 Z"
            fill="url(#pizzaCrust)"
          />
          {/* Pepperoni slices */}
          <circle cx="50" cy="46" r="6" fill="#DC2626" />
          <circle cx="40" cy="62" r="5.5" fill="#B91C1C" />
          <circle cx="62" cy="64" r="6" fill="#DC2626" />
          <circle cx="52" cy="74" r="4.5" fill="#B91C1C" />
          {/* Basil herbs */}
          <ellipse cx="44" cy="52" rx="2" ry="4" fill="#16A34A" transform="rotate(30 44 52)" />
          <ellipse cx="58" cy="54" rx="2" ry="4" fill="#16A34A" transform="rotate(-40 58 54)" />
          <ellipse cx="50" cy="30" rx="1.5" ry="3" fill="#16A34A" transform="rotate(15 50 30)" />

          <defs>
            <linearGradient id="pizzaCheese" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="pizzaCrust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'donut':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="85" rx="35" ry="7" fill="rgba(0,0,0,0.12)" />
          {/* Donut base */}
          <circle cx="50" cy="50" r="34" fill="url(#donutDough)" />
          {/* Glaze */}
          <path
            d="M 50 16 C 68 16 84 32 84 50 C 84 62 80 66 74 65 C 68 64 66 72 60 72 C 54 72 52 64 46 66 C 40 68 38 72 32 72 C 26 72 22 66 18 64 C 16 58 16 50 16 50 C 16 32 32 16 50 16 Z"
            fill="url(#donutGlaze)"
          />
          {/* Center Hole */}
          <circle cx="50" cy="50" r="13" fill="#F0F8F0" />
          {/* Sprinkles */}
          <rect x="36" y="26" width="3" height="7" rx="1.5" fill="#EF4444" transform="rotate(25 36 26)" />
          <rect x="58" y="25" width="3" height="7" rx="1.5" fill="#3B82F6" transform="rotate(-35 58 25)" />
          <rect x="70" y="42" width="3" height="7" rx="1.5" fill="#FBBF24" transform="rotate(45 70 42)" />
          <rect x="25" y="46" width="3" height="7" rx="1.5" fill="#10B981" transform="rotate(-20 25 46)" />
          <rect x="38" y="66" width="3" height="7" rx="1.5" fill="#EC4899" transform="rotate(60 38 66)" />
          <rect x="62" y="62" width="3" height="7" rx="1.5" fill="#8B5CF6" transform="rotate(-15 62 62)" />

          <defs>
            <linearGradient id="donutDough" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="donutGlaze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#4D7C0F" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'cake':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="85" rx="34" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Cake Slice Base */}
          <path
            d="M 20 45 L 75 30 L 85 68 L 26 80 Z"
            fill="#D1FAE5"
          />
          {/* Cake Layers */}
          <path
            d="M 22 55 L 77 42 L 80 50 L 23 63 Z"
            fill="#34D399"
          />
          <path
            d="M 24 67 L 81 56 L 83 62 L 25 73 Z"
            fill="#059669"
          />
          {/* Frosting Top */}
          <polygon points="20,45 75,30 50,18" fill="#F0FDF4" />
          {/* Cherry / Strawberry on top */}
          <circle cx="50" cy="20" r="5" fill="#EF4444" />
          <path d="M 50 15 Q 52 10 56 12" stroke="#15803D" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'popcorn':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Red and White striped box */}
          <path d="M 28 45 L 72 45 L 66 84 L 34 84 Z" fill="#EF4444" />
          <path d="M 37 45 L 43 45 L 41 84 L 36 84 Z" fill="#FFFFFF" />
          <path d="M 49 45 L 55 45 L 53 84 L 48 84 Z" fill="#FFFFFF" />
          <path d="M 61 45 L 67 45 L 63 84 L 59 84 Z" fill="#FFFFFF" />
          {/* Popcorn fluffy puffs */}
          <circle cx="36" cy="40" r="7" fill="#FEF08A" />
          <circle cx="48" cy="36" r="8" fill="#FEF9C3" />
          <circle cx="62" cy="38" r="7.5" fill="#FEF08A" />
          <circle cx="42" cy="28" r="7.5" fill="#FEF9C3" />
          <circle cx="56" cy="26" r="8" fill="#FEF08A" />
        </svg>
      );

    case 'cookies':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="85" rx="34" ry="7" fill="rgba(0,0,0,0.12)" />
          <circle cx="50" cy="50" r="32" fill="url(#cookieGrad)" />
          {/* Chocolate chips */}
          <circle cx="36" cy="38" r="4" fill="#3E2723" />
          <circle cx="62" cy="36" r="3.5" fill="#3E2723" />
          <circle cx="50" cy="52" r="4.5" fill="#3E2723" />
          <circle cx="34" cy="62" r="3" fill="#3E2723" />
          <circle cx="64" cy="58" r="4" fill="#3E2723" />
          <circle cx="48" cy="70" r="3.5" fill="#3E2723" />
          <defs>
            <linearGradient id="cookieGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'chicken':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="86" rx="36" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Drumstick meat */}
          <path
            d="M 32 30 C 15 45, 25 70, 55 72 C 72 73, 85 58, 80 40 C 75 25, 48 18, 32 30 Z"
            fill="url(#chickenGrad)"
          />
          {/* Bone handle */}
          <path d="M 28 58 L 18 70" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" />
          <circle cx="16" cy="74" r="4" fill="#FEF08A" />
          <circle cx="20" cy="76" r="4" fill="#FEF08A" />
          {/* Roasted grill marks */}
          <path d="M 45 36 Q 52 42 58 38" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 42 48 Q 50 54 60 50" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="chickenGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'rice':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="88" rx="34" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Bowl */}
          <path d="M 20 54 C 20 84, 80 84, 80 54 Z" fill="url(#bowlGrad)" />
          <ellipse cx="50" cy="54" rx="30" ry="8" fill="#E2E8F0" />
          {/* Fluffy Rice Mound */}
          <ellipse cx="50" cy="46" rx="26" ry="16" fill="#FFFFFF" />
          <circle cx="42" cy="40" r="10" fill="#F8FAFC" />
          <circle cx="56" cy="38" r="9" fill="#FFFFFF" />
          {/* Nori or parsley garnish */}
          <rect x="47" y="34" width="7" height="6" rx="1" fill="#15803D" />
          <defs>
            <linearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'salad':
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="88" rx="34" ry="6" fill="rgba(0,0,0,0.12)" />
          <path d="M 20 54 C 20 84, 80 84, 80 54 Z" fill="#E2E8F0" />
          {/* Green leaves */}
          <circle cx="40" cy="45" r="14" fill="#22C55E" />
          <circle cx="60" cy="45" r="14" fill="#16A34A" />
          <circle cx="50" cy="38" r="13" fill="#4ADE80" />
          {/* Tomatoes and cucumbers */}
          <circle cx="36" cy="42" r="5" fill="#EF4444" />
          <circle cx="64" cy="44" r="5" fill="#EF4444" />
          <circle cx="50" cy="48" r="6" fill="#86EFAC" stroke="#15803D" strokeWidth="2" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: px, height: px }}
          className={`drop-shadow-md shrink-0 ${className}`}
        >
          <ellipse cx="50" cy="86" rx="36" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* Plate */}
          <ellipse cx="50" cy="56" rx="36" ry="16" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="3" />
          {/* Cloche / food */}
          <path d="M 28 54 C 28 30, 72 30, 72 54 Z" fill="url(#foodDishGrad)" />
          <circle cx="50" cy="28" r="4" fill="#F59E0B" />
          <defs>
            <linearGradient id="foodDishGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      );
  }
}
