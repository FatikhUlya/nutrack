'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { UserPlus, Mail, Lock, User, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccessToast,
}: CreateUserModalProps) {
  const { createAdminUser, isConfigured } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createAdminUser(
        email.trim(),
        password.trim(),
        fullName.trim(),
        role
      );

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        if (onSuccessToast) {
          onSuccessToast(res.message || `Akun ${email} berhasil dibuat.`);
        }
        setFullName('');
        setEmail('');
        setPassword('');
        onClose();
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj.message || 'Gagal membuat akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Akun Pengguna Baru"
      description="Hanya Administrator yang memiliki akses untuk membuat akun baru"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <span>{errorMsg}</span>
              {isConfigured && (
                <div className="mt-2 pt-2 border-t border-rose-500/20">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                  >
                    Buka Supabase Dashboard &gt; Auth &gt; Users &gt; Add User
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5">
            Nama Lengkap Pengguna
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Rina Anggraini"
              required
              className="w-full rounded-xl bg-surface-elevated border border-border pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5">
            Alamat Email Pengguna
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pengguna@email.com"
              required
              className="w-full rounded-xl bg-surface-elevated border border-border pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5">
            Kata Sandi Awal
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata sandi sementara (min 6 karakter)"
              required
              className="w-full rounded-xl bg-surface-elevated border border-border pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all font-mono"
            />
          </div>
          <span className="text-[11px] text-text-muted mt-1 block">
            Pengguna dapat mengubah kata sandi ini sendiri kapan saja setelah masuk.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5">
            Peran (Role)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                role === 'user'
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border bg-surface-elevated text-text-muted'
              }`}
            >
              Pengguna Biasa
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                role === 'admin'
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border bg-surface-elevated text-text-muted'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Administrator
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isSubmitting ? 'Membuat Akun...' : 'Buatkan Akun'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
