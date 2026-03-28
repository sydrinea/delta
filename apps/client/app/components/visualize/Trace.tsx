"use client";

import { Fragment, useState, useMemo, useRef, type ReactNode } from "react";
import { GraphvizViewer } from "./GraphvizViewer";
import { useStepNavigation } from "@/hooks/useStepNavigation";
import { type TestCase } from "@delta/examples";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";

interface TraceStep {
  states: Set<string>;
  tapes?: string[][];
}

interface TraceSimulationResult {
  accepted: boolean;
  trace: TraceStep[];
}

interface VisualMachine {
  name: string;
}

interface TraceInputArgs {
  input: string;
  current: TraceStep;
  step: number;
  maxStep: number;
  isLast: boolean;
}

interface TraceInputToken {
  key: string;
  text: string;
  className: string;
  row?: number;
}

interface TraceProps<M extends VisualMachine> {
  machine: M | null;
  tests: TestCase[];
  simulate: (machine: M, input: string) => TraceSimulationResult;
  getDot: (machine: M, states: Set<string>) => string;
  inputFilter?: (value: string) => string | null;
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[];
  bottomPanel?: (context: TraceBottomPanelContext<M>) => ReactNode;
}

export interface TraceBottomPanelContext<M extends VisualMachine> {
  machine: M;
  current: TraceStep;
  step: number;
  maxStep: number;
  isLast: boolean;
  input: string;
  accepted: boolean;
  dot: string;
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (edgeId: string | null) => void;
}

export function Trace<M extends VisualMachine>({
  machine,
  tests,
  simulate,
  getDot,
  getInputTokens,
  bottomPanel,
}: TraceProps<M>) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTest, setSelectedTest] = useState("");
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const simulation = useMemo(() => {
    if (!machine) return null;
    return simulate(machine, input);
  }, [input, machine, simulate]);

  const trace = simulation?.trace ?? [];
  const maxStep = Math.max(0, trace.length - 1);

  const { step, focused, onFocus, onBlur, onTouchStart, onTouchEnd } =
    useStepNavigation({
      maxStep,
      resetDeps: [input, machine],
      focusRequiredForKeys: true,
      enableSwipe: true,
    });

  const safeStep = Math.min(step, maxStep);
  const current = trace[safeStep];
  const dot = useMemo(() => {
    if (!machine || !current) return null;
    return getDot(machine, current.states);
  }, [machine, current, getDot]);

  const isEmpty = input === "";
  const isLast = safeStep === maxStep;
  const accepted = simulation?.accepted ?? false;

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
    const selected = tests.find((t) => t.id === testId);
    if (selected) setInput(selected.input);
  };

  const selectedTestCase = tests.find((t) => t.id === selectedTest);

  const tokenRows = useMemo(() => {
    const tokens =
      getInputTokens({
        input,
        current: current ?? { states: new Set<string>(), tapes: [] },
        step: safeStep,
        maxStep,
        isLast,
      }) ?? [];

    const rows = new Map<number, TraceInputToken[]>();
    tokens.forEach((token) => {
      const row = token.row ?? 0;
      const existing = rows.get(row) ?? [];
      existing.push(token);
      rows.set(row, existing);
    });

    return [...rows.entries()].sort((a, b) => a[0] - b[0]);
  }, [getInputTokens, input, current, safeStep, maxStep, isLast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInput(nextValue);
    const match = tests.find((t) => t.input === nextValue);
    setSelectedTest(match?.id ?? "");
  };

  if (!machine) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
        Compile a machine to visualize execution.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="flex flex-col gap-4 md:p-4 h-full overflow-y-scroll focus:outline-none"
    >
      {/* input + test picker */}
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="input string"
          className="flex-1 w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve font-mono"
        />
        <Listbox value={selectedTest} onChange={handleTestSelect}>
          <div className="relative w-full md:w-auto">
            <ListboxButton className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg pl-3 pr-8 py-1.5 text-sm text-left text-ctp-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-ctp-mauve">
              <span className={selectedTestCase ? "" : "text-ctp-subtext1"}>
                {selectedTestCase
                  ? `${selectedTestCase.input === "" ? "ε" : selectedTestCase.input} - ${selectedTestCase.expected ? "accept" : "reject"}`
                  : "pick test"}
              </span>
            </ListboxButton>

            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ctp-overlay0 pointer-events-none"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 4L6 8L10 4" />
            </svg>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-ctp-surface1 bg-ctp-mantle py-1 text-sm shadow-lg focus:outline-none">
                {tests.map((t) => (
                  <ListboxOption
                    key={t.id}
                    value={t.id}
                    className="cursor-pointer select-none px-3 py-1.5 text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
                  >
                    {t.input === "" ? "ε" : t.input} -{" "}
                    {t.expected ? "accept" : "reject"}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* graph + optional bottom panel */}
      {machine && current && dot && (
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <GraphvizViewer
              dot={dot}
              machineName={machine.name}
              showExportActions
              onEdgeHover={bottomPanel ? setHoveredEdgeId : undefined}
            />
          </div>
          {bottomPanel?.({
            machine,
            current,
            step: safeStep,
            maxStep,
            isLast,
            input,
            accepted,
            dot,
            hoveredEdgeId,
            setHoveredEdgeId,
          })}
        </div>
      )}

      {!isEmpty && current && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col gap-1 text-lg tracking-widest w-full">
            {tokenRows.map(([row, tokens]) => (
              <div key={row} className="flex items-center gap-2 justify-center">
                {tokenRows.length > 1 && (
                  <span className="text-xs text-ctp-subtext1 min-w-12 text-right">
                    T{row + 1}:
                  </span>
                )}
                {tokens.map((token) => (
                  <span key={token.key} className={token.className}>
                    {token.text}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm text-ctp-subtext0">
            <span>
              step <span className="text-ctp-text font-bold">{safeStep}</span> /{" "}
              {maxStep}
            </span>
            <span className="hidden md:inline">·</span>
            <span>
              active{" "}
              <span className="text-ctp-mauve font-bold">
                {`{${[...current.states].join(", ")}}`}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* result */}
      {(isEmpty || isLast) && (
        <p
          className={`text-sm font-bold text-center ${accepted ? "text-ctp-green" : "text-ctp-red"}`}
        >
          {accepted ? "✓ accepted" : "✗ rejected"}
        </p>
      )}

      {!focused && !isEmpty && (
        <p className="text-ctp-overlay0 text-xs text-center">
          click to focus · ← → to step
        </p>
      )}

      {focused && !isEmpty && (
        <p className="text-ctp-overlay0 text-xs text-center">← → to step</p>
      )}
    </div>
  );
}
