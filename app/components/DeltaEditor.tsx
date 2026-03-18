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
import { useDelta } from "@/context/DeltaContext";

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

  class StateProxy {
    loop(...symbols: string[]): this;
    to(target: string, ...symbols: string[]): this;
    done(): NFABuilder;
  }

  class NFABuilder {
    alphabet(...symbols: string[]): this;
    states(...states: string[]): this;
    start(state: string): this;
    accept(...states: string[]): this;
    transition(from: string, symbol: string, to: string): this;
    state(state: string): StateProxy;
    batch(filter: (state: string) => boolean, apply: (state: StateProxy) => this): this;
    all(apply: (state: StateProxy) => this): this;
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

interface DeltaEditorProps {
  onValidMachine: (anf: string) => void;
  onError: (error: string | null) => void;
}

export function DeltaEditor({ onValidMachine, onError }: DeltaEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const { editorValue, setEditorValue } = useDelta();

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
    if (!monaco.editor.getModel(monaco.Uri.parse("ts:delta/lib.d.ts"))) {
      monaco.editor.createModel(
        DELTA_TYPES,
        "typescript",
        monaco.Uri.parse("ts:delta/lib.d.ts"),
      );
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      runCode(editor.getValue());
      setEditorValue(editor.getValue());
    });
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
      options={{
        minimap: { enabled: false },
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}
