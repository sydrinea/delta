"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Node, Edge } from "reactflow";
import type { NFA } from "@/lib/compiler/nfa";
import { deserialize } from "@/lib/compiler/serialize";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface TestCase {
  id: string;
  input: string;
  expected: boolean;
}

export interface TestResult {
  id: string;
  passed: boolean;
  actual: boolean;
}

interface DeltaContextValue {
  label: string;
  editorValue: string;
  setEditorValue: (value: string) => void;
  anf: string | null;
  setAnf: (anf: string | null) => void;
  machine: NFA | null;
  machineError: string | null;
  tests: TestCase[];
  setTests: (tests: TestCase[]) => void;
  editorError: string | null;
  setEditorError: (error: string | null) => void;
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  startId: string | null;
  setStartId: (id: string | null) => void;
}

const DeltaContext = createContext<DeltaContextValue | null>(null);

const DEFAULT_ANF =
  "# of a's divisible by 2 or 3|q0,q1,q2,q3,q4,q5|a,b|q0|q0,q2,q3,q4|q0>a>q1,q0>b>q0,q1>a>q2,q1>b>q1,q2>a>q3,q2>b>q2,q3>a>q4,q3>b>q3,q4>a>q5,q4>b>q4,q5>a>q0,q5>b>q5";

const DEFAULT_VALUE = `//---
// Welcome to Delta! This is the code editor. If you'd like to use 
// a drag-and-drop interface, click the "canvas" tab above and
// use the "clear" button to get started building your own
// DFA or NFA!
// ---
const machine = Delta.dfa("# of a's divisible by 2 or 3")
  .alphabet("a", "b")
  .states(...Delta.q(0, 5))
  .start("q0")
  .accept("q0", "q2", "q3", "q4")
  .increment("a")
  .all((s) => s.loop("b").done())
  .build();`;

const DEFAULT_TESTS = [
  { id: crypto.randomUUID(), input: "", expected: true },
  { id: crypto.randomUUID(), input: "a", expected: false },
  { id: crypto.randomUUID(), input: "aa", expected: true },
  { id: crypto.randomUUID(), input: "aaa", expected: true },
  { id: crypto.randomUUID(), input: "abababaaa", expected: true },
  { id: crypto.randomUUID(), input: "abababbaa", expected: false },
];

interface DeltaProviderProps {
  label: string;
  children: ReactNode;
}

export function DeltaProvider({ label, children }: DeltaProviderProps) {
  const [tests, setTests] = useLocalStorage<TestCase[]>(
    `delta:${label}:tests`,
    DEFAULT_TESTS,
  );
  const [anf, setAnf] = useLocalStorage<string | null>(
    `delta:${label}:anf`,
    DEFAULT_ANF,
  );
  const [editorValue, setEditorValue] = useLocalStorage(
    `delta:${label}:editor`,
    DEFAULT_VALUE,
  );
  const [nodes, setNodes] = useLocalStorage<Node[]>(`delta:${label}:nodes`, []);
  const [edges, setEdges] = useLocalStorage<Edge[]>(`delta:${label}:edges`, []);
  const [startId, setStartId] = useLocalStorage<string | null>(
    `delta:${label}:startId`,
    null,
  );

  const [editorError, setEditorError] = useState<string | null>(null);
  const [machine, setMachine] = useState<NFA | null>(null);
  const [machineError, setMachineError] = useState<string | null>(null);

  useEffect(() => {
    if (!anf) return;
    try {
      const m = deserialize(anf);
      setMachine(m);
      setMachineError(null);
    } catch (e) {
      setMachineError(`✗ ${String(e).substring(0, 70)}...`);
      setMachine(null);
    }
  }, [anf]);

  return (
    <DeltaContext.Provider
      value={{
        label,
        editorValue,
        setEditorValue,
        anf,
        setAnf,
        machine,
        machineError,
        tests,
        setTests,
        editorError,
        setEditorError,
        nodes,
        setNodes,
        edges,
        setEdges,
        startId,
        setStartId,
      }}
    >
      {children}
    </DeltaContext.Provider>
  );
}

export function useDelta() {
  const ctx = useContext(DeltaContext);
  if (!ctx) throw new Error("useDelta must be used within a DeltaProvider");
  return ctx;
}
