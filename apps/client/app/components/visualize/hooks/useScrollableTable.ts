"use client";

import { useRef, useCallback } from "react";

export function useScrollableTable<
  TElement extends HTMLElement = HTMLDivElement,
>() {
  const scrollContainerRef = useRef<TElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollRowToCenter = useCallback((itemId: string | null) => {
    if (!itemId) return;

    const container = scrollContainerRef.current;
    const rowElement = rowRefs.current[itemId];

    if (!container || !rowElement) {
      return;
    }

    const targetTop =
      rowElement.offsetTop -
      (container.clientHeight / 2 - rowElement.clientHeight / 2);
    const maxScroll = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );
    const boundedTop = Math.max(0, Math.min(targetTop, maxScroll));

    container.scrollTo({ top: boundedTop, behavior: "smooth" });
  }, []);

  return { scrollContainerRef, rowRefs, scrollRowToCenter };
}
