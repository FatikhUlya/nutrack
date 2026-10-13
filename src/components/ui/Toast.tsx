'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastMessage } from '@/types';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'border-success/30 bg-success/10',
  error: 'border-danger/30 bg-danger/10',
  warning: 'border-warning/30 bg-warning/10',
  info: 'border-info/30 bg-info/10',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
  key?: string;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = toastIcons[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm',
        'bg-surface-elevated border rounded-[14px] p-4 shadow-elevated',
        'animate-toast-in',
        toastStyles[toast.type],
      )}
    >
      <Icon size={18} className={cn('shrink-0 mt-0.5', iconStyles[toast.type])} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-text-secondary mt-0.5">{toast.description}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Tutup notifikasi"
        className="shrink-0 p-0.5 text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove?: (id: string) => void;
  onClose?: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  const handleRemove = onRemove ?? onClose ?? (() => {});

  return (
    <div
      aria-label="Notifikasi"
      className={cn(
        'fixed z-[500] flex flex-col gap-2',
        // Mobile: bottom center above navigation
        'bottom-20 left-4 right-4',
        // Desktop: top right
        'sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:w-auto',
      )}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={handleRemove} />
      ))}
    </div>
  );
}
