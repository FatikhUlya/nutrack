'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      unit,
      id,
      className,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
            {required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-text-muted pointer-events-none">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              'w-full bg-surface border rounded-[12px] px-4 py-2.5',
              'text-sm text-text-primary placeholder:text-text-muted',
              'transition-colors duration-150 outline-none',
              'border-border focus:border-accent focus:ring-1 focus:ring-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              Boolean(error) && 'border-danger focus:border-danger focus:ring-danger',
              Boolean(leftAddon) && 'pl-10',
              Boolean(rightAddon || unit) && 'pr-16',
              className,
            )}
            {...props}
          />

          {(rightAddon || unit) && (
            <div className="absolute right-3 flex items-center gap-2 pointer-events-none">
              {unit && (
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {unit}
                </span>
              )}
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

// ─── Number Input ─────────────────────────────────────────────────────────────

interface NumberInputProps
  extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  onChange?: (value: any) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;
      const raw = e.target.value;
      if (raw === '') {
        onChange('');
        return;
      }
      const num = parseFloat(raw);
      onChange(isNaN(num) ? '' : num);
    };

    return (
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

NumberInput.displayName = 'NumberInput';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, required, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'w-full bg-surface border rounded-[12px] px-4 py-2.5 min-h-[80px] resize-y',
            'text-sm text-text-primary placeholder:text-text-muted',
            'transition-colors duration-150 outline-none',
            'border-border focus:border-accent focus:ring-1 focus:ring-accent',
            error && 'border-danger',
            className,
          )}
          {...props}
        />
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
