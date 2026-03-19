"use client";

import { useEffect, useRef, useState } from "react";
import { instance } from "@viz-js/viz";
import type { NFA } from "@/lib/compiler/nfa";
import { toDot } from "@/lib/compiler/dot";
import { Tooltip } from "./Tooltip";

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
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="19" cy="5" r="2" />
                <circle cx="5" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="9" x2="5" y2="6" />
                <line x1="12" y1="9" x2="19" y2="6" />
                <line x1="12" y1="15" x2="5" y2="18" />
                <line x1="12" y1="15" x2="19" y2="18" />
              </svg>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
