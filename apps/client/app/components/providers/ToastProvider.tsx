'use client'

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

interface Toast {
  id: string
  message: string
  duration: number
}

interface ToastContextValue {
  setToast: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = use(ToastContext)
  if (!ctx)
    throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastItem({
  toast,
  onDone,
}: {
  toast: Toast
  onDone: (id: string) => void
}) {
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current)
      return
    doneRef.current = true
    setExiting(true)
    setTimeout(onDone, 300, toast.id)
  }, [onDone, toast.id])

  useEffect(() => {
    const t = setTimeout(finish, toast.duration)
    return () => clearTimeout(t)
  }, [finish, toast.duration])

  return (
    <div
      className={`
    relative overflow-hidden
    bg-ctp-base border border-ctp-surface1
    rounded-xl shadow-xl px-4 pt-3 pb-2
    text-sm text-ctp-text font-sans
    ${exiting ? 'animate-toast-out' : 'animate-toast-in'}
  `}
    >
      <p className="mb-2">{toast.message}</p>

      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden ${exiting ? 'bg-ctp-surface1' : 'bg-ctp-lavender'}`}
      >
        <div
          className="h-full bg-ctp-surface1 rounded-full"
          style={{
            animation: `toast-cover ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([])

  const setToast = useCallback((message: string, duration = 3000) => {
    const id = crypto.randomUUID()
    setQueue(q => [...q, { id, message, duration }])
  }, [])

  const remove = useCallback((id: string) => {
    setQueue(q => q.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ setToast }}>
      {children}

      {/* portal anchor — bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast flex flex-col gap-2 items-center pointer-events-none">
        {queue.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDone={remove} />
        ))}
      </div>
    </ToastContext>
  )
}
