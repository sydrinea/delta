"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ReactFlowProvider } from "reactflow";
import { useDeltaStore } from "@/store/deltaStore";
import { MachineTypes, type MachineType } from "@delta/proto";
import { type NFA, type TuringMachine } from "@delta/build";
import { nfaToFlow } from "@/lib/toFlow";
import { containsCustomLogicOrComments } from "@/lib/detect-custom-logic";
import { DeltaEditor } from "@/components/editor/DeltaEditor";
import { FlowEditor } from "@/components/editor/FlowEditor";
import {
  Trace,
  type TraceBottomPanelContext,
} from "@/components/visualize/Trace";
import { TransitionTable } from "@/components/visualize/TransitionTable";
import { GraphvizViewer } from "@/components/visualize/GraphvizViewer";
import { TestSuite } from "@/components/TestSuite";
import { Tooltip } from "@/components/Tooltip";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useMachineShare } from "@/hooks/useMachineShare";
import { useAlert } from "@/components/AlertProvider";
import { Check } from "@/icons/Check";
import { Share } from "@/icons/Share";
import { simulate as simulateNFA, simulateTM } from "@delta/simulator";
import { useCompile } from "@/hooks/useCompile";
import { recipes } from "../../recipes";
import { toDot, toDotTM } from "@/lib/dot";

type TabId = "editor" | "canvas" | "visualizer";

interface EnabledTabs {
  editor?: boolean;
  canvas?: boolean;
  visualizer?: boolean;
}

type WorkbenchScope = "nfa" | "tm";

interface WorkbenchProps<M> {
  simulate: (machine: M, input: string) => boolean;
  storeScope: WorkbenchScope;
  enabledTabs: EnabledTabs;
}

const TAB_ORDER: TabId[] = ["editor", "canvas", "visualizer"];

function isTabEnabled(enabledTabs: EnabledTabs, tab: TabId): boolean {
  return enabledTabs[tab] !== false;
}

function scopeToMachineType(scope: WorkbenchScope): MachineType {
  return scope === "nfa" ? MachineTypes.NFA : MachineTypes.TM;
}

function getInitialTab(enabledTabs: EnabledTabs): TabId {
  return TAB_ORDER.find((tab) => isTabEnabled(enabledTabs, tab)) ?? "editor";
}

