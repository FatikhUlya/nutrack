'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent hover:bg-accent-hover text-[#17191B] font-bold shadow-neon-glow',
    'hover:shadow-neon-glow-lg hover:-translate-y-0.5',
    'active:scale-[0.98] active:translate-y-0',
    'disabled:bg-surface-elevated disabled:text-text-muted disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ].join(' '),

  secondary: [
    'bg-surface-elevated border border-border text-text-primary font-medium shadow-card',
    'hover:bg-surface-hover hover:border-accent/40 hover:text-white',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ].join(' '),

  tertiary: [
    'bg-transparent text-text-secondary font-medium',
    'hover:bg-surface-elevated hover:text-text-primary',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  ].join(' '),

  destructive: [
    'bg-danger/10 border border-danger/30 text-danger font-medium',
    'hover:bg-danger/20 hover:border-danger/50',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-muted font-medium',
    'hover:text-text-primary hover:bg-surface-elevated',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-sm rounded-2xl gap-2.5',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200',
          'select-none outline-none font-semibold',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span className={cn(isLoading && 'opacity-0')}>{children}</span>}
        {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

// ─── Icon Button ──────────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: ButtonSize;
  variant?: Extract<ButtonVariant, 'secondary' | 'tertiary' | 'ghost'>;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', variant = 'tertiary', className, ...props }, ref) => {
    const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          sizeMap[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
