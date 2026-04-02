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
import { useNfaStore } from "@/store/nfaStore";
import { useTmStore } from "@/store/tmStore";
import { MachineTypes, type MachineType } from "../../lib/worker/protocol";
import { TM, type NFA, type TuringMachine } from "@delta/build";
import { nfaToFlow } from "@/lib/flow/toFlow";
import { containsCustomLogicOrComments } from "@/lib/detect-custom-logic";
import { DeltaEditor } from "@/components/editor/DeltaEditor";
import { FlowEditor } from "@/components/editor/FlowEditor";
import { Trace } from "@/components/visualize/Trace";
import {
  TraceProvider,
  useTraceContext,
} from "@/components/visualize/TraceContext";
import { TransitionTable } from "@/components/visualize/TransitionTable";
import { ConfigurationTable } from "@/components/visualize/ConfigurationTable";
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
import { recipes } from "@delta/examples/recipes";
import { toDot, toDotTM } from "@/lib/dot";
import { useTheme } from "next-themes";
import { themeNames } from "@/lib/theme";

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

function useWorkbenchLogic<M>(props: WorkbenchProps<M>) {
  const { simulate, storeScope, enabledTabs } = props;

  const [activeTab, setActiveTab] = useState<TabId>(() =>
    getInitialTab(enabledTabs),
  );
  const [showWarning, setShowWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [selectedRecipeKey, setSelectedRecipeKey] = useState("");

  const nfa = useNfaStore((s) => s);
  const tm = useTmStore((s) => s);
  const patchNfa = useNfaStore((s) => s.patch);
  const patchTm = useTmStore((s) => s.patch);
  const { showAlert } = useAlert();
  const { resolvedTheme } = useTheme();

  const scopeConfig = {
    nfa: { store: nfa, setScopeState: patchNfa },
    tm: { store: tm, setScopeState: patchTm },
  };

  const currentConfig = scopeConfig[storeScope];
  const machine = currentConfig.store.machine as M | null;
  const editorValue = currentConfig.store.editorValue;
  const tests = currentConfig.store.tests;
  const editorErrors = currentConfig.store.editorErrors;

  const setEditorValue = (value: string) =>
    currentConfig.setScopeState({ editorValue: value });
  const setEditorErrors = (
    errors: { message: string; line: number; column: number }[] | null,
  ) => {
    currentConfig.setScopeState({ editorErrors: errors });
  };
  const setTests = (
    nextTests: { id: string; input: string; expected: boolean }[],
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
      const response = await fetch(recipe.path);
      if (!response.ok)
        throw new Error(`Failed to load recipe at ${recipe.path}`);

      const fetchedCode = await response.text();
      if (activeTab === "canvas") setActiveTab("editor");

      setTests(testsWithFreshIds);
      setEditorValue(fetchedCode.replace("//@ts-nocheck", "").trim());
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

  const { dot: activeDot, setHoveredEdgeId } = useTraceContext<any>();

  const machineDot = useMemo(() => {
    if (activeDot) return activeDot;
    if (!machine) return null;
    const currentTheme = themeNames[resolvedTheme ?? "light"];
    const dotGenerators = {
      nfa: (m: NFA) => toDot(m, currentTheme),
      tm: (m: TuringMachine) => toDotTM(m, currentTheme),
    };
    return dotGenerators[storeScope](machine as unknown as NFA & TuringMachine);
  }, [machine, storeScope, resolvedTheme, activeDot]);

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
      patchNfa({ nodes, edges, startId: nfa.machine.startState });
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

  const visualizer = <Trace />;
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

  const tabs = TAB_ORDER.map((tab) => ({
    id: tab,
    content:
      tab === "editor" ? (
        <DeltaEditor scope={storeScope} />
      ) : tab === "canvas" ? (
        canvasContent[storeScope]
      ) : (
        visualizer
      ),
  }));

  const visibleTabs = tabs.filter((tab) => isTabEnabled(enabledTabs, tab.id));
  const activeTabContent =
    visibleTabs.find((tab) => tab.id === activeTab)?.content ??
    visibleTabs[0]?.content;

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTab)) return;
    if (!visibleTabs[0]) return;
    setActiveTab(visibleTabs[0].id);
  }, [activeTab, visibleTabs]);

  return {
    simulate,
    storeScope,
    activeTab,
    requestTabChange,
    visibleTabs,
    activeTabContent,
    showWarning,
    confirmTabChange,
    cancelTabChange,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
    machine,
    machineDot,
    editorErrors,
    editorValue,
    compile,
    tests,
    setTests,
    handleShare,
    copied,
    setHoveredEdgeId,
    visualizer,
  };
}

