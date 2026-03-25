"use client";

import { useState, useEffect } from "react";
import { DeltaEditor } from "@/components/editor/DeltaEditor";
import { useDeltaStore } from "@/store/deltaStore";
import { AutomataViewer } from "@/components/visualize/AutomataViewer";
import { TestSuite } from "@/components/TestSuite";
import { Trace } from "@/components/visualize/Trace";
import { Tooltip } from "@/components/Tooltip";
import { runCode } from "./runCode";
import { FlowEditor } from "@/components/editor/FlowEditor";
import { nfaToFlow } from "@/lib/compiler/toFlow";
import { Check } from "@/icons/Check";
import { Share } from "@/icons/Share";
import { ReactFlowProvider } from "reactflow";
import { ConfirmModal } from "./components/ConfirmModal";
import { containsCustomLogicOrComments } from "./lib/detect-custom-logic";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { Alert } from "./components/Alert";

export default function Home() {
  return (
    <section className="flex md:flex-col md:h-screen md:overflow-hidden">
      <NFAPage />
      <WhatsNewModal />
    </section>
  );
}

function NFAPage() {
  const anf = useDeltaStore((s) => s.anf);
  const setAnf = useDeltaStore((s) => s.setAnf);
  const machine = useDeltaStore((s) => s.machine);
  const machineError = useDeltaStore((s) => s.machineError);
  const editorErrors = useDeltaStore((s) => s.editorErrors);
  const editorValue = useDeltaStore((s) => s.editorValue);
  const setEditorErrors = useDeltaStore((s) => s.setEditorErrors);
  const setEditorValue = useDeltaStore((s) => s.setEditorValue);

  const [copied, setCopied] = useState(false);
  const [showShareError, setShowShareError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const machineId = params.get("m");

    const SHARE_URL = window.location.hostname.includes("comptheory.tools")
      ? "https://share.comptheory.tools"
      : "https://share.delta.sydneyn.dev";

    if (machineId) {
      fetch(`${SHARE_URL}/anf/${machineId}`)
        .then((res) => res.json() as Promise<{ anf: string; code: string }>)
        .then(({ code }) => {
          setEditorValue(code);
          runCode(code, setAnf, setEditorErrors);
        })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
    }
  }, [setAnf, setEditorValue]);

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
      setShowShareError(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
      <Alert
        isOpen={showShareError}
        title="Share Failed"
        message="Could not generate a share link right now. Please try again later."
        confirmText="OK"
        onConfirm={() => setShowShareError(false)}
        onClose={() => setShowShareError(false)}
      />
      <div className="hidden md:flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <LeftPanel />
      </div>
      <div className="flex flex-col w-full md:w-1/2 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col-reverse lg:flex-row justify-between gap-3">
            <div className="flex items-center gap-y-3">
              <Tooltip label="cmd+s">
                <button
                  onClick={() => runCode(editorValue, setAnf, setEditorErrors)}
                  className="text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  compile
                </button>
              </Tooltip>
              <p
                className={`text-xs px-3 py-1 rounded-lg ${editorErrors && editorErrors?.length > 0 ? "text-ctp-red" : "text-ctp-green"} transition-colors`}
              >
                {editorErrors && editorErrors?.length > 0
                  ? "✗ check errors"
                  : "✓ valid"}
              </p>
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

function LeftPanel() {
  const [activeTab, setActiveTab] = useState<LeftTab>("editor");
  const [showWarning, setShowWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<LeftTab | null>(null);

  const machine = useDeltaStore((s) => s.machine);
  const setNodes = useDeltaStore((s) => s.setNodes);
  const setEdges = useDeltaStore((s) => s.setEdges);
  const setStartId = useDeltaStore((s) => s.setStartId);
  const editorValue = useDeltaStore((s) => s.editorValue);
  const setEditorErrors = useDeltaStore((s) => s.setEditorErrors);

  const requestTabChange = (tab: LeftTab) => {
    if (
      tab === "canvas" &&
      activeTab !== "canvas" &&
      containsCustomLogicOrComments(editorValue)
    ) {
      setPendingTab(tab);
      setShowWarning(true);
      return;
    }

    setActiveTab(tab);
  };

  const confirmTabChange = () => {
    if (pendingTab === "canvas" && machine) {
      const { nodes, edges } = nfaToFlow(machine);
      setNodes(nodes);
      setEdges(edges);
      setStartId(machine.startState);
    }
    if (pendingTab) {
      setEditorErrors(null);
      setActiveTab(pendingTab);
    }
    setShowWarning(false);
    setPendingTab(null);
  };

  const cancelTabChange = () => {
    setShowWarning(false);
    setPendingTab(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-ctp-surface0 shrink-0">
        {(["editor", "canvas", "visualizer"] as LeftTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => requestTabChange(tab)}
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
          <DeltaEditor />
        ) : activeTab === "visualizer" ? (
          <Trace />
        ) : (
          <ReactFlowProvider>
            <FlowEditor />
          </ReactFlowProvider>
        )}
      </div>

      <ConfirmModal
        isOpen={showWarning}
        title="Switching to Canvas"
        message="Entering the canvas will automatically convert your code. Any custom formatting or comments will be lost. Do you want to continue?"
        confirmText="Convert to Canvas"
        cancelText={`Stay in ${activeTab.replace(/^[a-z]/, (s) => s.toUpperCase())}`}
        onConfirm={confirmTabChange}
        onCancel={cancelTabChange}
      />
    </div>
  );
}
