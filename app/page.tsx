"use client";

import { useState } from "react";
import { DeltaEditor } from "@/components/DeltaEditor";
import { DeltaProvider, useDelta } from "@/context/DeltaContext";
import { AutomataViewer } from "@/components/AutomataViewer";
import { TestSuite } from "@/components/TestSuite";

export default function Home() {
  return (
    <DeltaProvider label="nfa">
      <NFAPage />
    </DeltaProvider>
  );
}

function NFAPage() {
  const {
    anf,
    machine,
    machineError,
    editorError,
    setEditorError,
    setAnf,
    tests,
  } = useDelta();
  const [copied, setCopied] = useState(false);

  const handleCopyANF = () => {
    if (anf) {
      navigator.clipboard.writeText(anf);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex">
      {/* left — editor */}
      <div
        className="flex flex-col border-r border-ctp-surface0 "
        style={{ width: "50%" }}
      >
        <DeltaEditor onValidMachine={setAnf} onError={setEditorError} />
      </div>

      {/* right — preview + tests */}
      <div className="flex flex-col overflow-y-auto" style={{ width: "50%" }}>
        <div className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg px-3 py-1.5 transition-colors ${
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
            <p className="text-ctp-subtext0 text-xs">cmd+S to compile</p>
          </div>
          {/* ANF field + copy button */}
          <div className="relative space-y-2">
            <h1 className="text-ctp-subtext1 text-lg font-bold text-center">
              {machine?.name ?? "—"}
            </h1>
            <input
              type="text"
              value={anf ?? ""}
              readOnly
              placeholder="ANF string"
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 pr-10 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none"
            />
            <button
              onClick={handleCopyANF}
              title="copy ANF"
              className="absolute right-2 bottom-1/6 -translate-y-1/2 text-ctp-overlay0 hover:text-ctp-text transition-colors"
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

          {machineError && (
            <div className="bg-ctp-red/20 border border-ctp-red rounded-lg px-3 py-2">
              <p className="text-ctp-red text-xs">{machineError}</p>
            </div>
          )}

          {machine && <AutomataViewer nfa={machine} />}

          <TestSuite machine={machine} defaultTests={tests} />
        </div>
      </div>
    </div>
  );
}
