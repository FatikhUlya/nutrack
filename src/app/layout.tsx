import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NUTRACK — Smart Nutrition Tracker',
    template: '%s | NUTRACK',
  },
  description:
    'Lacak asupan nutrisi harian, scan makanan dengan AI Gemini, dan pantau perkembangan Anda menuju target kesehatan dengan tampilan yang cantik dan intuitif.',
  keywords: ['nutrisi', 'kalori', 'diet', 'kesehatan', 'makanan', 'tracker', 'AI', 'Gemini'],
  authors: [{ name: 'NUTRACK' }],
  creator: 'NUTRACK',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'NUTRACK — Smart Nutrition Tracker',
    description: 'Lacak asupan nutrisi harian dengan AI Food Scanner berbasis Google Gemini.',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#17191B',
};

import { AuthProvider } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="font-sans">
      <body className="bg-bg text-text-primary antialiased">
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
