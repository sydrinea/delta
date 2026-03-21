"use client";

import { useState } from "react";
import { DeltaEditor } from "@/components/editor/DeltaEditor";
import { DeltaProvider, useDelta } from "@/context/DeltaContext";
import { AutomataViewer } from "@/components/visualize/AutomataViewer";
import { TestSuite } from "@/components/TestSuite";
import { Trace } from "@/components/visualize/Trace";
import { Tooltip } from "@/components/Tooltip";
import { ExecutionError, runCode } from "./runCode";
import { FlowEditor } from "@/components/editor/FlowEditor";
import { nfaToFlow } from "@/lib/compiler/toFlow";
import { Check } from "@/icons/Check";
import { Share } from "@/icons/Share";

export default function Home() {
  return (
    <DeltaProvider label="nfa">
      <section className="flex md:flex-col md:h-screen md:overflow-hidden">
        <NFAPage />
      </section>
    </DeltaProvider>
  );
}

function NFAPage() {
  const {
    anf,
    machine,
    machineError,
    editorError,
    editorValue,
    setEditorError,
    setAnf,
  } = useDelta();

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const SHARE_URL = window.location.hostname.includes("comptheory.tools")
      ? "https://share.comptheory.tools"
      : "https://share.delta.sydneyn.dev";

    if (!anf) return;

    try {
      const res = await fetch(`${SHARE_URL}/anf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anf, code: editorValue }),
      });
      const { id } = (await res.json()) as { id: string };
      const url = `${window.location.origin}?m=${id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback to ANF in URL
      const url = `${window.location.origin}?anf=${encodeURIComponent(anf)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
      {/* left — editor */}
      {/* left panel — hidden on mobile */}
      <div className="hidden md:flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <LeftPanel
          setAnf={setAnf}
          setEditorError={setEditorError}
          editorError={editorError}
        />
      </div>

      {/* right — preview + tests */}
      {/* right panel — full width on mobile, half on desktop */}
      <div className="flex flex-col w-full md:w-1/2 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col-reverse lg:flex-row justify-between gap-3">
            <div className="flex items-center gap-y-3">
              <Tooltip label="cmd+s">
                <button
                  onClick={() => runCode(editorValue, setAnf, setEditorError)}
                  className="text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  compile
                </button>
              </Tooltip>
              <a
                className={`text-xs px-3 py-1 rounded-lg ${editorError ? "text-ctp-red" : "text-ctp-green"} transition-colors`}
              >
                {editorError ? "✗ check errors" : "✓ valid"}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-ctp-text text-sm lg:text-end font-bold uppercase tracking-widest max-w-56 xl:max-w-80 text-nowrap overflow-scroll">
                {machine?.name ?? "untitled"}
              </h1>
              <Tooltip label="Share Machine">
                <button
                  onClick={handleShare}
                  className="text-ctp-overlay0 hover:text-ctp-text transition-colors flex items-center"
                >
                  {copied ? <Check /> : <Share />}
                </button>
              </Tooltip>
            </div>
          </div>

          {machineError && (
            <div className="bg-ctp-red/10 border border-ctp-red/30 rounded-xl px-4 py-3">
              <p className="text-ctp-red text-xs font-mono leading-relaxed">
                {machineError}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* graph viewer — desktop only */}
            {machine && (
              <div className="hidden md:block">
                <AutomataViewer nfa={machine} />
              </div>
            )}
            {/* trace — mobile only */}
            {machine && (
              <div className="md:hidden">
                <Trace />
              </div>
            )}
            <TestSuite machine={machine} />
          </div>
        </div>
      </div>
    </div>
  );
}

type LeftTab = "editor" | "canvas" | "visualizer";

interface LeftPanelProps {
  setAnf: (anf: string) => void;
  setEditorError: (error: ExecutionError | null) => void;
  editorError: ExecutionError | null;
}

function LeftPanel({ setAnf, setEditorError, editorError }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>("editor");
  const { machine, setNodes, setEdges, setStartId } = useDelta();

  const handleTabChange = (tab: LeftTab) => {
    // editor → canvas: populate graph from compiled machine
    if (activeTab === "editor" && tab === "canvas") {
      if (machine) {
        const { nodes: newNodes, edges: newEdges } = nfaToFlow(machine);
        setNodes(newNodes);
        setEdges(newEdges);
        setStartId(machine.startState);
      }
    }

    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-ctp-surface0 shrink-0">
        {(["editor", "canvas", "visualizer"] as LeftTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`pb-2 text-xs transition-colors border-b-2 cursor-pointer ${
              activeTab === tab
                ? "text-ctp-text border-ctp-mauve"
                : "text-ctp-subtext0 border-transparent hover:text-ctp-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "editor" ? (
          <DeltaEditor
            onValidMachine={setAnf}
            onError={setEditorError}
            editorError={editorError}
          />
        ) : activeTab === "visualizer" ? (
          <Trace />
        ) : (
          <FlowEditor />
        )}
      </div>
    </div>
  );
}