function MobileWorkbench<M>({
  logic,
}: {
  logic: ReturnType<typeof useWorkbenchLogic<M>>;
}) {
  const { machine, visualizer, tests, setTests, simulate } = logic;

  return (
    <div className="flex flex-col md:hidden w-full h-full overflow-y-auto min-w-0 p-4 gap-6">
      <WorkbenchHeader logic={logic} />

      <div className="flex-1 w-full min-h-75">{machine && visualizer}</div>

      <TestSuite
        tests={tests}
        setTests={setTests}
        evaluateInput={
          machine ? (input: string) => simulate(machine as M, input) : undefined
        }
        machineName={(machine as { name?: string } | null)?.name ?? "delta"}
        resetKeys={[machine, logic.selectedRecipeKey]}
      />
    </div>
  );
}

function DesktopWorkbench<M>({
  logic,
}: {
  logic: ReturnType<typeof useWorkbenchLogic<M>>;
}) {
  const {
    storeScope,
    activeTab,
    requestTabChange,
    visibleTabs,
    activeTabContent,
    showWarning,
    confirmTabChange,
    cancelTabChange,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
    machine,
    machineDot,
    setHoveredEdgeId,
    tests,
    setTests,
    simulate,
    visualizer,
  } = logic;

  return (
    <div className="hidden md:flex flex-row flex-1 overflow-hidden">
      {/* Left Panel: Tabs & Editor/Canvas/Visualizer */}
      <div className="flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-ctp-surface0 shrink-0 relative z-50">
          {/* Add shrink-0 here so the tabs NEVER shrink */}
          <div className="flex items-center gap-4 shrink-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => requestTabChange(tab.id)}
                className={`tracking-wide pb-2 text-xs transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "text-ctp-text border-ctp-mauve"
                    : "text-ctp-subtext0 border-transparent hover:text-ctp-text"
                }`}
              >
                {tab.id}
              </button>
            ))}
          </div>

          {/* Ensure the dropdown itself is allowed to shrink */}
          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
            className="ml-auto pb-2 shrink"
          />
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

      {/* Right Panel: Graph & Test Suite */}
      <div className="flex flex-col w-1/2 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="flex flex-col gap-4 p-6 min-w-0">
          <WorkbenchHeader logic={logic} />

          <div className="flex flex-col gap-4">
            {machine && machineDot && (
              <GraphvizViewer
                dot={machineDot}
                machineName={(machine as { name?: string }).name ?? "machine"}
                showExportActions
                onEdgeHover={storeScope === "tm" ? setHoveredEdgeId : undefined}
              />
            )}

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

function WorkbenchHeader<M>({
  logic,
}: {
  logic: ReturnType<typeof useWorkbenchLogic<M>>;
}) {
  const {
    editorValue,
    compile,
    editorErrors,
    machine,
    handleShare,
    copied,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
  } = logic;

  return (
    <div className="flex flex-col-reverse lg:flex-row justify-between gap-3 relative">
      <div className="flex items-center gap-y-3">
        <Tooltip label="cmd+s">
          <button
            onClick={() => compile(editorValue)}
            className="hover:cursor-pointer text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            compile
          </button>
        </Tooltip>
        <p
          className={`font-bold text-xs px-3 py-1 rounded-lg ${editorErrors && editorErrors.length > 0 ? "text-ctp-red" : "text-ctp-green"} transition-colors whitespace-nowrap`}
        >
          {editorErrors && editorErrors.length > 0
            ? "✗ check errors"
            : "✓ valid"}
        </p>
      </div>

      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <h1 className="text-ctp-text text-sm lg:text-end font-bold uppercase tracking-widest max-w-40 md:max-w-56 xl:max-w-80 text-nowrap overflow-x-auto">
            {(machine as { name?: string } | null)?.name ?? "untitled"}
          </h1>
          <Tooltip label="Share Machine">
            <button
              onClick={handleShare}
              className="text-ctp-overlay0 hover:text-ctp-text transition-colors flex items-center shrink-0"
            >
              {copied ? <Check /> : <Share />}
            </button>
          </Tooltip>
        </div>

        <div className="md:hidden shrink-0">
          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
          />
        </div>
      </div>
    </div>
  );
}

function WorkbenchInner<M>(props: WorkbenchProps<M>) {
  const logic = useWorkbenchLogic(props);

  return (
    <>
      <DesktopWorkbench logic={logic} />
      <MobileWorkbench logic={logic} />
    </>
  );
}

