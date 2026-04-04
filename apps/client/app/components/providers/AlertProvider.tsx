'use client'

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Alert } from '../ui'

const CLOSE_TEXT_CLEAR_DELAY_MS = 300

interface AlertPayload {
  title: string
  message: string
  confirmText?: string
}

interface AlertContextValue {
  showAlert: (payload: AlertPayload) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [activeAlert, setActiveAlert] = useState<AlertPayload | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const clearTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  useEffect(() => {
    return () => {
      if (clearTextTimeoutRef.current !== null) {
        clearTimeout(clearTextTimeoutRef.current)
      }
    }
  }, [])

  const hideAlert = useCallback(() => {
    setIsOpen(false)
    if (clearTextTimeoutRef.current !== null) {
      clearTimeout(clearTextTimeoutRef.current)
    }

    clearTextTimeoutRef.current = setTimeout(() => {
      setActiveAlert(null)
      clearTextTimeoutRef.current = null
    }, CLOSE_TEXT_CLEAR_DELAY_MS)
  }, [])

  const showAlert = useCallback((payload: AlertPayload) => {
    if (clearTextTimeoutRef.current !== null) {
      clearTimeout(clearTextTimeoutRef.current)
      clearTextTimeoutRef.current = null
    }

    setActiveAlert(payload)
    setIsOpen(true)
  }, [])

  const value = useMemo(
    () => ({ showAlert, hideAlert }),
    [hideAlert, showAlert],
  )

  return (
    <AlertContext value={value}>
      {children}
      <Alert
        isOpen={isOpen}
        title={activeAlert?.title ?? ''}
        message={activeAlert?.message ?? ''}
        confirmText={activeAlert?.confirmText ?? 'OK'}
        onConfirm={hideAlert}
        onClose={hideAlert}
      />
    </AlertContext>
  )
}

export function useAlert() {
  const context = use(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }

  return context
}
