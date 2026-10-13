'use client';

import { cn } from '@/lib/utils';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const variantMap = {
  default: 'bg-surface border border-border-subtle',
  elevated: 'bg-surface-elevated border border-border-subtle',
  bordered: 'bg-surface border border-border',
};

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] transition-colors duration-150',
        variantMap[variant],
        paddingMap[padding],
        interactive &&
          'cursor-pointer hover:bg-surface-hover hover:border-border active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card Header ──────────────────────────────────────────────────────────────

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Card Title ───────────────────────────────────────────────────────────────

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-semibold text-text-secondary uppercase tracking-wide', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─── Card Section ─────────────────────────────────────────────────────────────

export function CardSection({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-border-subtle pt-3 mt-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}
