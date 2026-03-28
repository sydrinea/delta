"use client";

import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { createPortal } from "react-dom";
import { instance } from "@viz-js/viz";
import { Transition, TransitionChild } from "@headlessui/react";
import { Tooltip } from "../Tooltip";
import { Check } from "../icons/Check";
import { Graph } from "../icons/Graph";
import { Download } from "../icons/Download";
import { Copy } from "../icons/Copy";
import { Svg } from "../icons/Svg";
import { Fullscreen } from "../icons/Fullscreen";
import { Minimize } from "../icons/Minimize";
import { toPng, toSvg } from "./helpers";

interface GraphvizViewerProps {
  dot: string;
  machineName: string;
  showExportActions?: boolean;
  onEdgeHover?: (transitionId: string | null) => void;
  fullscreenNodesep?: number;
  fullscreenRanksep?: number;
}

type ActionType = "png" | "svg" | "dot" | "download" | null;

function withFullscreenLayout(
  dot: string,
  nodesep: number,
  ranksep: number,
): string {
  const lines = dot.split("\n");
  const rankdirIndex = lines.findIndex((line) =>
    line.trim().startsWith("rankdir="),
  );

  const upsertGraphAttribute = (key: string, value: string) => {
    const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
    const nextLine = `  ${key}=${value}`;

    if (index >= 0) {
      lines[index] = nextLine;
      return;
    }

    if (rankdirIndex >= 0) {
      lines.splice(rankdirIndex + 1, 0, nextLine);
    }
  };

  upsertGraphAttribute("nodesep", nodesep.toString());
  upsertGraphAttribute("ranksep", ranksep.toString());

  return lines.join("\n");
}

export function GraphvizViewer({
  dot,
  machineName,
  showExportActions = false,
  onEdgeHover,
  fullscreenNodesep = 1.25,
  fullscreenRanksep = 1.4,
}: GraphvizViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionType>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fullscreenDot = useMemo(
    () => withFullscreenLayout(dot, fullscreenNodesep, fullscreenRanksep),
    [dot, fullscreenNodesep, fullscreenRanksep],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bindEdgeHover = (svg: SVGSVGElement) => {
      if (!onEdgeHover) {
        return () => undefined;
      }

      const cleanups: Array<() => void> = [];
      const edgeGroups = svg.querySelectorAll<SVGGElement>("g.edge");

      edgeGroups.forEach((edgeGroup) => {
        const transitionId = edgeGroup.getAttribute("id");
        if (!transitionId) {
          return;
        }

        const onEnter = () => onEdgeHover(transitionId);
        const onLeave = () => onEdgeHover(null);

        edgeGroup.addEventListener("mouseenter", onEnter);
        edgeGroup.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          edgeGroup.removeEventListener("mouseenter", onEnter);
          edgeGroup.removeEventListener("mouseleave", onLeave);
        });
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    };

    instance().then((viz) => {
      try {
        if (cancelled) return;

        const standardSvg = viz.renderSVGElement(dot);
        standardSvg.style.maxWidth = "100%";
        standardSvg.style.maxHeight = "60vh";
        const cleanupStandardHover = bindEdgeHover(standardSvg);

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(standardSvg);
        }

        if (fullscreenContainerRef.current) {
          const fullscreenSvg = viz.renderSVGElement(fullscreenDot);
          fullscreenSvg.style.maxWidth = "100%";
          fullscreenSvg.style.maxHeight = "100%";
          const cleanupFullscreenHover = bindEdgeHover(fullscreenSvg);
          fullscreenContainerRef.current.innerHTML = "";
          fullscreenContainerRef.current.appendChild(fullscreenSvg);

          if (cancelled) {
            cleanupFullscreenHover();
          }
        }

        if (cancelled) {
          cleanupStandardHover();
        }

        setError(null);
      } catch (e) {
        setError(String(e));
      }
    });

    return () => {
      cancelled = true;
      onEdgeHover?.(null);
    };
  }, [dot, fullscreenDot, isFullscreen, onEdgeHover]);

  useEffect(() => {
    if (!isFullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const triggerActionFeedback = (type: ActionType) => {
    setActionState(type);
    setTimeout(() => setActionState(null), 2000);
  };

  const getSvg = () => containerRef.current?.querySelector("svg") ?? null;

  const handleCopyDot = () => {
    navigator.clipboard.writeText(dot);
    triggerActionFeedback("dot");
  };

  const handleCopySvg = () => {
    const svg = getSvg();
    if (!svg) return;

    navigator.clipboard.writeText(toSvg(svg));
    triggerActionFeedback("svg");
  };

  const handleDownloadPng = async () => {
    const svg = getSvg();
    if (!svg) return;

    try {
      const blob = await toPng(svg);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${machineName || "automata"}.png`;
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
    const svg = getSvg();
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

  const exportActions = [
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
    return <div className="text-ctp-red text-sm p-4">{error}</div>;
  }

  const renderViewerContent = (fullscreenMode: boolean) => (
    <>
      <div
        ref={fullscreenMode ? fullscreenContainerRef : containerRef}
        className="bg-ctp-mantle rounded-2xl p-6 border border-ctp-surface0 flex items-center justify-center min-h-48 overflow-hidden h-full"
      />

      {showExportActions && (
        <div className="absolute bottom-3 left-3 flex flex-row items-center p-1 rounded-full bg-ctp-crust/80 backdrop-blur-sm border border-ctp-surface1 shadow-sm">
          {exportActions.map(
            ({ id, label, color, icon: Icon, handler }, index) => (
              <Fragment key={id}>
                <Tooltip label={label}>
                  <button
                    onClick={handler}
                    className={`shrink-0 hover:cursor-pointer p-1.5 rounded-full text-ctp-overlay0 ${color} hover:bg-ctp-surface0 transition-colors flex items-center justify-center w-7 h-7`}
                  >
                    {actionState === id ? <Check /> : <Icon />}
                  </button>
                </Tooltip>

                {index < exportActions.length - 1 && (
                  <div className="w-px h-4 bg-ctp-surface1 shrink-0 mx-1" />
                )}
              </Fragment>
            ),
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex flex-row items-center p-1 rounded-full bg-ctp-crust/80 backdrop-blur-sm border border-ctp-surface1 shadow-sm">
        <Tooltip label={fullscreenMode ? "Exit Fullscreen" : "Fullscreen"}>
          <button
            onClick={() => setIsFullscreen((value) => !value)}
            className="shrink-0 hover:cursor-pointer p-1.5 rounded-full text-ctp-overlay0 hover:text-ctp-mauve hover:bg-ctp-surface0 transition-colors flex items-center justify-center w-7 h-7"
          >
            {isFullscreen ? <Minimize /> : <Fullscreen />}
          </button>
        </Tooltip>
      </div>
    </>
  );

  return (
    <>
      <div className="relative group">{renderViewerContent(false)}</div>

      {isMounted &&
        createPortal(
          <Transition as={Fragment} show={isFullscreen}>
            <div
              className="fixed inset-0 z-120 p-3 sm:p-4 md:p-6"
              onClick={() => setIsFullscreen(false)}
            >
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute inset-0 bg-ctp-crust/35 backdrop-blur-sm" />
              </TransitionChild>

              <TransitionChild
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-180"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div
                  className="relative h-full w-full rounded-2xl border border-ctp-surface1 bg-ctp-base/95 shadow-2xl overflow-hidden"
                  onClick={(event) => event.stopPropagation()}
                >
                  {renderViewerContent(true)}
                </div>
              </TransitionChild>
            </div>
          </Transition>,
          document.body,
        )}
    </>
  );
}
