import type * as MonacoEditor from 'monaco-editor'
import { flavors } from '@catppuccin/palette'
import { getCatppuccinMonacoTheme } from './catppuccin-monaco'

/**
 * Initializes Catppuccin themes for Monaco Editor
 * @param monaco The Monaco Editor instance
 */
export default function defineThemes(monaco: typeof MonacoEditor) {
  const themesToRegister = [
    { name: 'latte', base: 'vs' as const, colors: flavors.latte.colors },
    { name: 'mocha', base: 'vs-dark' as const, colors: flavors.mocha.colors },
  ]

  for (const theme of themesToRegister) {
    const { rules, colors } = getCatppuccinMonacoTheme(theme.colors)

    monaco.editor.defineTheme(`catppuccin-${theme.name}`, {
      base: theme.base,
      inherit: false,
      rules,
      colors,
    })
  }
}
