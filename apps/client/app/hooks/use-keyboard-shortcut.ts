import { useCallback, useEffect } from 'react'

interface Shortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  preventDefault?: boolean
  handler: () => void
}

export function useKeyboardShortcut(shortcuts: Shortcut | Shortcut[], isActive: boolean = true) {
  const handle = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      const isInput
        = target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable
          || target.closest?.('[contenteditable="true"]')

      if (isInput)
        return

      const list = Array.isArray(shortcuts) ? shortcuts : [shortcuts]
      for (const shortcut of list) {
        const metaMatch = shortcut.meta
          ? e.metaKey || e.ctrlKey
          : !shortcut.ctrl || e.ctrlKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !shortcut.shift
        const altMatch = shortcut.alt ? e.altKey : !shortcut.alt
        const keyMatch = e.key === shortcut.key

        if (metaMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault !== false)
            e.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handle)
    }
    return () => window.removeEventListener('keydown', handle)
  }, [isActive, handle])
}
