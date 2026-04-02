import { useCallback } from "react";
import { runCode, type ExecutionError } from "@/lib/runCode";
import type { NFA, TuringMachine } from "@delta/build";
import { useNfaStore } from "@/store/nfaStore";
import { useTmStore } from "@/store/tmStore";

type CompileScope = "nfa" | "tm";

export function useCompile(scope: CompileScope) {
  const patchNfa = useNfaStore((s) => s.patch);
  const patchTm = useTmStore((s) => s.patch);

  return useCallback(
    (code: string) =>
      ({
        nfa: () =>
          runCode<NFA>(
            code,
            "nfa",
            (compiledMachine: NFA) => patchNfa({ machine: compiledMachine }),
            (errors: ExecutionError[] | null) =>
              patchNfa({ editorErrors: errors }),
          ),
        tm: () =>
          runCode<TuringMachine>(
            code,
            "tm",
            (compiledMachine: TuringMachine) =>
              patchTm({ machine: compiledMachine }),
            (errors: ExecutionError[] | null) =>
              patchTm({ editorErrors: errors }),
          ),
      })[scope](),
    [scope, patchNfa, patchTm],
  );
}
