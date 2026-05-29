import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maestro — AI Social Media Conductor',
  description: 'Plateforme unifiée de gestion sociale pour HORECA avec agents IA spécialisés',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Maestro' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full bg-[#07081A] text-[#E0E3FF] antialiased">
        {/* WCAG 2.4.1 — Lien d'évitement clavier */}
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <Sidebar />
        <TopBar />
        <BottomNav />
        <main
          id="main-content"
          aria-label="Contenu principal"
          className="ml-0 lg:ml-64 mt-14 min-h-[calc(100vh-3.5rem)] p-4 lg:p-6 pb-24 lg:pb-6"
        >
          {children}
        </main>
      </body>
    </html>
  )
}
