import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import type { Node, Edge } from "reactflow";
import type { NFA } from "@delta/build";
import type { TuringMachine } from "@delta/build";
import { flowToCode } from "@/lib/flow/fromFlow";
import { runCode, type ExecutionError } from "@/lib/runCode";
import { MachineTypes } from "@/lib/worker/protocol";
import { version } from "../../../../package.json";

export interface TestCase {
  id: string;
  input: string;
  expected: boolean;
}

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

const DEFAULT_TM_TESTS = [
  { id: "empty", input: "", expected: true },
  { id: "single-0", input: "0", expected: true },
  { id: "single-1", input: "1", expected: true },
  { id: "double-00", input: "00", expected: true },
  { id: "double-11", input: "11", expected: true },
  { id: "even-bad", input: "01", expected: false },
  { id: "odd-good", input: "010", expected: true },
  { id: "odd-bad", input: "001", expected: false },
  { id: "long-good", input: "011110", expected: true },
  { id: "long-bad", input: "011010", expected: false },
];

const DEFAULT_TM_VALUE = `import * as Delta from "delta:lib";

const machine = Delta.tm("binary palindrome")
  .alphabet("0", "1")
  .tape("X", "Y", "_")
  .blank("_")
  .states("q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8")
  .start("q0")
  .accept("q6")
  // Step 1: Start by moving right (skipping the initial blank if tape is standard)
  .state("q0", (s) => s.on("_", "R", "q1"))
  // Step 2: Read the leftmost unmarked character and mark it (X for 0, Y for 1)
  .state("q1", (s) => s
    .on("0", "R", "q2", "X")
    .on("1", "R", "q7", "Y")
    .on(["X", "Y"], "R", "q5") // Hit marks: even length palindrome center reached
    .on("_", "R", "q6")        // Hit blank: empty string / done
  )
  // Step 3a: 0-Branch - Scan right to the end of unmarked characters
  .state("q2", (s) => s
    .on(["0", "1"], "R", "q2")
    .on(["_", "X", "Y"], "L", "q3") // Reached boundary, step left
  )
  // Step 4a: 0-Branch - Verify the rightmost unmarked character is a '0'
  .state("q3", (s) => s
    .on(["X", "Y"], "L", "q3") // Rewind past marked characters
    .on("0", "L", "q4", "X") // Match found! Mark it and head back
    .on(["_"], ["R"], "q5")        // No match found, hit left bound (odd length middle)
  )
  // Step 3b: 1-Branch - Scan right to the end of unmarked characters
  .state("q7", (s) => s
    .on([["0", "1"]], ["R"], "q7")
    .on([["_", "X", "Y"]], ["L"], "q8") // Reached boundary, step left
  )
  // Step 4b: 1-Branch - Verify the rightmost unmarked character is a '1'
  .state("q8", (s) => s
    .on(["X", "Y"], "L", "q8") // Rewind past marked characters
    .on("1", "L", "q4", "Y") // Match found! Mark it and head back
    .on("_", "R", "q5")        // No match found, hit left bound (odd length middle)
  )
  // Step 5: Rewind left back to the leftmost boundary
  .state("q4", (s) => s
    .on(["0", "1"], "L", "q4")       // Rewind unmarked
    .on(["X", "Y", "_"], "R", "q1")  // Hit left boundary, step right to restart loop
  )
  // Step 6: Verify remaining tape is fully marked (cleanup/accept phase)
  .state("q5", (s) => s
    .on(["X", "Y"], "R", "q5")
    .on("_", "R", "q6") // Everything is matched, accept!
  )
  .build();

export default machine;`;

interface AppSlice {
  lastSeenVersion: string;
}

interface NfaSlice {
  editorValue: string;
  tests: TestCase[];
  nodes: Node[];
  edges: Edge[];
  startId: string | null;
  machine: NFA | null;
  editorErrors: ExecutionError[] | null;
}

interface TmSlice {
  editorValue: string;
  tests: TestCase[];
  machine: TuringMachine | null;
  editorErrors: ExecutionError[] | null;
}

type SlicePatch<T> = Partial<T> | ((slice: T) => Partial<T>);

function applyPatch<T extends object>(slice: T, patch: SlicePatch<T>): T {
  const nextPatch = typeof patch === "function" ? patch(slice) : patch;
  return { ...slice, ...nextPatch };
}

interface DeltaActions {
  setApp: (patch: SlicePatch<AppSlice>) => void;
  setNfa: (patch: SlicePatch<NfaSlice>) => void;
  setTm: (patch: SlicePatch<TmSlice>) => void;
  syncNfaFromFlow: (
    nodes: Node[],
    edges: Edge[],
    startId: string | null,
  ) => void;
}

interface DeltaState {
  app: AppSlice;
  nfa: NfaSlice;
  tm: TmSlice;
  actions: DeltaActions;
}

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
    (set) => ({
      app: {
        lastSeenVersion: version,
      },
      nfa: {
        editorValue: DEFAULT_VALUE,
        tests: DEFAULT_TESTS,
        nodes: [],
        edges: [],
        startId: null,
        machine: null,
        editorErrors: [],
      },
      tm: {
        editorValue: DEFAULT_TM_VALUE,
        tests: DEFAULT_TM_TESTS,
        machine: null,
        editorErrors: [],
      },

      actions: {
        setApp: (patch) =>
          set((state) => ({
            app: applyPatch(state.app, patch),
          })),
        setNfa: (patch) =>
          set((state) => ({
            nfa: applyPatch(state.nfa, patch),
          })),
        setTm: (patch) =>
          set((state) => ({
            tm: applyPatch(state.tm, patch),
          })),
        syncNfaFromFlow: (nodes, edges, startId) => {
          const code = flowToCode(nodes, edges, startId);

          set((state) => ({
            nfa: {
              ...state.nfa,
              nodes,
              edges,
              startId,
              editorValue: code,
            },
          }));

          runCode<NFA>(
            code,
            MachineTypes.NFA,
            (machine) =>
              set((state) => ({
                nfa: { ...state.nfa, machine },
              })),
            (err) =>
              set((state) => ({
                nfa: { ...state.nfa, editorErrors: err },
              })),
          );
        },
      },
    }),
    {
      name: "delta-store",
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({
        app: {
          lastSeenVersion: state.app.lastSeenVersion,
        },
        nfa: {
          editorValue: state.nfa.editorValue,
          tests: state.nfa.tests,
          nodes: state.nfa.nodes,
          edges: state.nfa.edges,
          startId: state.nfa.startId,
        },
        tm: {
          editorValue: state.tm.editorValue,
          tests: state.tm.tests,
        },
      }),
    },
  ),
);
