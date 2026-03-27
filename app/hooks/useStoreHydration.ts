import { useEffect, useState } from "react";
import { useDeltaStore } from "@/store/deltaStore";

export function useStoreHydration() {
  const [isStoreHydrated, setIsStoreHydrated] = useState(() =>
    useDeltaStore.persist.hasHydrated(),
  );
  const [hasMetLoaderMinimum, setHasMetLoaderMinimum] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasMetLoaderMinimum(true);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const unhydrate = useDeltaStore.persist.onHydrate(() => {
      setIsStoreHydrated(false);
    });

    const finishHydration = useDeltaStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });

    return () => {
      unhydrate();
      finishHydration();
    };
  }, []);

  return isStoreHydrated && hasMetLoaderMinimum;
}
