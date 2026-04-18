'use client'

import type { Theme } from '@/lib/theme'
import { useMemo } from 'react'
import { themeNames } from '@/lib/theme'

interface UseMachineDotOptions<M> {
  activeDot: string | null
  machine: M | null
  dotFromMachine: (machine: M, themeName: Theme) => string
  resolvedTheme: string | undefined
}

export function useMachineDot<M>({ activeDot, machine, dotFromMachine, resolvedTheme }: UseMachineDotOptions<M>) {
  const machineDot = useMemo(() => {
    if (activeDot)
      return activeDot
    if (!machine)
      return null
    return dotFromMachine(machine, themeNames[resolvedTheme ?? 'light'])
  }, [activeDot, dotFromMachine, machine, resolvedTheme])

  return { machineDot }
}
