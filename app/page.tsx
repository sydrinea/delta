"use client";

import { useState, useEffect, useCallback } from "react";
import { AutomataViewer } from "@/components/AutomataViewer";
import { deserialize } from "@/lib/compiler/serialize";
import { simulate } from "@/lib/simulator/nfa";
import type { NFA } from "@/lib/compiler/nfa";
import type { SimulationResult } from "@/lib/simulator/nfa";

const DEFAULT_ANF =
  "endsInAB|q0,q1,q2|a,b|q0|q2|q0>a>q0,q0>b>q0,q0>a>q1,q1>b>q2";
const DEFAULT_INPUT = "aabab";

export default function Home() {
  const [anf, setAnf] = useState(DEFAULT_ANF);
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [machine, setMachine] = useState<NFA | null>(null);
  const [trace, setTrace] = useState<SimulationResult["trace"] | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // load machine whenever ANF or input changes
  useEffect(() => {
    try {
      const m = deserialize(anf);
      const { trace } = simulate(m, input);
      setMachine(m);
      setTrace(trace);
      setStep(0);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [anf, input]);

  // keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!trace) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setStep((s) => Math.min(s + 1, trace.length - 1));
      }
      if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(s - 1, 0));
      }
    },
    [trace],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const current = trace?.[step];
  const isLast = trace ? step === trace.length - 1 : false;
  const accepted =
    isLast && current
      ? [...current.states].some((s) => machine?.acceptStates.has(s))
      : null;

  return (
    <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6 p-8 font-mono">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-zinc-900 text-xl font-bold tracking-widest uppercase">
          delta
        </h1>
        <p className="text-zinc-400 text-sm">{machine?.name ?? "—"}</p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-2xl">
        <input
          type="text"
          value={anf}
          onChange={(e) => setAnf(e.target.value)}
          placeholder="ANF string"
          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="input string"
          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      {machine && current && (
        <AutomataViewer nfa={machine} activeStates={current.states} />
      )}

      {current && (
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
                      ? "text-rose-500 font-bold underline underline-offset-4"
                      : isPast
                        ? "text-zinc-300 line-through"
                        : "text-zinc-600"
                  }
                >
                  {symbol}
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>
              step <span className="text-zinc-900 font-bold">{step}</span> /{" "}
              {trace!.length - 1}
            </span>
            <span>·</span>
            <span>
              active:{" "}
              <span className="text-rose-500 font-bold">
                {`{${[...current.states].join(", ")}}`}
              </span>
            </span>
          </div>

          {accepted !== null && (
            <p
              className={`text-sm font-bold ${accepted ? "text-green-500" : "text-red-500"}`}
            >
              {accepted ? "✓ accepted" : "✗ rejected"}
            </p>
          )}
        </div>
      )}

      <p className="text-zinc-300 text-xs">← → to step · space to advance</p>
    </main>
  );
}
