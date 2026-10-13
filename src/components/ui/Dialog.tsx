'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size,
  maxWidth,
}: DialogProps) {
  const effectiveSize = (maxWidth ?? size ?? 'md') as keyof typeof sizeMap;
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides up on mobile, fades on desktop */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface-elevated border border-border',
          'outline-none',
          // Mobile: full-width bottom sheet
          'rounded-t-[24px] sm:rounded-[20px]',
          // Desktop: constrained width
          `sm:${sizeMap[effectiveSize] ?? sizeMap.md}`,
          'animate-slide-up sm:animate-fade-in',
          'shadow-modal',
          'max-h-[90vh] overflow-y-auto',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div>
            <h2
              id="dialog-title"
              className="text-base font-semibold text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="text-sm text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className={cn(
              'ml-3 mt-0.5 p-1.5 rounded-[8px] text-text-muted',
              'hover:bg-surface-hover hover:text-text-primary',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pb-5 pt-0 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive,
  variant,
  isLoading = false,
}: ConfirmationDialogProps) {
  const displayMessage = message ?? description ?? '';
  const displayConfirm = confirmText ?? confirmLabel ?? 'Konfirmasi';
  const displayCancel = cancelText ?? cancelLabel ?? 'Batal';
  const isDestruct = isDestructive ?? variant === 'destructive';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {displayCancel}
          </Button>
          <Button
            variant={isDestruct ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {displayConfirm}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{displayMessage}</p>
    </Dialog>
  );
}
