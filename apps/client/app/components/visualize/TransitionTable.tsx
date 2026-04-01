"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type TuringMachine } from "@delta/build";
import {
  activeTupleFromTapes,
  buildTMTransitionRows,
  formatReadTuple,
} from "@/components/visualize/metadata";

interface TransitionTableCurrentStep {
  states: Set<string>;
  tapes?: string[][];
}

interface TransitionTableProps {
  machine: TuringMachine<any>;
  current: TransitionTableCurrentStep;
  hoveredEdgeId: string | null;
}

type TMTableMode = "all" | "state";

export function TransitionTable({
  machine,
  current,
  hoveredEdgeId,
}: TransitionTableProps) {
  const [tableMode, setTableMode] = useState<TMTableMode>("state");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const transitionRows = useMemo(
    () => buildTMTransitionRows(machine),
    [machine],
  );

  const currentState = useMemo(() => {
    const states = [...current.states].sort();
    return states[0] ?? null;
  }, [current]);

  const currentReadTuple = useMemo(
    () => activeTupleFromTapes(current.tapes),
    [current],
  );

  const stateRelevantRows = useMemo(() => {
    if (!currentState) {
      return [];
    }

    return transitionRows.filter((row) => row.fromState === currentState);
  }, [transitionRows, currentState]);

  const visibleRows = tableMode === "all" ? transitionRows : stateRelevantRows;

  const scrollRowToCenter = (row: (typeof transitionRows)[number]): void => {
    const container = scrollContainerRef.current;
    const rowElement = rowRefs.current[row.id];

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
  };

  const isCurrentTransition = (
    row: (typeof transitionRows)[number],
  ): boolean => {
    if (!currentState || !currentReadTuple) {
      return false;
    }

    if (row.fromState !== currentState) {
      return false;
    }

    if (row.readSymbols.length !== currentReadTuple.length) {
      return false;
    }

    return row.readSymbols.every(
      (symbol, index) => symbol === currentReadTuple[index],
    );
  };

  useEffect(() => {
    if (!hoveredEdgeId) {
      return;
    }

    const hoveredRow = visibleRows.find((row) => row.edgeId === hoveredEdgeId);
    if (!hoveredRow) {
      return;
    }

    scrollRowToCenter(hoveredRow);
  }, [hoveredEdgeId, visibleRows]);

  useEffect(() => {
    const activeRow = visibleRows.find((row) => isCurrentTransition(row));
    if (!activeRow) {
      return;
    }

    scrollRowToCenter(activeRow);
  }, [visibleRows, currentState, currentReadTuple]);

  return (
    <div className="w-full rounded-2xl border border-ctp-surface0 bg-ctp-mantle overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-ctp-surface0 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-ctp-subtext0">
          transitions
        </p>
        <div className="inline-flex rounded-lg border border-ctp-surface1 overflow-hidden text-xs">
          <button
            className={`cursor-pointer px-2 py-1 border-l border-ctp-surface1 ${tableMode === "state" ? "bg-ctp-surface0 text-ctp-text" : "text-ctp-subtext0 hover:text-ctp-text"}`}
            onClick={() => setTableMode("state")}
          >
            state
          </button>
          <button
            className={`cursor-pointer px-2 py-1 ${tableMode === "all" ? "bg-ctp-surface0 text-ctp-text" : "text-ctp-subtext0 hover:text-ctp-text"}`}
            onClick={() => setTableMode("all")}
          >
            all
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-auto max-h-96">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-ctp-crust/80 backdrop-blur-sm text-ctp-subtext0">
            <tr>
              <th className="px-2 py-2 border-b border-ctp-surface1">ID</th>
              <th className="px-2 py-2 border-b border-ctp-surface1">From</th>
              <th className="px-2 py-2 border-b border-ctp-surface1">To</th>
              {[...Array(machine.tapeCount).keys()].map((index) => (
                <th
                  key={`tape-col-${index}`}
                  className="px-2 py-2 border-b border-ctp-surface1"
                >
                  Tape {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isHovered = row.edgeId === hoveredEdgeId;
              const isCurrent = isCurrentTransition(row);
              const rowClassName = isCurrent
                ? "bg-ctp-green/20"
                : isHovered
                  ? "bg-ctp-surface0/70"
                  : "";

              return (
                <tr
                  key={row.id}
                  ref={(element) => {
                    rowRefs.current[row.id] = element;
                  }}
                  className={rowClassName}
                >
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-mauve font-semibold">
                    {row.id}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-text">
                    {row.fromState}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-text">
                    {row.toState}
                  </td>
                  {[...Array(machine.tapeCount).keys()].map((index) => {
                    const read = row.readSymbols[index] ?? "_";
                    const write = row.writeSymbols[index] ?? read;
                    const direction = row.directions[index] ?? "S";

                    return (
                      <td
                        key={`${row.id}-tape-${index}`}
                        className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-subtext1"
                      >
                        <span className="text-ctp-text">{read}</span>
                        <span className="px-1">-&gt;</span>
                        <span className="text-ctp-text">{write}</span>
                        <span className="pl-1 text-ctp-mauve">{direction}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={3 + machine.tapeCount}
                  className="px-2 py-4 text-center text-ctp-subtext0"
                >
                  {tableMode === "state"
                    ? "No transitions from the current state."
                    : "No transitions available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-ctp-surface0 text-[11px] text-ctp-subtext1">
        {tableMode === "state" && currentReadTuple
          ? `state ${currentState ?? "?"} · read ${formatReadTuple(currentReadTuple)}`
          : `${transitionRows.length} transitions`}
      </div>
    </div>
  );
}
