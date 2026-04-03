import { AlertProvider, ToastProvider } from '../providers'
import { Loader, OfflineReadyToast } from '../ui'
import Navbar from './Navbar'

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
