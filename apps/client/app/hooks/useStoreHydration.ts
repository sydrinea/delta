import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAutomataStore } from '@/store/automataStore'
import { useNfaStore } from '@/store/nfaStore'

function hasHydratedAllStores() {
  return (
    useAppStore.persist.hasHydrated()
    && useAutomataStore.persist.hasHydrated()
    && useNfaStore.persist.hasHydrated()
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
    const unhydrateAutomata = useAutomataStore.persist.onHydrate(markHydrating)
    const unhydrateNfa = useNfaStore.persist.onHydrate(markHydrating)

    const finishHydrationApp = useAppStore.persist.onFinishHydration(markFinished)
    const finishHydrationAutomata = useAutomataStore.persist.onFinishHydration(markFinished)
    const finishHydrationNfa = useNfaStore.persist.onFinishHydration(markFinished)

    return () => {
      unhydrateApp()
      unhydrateAutomata()
      unhydrateNfa()
      finishHydrationApp()
      finishHydrationAutomata()
      finishHydrationNfa()
    }
  }, [])

  return isStoreHydrated && hasMetLoaderMinimum
}
