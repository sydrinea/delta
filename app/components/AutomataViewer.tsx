"use client";

import { useEffect, useRef, useState } from "react";
import { instance } from "@viz-js/viz";
import type { NFA } from "@/lib/compiler/nfa";
import { toDot } from "@/lib/compiler/dot";
import { Tooltip } from "./Tooltip";
import { Check } from "./icons/Check";
import { Graph } from "./icons/Graph";

interface AutomataViewerProps {
  nfa: NFA;
  activeStates?: Set<string>;
}

export function AutomataViewer({ nfa, activeStates }: AutomataViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyDot = () => {
    navigator.clipboard.writeText(toDot(nfa));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return <div className="text-ctp-red text-sm font-mono p-4">{error}</div>;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="bg-ctp-mantle rounded-2xl p-6 border border-ctp-surface0 flex items-center justify-center min-h-48"
      />
      <div className="absolute top-3 right-3">
        <Tooltip label="Copy GraphViz DOT">
          <button
            onClick={handleCopyDot}
            className="text-ctp-overlay0 hover:text-ctp-text transition-colors"
          >
            {copied ? <Check /> : <Graph />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
