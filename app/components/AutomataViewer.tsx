"use client";

import { useEffect, useRef, useState } from "react";
import { instance } from "@viz-js/viz";
import type { NFA } from "@/lib/compiler/nfa";
import { toDot } from "@/lib/compiler/dot";
import { Tooltip } from "./Tooltip";
import { Check } from "./icons/Check";
import { Graph } from "./icons/Graph";
import { Download } from "@/icons/Download";

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
    navigator.clipboard.writeText(toDot(nfa, activeStates));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;

    const bbox = svg.getBBox();
    const width = svg.width.baseVal.value || bbox.width;
    const height = svg.height.baseVal.value || bbox.height;

    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#1e1e2e"; // ctp-mantle
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, width * scale, height * scale);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${nfa.name || "automata"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (error) {
    return <div className="text-ctp-red text-sm font-mono p-4">{error}</div>;
  }

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="bg-ctp-mantle rounded-2xl p-6 border border-ctp-surface0 flex items-center justify-center min-h-48 overflow-hidden"
      />

      <div className="absolute bottom-3 left-3 flex flex-row items-center gap-1 p-1 rounded-full bg-ctp-crust/80 backdrop-blur-sm border border-ctp-surface1 shadow-sm shadow-ctp-crust">
        <Tooltip label="Download PNG">
          <button
            onClick={handleDownloadPng}
            className="p-1.5 rounded-full text-ctp-overlay0 hover:text-ctp-green hover:bg-ctp-surface0 transition-all"
          >
            <Download />
          </button>
        </Tooltip>
        <div className="w-px h-4 bg-ctp-surface1" />
        <Tooltip label="Copy GraphViz DOT">
          <button
            onClick={handleCopyDot}
            className="p-1.5 rounded-full text-ctp-overlay0 hover:text-ctp-mauve hover:bg-ctp-surface0 transition-all"
          >
            {copied ? <Check /> : <Graph />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
