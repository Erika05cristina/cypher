import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'CYPHER | AI-Powered Forensic Risk Intelligence for Solana',
  description: 'Predict before you sign. AI-powered forensic risk intelligence platform for the Solana ecosystem. Detect scam signals before interacting with malicious smart contracts.',
  keywords: ['blockchain security', 'Solana', 'Web3', 'cybersecurity', 'risk analysis', 'smart contract audit', 'AI security'],
  authors: [{ name: 'Erika Cristina Villa' }],
  openGraph: {
    title: 'CYPHER | AI-Powered Forensic Risk Intelligence',
    description: 'Predict before you sign. AI-powered forensic risk intelligence for the Solana ecosystem.',
    type: 'website',
  },
  icons: {
    icon: '/cypher-logo.svg',
    apple: '/cypher_logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0c0a0f',
  width: 'device-width',
  initialScale: 1,
}

import { Header } from '@/components/landing/header'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased noise grid-bg`}>
        <Header />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
