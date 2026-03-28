import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import type { Node, Edge } from "reactflow";
import type { NFA } from "@delta/build";
import type { TuringMachine } from "@delta/build";
import { flowToCode } from "@/lib/flow/fromFlow";
import { runCode, type ExecutionError } from "@/lib/runCode";
import { MachineTypes } from "@/lib/worker/protocol";
import { version } from "../../../../package.json";
import { TestCase } from "@delta/examples";
import { defaultNFA, defaultTM } from "@/lib/defaults";

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
        editorValue: defaultNFA,
        tests: DEFAULT_TESTS,
        nodes: [],
        edges: [],
        startId: null,
        machine: null,
        editorErrors: [],
      },
      tm: {
        editorValue: defaultTM,
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
