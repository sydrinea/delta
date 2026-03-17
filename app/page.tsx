"use client";

import { useState, useEffect } from "react";
import { DeltaEditor } from "@/components/DeltaEditor";
import { AutomataViewer } from "@/components/AutomataViewer";
import { TestSuite } from "@/components/TestSuite";
import { deserialize } from "@/lib/compiler/serialize";
import type { NFA } from "@/lib/compiler/nfa";

const DEFAULT_ANF =
  "endsInAB|q0,q1,q2|a,b|q0|q2|q0>a>q0,q0>b>q0,q0>a>q1,q1>b>q2";

const DEFAULT_TESTS = [
  { id: crypto.randomUUID(), input: "ab", expected: true },
  { id: crypto.randomUUID(), input: "ababab", expected: true },
  { id: crypto.randomUUID(), input: "ba", expected: false },
  { id: crypto.randomUUID(), input: "", expected: false },
];

export default function Home() {
  const [anf, setAnf] = useState(DEFAULT_ANF);
  const [machine, setMachine] = useState<NFA | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const m = deserialize(anf);
      setMachine(m);
      setError(null);
    } catch (e) {
      setError(`✗ ${String(e).substring(0, 70)}...`);
    }
  }, [anf]);

  const handleCopyANF = () => {
    navigator.clipboard.writeText(anf);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-ctp-base flex flex-col items-center justify-center gap-6 p-8 font-mono">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-ctp-text text-xl font-bold tracking-widest uppercase">
          delta
        </h1>
        <p className="text-ctp-subtext1 text-sm">{machine?.name ?? "—"}</p>
      </div>

      <div className="flex flex-row gap-8 items-start">
        {/* left — editor */}
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
            press cmd+enter to recompile
          </p>
        </div>

        {/* right — preview + tests */}
        <section className="flex flex-col gap-4 w-96">
          {/* ANF field + copy button */}
          <div className="relative">
            <input
              type="text"
              value={anf}
              readOnly={true}
              placeholder="ANF string"
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 pr-10 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
            />
            <button
              onClick={handleCopyANF}
              title="copy ANF"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ctp-overlay0 hover:text-ctp-text transition-colors"
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-ctp-red/20 border border-ctp-red rounded-lg px-3 py-2">
              <p className="text-ctp-red text-xs">{error}</p>
            </div>
          )}

          {/* NFA preview */}
          {machine && <AutomataViewer nfa={machine} />}

          {/* test suite */}
          <TestSuite machine={machine} defaultTests={DEFAULT_TESTS} />
        </section>
      </div>
    </main>
  );
}
