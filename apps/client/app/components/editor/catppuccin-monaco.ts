import type { CatppuccinColors } from '@catppuccin/palette'
import type { editor } from 'monaco-editor'

type TokenStyle = string | { fg?: string, bg?: string, fontStyle?: string }

interface Theme {
  rules: editor.ITokenThemeRule[]
  colors: Record<string, string>
}

/**
 * Generates Monaco Editor rules and UI colors
 * @param colors A flavor palette from @catppuccin/palette (e.g., flavors.mocha.colors)
 * @returns An object containing the formatted rules array and the colors dictionary
 */
export function getCatppuccinMonacoTheme(colors: CatppuccinColors): Theme {
  const tokenMap: Record<string, TokenStyle> = {
    // Base
    '': { fg: colors.text.hex, bg: colors.base.hex },

    // Comments
    'comment': { fg: colors.overlay1.hex, fontStyle: 'italic' },
    'comment.block': { fg: colors.overlay1.hex, fontStyle: 'italic' },
    'comment.line': { fg: colors.overlay1.hex, fontStyle: 'italic' },

    // Keywords
    'keyword': colors.mauve.hex,
    'keyword.control': colors.mauve.hex,
    'keyword.operator': colors.sky.hex,
    'keyword.other': colors.mauve.hex,

    // Types
    'type': colors.yellow.hex,
    'type.identifier': colors.yellow.hex,
    'support.type': colors.yellow.hex,
    'entity.name.type': colors.yellow.hex,
    'type.annotation': colors.yellow.hex,
    'meta.type.annotation': colors.yellow.hex,
    'keyword.operator.type': colors.sky.hex,
    'storage.type': colors.mauve.hex,
    'storage.modifier': colors.mauve.hex,

    // Classes & Functions
    'entity.name.class': colors.yellow.hex,
    'entity.name.function': colors.blue.hex,
    'support.function': colors.blue.hex,
    'meta.function-call': colors.blue.hex,

    // Variables
    'variable': colors.text.hex,
    'variable.other': colors.text.hex,
    'variable.parameter': colors.maroon.hex,
    'variable.language': colors.mauve.hex,

    // Strings
    'string': colors.green.hex,
    'string.quoted': colors.green.hex,
    'string.template': colors.green.hex,
    'string.escape': colors.pink.hex,

    // Numbers & Constants
    'number': colors.peach.hex,
    'constant.numeric': colors.peach.hex,
    'constant': colors.peach.hex,
    'constant.language': colors.peach.hex,

    // Operators & Punctuation
    'operator': colors.sky.hex,
    'punctuation': colors.overlay2.hex,
    'delimiter': colors.overlay2.hex,
    'delimiter.bracket': colors.overlay2.hex,
    'delimiter.parenthesis': colors.overlay2.hex,

    // HTML / JSX Tags
    'tag': colors.red.hex,
    'tag.attribute.name': colors.yellow.hex,
    'attribute.name': colors.yellow.hex,
    'attribute.value': colors.green.hex,

    // Diagnostics
    'invalid': { fg: colors.red.hex, fontStyle: 'underline' },
  }

  // Convert the friendly map above into Monaco's required array format
  const rules: editor.ITokenThemeRule[] = Object.entries(tokenMap).map(
    ([token, style]) => {
      if (typeof style === 'string') {
        return { token, foreground: style }
      }
      return {
        token,
        ...(style.fg && { foreground: style.fg }),
        ...(style.bg && { background: style.bg }),
        ...(style.fontStyle && { fontStyle: style.fontStyle }),
      }
    },
  )

  const uiColors: Record<string, string> = {
    // Base Editor
    'editor.background': colors.base.hex,
    'editor.foreground': colors.text.hex,
    'editorCursor.foreground': colors.rosewater.hex,
    'editorCursor.background': colors.base.hex,
    'editorLineNumber.foreground': colors.surface2.hex,
    'editorLineNumber.activeForeground': colors.subtext0.hex,

    // Selections & Highlights
    'editor.selectionBackground': colors.surface0.hex,
    'editor.inactiveSelectionBackground': `${colors.surface0.hex}88`,
    'editor.selectionHighlightBackground': `${colors.surface0.hex}66`,
    'editor.wordHighlightBackground': colors.surface0.hex,
    'editor.wordHighlightStrongBackground': colors.surface1.hex,
    'editor.findMatchBackground': `${colors.yellow.hex}44`,
    'editor.findMatchHighlightBackground': `${colors.yellow.hex}22`,

    // Current Line
    'editor.lineHighlightBackground': colors.mantle.hex,
    'editor.lineHighlightBorder': '#00000000',

    // Indent Guides
    'editorIndentGuide.background1': colors.surface0.hex,
    'editorIndentGuide.activeBackground1': colors.surface2.hex,

    // Gutter
    'editorGutter.background': colors.base.hex,
    'editorGutter.addedBackground': colors.green.hex,
    'editorGutter.modifiedBackground': colors.yellow.hex,
    'editorGutter.deletedBackground': colors.red.hex,

    // General Widgets
    'editorWidget.background': colors.mantle.hex,
    'editorWidget.border': colors.surface1.hex,
    'editorWidget.foreground': colors.text.hex,

    // Suggest/Autocomplete Widget
    'editorSuggestWidget.background': colors.mantle.hex,
    'editorSuggestWidget.border': colors.surface1.hex,
    'editorSuggestWidget.foreground': colors.text.hex,
    'editorSuggestWidget.selectedForeground': colors.text.hex,
    'editorSuggestWidget.selectedBackground': colors.surface0.hex,
    'editorSuggestWidget.highlightForeground': colors.blue.hex,

    // Hover Widget
    'editorHoverWidget.background': colors.mantle.hex,
    'editorHoverWidget.border': colors.surface1.hex,
    'editorHoverWidget.foreground': colors.text.hex,

    // Bracket Matching
    'editorBracketMatch.background': colors.surface1.hex,
    'editorBracketMatch.border': colors.overlay2.hex,

    // Diagnostics (Errors/Warnings)
    'editorError.foreground': colors.red.hex,
    'editorWarning.foreground': colors.yellow.hex,
    'editorInfo.foreground': colors.blue.hex,

    // Scrollbar
    'scrollbarSlider.background': `${colors.surface1.hex}88`,
    'scrollbarSlider.hoverBackground': `${colors.surface2.hex}88`,
    'scrollbarSlider.activeBackground': `${colors.overlay0.hex}88`,

    // Lists/Trees
    'list.hoverBackground': colors.surface0.hex,
    'list.hoverForeground': colors.text.hex,
    'list.activeSelectionBackground': colors.surface1.hex,
    'list.activeSelectionForeground': colors.text.hex,
    'list.inactiveSelectionBackground': colors.surface0.hex,
    'list.inactiveSelectionForeground': colors.text.hex,

    // Minimap
    'minimap.background': colors.mantle.hex,

    // Overview Ruler (Scrollbar tracks)
    'editorOverviewRuler.border': colors.surface0.hex,
    'editorOverviewRuler.errorForeground': colors.red.hex,
    'editorOverviewRuler.warningForeground': colors.yellow.hex,
  }

  return {
    rules,
    colors: uiColors,
  }
}
