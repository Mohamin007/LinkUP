import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthGate } from '@/components/auth-gate'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'LinkUp - Find Gigs Near You',
  description: 'Hyperlocal gig economy platform connecting people with quick jobs in their area',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="theme-atmosphere" aria-hidden />
          <div className="relative z-10 min-h-screen text-foreground">
            <Navbar />
            <AuthGate>
              <main>{children}</main>
            </AuthGate>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
