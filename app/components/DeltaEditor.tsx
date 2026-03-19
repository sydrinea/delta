"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as MonacoEditor from "monaco-editor";
import defineTheme from "./defineTheme";
import { useDelta } from "@/context/DeltaContext";
import { runCode } from "../runCode";
import DELTA_D_TS from "@/lib/delta-runtime";

interface DeltaEditorProps {
  onValidMachine: (anf: string) => void;
  onError: (error: string | null) => void;
}

export function DeltaEditor({ onValidMachine, onError }: DeltaEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const { editorValue, setEditorValue } = useDelta();

  const handleMount: OnMount = (editor, monaco: typeof MonacoEditor) => {
    editorRef.current = editor;

    defineTheme(monaco);
    monaco.editor.setTheme("catppuccin-latte");

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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
      runCode(editor.getValue(), onValidMachine, onError),
    );
  };

  return (
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
  );
}
