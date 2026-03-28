"use client";

import { useEffect, useRef } from "react";
import Editor, { OnChange, OnMount, useMonaco } from "@monaco-editor/react";
import * as MonacoEditor from "monaco-editor";
import defineTheme from "./defineTheme";
import { useDeltaStore } from "@/store/deltaStore";
import { useCompile } from "@/hooks/useCompile";
import DELTA_D_TS from "@/lib/editor-types";
import { Caution } from "@/icons/Caution";

interface DeltaEditorProps {
  scope?: "nfa" | "tm";
}

export function DeltaEditor({ scope = "nfa" }: DeltaEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );

  const setNfa = useDeltaStore((s) => s.actions.setNfa);
  const setTm = useDeltaStore((s) => s.actions.setTm);
  const editorValue = {
    nfa: useDeltaStore((s) => s.nfa.editorValue),
    tm: useDeltaStore((s) => s.tm.editorValue),
  }[scope];
  const editorErrors = {
    nfa: useDeltaStore((s) => s.nfa.editorErrors),
    tm: useDeltaStore((s) => s.tm.editorErrors),
  }[scope];
  const editorPath = {
    nfa: "file:///main.nfa.ts",
    tm: "file:///main.tm.ts",
  }[scope];

  const monaco = useMonaco();
  const compile = useCompile(scope);

  const handleMount: OnMount = (editor, monaco: typeof MonacoEditor) => {
    editorRef.current = editor;

    if (editor.getValue() !== editorValue) {
      editor.setValue(editorValue);
    }

    compile(editorValue);

    defineTheme(monaco);
    monaco.editor.setTheme("catppuccin-latte");

    monaco.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ESNext,
      module: monaco.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
    });

    monaco.typescript.typescriptDefaults.addExtraLib(
      DELTA_D_TS,
      "ts:delta/lib.d.ts",
    );

    if (!monaco.editor.getModel(monaco.Uri.parse("ts:delta/lib.d.ts"))) {
      monaco.editor.createModel(
        DELTA_D_TS,
        "typescript",
        monaco.Uri.parse("ts:delta/lib.d.ts"),
      );
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const model = editor.getModel();
      if (!model) return;

      try {
        const getWorker = await monaco.typescript.getTypeScriptWorker();
        const worker = await getWorker(model.uri);

        const syntactic = await worker.getSyntacticDiagnostics(
          model.uri.toString(),
        );
        const semantic = await worker.getSemanticDiagnostics(
          model.uri.toString(),
        );
        const allDiagnostics = [...syntactic, ...semantic];

        const tsErrors = allDiagnostics.filter((d) => d.category === 1);

        if (tsErrors.length > 0) return;

        compile(editor.getValue());
      } catch {
        compile(editor.getValue());
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && editorValue) {
      const current = editorRef.current.getValue();
      if (current !== editorValue) {
        editorRef.current.setValue(editorValue);
        compile(editorValue);
      }
    }
  }, [editorValue, editorRef?.current]);

  useEffect(() => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();

    if (!model || !monaco) return;

    if (editorErrors) {
      monaco.editor.setModelMarkers(
        model,
        "delta-runtime",
        editorErrors
          .filter((editorError) => editorError.line !== 0)
          .map((editorError) => ({
            startLineNumber: editorError.line,
            startColumn: editorError.column,
            endLineNumber: editorError.line,
            endColumn: model.getLineMaxColumn(editorError.line),
            message: editorError.message,
            severity: monaco.MarkerSeverity.Error,
          })),
      );
    } else {
      monaco.editor.setModelMarkers(model, "delta-runtime", []);
    }
  }, [monaco, editorErrors, editorRef?.current]);

  const handleChange: OnChange = (value) => {
    const set = {
      tm: setTm,
      nfa: setNfa,
    };
    set[scope]({ editorValue: value ?? "" });
  };

  return (
    <div className="relative w-full h-full">
      <Editor
        theme="catppuccin-latte"
        path={editorPath}
        height="100%"
        width="100%"
        defaultLanguage="typescript"
        defaultValue={editorValue}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          padding: { top: 12, bottom: 12 },
          fixedOverflowWidgets: true,
          fontSize: 15,
        }}
      />

      {editorErrors &&
        editorErrors.filter((err) => err.line === 0).length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-ctp-base/95 backdrop-blur-md border border-ctp-red/30 shadow-sm rounded-lg z-10 flex items-start gap-3 px-4 py-3 transition-all">
            <Caution />

            <div className="flex flex-col">
              <span className="font-semibold text-sm text-ctp-text">
                Build Failed
              </span>

              <span className="text-xs mt-1 text-ctp-red/90 leading-relaxed">
                {editorErrors.find((err) => err.line === 0)!.message}
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
