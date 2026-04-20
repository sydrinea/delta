'use client'

import { useEffect } from 'react'
import { useToast } from '../../providers'

export function OfflineReadyToast() {
  const { setToast } = useToast()

  useEffect(() => {
    if (!('serviceWorker' in navigator))
      return

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        setToast('Ready to use offline', 3000)
      }
    })
  }, [setToast])

  return null
}
