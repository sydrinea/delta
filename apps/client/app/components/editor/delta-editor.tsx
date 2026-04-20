'use client'

import type { BeforeMount, OnChange, OnMount } from '@monaco-editor/react'
import type * as MonacoEditor from 'monaco-editor'
import type { MachineType } from '@/lib/worker/protocol'
import Editor, { useMonaco } from '@monaco-editor/react'
import { AlertTriangle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/ui/feedback/spinner'
import { useCompile } from '@/hooks/use-compile'
import { useEditorState } from '@/hooks/use-editor-state'
import { themeNames } from '@/lib/theme'
import { MachineTypes } from '@/lib/worker/protocol'
import defineThemes from './define-theme'

interface DeltaEditorProps {
  scope?: MachineType
}

const EDITOR_PATH = Object.fromEntries(
  Object.values(MachineTypes).map(t => [t, `file:///main.${t}.ts`]),
) as Record<MachineType, string>

export function DeltaEditor({ scope = 'nfa' }: DeltaEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  )
  const { resolvedTheme } = useTheme()

  const { value: editorValue, errors: editorErrors, setEditorValue } = useEditorState(scope)
  const compile = useCompile(scope)
  const monaco = useMonaco()

  const [isEditorReady, setIsEditorReady] = useState(false)

  const beforeMount: BeforeMount = (monaco: typeof MonacoEditor) => {
    defineThemes(monaco)

    monaco.editor.setTheme(
      `catppuccin-${themeNames[resolvedTheme ?? 'light']}`,
    )
  }

  const handleMount: OnMount = (editor, monaco: typeof MonacoEditor) => {
    editorRef.current = editor

    setIsEditorReady(true)

    compile(editor.getValue())

    monaco.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ESNext,
      module: monaco.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
    })

    monaco.typescript.typescriptDefaults.addExtraLib(
      // eslint-disable-next-line node/prefer-global/process
      process.env.DELTA_TYPES!,
      'ts:delta/lib.d.ts',
    )

    if (!monaco.editor.getModel(monaco.Uri.parse('ts:delta/lib.d.ts'))) {
      monaco.editor.createModel(
        // eslint-disable-next-line node/prefer-global/process
        process.env.DELTA_TYPES!,
        'typescript',
        monaco.Uri.parse('ts:delta/lib.d.ts'),
      )
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const model = editor.getModel()
      if (!model)
        return

      try {
        const getWorker = await monaco.typescript.getTypeScriptWorker()
        const worker = await getWorker(model.uri)

        const syntactic = await worker.getSyntacticDiagnostics(
          model.uri.toString(),
        )
        const semantic = await worker.getSemanticDiagnostics(
          model.uri.toString(),
        )
        const allDiagnostics = [...syntactic, ...semantic]

        const tsErrors = allDiagnostics.filter(d => d.category === 1)

        if (tsErrors.length > 0)
          return

        compile(editor.getValue())
      }
      catch {
        compile(editor.getValue())
      }
    })
  }

  useEffect(() => {
    if (editorRef.current && editorValue) {
      const current = editorRef.current.getValue()
      if (current !== editorValue) {
        editorRef.current.setValue(editorValue)
        compile(editorValue)
      }
    }
  }, [compile, editorValue, isEditorReady])

  useEffect(() => {
    if (!editorRef.current)
      return

    const model = editorRef.current.getModel()

    if (!model || !monaco)
      return

    if (editorErrors) {
      monaco.editor.setModelMarkers(
        model,
        'delta-runtime',
        editorErrors
          .filter(editorError => editorError.line !== 0)
          .map(editorError => ({
            startLineNumber: editorError.line,
            startColumn: editorError.column,
            endLineNumber: editorError.line,
            endColumn: model.getLineMaxColumn(editorError.line),
            message: editorError.message,
            severity: monaco.MarkerSeverity.Error,
          })),
      )
    }
    else {
      monaco.editor.setModelMarkers(model, 'delta-runtime', [])
    }
  }, [monaco, editorErrors])

  const handleChange: OnChange = (value) => {
    setEditorValue(value ?? '')
  }

  return (
    <div
      className="relative w-full h-full"
    >
      <Editor
        theme={`catppuccin-${themeNames[resolvedTheme ?? 'light']}`}
        path={EDITOR_PATH[scope]}
        height="100%"
        width="100%"
        defaultLanguage="typescript"
        defaultValue={editorValue}
        loading={(
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-6" />
          </div>
        )}
        beforeMount={beforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          padding: { top: 12, bottom: 12 },
          fixedOverflowWidgets: true,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 16,
          fontVariations: `'MONO' 0.5`,
        }}
      />

      {editorErrors
        && editorErrors.filter(err => err.line === 0).length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-background/95 backdrop-blur-md border border-destructive/30 shadow-sm rounded-lg z-raised flex items-start gap-3 px-4 py-3 transition-all">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />

          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">
              Build Failed
            </span>

            <span className="text-xs mt-1 text-destructive/90 leading-relaxed">
              {editorErrors.find(err => err.line === 0)!.message}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
