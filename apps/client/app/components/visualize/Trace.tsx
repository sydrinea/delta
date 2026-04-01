"use client";

import { useMemo, useRef, Fragment } from "react";
import { useTraceContext, type VisualMachine } from "./TraceContext";
import { type NFA } from "@delta/build";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";

export function Trace<M extends VisualMachine>() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    machine,
    tests,
    input,
    setInput,
    selectedTest,
    setSelectedTest,
    trace,
    step,
    maxStep,
    safeStep,
    current,
    isEmpty,
    isLast,
    accepted,
    focused,
    onFocus,
    onBlur,
    onTouchStart,
    onTouchEnd,
    getInputTokens,
    bottomPanel,
    dot,
    hoveredEdgeId,
    setHoveredEdgeId,
  } = useTraceContext<M>();

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

    const rows = new Map<number, any[]>();
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

  // History panel details
  const history = useMemo(() => {
    return trace.slice(0, safeStep + 1);
  }, [trace, safeStep]);

  // NFA active transition calculations
  const activeTransitions = useMemo(() => {
    if (!machine || !current) return null;
    if ("transitions" in machine === false) return null; // Only for NFAs/DFAs
    const nfaMachine = machine as unknown as NFA;

    const prevStep = safeStep > 0 ? trace[safeStep - 1] : null;
    const prevStates = prevStep?.states ?? new Set([nfaMachine.startState]);
    const readSymbol = input[safeStep - 1] ?? null;

    // Evaluate regular rules from previous states taking the current symbol
    const evaluated: {
      from: string;
      symbol: string | null;
      to: Set<string>;
    }[] = [];

    if (readSymbol) {
      for (const st of prevStates) {
        const targets = nfaMachine.transitions.get(st)?.get(readSymbol);
        if (targets && targets.size > 0) {
          evaluated.push({ from: st, symbol: readSymbol, to: targets });
        }
      }
    }

    // Check for Epsilon additions in the current states not accounted for by explicitly targeted transitions
    const explicitTargets = new Set(evaluated.flatMap((e) => [...e.to]));
    const epsilonStates = new Set(
      [...current.states].filter(
        (s) =>
          !explicitTargets.has(s) && (readSymbol ? !prevStates.has(s) : true),
      ),
    );

    return { evaluated, epsilonStates, explicitTargets };
  }, [machine, current, safeStep, trace, input]);

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
      className="flex flex-col gap-4 md:p-4 focus:outline-none min-w-0 w-full max-w-full"
    >
      {/* input + test picker */}
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="input string"
          className="flex-1 w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
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
              <ListboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-ctp-surface1 bg-ctp-mantle py-1 text-sm shadow-lg focus:outline-none">
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

      {!isEmpty && current && (
        <div className="flex flex-col items-center gap-2 py-4 bg-ctp-mantle border border-ctp-surface0 rounded-lg w-full min-w-0 overflow-x-hidden box-border">
          <div className="flex flex-col gap-1 text-lg tracking-widest w-full min-w-0 px-4 box-border">
            {tokenRows.map(([row, tokens]) => (
              <div key={row} className="flex items-center gap-2 w-full min-w-0">
                {tokenRows.length > 1 && (
                  <span className="text-xs text-ctp-subtext1 min-w-8 text-right pr-2">
                    T{row + 1}:
                  </span>
                )}
                <div className="relative flex-1 basis-0 min-w-0 max-w-full overflow-hidden bg-ctp-crust p-1 rounded border border-ctp-surface1 h-10">
                  <div className="absolute inset-y-1 left-1/2 w-px bg-ctp-mauve/70 pointer-events-none" />
                  {(() => {
                    const activeIndex = tokens.findIndex(
                      (token) => token.isActive,
                    );
                    const centeredIndex =
                      activeIndex >= 0
                        ? activeIndex
                        : Math.floor(tokens.length / 2);
                    return (
                      <div
                        className="relative left-1/2 flex transition-transform duration-150 ease-out will-change-transform"
                        style={{
                          transform: `translateX(calc(-${centeredIndex * 32 + 16}px))`,
                        }}
                      >
                        {tokens.map((token) => (
                          <span
                            key={token.key}
                            className={`flex items-center justify-center w-8 h-8 font-mono text-lg rounded-sm shrink-0 ${token.className}`}
                          >
                            {token.text || "\u00A0"}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm text-ctp-subtext0 mt-2 px-4">
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

      {bottomPanel?.({
        machine,
        current: current ?? { states: new Set<string>() },
        trace,
        step: safeStep,
        maxStep,
        isLast,
        input,
        accepted,
        dot: dot ?? "",
        hoveredEdgeId,
        setHoveredEdgeId,
      })}

      {!focused && !isEmpty && (
        <p className="text-ctp-overlay0 text-xs text-center mt-auto">
          click to focus · ← → to step
        </p>
      )}

      {focused && !isEmpty && (
        <p className="text-ctp-overlay0 text-xs text-center mt-auto">
          ← → to step
        </p>
      )}
    </div>
  );
}
