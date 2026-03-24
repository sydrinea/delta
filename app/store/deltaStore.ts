import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import type { Node, Edge } from "reactflow";
import type { NFA } from "@/lib/compiler/nfa";
import { deserialize } from "@/lib/compiler/serialize";
import { flowToCode } from "@/lib/compiler/fromFlow";
import { runCode, type ExecutionError } from "../runCode";
import { version } from "../../package.json";

export interface TestCase {
  id: string;
  input: string;
  expected: boolean;
}

const DEFAULT_ANF =
  "%23%20of%20a's%20divisible%20by%202%20or%203|q0;q1;q2;q3;q4;q5|a;b|q0|q0;q2;q3;q4|q0>a>q1;q0>b>q0;q1>a>q2;q1>b>q1;q2>a>q3;q2>b>q2;q3>a>q4;q3>b>q3;q4>a>q5;q4>b>q4;q5>a>q0;q5>b>q5";

const DEFAULT_VALUE = `//---
// Welcome to Delta! This is the code editor. If you'd like to use 
// a drag-and-drop interface, click the "canvas" tab above and
// use the "clear" button to get started building your own
// DFA or NFA!
// ---
import * as Delta from "delta:lib";
// import { dfa, q } from "delta:lib";

const machine = Delta.dfa("# of a's divisible by 2 or 3")
  .alphabet("a", "b")
  .states(...Delta.q(0, 5))
  .start("q0")
  .accept("q0", "q2", "q3", "q4")
  .increment("a")
  .all((s) => s.loop("b"))
  .build();

export default machine;`;

const DEFAULT_TESTS = [
  { id: crypto.randomUUID(), input: "", expected: true },
  { id: crypto.randomUUID(), input: "a", expected: false },
  { id: crypto.randomUUID(), input: "aa", expected: true },
  { id: crypto.randomUUID(), input: "aaa", expected: true },
  { id: crypto.randomUUID(), input: "abababaaa", expected: true },
  { id: crypto.randomUUID(), input: "abababbaa", expected: false },
];

interface DeltaState {
  // persisted
  editorValue: string;
  anf: string | null;
  tests: TestCase[];
  nodes: Node[];
  edges: Edge[];
  startId: string | null;
  lastSeenVersion: string;

  // volatile
  machine: NFA | null;
  machineError: string | null;
  editorErrors: ExecutionError[] | null;

  setEditorValue: (value: string) => void;
  setAnf: (anf: string | null) => void;
  setTests: (tests: TestCase[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setStartId: (id: string | null) => void;
  setEditorErrors: (errors: ExecutionError[] | null) => void;
  setLastSeenVersion: (version: string) => void;

  syncFromFlow: (nodes: Node[], edges: Edge[], startId: string | null) => void;
}

const initialMachine = (() => {
  try {
    return deserialize(DEFAULT_ANF);
  } catch {
    return null;
  }
})();

const hybridStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const sessionValue = sessionStorage.getItem(name);
    if (sessionValue) return sessionValue;
    return localStorage.getItem(name);
  },

  setItem: (name: string, value: string): void => {
    sessionStorage.setItem(name, value);
    localStorage.setItem(name, value);
  },

  removeItem: (name: string): void => {
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
  },
};

export const useDeltaStore = create<DeltaState>()(
  persist(
    (set, get) => ({
      editorValue: DEFAULT_VALUE,
      anf: DEFAULT_ANF,
      tests: DEFAULT_TESTS,
      nodes: [],
      edges: [],
      startId: null,
      lastSeenVersion: version,

      machine: initialMachine,
      machineError: null,
      editorErrors: [],

      setEditorValue: (editorValue) => set({ editorValue }),

      setAnf: (anf) => {
        if (!anf) {
          set({ anf, machine: null, machineError: null });
          return;
        }
        try {
          const m = deserialize(anf);
          set({ anf, machine: m, machineError: null });
        } catch (e) {
          set({
            anf,
            machine: null,
            machineError: `✗ ${String(e).split("\n").join("; ")}`,
          });
        }
      },

      setTests: (tests) => set({ tests }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setStartId: (startId) => set({ startId }),
      setEditorErrors: (editorErrors) => set({ editorErrors }),
      setLastSeenVersion: (version) => set({ lastSeenVersion: version }),

      syncFromFlow: (nodes, edges, startId) => {
        const code = flowToCode(nodes, edges, startId);

        set({ nodes, edges, startId, editorValue: code });

        runCode(
          code,
          (anf) => get().setAnf(anf),
          (err) => set({ editorErrors: err }),
        );
      },
    }),
    {
      name: "delta-store",
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({
        editorValue: state.editorValue,
        lastSeenVersion: state.lastSeenVersion,
        anf: state.anf,
        tests: state.tests,
        nodes: state.nodes,
        edges: state.edges,
        startId: state.startId,
      }),
    },
  ),
);
