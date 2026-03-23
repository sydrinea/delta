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
import { deserialize } from "@/lib/compiler/serialize";
import { nfaToCode } from "@/lib/compiler/nfaToCode";
import { Check } from "@/icons/Check";
import { Share } from "@/icons/Share";

export default function Home() {
  return (
    <section className="flex md:flex-col md:h-screen md:overflow-hidden">
      <NFAPage />
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const machineId = params.get("m");
    const anfParam = params.get("anf");

    const SHARE_URL = window.location.hostname.includes("comptheory.tools")
      ? "https://share.comptheory.tools"
      : "https://share.delta.sydneyn.dev";

    if (machineId) {
      fetch(`${SHARE_URL}/anf/${machineId}`)
        .then((res) => res.json() as Promise<{ anf: string; code: string }>)
        .then(({ anf, code }) => {
          setAnf(anf);
          setEditorValue(code);
        })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
    } else if (anfParam) {
      setAnf(anfParam);
      try {
        const m = deserialize(anfParam);
        setEditorValue(nfaToCode(m));
      } catch {}
      window.history.replaceState({}, "", window.location.pathname);
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
      // fallback to ANF in URL
      const url = `${window.location.origin}?anf=${encodeURIComponent(anf)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
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
              <a
                className={`text-xs px-3 py-1 rounded-lg ${editorErrors ? "text-ctp-red" : "text-ctp-green"} transition-colors`}
              >
                {editorErrors ? "✗ check errors" : "✓ valid"}
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

function LeftPanel() {
  const [activeTab, setActiveTab] = useState<LeftTab>("editor");

  const machine = useDeltaStore((s) => s.machine);
  const setNodes = useDeltaStore((s) => s.setNodes);
  const setEdges = useDeltaStore((s) => s.setEdges);
  const setStartId = useDeltaStore((s) => s.setStartId);

  const handleTabChange = (tab: LeftTab) => {
    if (
      (activeTab === "editor" || activeTab === "visualizer") &&
      tab === "canvas"
    ) {
      if (machine) {
        const { nodes, edges } = nfaToFlow(machine);
        setNodes(nodes);
        setEdges(edges);
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
          <DeltaEditor />
        ) : activeTab === "visualizer" ? (
          <Trace />
        ) : (
          <FlowEditor />
        )}
      </div>
    </div>
  );
}
