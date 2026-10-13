'use client';

import { useState, useCallback } from 'react';
import type { ToastMessage } from '@/types';
import { generateId } from '@/lib/utils';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration ?? 4000 };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    [addToast],
  );

  const showError = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    [addToast],
  );

  const showWarning = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    [addToast],
  );

  const showInfo = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    [addToast],
  );

  const toast = {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
