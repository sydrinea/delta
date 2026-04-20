'use client'

import { AlertProvider, ToastProvider } from '../providers'
import { Loader, OfflineReadyToast } from '../ui'
import { TooltipProvider } from '../ui/overlays/tooltip'
import Navbar from './navbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <TooltipProvider delayDuration={50}>
      <ToastProvider>
        <AlertProvider>
          <main className="relative flex flex-col font-mono">
            <Loader />
            <Navbar />
            {children}
            <OfflineReadyToast />
          </main>
        </AlertProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
