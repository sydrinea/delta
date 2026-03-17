"use client";

import { useEffect, useRef, useState } from "react";
import { instance } from "@viz-js/viz";
import type { NFA } from "@/lib/compiler/nfa";
import { toDot } from "@/lib/compiler/dot";

interface AutomataViewerProps {
  nfa: NFA;
  activeStates?: Set<string>;
}

export function AutomataViewer({ nfa, activeStates }: AutomataViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dot = toDot(nfa, activeStates);
    instance().then((viz) => {
      try {
        const svg = viz.renderSVGElement(dot);
        svg.style.maxWidth = "100%";
        svg.style.maxHeight = "60vh";
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(svg);
        }
      } catch (e) {
        setError(String(e));
      }
    });
  }, [nfa, activeStates]);

  if (error) {
    return <div className="text-red-500 text-sm font-mono p-4">{error}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl p-6 border border-zinc-200 flex items-center justify-center min-h-48"
    />
  );
}
