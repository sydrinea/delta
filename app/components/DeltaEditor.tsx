"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as MonacoEditor from "monaco-editor";
import { z } from "zod";
import nfa from "@/lib/compiler/nfa";
import dfa from "@/lib/compiler/dfa";
import { serialize } from "@/lib/compiler/serialize";
import { EPS } from "@/lib/compiler/constants";
import defineTheme from "./defineTheme";

const MessageSchema = z.object({
  content: z.string(),
  severity: z.enum(["warning", "error"]),
});

export const NFASchema = z.object({
  name: z.string(),
  alphabet: z.instanceof(Set),
  states: z.instanceof(Set),
  startState: z.string(),
  acceptStates: z.instanceof(Set),
  transitions: z.instanceof(Map),
  messages: z.array(MessageSchema),
});

const DELTA_TYPES = `
declare namespace Delta {
  interface Message {
    content: string;
    severity: "warning" | "error";
  }

  interface NFA {
    name: string;
    alphabet: Set<string>;
    states: Set<string>;
    startState: string;
    acceptStates: Set<string>;
    transitions: Map<string, Map<string, Set<string>>>;
    messages: Message[];
  }

  class NFABuilder {
    alphabet(...symbols: string[]): this;
    states(...states: string[]): this;
    start(state: string): this;
    accept(...states: string[]): this;
    transition(from: string, symbol: string, to: string): this;
    build(): NFA;
    get messages(): readonly Message[];
    get repr(): string;
  }

  class DFABuilder extends NFABuilder {}

  function nfa(name: string): NFABuilder;
  function dfa(name: string): DFABuilder;

  const EPS: string;
}
`;

const DEFAULT_VALUE = `const machine = Delta.nfa("endsInAB")
    .alphabet("a", "b")
    .states("q0", "q1", "q2")
    .start("q0")
    .accept("q2")
    .transition("q0", "a", "q0")
    .transition("q0", "b", "q0")
    .transition("q0", "a", "q1")
    .transition("q1", "b", "q2")
    .build();`;

interface DeltaEditorProps {
  onValidMachine: (anf: string) => void;
  onError: (error: string | null) => void;
}

export function DeltaEditor({ onValidMachine, onError }: DeltaEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );

  const runCode = (value: string) => {
    const Delta = { nfa, dfa, EPS };
    try {
      const result = new Function("Delta", value + "\n; return machine;")(
        Delta,
      );
      const { success } = NFASchema.safeParse(result);
      if (!success) {
        onError("✗ did you forget to call .build()?");
        return;
      }
      onError(null);
      onValidMachine(serialize(result));
    } catch (e) {
      onError(`✗ ${String(e).substring(0, 70)}...`);
    }
  };

  const handleMount: OnMount = (editor, monaco: typeof MonacoEditor) => {
    editorRef.current = editor;

    defineTheme(monaco);
    monaco.editor.setTheme("catppuccin-latte");

    monaco.typescript.typescriptDefaults.addExtraLib(
      DELTA_TYPES,
      "ts:delta/lib.d.ts",
    );
    if (monaco.editor.getModel(monaco.Uri.parse("ts:delta/lib.d.ts"))) {
      monaco.editor.createModel(
        DELTA_TYPES,
        "typescript",
        monaco.Uri.parse("ts:delta/lib.d.ts"),
      );
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
      runCode(editor.getValue()),
    );
  };

  return (
    <Editor
      theme="catppuccin-latte"
      path="file:///main.ts"
      height="100%"
      width="100%"
      defaultLanguage="typescript"
      defaultValue={DEFAULT_VALUE}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}
