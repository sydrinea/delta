"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useStepNavigation } from "@/hooks/useStepNavigation";
import { type TestCase } from "@delta/examples";

export interface TraceStep {
  states: Set<string>;
  tapes?: string[][];
}

export interface TraceSimulationResult {
  accepted: boolean;
  trace: TraceStep[];
}

export interface VisualMachine {
  name: string;
}

export interface TraceInputArgs {
  input: string;
  current: TraceStep;
  step: number;
  maxStep: number;
  isLast: boolean;
  windowSize?: number;
}

export interface TraceInputToken {
  key: string;
  text: string;
  className: string;
  row?: number;
  isActive?: boolean;
}

export interface TraceBottomPanelContext<M extends VisualMachine> {
  machine: M;
  current: TraceStep;
  trace: TraceStep[];
  step: number;
  maxStep: number;
  isLast: boolean;
  input: string;
  accepted: boolean;
  dot: string;
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (edgeId: string | null) => void;
}

interface TraceContextValue<M extends VisualMachine> {
  machine: M | null;
  tests: TestCase[];
  input: string;
  setInput: (value: string) => void;
  selectedTest: string;
  setSelectedTest: (value: string) => void;
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (id: string | null) => void;
  simulation: TraceSimulationResult | null;
  trace: TraceStep[];
  step: number;
  maxStep: number;
  safeStep: number;
  current: TraceStep | null;
  dot: string | null;
  isEmpty: boolean;
  isLast: boolean;
  accepted: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[];
  bottomPanel?: (context: TraceBottomPanelContext<M>) => ReactNode;
}

const TraceContext = createContext<TraceContextValue<any> | null>(null);

interface TraceProviderProps<M extends VisualMachine> {
  children: ReactNode;
  machine: M | null;
  tests: TestCase[];
  simulate: (machine: M, input: string) => TraceSimulationResult;
  getDot: (machine: M, states: Set<string>) => string;
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[];
  bottomPanel?: (context: TraceBottomPanelContext<M>) => ReactNode;
}

export function TraceProvider<M extends VisualMachine>({
  children,
  machine,
  tests,
  simulate,
  getDot,
  getInputTokens,
  bottomPanel,
}: TraceProviderProps<M>) {
  const [input, setInput] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const simulation = useMemo(() => {
    if (!machine) return null;
    return simulate(machine, input);
  }, [input, machine, simulate]);

  const trace = simulation?.trace ?? [];
  const maxStep = Math.max(0, trace.length - 1);

  const { step, focused, onFocus, onBlur, onTouchStart, onTouchEnd } =
    useStepNavigation({
      maxStep,
      resetDeps: [input, machine],
      focusRequiredForKeys: true,
      enableSwipe: true,
    });

  const safeStep = Math.min(step, maxStep);
  const current = trace[safeStep] ?? null;
  const dot = useMemo(() => {
    if (!machine || !current) return null;
    return getDot(machine, current.states);
  }, [machine, current, getDot]);

  const isEmpty = input === "";
  const isLast = safeStep === maxStep;
  const accepted = simulation?.accepted ?? false;

  const value: TraceContextValue<M> = {
    machine,
    tests,
    input,
    setInput,
    selectedTest,
    setSelectedTest,
    hoveredEdgeId,
    setHoveredEdgeId,
    simulation,
    trace,
    step,
    maxStep,
    safeStep,
    current,
    dot,
    isEmpty,
    isLast,
    accepted,
    focused,
    onFocus,
    onBlur,
    onTouchStart,
    onTouchEnd,
    getInputTokens,
    bottomPanel,
  };

  return (
    <TraceContext.Provider value={value}>{children}</TraceContext.Provider>
  );
}

export function useTraceContext<M extends VisualMachine>() {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error("useTraceContext must be used within a TraceProvider");
  }
  return context as unknown as TraceContextValue<M>;
}