function RecipeDropdown({
  recipeEntries,
  selectedRecipeKey,
  applyRecipe,
  selectedRecipeLabel,
  className = "",
}: {
  recipeEntries: [string, any][];
  selectedRecipeKey: string;
  applyRecipe: (key: string) => void;
  selectedRecipeLabel: string;
  className?: string;
}) {
  if (recipeEntries.length === 0) return null;

  return (
    <Listbox
      as="div"
      value={selectedRecipeKey}
      onChange={applyRecipe}
      className={`min-w-0 ${className}`}
    >
      <div className="relative w-full md:w-auto min-w-32">
        <ListboxButton className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg pl-3 pr-8 py-1 text-xs text-left text-ctp-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-ctp-mauve overflow-hidden">
          <span
            className={`block overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              selectedRecipeKey ? "" : "text-ctp-subtext1"
            }`}
          >
            {selectedRecipeLabel}
          </span>
        </ListboxButton>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ctp-overlay0 pointer-events-none bg-ctp-mantle"
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
          <ListboxOptions className="absolute right-0 z-30 mt-1 max-h-60 min-w-56 overflow-auto rounded-lg border border-ctp-surface1 bg-ctp-mantle py-1 text-sm shadow-lg focus:outline-none">
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
  );
}

// --- Main Export ---
export function Workbench<M>(props: WorkbenchProps<M>) {
  const storeScope = props.storeScope;
  const nfa = useNfaStore((s) => s);
  const tm = useTmStore((s) => s);
  const scopeConfig = { nfa: { store: nfa }, tm: { store: tm } };
  const currentConfig = scopeConfig[storeScope as WorkbenchScope];
  const { resolvedTheme } = useTheme();

  return (
    <TraceProvider<any>
      machine={currentConfig.store.machine}
      tests={currentConfig.store.tests}
      simulate={
        storeScope === "nfa"
          ? (m: NFA, i: string) => simulateNFA(m, i)
          : (m: TuringMachine, i: string) =>
              simulateTM(m, i, { maxSteps: Math.max(1000, i.length * 100) })
      }
      getDot={(m, s) =>
        storeScope === "nfa"
          ? toDot(m as NFA, themeNames[resolvedTheme ?? "light"], s)
          : toDotTM(m as TuringMachine, themeNames[resolvedTheme ?? "light"], s)
      }
      getInputTokens={(args) => {
        const WINDOW_SIZE = 81;
        const HALF_WINDOW = Math.floor(WINDOW_SIZE / 2);

        if (storeScope === "nfa") {
          const tokens = [];
          for (let i = 0; i < WINDOW_SIZE; i++) {
            const charIndex = args.step - HALF_WINDOW + i;
            const symbol = args.input[charIndex];
            const isActive = !args.isLast && i === HALF_WINDOW;
            const isPast = args.isLast || charIndex < args.step;

            if (charIndex >= 0 && charIndex < args.input.length) {
              tokens.push({
                key: `nfa-${i}-${charIndex}`,
                text: symbol,
                isActive: isActive,
                className: isActive
                  ? "text-ctp-mauve font-bold bg-ctp-surface0 ring-1 ring-ctp-mauve"
                  : isPast
                    ? "text-ctp-surface2"
                    : "text-ctp-subtext1",
              });
            } else {
              tokens.push({
                key: `nfa-empty-${i}`,
                text: "",
                isActive: false,
                className: "text-transparent",
              });
            }
          }
          return tokens;
        }

        const tapes = args.current.tapes ?? [];
        return tapes.flatMap((tape: string[], row: number) => {
          const activeTapeIndex = tape.findIndex(
            (cell: string) => cell.startsWith("[") && cell.endsWith("]"),
          );
          const tokens = [];
          for (let i = 0; i < WINDOW_SIZE; i++) {
            const charIndex = activeTapeIndex - HALF_WINDOW + i;
            const cell = tape[charIndex];
            const isActive = i === HALF_WINDOW;

            if (cell !== undefined) {
              const symbol = cell.replace(/^\[/, "").replace(/\]$/, "");
              tokens.push({
                key: `t${row}-${i}-${charIndex}`,
                text: symbol,
                isActive: isActive,
                className: isActive
                  ? "text-ctp-mauve font-bold bg-ctp-surface0 ring-1 ring-ctp-mauve"
                  : "text-ctp-text",
                row: row,
              });
            } else {
              tokens.push({
                key: `t${row}-empty-${i}`,
                text: "",
                isActive: false,
                className: "text-transparent",
                row: row,
              });
            }
          }
          return tokens;
        });
      }}
      bottomPanel={
        storeScope === "tm"
          ? ({ machine, current, hoveredEdgeId, isLast, accepted }: any) => (
              <TransitionTable
                machine={machine as TuringMachine}
                current={current}
                hoveredEdgeId={hoveredEdgeId}
                isLast={isLast}
                accepted={accepted}
              />
            )
          : storeScope === "nfa"
            ? ({ trace, step, input, isLast, accepted }: any) => (
                <ConfigurationTable
                  trace={trace}
                  step={step}
                  input={input}
                  isLast={isLast}
                  accepted={accepted}
                />
              )
            : undefined
      }
    >
      <WorkbenchInner {...props} />
    </TraceProvider>
  );
}
