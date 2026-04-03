import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useNfaStore } from '@/store/nfaStore'
import { useTmStore } from '@/store/tmStore'

function hasHydratedAllStores() {
  return (
    useAppStore.persist.hasHydrated()
    && useNfaStore.persist.hasHydrated()
    && useTmStore.persist.hasHydrated()
  )
}

export function useStoreHydration() {
  const [isStoreHydrated, setIsStoreHydrated] = useState(hasHydratedAllStores)
  const [hasMetLoaderMinimum, setHasMetLoaderMinimum] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasMetLoaderMinimum(true)
    }, 500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const markHydrating = () => {
      setIsStoreHydrated(false)
    }

    const markFinished = () => {
      setIsStoreHydrated(hasHydratedAllStores())
    }

    const unhydrateApp = useAppStore.persist.onHydrate(markHydrating)
    const unhydrateNfa = useNfaStore.persist.onHydrate(markHydrating)
    const unhydrateTm = useTmStore.persist.onHydrate(markHydrating)

    const finishHydrationApp
      = useAppStore.persist.onFinishHydration(markFinished)
    const finishHydrationNfa
      = useNfaStore.persist.onFinishHydration(markFinished)
    const finishHydrationTm
      = useTmStore.persist.onFinishHydration(markFinished)

    return () => {
      unhydrateApp()
      unhydrateNfa()
      unhydrateTm()
      finishHydrationApp()
      finishHydrationNfa()
      finishHydrationTm()
    }
  }, [])

  return isStoreHydrated && hasMetLoaderMinimum
}
