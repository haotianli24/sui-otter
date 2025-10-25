import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project Otter - Decentralized Social Trading on Sui',
  description: 'A decentralized social trading platform built on Sui, where communities share and track on-chain trades in real time. Transparency. Trust. Together.',
  authors: [{ name: 'Project Otter' }],
  openGraph: {
    title: 'Project Otter - Decentralized Social Trading on Sui',
    description: 'A decentralized social trading platform built on Sui, where communities share and track on-chain trades in real time.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sui_otter',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
