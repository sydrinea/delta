"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import { instance } from "@viz-js/viz";
import type { NFA } from "@/lib/compiler/nfa";
import { toDot } from "@/lib/compiler/dot";
import { Tooltip } from "../Tooltip";
import { Check } from "../icons/Check";
import { Graph } from "../icons/Graph";
import { Download } from "../icons/Download";
import { Copy } from "../icons/Copy";
import { Svg } from "../icons/Svg";
import { toPng, toSvg } from "./helpers";

interface AutomataViewerProps {
  nfa: NFA;
  activeStates?: Set<string>;
}

type ActionType = "png" | "svg" | "dot" | "download" | null;

export function AutomataViewer({ nfa, activeStates }: AutomataViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionType>(null);

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

  const triggerActionFeedback = (type: ActionType) => {
    setActionState(type);
    setTimeout(() => setActionState(null), 2000);
  };

  const handleCopyDot = () => {
    navigator.clipboard.writeText(toDot(nfa, activeStates));
    triggerActionFeedback("dot");
  };

  const handleCopySvg = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    navigator.clipboard.writeText(toSvg(svg));
    triggerActionFeedback("svg");
  };

  const handleDownloadPng = async () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;

    try {
      const blob = await toPng(svg);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nfa.name || "automata"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerActionFeedback("download");
    } catch (err) {
      console.error("Failed to download image:", err);
    }
  };

  const handleCopyPng = async () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;

    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({ "image/png": toPng(svg) }),
      ]);
      triggerActionFeedback("png");
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
    }
  };

  const EXPORT_ACTIONS = [
    {
      id: "download",
      label: "Download PNG",
      color: "hover:text-ctp-mauve",
      icon: Download,
      handler: handleDownloadPng,
    },
    {
      id: "png",
      label: "Copy Image",
      color: "hover:text-ctp-green",
      icon: Copy,
      handler: handleCopyPng,
    },
    {
      id: "svg",
      label: "Copy SVG",
      color: "hover:text-ctp-yellow",
      icon: Svg,
      handler: handleCopySvg,
    },
    {
      id: "dot",
      label: "Copy DOT",
      color: "hover:text-ctp-blue",
      icon: Graph,
      handler: handleCopyDot,
    },
  ] as const;

  if (error) {
    return <div className="text-ctp-red text-sm font-mono p-4">{error}</div>;
  }

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="bg-ctp-mantle rounded-2xl p-6 border border-ctp-surface0 flex items-center justify-center min-h-48 overflow-hidden"
      />

      <div className="absolute bottom-3 left-3 flex flex-row items-center p-1 rounded-full bg-ctp-crust/80 backdrop-blur-sm border border-ctp-surface1 shadow-sm">
        {EXPORT_ACTIONS.map(
          ({ id, label, color, icon: Icon, handler }, index) => (
            <Fragment key={id}>
              <Tooltip label={label}>
                <button
                  onClick={handler}
                  className={`shrink-0 p-1.5 rounded-full text-ctp-overlay0 ${color} hover:bg-ctp-surface0 transition-colors flex items-center justify-center w-7 h-7`}
                >
                  {actionState === id ? <Check /> : <Icon />}
                </button>
              </Tooltip>

              {index < EXPORT_ACTIONS.length - 1 && (
                <div className="w-px h-4 bg-ctp-surface1 shrink-0 mx-1" />
              )}
            </Fragment>
          ),
        )}
      </div>
    </div>
  );
}
