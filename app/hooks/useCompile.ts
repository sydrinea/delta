import { useCallback } from "react";
import { runCode, type ExecutionError } from "../runCode";
import type { NFA } from "@/lib/compiler/nfa";
import type { TuringMachine } from "@/lib/compiler/tm";
import { useDeltaStore } from "@/store/deltaStore";

type CompileScope = "nfa" | "tm";

export function useCompile(scope: CompileScope) {
  const setNfa = useDeltaStore((s) => s.actions.setNfa);
  const setTm = useDeltaStore((s) => s.actions.setTm);

  return useCallback(
    (code: string) =>
      ({
        nfa: () =>
          runCode<NFA>(
            code,
            "nfa",
            (compiledMachine: NFA) => setNfa({ machine: compiledMachine }),
            (errors: ExecutionError[] | null) =>
              setNfa({ editorErrors: errors }),
          ),
        tm: () =>
          runCode<TuringMachine>(
            code,
            "tm",
            (compiledMachine: TuringMachine) =>
              setTm({ machine: compiledMachine }),
            (errors: ExecutionError[] | null) =>
              setTm({ editorErrors: errors }),
          ),
      })[scope](),
    [scope, setNfa, setTm],
  );
}
