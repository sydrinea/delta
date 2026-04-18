import { useEffect, useRef, useState } from 'react'
import { useKeyboardShortcut } from './use-keyboard-shortcut'

interface UseStepNavigationOptions {
  maxStep: number
  resetDeps?: readonly unknown[]
  focusRequiredForKeys?: boolean
  enableSwipe?: boolean
}

export function useStepNavigation({
  maxStep,
  resetDeps = [],
  focusRequiredForKeys = true,
  enableSwipe = false,
}: UseStepNavigationOptions) {
  const [step, setStep] = useState(0)
  const [focused, setFocused] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const boundedStep = Math.min(step, maxStep)

  /* eslint-disable react/set-state-in-effect, react/exhaustive-deps -- resetDeps is an intentional external trigger list that resets navigation to step 0. */
  useEffect(() => {
    setStep(0)
  }, resetDeps)
  /* eslint-enable react/set-state-in-effect, react/exhaustive-deps */

  const goNext = () => {
    if (focusRequiredForKeys && !focused)
      return
    setStep(Math.min(boundedStep + 1, maxStep))
  }

  const goPrev = () => {
    if (focusRequiredForKeys && !focused)
      return
    setStep(Math.max(boundedStep - 1, 0))
  }

  useKeyboardShortcut([
    {
      key: 'ArrowRight',
      preventDefault: true,
      handler: goNext,
    },
    {
      key: 'ArrowLeft',
      preventDefault: true,
      handler: goPrev,
    },
  ])

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe)
      return
    touchStartXRef.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || touchStartXRef.current === null)
      return

    const delta = e.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null

    if (Math.abs(delta) < 40)
      return
    if (delta < 0) {
      setStep(Math.min(boundedStep + 1, maxStep))
      return
    }
    setStep(Math.max(boundedStep - 1, 0))
  }

  return {
    step: boundedStep,
    setStep,
    stepBack: () => setStep(s => Math.max(0, s - 1)),
    stepForward: () => setStep(s => Math.min(maxStep, s + 1)),
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onTouchStart,
    onTouchEnd,
  }
}
