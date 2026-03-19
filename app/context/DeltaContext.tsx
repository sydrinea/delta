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
  "FizzBuzz|q0,q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14|0,1|q0|q0,q3,q5,q6,q9,q10,q12|q0>0>q0,q0>1>q1,q1>0>q1,q1>1>q2,q2>0>q2,q2>1>q3,q3>0>q3,q3>1>q4,q4>0>q4,q4>1>q5,q5>0>q5,q5>1>q6,q6>0>q6,q6>1>q7,q7>0>q7,q7>1>q8,q8>0>q8,q8>1>q9,q9>0>q9,q9>1>q10,q10>0>q10,q10>1>q11,q11>0>q11,q11>1>q12,q12>0>q12,q12>1>q13,q13>0>q13,q13>1>q14,q14>0>q14,q14>1>q0";

const DEFAULT_VALUE = `const machine = Delta.dfa("FizzBuzz")
  .alphabet("0", "1")
  .states(...Delta.q(0, 14))
  .start("q0")
  .accept("q0", "q3", "q5", "q6", "q9", "q10", "q12")
  .all((s) => s.loop("0").done())
  .increment("1")
  .build();`;

const DEFAULT_TESTS = [
  { id: crypto.randomUUID(), input: "0", expected: true },
  { id: crypto.randomUUID(), input: "111", expected: true },
  { id: crypto.randomUUID(), input: "11111", expected: true },
  { id: crypto.randomUUID(), input: "111111", expected: true },
  { id: crypto.randomUUID(), input: "1100110101", expected: true },
  { id: crypto.randomUUID(), input: "11", expected: false },
  { id: crypto.randomUUID(), input: "1111", expected: false },
  { id: crypto.randomUUID(), input: "1101010101011", expected: false },
  { id: crypto.randomUUID(), input: "", expected: true },
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
