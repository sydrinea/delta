"use client";

import { useState } from "react";
import { DeltaEditor } from "@/components/DeltaEditor";
import { DeltaProvider, useDelta } from "@/context/DeltaContext";
import { AutomataViewer } from "@/components/AutomataViewer";
import { TestSuite } from "@/components/TestSuite";
import { Visualizer } from "@/components/Visualizer";
import { Tooltip } from "@/components/Tooltip";
import { ExecutionError, runCode } from "./runCode";
import { FlowEditor } from "@/components/FlowEditor";
import { nfaToFlow } from "@/lib/compiler/toFlow";
import { Check } from "@/icons/Check";
import { Copy } from "@/icons/Copy";

export default function Home() {
  return (
    <DeltaProvider label="nfa">
      <section className="md:hidden h-screen bg-ctp-base flex flex-col overflow-hidden font-mono m-5 text-center">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-ctp-subtext0 text-sm">
            Delta isn't available for windows this narrow. Please resize your
            web browser or try a larger device.
          </p>
        </div>
      </section>
      <section className="hidden md:flex md:flex-col md:h-screen md:overflow-hidden">
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

  const handleCopyANF = () => {
    if (anf) {
      navigator.clipboard.writeText(anf);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* left — editor */}
      <div className="flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <LeftPanel
          setAnf={setAnf}
          setEditorError={setEditorError}
          editorError={editorError}
        />
      </div>

      {/* right — preview + tests */}
      <div className="flex flex-col w-1/2 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tooltip label="cmd+s">
                <button
                  onClick={() => runCode(editorValue, setAnf, setEditorError)}
                  className="text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  compile
                </button>
              </Tooltip>
              <p
                className={`text-xs font-mono ${editorError ? "text-ctp-red" : "text-ctp-green"}`}
              >
                {editorError ? "✗ failed to compile; check errors" : "✓ valid"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-ctp-text text-sm font-bold uppercase tracking-widest">
                {machine?.name ?? "untitled"}
              </h1>
              <Tooltip label="Copy ANF">
                <button
                  onClick={handleCopyANF}
                  className="text-ctp-overlay0 hover:text-ctp-text transition-colors flex items-center"
                >
                  {copied ? <Check /> : <Copy />}
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
            {machine && <AutomataViewer nfa={machine} />}
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
          <Visualizer />
        ) : (
          <FlowEditor />
        )}
      </div>
    </div>
  );
}
