"use client";

import { useState, useEffect, useRef } from "react";
import { useDeltaStore } from "@/store/deltaStore";
import { simulate } from "@/lib/simulator/nfa";
import { AutomataViewer } from "./AutomataViewer";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

export function Trace() {
  const { machine, tests } = useDeltaStore();
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [trace, setTrace] = useState<ReturnType<typeof simulate>["trace"]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [selectedTest, setSelectedTest] = useState("");

  // recompute trace when input or machine changes
  useEffect(() => {
    if (!machine) return;
    const { trace } = simulate(machine, input);
    setTrace(trace);
    setStep(0);
  }, [input, machine]);

  const current = trace[step];
  const isLast = step === trace.length - 1;
  const accepted =
    isLast && current
      ? [...current.states].some((s) => machine?.acceptStates.has(s))
      : null;

  // empty string — show result immediately
  const isEmpty = input === "";

  useKeyboardShortcut([
    {
      key: "ArrowRight",
      preventDefault: true,
      handler: () => {
        if (!focused) return;
        setStep((s) => Math.min(s + 1, trace.length - 1));
      },
    },
    {
      key: "ArrowLeft",
      preventDefault: true,
      handler: () => {
        if (!focused) return;
        setStep((s) => Math.max(s - 1, 0));
      },
    },
  ]);

  const handleTestSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTest(e.target.value);
    const selected = tests.find((t) => t.id === e.target.value);
    if (selected) setInput(selected.input);
  };

  // reset dropdown when user types manually
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    const match = tests.find((t) => t.input === value);
    setSelectedTest(match?.id ?? "");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // ignore small nudges
    if (delta < 0)
      setStep((s) => Math.min(s + 1, trace.length - 1)); // swipe left → forward
    else setStep((s) => Math.max(s - 1, 0)); // swipe right → back
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
        <div className="relative w-full md:w-auto">
          <select
            onChange={handleTestSelect}
            value={selectedTest}
            className="appearance-none w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg pl-3 pr-7 py-1.5 text-sm text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
          >
            <option value="" disabled>
              pick test
            </option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.input === "" ? "ε" : t.input} —{" "}
                {t.expected ? "accept" : "reject"}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ctp-overlay0 pointer-events-none"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 4L6 8L10 4" />
          </svg>
        </div>
      </div>

      {/* graph */}
      {machine && current && (
        <AutomataViewer
          nfa={machine}
          activeStates={isEmpty ? current.states : trace[step]?.states}
        />
      )}

      {/* input trace */}
      {!isEmpty && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2 text-lg tracking-widest">
            {input.split("").map((symbol, i) => {
              const isActive = !isLast && i === step;
              const isPast = isLast || i < step;
              return (
                <span
                  key={i}
                  className={
                    isActive
                      ? "text-ctp-mauve font-bold underline underline-offset-4"
                      : isPast
                        ? "text-ctp-surface2 line-through"
                        : "text-ctp-subtext1"
                  }
                >
                  {symbol}
                </span>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm text-ctp-subtext0">
            <span>
              step <span className="text-ctp-text font-bold">{step}</span> /{" "}
              {trace.length - 1}
            </span>
            <span className="hidden md:inline">·</span>
            <span>
              active{" "}
              <span className="text-ctp-mauve font-bold">
                {`{${[...(current?.states ?? [])].join(", ")}}`}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* result */}
      {(isEmpty || isLast) && accepted !== null && (
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
