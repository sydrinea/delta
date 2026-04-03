import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'

export type SlicePatch<T> = Partial<T> | ((slice: T) => Partial<T>)

export function applyPatch<T extends object>(
  slice: T,
  patch: SlicePatch<T>,
): T {
  const nextPatch = typeof patch === 'function' ? patch(slice) : patch
  return { ...slice, ...nextPatch }
}

const LEGACY_STORE_KEY = 'delta-store'

function getLegacySlice(
  legacyRaw: string,
  targetStoreName: string,
): string | null {
  try {
    const parsed = JSON.parse(legacyRaw)
    const state = parsed?.state
    if (!state)
      return null

    const mappedState = {
      'delta-app-store': state.app,
      'delta-nfa-store': state.nfa,
      'delta-tm-store': state.tm,
    }[targetStoreName]

    if (!mappedState)
      return null

    return JSON.stringify({ state: mappedState })
  }
  catch {
    return null
  }
}

const hybridStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const sessionValue = sessionStorage.getItem(name)
    if (sessionValue)
      return sessionValue

    const localValue = localStorage.getItem(name)
    if (localValue)
      return localValue

    const legacySessionValue = sessionStorage.getItem(LEGACY_STORE_KEY)
    if (legacySessionValue) {
      const fromLegacySession = getLegacySlice(legacySessionValue, name)
      if (fromLegacySession)
        return fromLegacySession
    }

    const legacyLocalValue = localStorage.getItem(LEGACY_STORE_KEY)
    if (!legacyLocalValue)
      return null

    return getLegacySlice(legacyLocalValue, name)
  },

  setItem: (name: string, value: string): void => {
    sessionStorage.setItem(name, value)
    localStorage.setItem(name, value)
  },

  removeItem: (name: string): void => {
    sessionStorage.removeItem(name)
    localStorage.removeItem(name)
  },
}

export const createHybridStorage = () => createJSONStorage(() => hybridStorage)
