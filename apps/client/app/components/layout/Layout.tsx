'use client'

import { AlertProvider, ToastProvider } from '../providers'
import { Loader, OfflineReadyToast } from '../ui'
import { TooltipProvider } from '../ui/tooltip'
import Navbar from './Navbar'

export default function Layout({ children }: { children: React.ReactNode }) {
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
