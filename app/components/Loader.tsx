"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStoreHydration } from "@/hooks/useStoreHydration";
import {
  shouldAnimateLoader,
  shouldEnableLoader,
} from "@/lib/navigation-loader-config";

const MIN_NAVIGATION_LOADER_MS = 500;
const NAVIGATION_FALLBACK_TIMEOUT_MS = 1200;

interface NavigationStartEventDetail {
  to?: string;
  animate?: boolean;
}

export function Loader() {
  const isReady = useStoreHydration();
  const pathname = usePathname();
  const isLoaderEnabled = shouldEnableLoader(pathname);
  const [isNavigating, setIsNavigating] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(() =>
    shouldAnimateLoader(pathname),
  );
  const startedAtRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const startNavigation = (event: Event) => {
      const detail = (event as CustomEvent<NavigationStartEventDetail>).detail;
      const to = detail?.to;
      const eventAnimate = detail?.animate;

      setShouldAnimate(
        typeof eventAnimate === "boolean"
          ? eventAnimate
          : shouldAnimateLoader(to ?? pathname),
      );

      startedAtRef.current = Date.now();
      setIsNavigating(true);

      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }

      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }

      fallbackTimeoutRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        fallbackTimeoutRef.current = null;
        startedAtRef.current = null;
      }, NAVIGATION_FALLBACK_TIMEOUT_MS);
    };

    window.addEventListener("delta:navigation-start", startNavigation);

    return () => {
      window.removeEventListener("delta:navigation-start", startNavigation);
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }
      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const startedAt = startedAtRef.current;
    setShouldAnimate(shouldAnimateLoader(pathname));

    if (!startedAt) {
      setIsNavigating(false);
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_NAVIGATION_LOADER_MS - elapsed);

    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
    }

    settleTimeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      settleTimeoutRef.current = null;
      startedAtRef.current = null;
    }, remaining);
  }, [pathname]);

  if (!isLoaderEnabled || (isReady && !isNavigating)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-ctp-base">
      <div
        className="flex items-center gap-2"
        role="status"
        aria-live="polite"
        aria-label="Loading workbench"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={
              shouldAnimate
                ? "workbench-loader-dot bg-ctp-surface0"
                : "h-2 w-2 rounded-full bg-ctp-surface0"
            }
            style={
              shouldAnimate ? { animationDelay: `${index * 220}ms` } : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
