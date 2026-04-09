import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/context/ThemeContext'

export const metadata: Metadata = {
  title: 'Digital Khata — Smart Finance Tracker',
  description: 'Track your income, expenses, and financial goals with Digital Khata. Your personal digital ledger.',
  keywords: 'finance tracker, expense tracker, digital khata, bookkeeping, budget manager',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#130f2e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            expand={false}
            toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
