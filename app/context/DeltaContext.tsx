"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
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
}

const DeltaContext = createContext<DeltaContextValue | null>(null);

const DEFAULT_ANF =
  "endsInAB|q0,q1,q2|a,b|q0|q2|q0>a>q0,q0>a>q1,q0>b>q0,q1>b>q2";

const DEFAULT_VALUE = `const machine = Delta.nfa("endsInAB")
    .alphabet("a", "b")
    .states("q0", "q1", "q2")
    .start("q0")
    .accept("q2")
    .state("q0").loop().done()
    .transition("q0", "a", "q1")
    .transition("q1", "b", "q2")
    .build();`;

const DEFAULT_TESTS = [
  { id: crypto.randomUUID(), input: "ab", expected: true },
  { id: crypto.randomUUID(), input: "ababab", expected: true },
  { id: crypto.randomUUID(), input: "ba", expected: false },
  { id: crypto.randomUUID(), input: "", expected: false },
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
