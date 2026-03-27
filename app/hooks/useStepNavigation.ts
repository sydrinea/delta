import { useEffect, useRef, useState } from "react";
import { useKeyboardShortcut } from "./useKeyboardShortcut";

interface UseStepNavigationOptions {
  maxStep: number;
  resetDeps?: readonly unknown[];
  focusRequiredForKeys?: boolean;
  enableSwipe?: boolean;
}

export function useStepNavigation({
  maxStep,
  resetDeps = [],
  focusRequiredForKeys = true,
  enableSwipe = false,
}: UseStepNavigationOptions) {
  const [step, setStep] = useState(0);
  const [focused, setFocused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setStep((prev) => Math.min(prev, maxStep));
  }, [maxStep]);

  useEffect(() => {
    setStep(0);
  }, resetDeps);

  const goNext = () => {
    if (focusRequiredForKeys && !focused) return;
    setStep((s) => Math.min(s + 1, maxStep));
  };

  const goPrev = () => {
    if (focusRequiredForKeys && !focused) return;
    setStep((s) => Math.max(s - 1, 0));
  };

  useKeyboardShortcut([
    {
      key: "ArrowRight",
      preventDefault: true,
      handler: goNext,
    },
    {
      key: "ArrowLeft",
      preventDefault: true,
      handler: goPrev,
    },
  ]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || touchStartX.current === null) return;

    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) return;
    if (delta < 0) {
      setStep((s) => Math.min(s + 1, maxStep));
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  return {
    step,
    setStep,
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onTouchStart,
    onTouchEnd,
  };
}
