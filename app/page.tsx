"use client";

import { useState, useEffect, useCallback } from "react";
import { DeltaEditor } from "@/components/DeltaEditor";
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
  const [editorError, setEditorError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const m = deserialize(anf);
      const { trace } = simulate(m, input);
      setMachine(m);
      setTrace(trace);
      setStep(0);
      setError(null);
    } catch (e) {
      setError(`✗ ${String(e).substring(0, 70)}...`);
    }
  }, [anf, input]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!trace) return;
      if (e.key === "ArrowRight") {
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
    <main className="min-h-screen bg-ctp-base flex flex-col items-center justify-center gap-6 p-8 font-mono">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-ctp-text text-xl font-bold tracking-widest uppercase">
          delta
        </h1>
        <p className="text-ctp-subtext1 text-sm">{machine?.name ?? "—"}</p>
      </div>

      <div className="flex flex-row gap-8">
        <div className="flex flex-col gap-2">
          <DeltaEditor onValidMachine={setAnf} onError={setEditorError} />
          <div
            className={`rounded-lg px-3 py-2 min-h-8 transition-colors ${
              editorError
                ? "bg-ctp-red/20 border border-ctp-red"
                : "bg-ctp-green/20 border border-ctp-green"
            }`}
          >
            <p
              className={`text-xs ${editorError ? "text-ctp-red" : "text-ctp-green"}`}
            >
              {editorError ?? "✓ looks good"}
            </p>
          </div>
          <p className="text-ctp-subtext0 text-xs text-center">
            press ⌘ + enter to run
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 w-full max-w-2xl">
            <input
              type="text"
              value={anf}
              onChange={(e) => setAnf(e.target.value)}
              placeholder="ANF string"
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="input string"
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
            />
            {error && (
              <div className="bg-ctp-red/20 border border-ctp-red rounded-lg px-3 py-2">
                <p className="text-ctp-red text-xs">{error}</p>
              </div>
            )}
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

              <div className="flex items-center gap-4 text-sm text-ctp-subtext0">
                <span>
                  step <span className="text-ctp-text font-bold">{step}</span> /{" "}
                  {trace!.length - 1}
                </span>
                <span>·</span>
                <span>
                  active:{" "}
                  <span className="text-ctp-mauve font-bold">
                    {`{${[...current.states].join(", ")}}`}
                  </span>
                </span>
              </div>

              {accepted !== null ? (
                <p
                  className={`text-sm font-bold ${accepted ? "text-ctp-green" : "text-ctp-red"}`}
                >
                  {accepted ? "✓ accepted" : "✗ rejected"}
                </p>
              ) : (
                <p className="text-sm text-ctp-surface2">...</p>
              )}
            </div>
          )}

          <p className="text-ctp-subtext0 text-xs text-center pt-3">
            use arrow keys to step
          </p>
        </section>
      </div>
    </main>
  );
}
