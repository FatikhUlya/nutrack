'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, options, error, hint, placeholder, id, className, required, disabled, ...props },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-required={required}
            aria-invalid={!!error}
            className={cn(
              'w-full appearance-none bg-surface border rounded-[12px] px-4 py-2.5 pr-10',
              'text-sm text-text-primary',
              'transition-colors duration-150 outline-none cursor-pointer',
              'border-border focus:border-accent focus:ring-1 focus:ring-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>

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

Select.displayName = 'Select';
