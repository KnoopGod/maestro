import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maestro — AI Social Media Conductor',
  description: 'Plateforme unifiée de gestion sociale pour HORECA avec agents IA spécialisés',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full bg-gray-950 text-gray-100 antialiased">
        <Sidebar />
        <TopBar />
        <main className="ml-64 mt-14 min-h-[calc(100vh-3.5rem)] p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
