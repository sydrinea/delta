import type { Metadata, Viewport } from 'next'
import { flavors } from '@catppuccin/palette'
import { ThemeProvider } from 'next-themes'
import { Lexend, Lora, Recursive } from 'next/font/google'
import { cn } from '@/app/lib/utils'
import { Layout } from '@/components'
import { SerwistProvider } from './serwist'
import './globals.css'
import 'reactflow/dist/style.css'

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
})

const recursive = Recursive({
  variable: '--font-recursive',
  subsets: ['latin'],
  axes: ['MONO'],
})

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  applicationName: 'Delta — theory of computation tools',
  title: 'Delta — theory of computation tools',
  description: 'Create, test, and visualize DFAs and NFAs, with more to come!',
  creator: 'Sydney Newmark',
  metadataBase: new URL('https://comptheory.tools'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://comptheory.tools',
    title: 'Delta — theory of computation tools',
    description:
      'Create, test, and visualize DFAs and NFAs, with more to come!',
    siteName: 'Delta — theory of computation tools',
    images: [
      {
        url: '/android-chrome-192x192.png',
        width: 64,
        height: 64,
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: flavors.latte.colors.lavender.hex,
  initialScale: 1,
  width: 'device-width',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={cn('overscroll-none', 'bg-ctp-base', 'antialiased', recursive.variable, lora.variable, lexend.variable, 'font-mono')}
      dir="ltr"
    >
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            value={{
              light: 'latte',
              dark: 'mocha',
            }}
          >
            <div id="dark-mode-root">
              <Layout>{children}</Layout>
            </div>
          </ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  )
}
