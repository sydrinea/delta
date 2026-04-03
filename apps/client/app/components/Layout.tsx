import { AlertProvider } from '@/components/AlertProvider'
import { Loader } from '@/components/Loader'
import Navbar from '@/components/Navbar'
import { OfflineReadyToast } from './OfflineReadyToast'
import { ToastProvider } from './ToastProvider'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AlertProvider>
        <main className="relative min-h-dvh flex flex-col font-mono">
          <Loader />
          <Navbar />
          {children}
          <OfflineReadyToast />
        </main>
      </AlertProvider>
    </ToastProvider>
  )
}
