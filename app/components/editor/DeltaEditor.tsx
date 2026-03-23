"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import * as MonacoEditor from "monaco-editor";
import defineTheme from "./defineTheme";
import { useDeltaStore } from "@/store/deltaStore";
import { runCode } from "../../runCode";
import DELTA_D_TS from "@/lib/delta-runtime";
import { Caution } from "@/icons/Caution";

export function DeltaEditor() {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );

  const editorValue = useDeltaStore((s) => s.editorValue);
  const setEditorValue = useDeltaStore((s) => s.setEditorValue);
  const editorErrors = useDeltaStore((s) => s.editorErrors);
  const setEditorErrors = useDeltaStore((s) => s.setEditorErrors);
  const setAnf = useDeltaStore((s) => s.setAnf);

  const monaco = useMonaco();

  const handleMount: OnMount = (editor, monaco: typeof MonacoEditor) => {
    editorRef.current = editor;

    runCode(editorRef.current.getValue(), setAnf, setEditorErrors);

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

        const tsErrors = allDiagnostics.filter((d: any) => d.category === 1);

        if (tsErrors.length > 0) return;

        setEditorErrors(null);
        runCode(editor.getValue(), setAnf, setEditorErrors);
      } catch (err) {
        setEditorErrors(null);
        runCode(editor.getValue(), setAnf, setEditorErrors);
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && editorValue) {
      const current = editorRef.current.getValue();
      if (current !== editorValue) {
        editorRef.current.setValue(editorValue);
      }
    }
  }, [editorValue, editorRef.current]);

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
  }, [monaco, editorErrors]);

  return (
    <div className="relative w-full h-full">
      <Editor
        theme="catppuccin-latte"
        path="file:///main.ts"
        height="100%"
        width="100%"
        defaultLanguage="typescript"
        defaultValue={editorValue}
        onMount={handleMount}
        onChange={(value) => setEditorValue(value ?? "")}
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

              <span className="font-mono text-xs mt-1 text-ctp-red/90 leading-relaxed">
                {editorErrors.find((err) => err.line === 0)!.message}
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
