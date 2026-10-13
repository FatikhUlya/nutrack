'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isConfigured, signIn, signUp, loginAsDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  if (user) {
    router.replace('/');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Harap isi email dan kata sandi.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Harap masukkan nama lengkap Anda.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          router.push('/');
        }
      } else {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(res.message || 'Pendaftaran berhasil! Silakan masuk.');
          if (!isConfigured) {
            router.push('/');
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoUser();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#121416] text-[#F4F5F6] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient neon glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D6FF3F]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6FF3F] text-[#17191B] shadow-[0_0_25px_rgba(214,255,63,0.35)] transition-transform group-hover:scale-105">
              <Activity className="h-7 w-7 stroke-[2.8]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black tracking-tight text-[#F4F5F6] leading-none">
                NUTRACK
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D6FF3F] leading-none mt-1.5">
                Nutrition & Health AI
              </span>
            </div>
          </Link>
          <p className="text-sm text-[#8E959C]">
            Kelola nutrisi dan kalori harian Anda secara terisolasi dan aman.
          </p>

          {/* Database Mode Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#202326] border border-[#2D3134] text-[#A7ADB3]">
            <Database className="h-3 w-3 text-[#D6FF3F]" />
            <span>
              {isConfigured
                ? 'Terhubung: Supabase Cloud Database'
                : 'Mode: Multi-User Local Storage'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-[#1C1F22]/90 backdrop-blur-2xl border border-[#2D3134] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#121416] rounded-2xl border border-[#2D3134]/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#D6FF3F] text-[#17191B] shadow-md'
                  : 'text-[#8E959C] hover:text-[#F4F5F6]'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-[#D6FF3F] text-[#17191B] shadow-md'
                  : 'text-[#8E959C] hover:text-[#F4F5F6]'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#A7ADB3] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-[#747C83]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-xl bg-[#121416] border border-[#2D3134] pl-10 pr-4 py-2.5 text-sm text-[#F4F5F6] placeholder-[#5C636A] focus:border-[#D6FF3F] focus:outline-none focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#A7ADB3] mb-1.5">
                Alamat Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-[#747C83]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full rounded-xl bg-[#121416] border border-[#2D3134] pl-10 pr-4 py-2.5 text-sm text-[#F4F5F6] placeholder-[#5C636A] focus:border-[#D6FF3F] focus:outline-none focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A7ADB3] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-[#747C83]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-xl bg-[#121416] border border-[#2D3134] pl-10 pr-10 py-2.5 text-sm text-[#F4F5F6] placeholder-[#5C636A] focus:border-[#D6FF3F] focus:outline-none focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#747C83] hover:text-[#F4F5F6] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] py-3 text-sm font-extrabold text-[#17191B] shadow-[0_0_20px_rgba(214,255,63,0.3)] hover:bg-[#C7F02D] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-[#17191B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang'}
                  </span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-[#2D3134] text-center">
            <p className="text-xs text-[#8E959C] mb-3">
              Ingin coba langsung tanpa akun?
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#202326] border border-[#2D3134] hover:border-[#D6FF3F]/40 py-2.5 text-xs font-bold text-[#F4F5F6] hover:text-[#D6FF3F] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D6FF3F]" />
              <span>Masuk Mode Tamu Demo</span>
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#747C83]">
          <ShieldCheck className="h-4 w-4 text-[#10B981]" />
          <span>Isolasi database aktif per akun pengguna.</span>
        </div>
      </div>
    </div>
  );
}
