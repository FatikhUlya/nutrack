'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Flame, BarChart3, Bookmark, User, Scan, Plus, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  onOpenQuickAdd?: () => void;
  onOpenScanner?: () => void;
}

export function Navbar({ onOpenQuickAdd, onOpenScanner }: NavbarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home', icon: Flame },
    { href: '/stats', label: 'Statistik', icon: BarChart3 },
    { href: '/saved', label: 'Tersimpan', icon: Bookmark },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#17191B]/90 backdrop-blur-xl border-b border-[#2D3134] shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D6FF3F] text-[#17191B] shadow-neon-glow transition-transform group-hover:scale-105 font-black">
            <Activity className="h-5 w-5 stroke-[2.8]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[#F4F5F6] leading-none">
              NUTRACK
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D6FF3F] leading-none mt-1">
              Nutrition AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#D6FF3F]/15 text-[#D6FF3F] shadow-xs'
                    : 'text-[#A7ADB3] hover:bg-[#202326] hover:text-[#F4F5F6]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? 'text-[#D6FF3F]' : 'text-[#747C83]'}`}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Auth */}
        <div className="flex items-center gap-2.5">
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 rounded-xl border border-[#D6FF3F]/40 bg-[#D6FF3F]/10 px-3.5 py-2 text-xs font-bold text-[#D6FF3F] transition-all hover:bg-[#D6FF3F]/20 hover:shadow-neon-glow"
            >
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Scan AI</span>
            </button>
          )}

          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 rounded-xl bg-[#D6FF3F] text-[#17191B] px-3.5 py-2 text-xs font-bold shadow-neon-glow hover:bg-[#C7F02D] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Catat</span>
            </button>
          )}

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <Link
                href="/profile"
                title={user.email}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#202326] border border-[#2D3134] text-xs font-medium text-[#F4F5F6] hover:border-[#D6FF3F]/40 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[#D6FF3F] text-[#17191B] font-black text-[10px] flex items-center justify-center uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <span className="max-w-[90px] truncate">{user.displayName || user.email}</span>
              </Link>
              <button
                onClick={() => signOut()}
                title="Keluar (Logout)"
                className="p-2 rounded-xl text-[#8E959C] hover:text-rose-400 hover:bg-[#202326] transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-[#202326] border border-[#2D3134] px-3.5 py-2 text-xs font-bold text-[#D6FF3F] hover:bg-[#D6FF3F]/10 hover:border-[#D6FF3F]/40 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