export function Workbench<M>({
  simulate,
  storeScope,
  enabledTabs,
}: WorkbenchProps<M>) {
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    getInitialTab(enabledTabs),
  );
  const [showWarning, setShowWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [selectedRecipeKey, setSelectedRecipeKey] = useState("");

  const nfa = useDeltaStore((s) => s.nfa);
  const tm = useDeltaStore((s) => s.tm);
  const setNfa = useDeltaStore((s) => s.actions.setNfa);
  const setTm = useDeltaStore((s) => s.actions.setTm);
  const { showAlert } = useAlert();

  const scopeConfig = {
    nfa: {
      store: nfa,
      setScopeState: setNfa,
    },
    tm: {
      store: tm,
      setScopeState: setTm,
    },
  };

  const currentConfig = scopeConfig[storeScope];
  const machine = currentConfig.store.machine as M | null;
  const editorValue = currentConfig.store.editorValue;
  const tests = currentConfig.store.tests;
  const editorErrors = currentConfig.store.editorErrors;

  const setEditorValue = (value: string) => {
    currentConfig.setScopeState({ editorValue: value });
  };

  const setEditorErrors = (
    errors: { message: string; line: number; column: number }[] | null,
  ) => {
    currentConfig.setScopeState({ editorErrors: errors });
  };

  const setTests = (
    nextTests: {
      id: string;
      input: string;
      expected: boolean;
    }[],
  ) => {
    currentConfig.setScopeState({ tests: nextTests });
  };

  const compile = useCompile(storeScope);

  const scopedRecipes = recipes[storeScope];
  const recipeEntries = useMemo(
    () => Object.entries(scopedRecipes),
    [scopedRecipes],
  );

  const selectedRecipeLabel =
    scopedRecipes[selectedRecipeKey]?.label ?? "load example";

  const applyRecipe = async (recipeKey: string) => {
    const recipe = scopedRecipes[recipeKey];
    if (!recipe) return;

    setSelectedRecipeKey(recipeKey);
    const testsWithFreshIds = recipe.tests.map((test) => ({
      ...test,
      id: crypto.randomUUID(),
    }));

    try {
      const response = await fetch(`${window.location.origin}/${recipe.path}`);

      if (!response.ok) {
        throw new Error(`Failed to load recipe at /${recipe.path}`);
      }

      const fetchedCode = await response.text();

      setActiveTab("editor"); // it gets really weird to switch recipes from the canvas
      setTests(testsWithFreshIds);
      setEditorValue(fetchedCode.replace("//@ts-nocheck\n", "").trim());
      setEditorErrors(null);
      compile(fetchedCode);
    } catch (error) {
      showAlert({
        message:
          "Could not load the example code right now. Please try again later.",
        confirmText: "OK",
        title: "Recipe Import Failed",
      });
    }
  };

  const dotGenerators = {
    nfa: (m: NFA) => toDot(m),
    tm: (m: TuringMachine) => toDotTM(m),
  };

  const machineDot = useMemo(() => {
    if (!machine) return null;
    return dotGenerators[storeScope](machine as unknown as NFA & TuringMachine);
  }, [machine, storeScope]);

  const requestTabChange = (tab: TabId) => {
    if (!isTabEnabled(enabledTabs, tab)) return;

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
    if (pendingTab === "canvas" && storeScope === "nfa" && nfa.machine) {
      const { nodes, edges } = nfaToFlow(nfa.machine);
      setNfa({
        nodes,
        edges,
        startId: nfa.machine.startState,
      });
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

  const { copied, handleShare } = useMachineShare({
    machineType: scopeToMachineType(storeScope),
    code: editorValue,
    canShare: machine !== null,
    onLoadCode: (code) => {
      setEditorValue(code);
      compile(code);
    },
    onShareError: () => {
      showAlert({
        title: "Share Failed",
        message:
          "Could not generate a share link right now. Please try again later.",
      });
    },
  });

  type TraceMachine = NFA | TuringMachine;

  const traceConfig = {
    nfa: {
      machine: nfa.machine as TraceMachine | null,
      tests: nfa.tests,
      simulate: (machine: TraceMachine, input: string) =>
        simulateNFA(machine as NFA, input),
      getDot: (machine: TraceMachine, states: Set<string>) =>
        toDot(machine as NFA, states),
      getInputTokens: ({
        input,
        step,
        isLast,
      }: {
        input: string;
        step: number;
        isLast: boolean;
      }) =>
        input.split("").map((symbol, i) => {
          const isActive = !isLast && i === step;
          const isPast = isLast || i < step;

          return {
            key: `${symbol}-${i}`,
            text: symbol,
            className: isActive
              ? "text-ctp-mauve font-bold underline underline-offset-4"
              : isPast
                ? "text-ctp-surface2 line-through"
                : "text-ctp-subtext1",
          };
        }),
    },
    tm: {
      machine: tm.machine as TraceMachine | null,
      tests: tm.tests,
      simulate: (machine: TraceMachine, input: string) =>
        simulateTM(machine as TuringMachine, input),
      getDot: (machine: TraceMachine, states: Set<string>) =>
        toDotTM(machine as TuringMachine, states),
      getInputTokens: ({ current }: { current: { tapes?: string[][] } }) => {
        const tapes = current.tapes ?? [];
        return tapes.flatMap((tape, row) => {
          const activeTapeIndex = tape.findIndex(
            (cell) => cell.startsWith("[") && cell.endsWith("]"),
          );

          return tape.map((cell, i) => {
            const isActive = i === activeTapeIndex;
            const symbol = cell.replace(/^\[/, "").replace(/\]$/, "");

            return {
              key: `t${row}-${symbol}-${i}`,
              text: isActive ? `[${symbol}]` : symbol,
              className: isActive ? "text-ctp-mauve" : "text-ctp-text",
              row,
            };
          });
        });
      },
      bottomPanel: ({
        machine,
        current,
        hoveredEdgeId,
      }: TraceBottomPanelContext<TraceMachine>) => (
        <TransitionTable
          machine={machine as TuringMachine}
          current={current}
          hoveredEdgeId={hoveredEdgeId}
        />
      ),
    },
  }[storeScope];

  const visualizer = (
    <Trace<TraceMachine>
      machine={traceConfig.machine}
      tests={traceConfig.tests}
      simulate={traceConfig.simulate}
      getDot={traceConfig.getDot}
      getInputTokens={traceConfig.getInputTokens}
      bottomPanel={traceConfig.bottomPanel}
    />
  );

  const canvasContent = {
    nfa: (
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    ),
    tm: (
      <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
        Canvas is only available for NFA machines.
      </div>
    ),
  };

  const tabs = TAB_ORDER.map((tab) => {
    if (tab === "editor") {
      return {
        id: tab,
        content: <DeltaEditor scope={storeScope} />,
      };
    }

    if (tab === "canvas") {
      return {
        id: tab,
        content: canvasContent[storeScope],
      };
    }

    return {
      id: tab,
      content: visualizer,
    };
  });

  const visibleTabs = tabs.filter((tab) => isTabEnabled(enabledTabs, tab.id));
  const activeTabContent =
    visibleTabs.find((tab) => tab.id === activeTab)?.content ??
    visibleTabs[0]?.content;

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTab)) return;
    if (!visibleTabs[0]) return;
    setActiveTab(visibleTabs[0].id);
  }, [activeTab, visibleTabs]);

  return (
    <div className="relative flex flex-col md:flex-row flex-1 md:overflow-hidden">
      <div className="hidden md:flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-ctp-surface0 shrink-0">
            <div className="flex items-center gap-4">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => requestTabChange(tab.id)}
                  className={`pb-2 text-xs transition-colors border-b-2 cursor-pointer ${activeTab === tab.id ? "text-ctp-text border-ctp-mauve" : "text-ctp-subtext0 border-transparent hover:text-ctp-text"}`}
                >
                  {tab.id}
                </button>
              ))}
            </div>

            {recipeEntries.length > 0 && (
              <Listbox
                as="div"
                value={selectedRecipeKey}
                onChange={applyRecipe}
                className="ml-auto pb-2"
              >
                <div className="relative w-full md:w-auto">
                  <ListboxButton className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg pl-3 pr-8 py-1 text-xs text-left text-ctp-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-ctp-mauve">
                    <span
                      className={selectedRecipeKey ? "" : "text-ctp-subtext1"}
                    >
                      {selectedRecipeLabel}
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
                    <ListboxOptions className="absolute right-0 z-20 mt-1 max-h-60 min-w-56 overflow-auto rounded-lg border border-ctp-surface1 bg-ctp-mantle py-1 text-sm shadow-lg focus:outline-none">
                      {recipeEntries.map(([key, recipe]) => (
                        <ListboxOption
                          key={key}
                          value={key}
                          className="cursor-pointer select-none px-3 py-1.5 text-xs text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
                        >
                          {recipe.label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            )}
          </div>

          <div className="flex-1 overflow-hidden">{activeTabContent}</div>

          {storeScope === "nfa" && (
            <ConfirmModal
              isOpen={showWarning}
              title="Switching to Canvas"
              message="Entering the canvas will automatically convert your code. Any custom formatting or comments will be lost. Do you want to continue?"
              confirmText="Convert to Canvas"
              cancelText={`Stay in ${activeTab.replace(/^[a-z]/, (s) => s.toUpperCase())}`}
              onConfirm={confirmTabChange}
              onCancel={cancelTabChange}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col w-full md:w-1/2 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col-reverse lg:flex-row justify-between gap-3">
            <div className="flex items-center gap-y-3">
              <Tooltip label="cmd+s">
                <button
                  onClick={() => compile(editorValue)}
                  className="text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  compile
                </button>
              </Tooltip>
              <p
                className={`text-xs px-3 py-1 rounded-lg ${editorErrors && editorErrors.length > 0 ? "text-ctp-red" : "text-ctp-green"} transition-colors`}
              >
                {editorErrors && editorErrors.length > 0
                  ? "✗ check errors"
                  : "✓ valid"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-ctp-text text-sm lg:text-end font-bold uppercase tracking-widest max-w-56 xl:max-w-80 text-nowrap overflow-scroll">
                {(machine as { name?: string } | null)?.name ?? "untitled"}
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

          <div className="flex flex-col gap-4">
            {machine && machineDot && (
              <div className="hidden md:block">
                <GraphvizViewer
                  dot={machineDot}
                  machineName={(machine as { name?: string }).name ?? "machine"}
                  showExportActions
                />
              </div>
            )}

            {machine && <div className="md:hidden">{visualizer}</div>}

            <TestSuite
              tests={tests}
              setTests={setTests}
              evaluateInput={
                machine
                  ? (input: string) => simulate(machine as M, input)
                  : undefined
              }
              machineName={
                (machine as { name?: string } | null)?.name ?? "delta"
              }
              resetKeys={[machine, selectedRecipeKey]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
