import * as MonacoEditor from "monaco-editor";

/**
 * Define Catppuccin Latte for use in Monaco
 * @param monaco The editor
 */
export default function defineTheme(monaco: typeof MonacoEditor) {
  // The color palette
  const latte = {
    rosewater: "dc8a78",
    flamingo: "dd7878",
    pink: "ea76cb",
    mauve: "8839ef",
    red: "d20f39",
    maroon: "e64553",
    peach: "fe640b",
    yellow: "df8e1d",
    green: "40a02b",
    teal: "179299",
    sky: "04a5e5",
    sapphire: "209fb5",
    blue: "1e66f5",
    lavender: "7287fd",
    text: "4c4f69",
    subtext1: "5c5f77",
    subtext0: "6c6f85",
    overlay2: "7c7f93",
    overlay1: "8c8fa1",
    overlay0: "9ca0b0",
    surface2: "acb0be",
    surface1: "bcc0cc",
    surface0: "ccd0da",
    base: "eff1f5",
    mantle: "e6e9ef",
    crust: "dce0e8",
  };

  monaco.editor.defineTheme("catppuccin-latte", {
    base: "vs",
    inherit: false,
    rules: [
      // base
      { token: "", foreground: latte.text, background: latte.base },

      // comments
      { token: "comment", foreground: latte.overlay1, fontStyle: "italic" },
      {
        token: "comment.block",
        foreground: latte.overlay1,
        fontStyle: "italic",
      },
      {
        token: "comment.line",
        foreground: latte.overlay1,
        fontStyle: "italic",
      },

      // keywords
      { token: "keyword", foreground: latte.mauve },
      { token: "keyword.control", foreground: latte.mauve },
      { token: "keyword.operator", foreground: latte.sky },
      { token: "keyword.other", foreground: latte.mauve },

      // types
      { token: "type", foreground: latte.yellow },
      { token: "type.identifier", foreground: latte.yellow },
      { token: "support.type", foreground: latte.yellow },
      { token: "entity.name.type", foreground: latte.yellow },

      // classes & functions
      { token: "entity.name.function", foreground: latte.blue },
      { token: "entity.name.class", foreground: latte.yellow },
      { token: "support.function", foreground: latte.blue },
      { token: "meta.function-call", foreground: latte.blue },

      // variables
      { token: "variable", foreground: latte.text },
      { token: "variable.other", foreground: latte.text },
      { token: "variable.parameter", foreground: latte.maroon },
      { token: "variable.language", foreground: latte.mauve },

      // strings
      { token: "string", foreground: latte.green },
      { token: "string.quoted", foreground: latte.green },
      { token: "string.template", foreground: latte.green },
      { token: "string.escape", foreground: latte.pink },

      // numbers
      { token: "constant.numeric", foreground: latte.peach },
      { token: "number", foreground: latte.peach },

      // booleans & constants
      { token: "constant.language", foreground: latte.peach },
      { token: "constant", foreground: latte.peach },

      // operators & punctuation
      { token: "operator", foreground: latte.sky },
      { token: "punctuation", foreground: latte.overlay2 },
      { token: "delimiter", foreground: latte.overlay2 },
      { token: "delimiter.bracket", foreground: latte.overlay2 },
      { token: "delimiter.parenthesis", foreground: latte.overlay2 },

      // tags (jsx/html)
      { token: "tag", foreground: latte.red },
      { token: "tag.attribute.name", foreground: latte.yellow },
      { token: "attribute.name", foreground: latte.yellow },
      { token: "attribute.value", foreground: latte.green },

      // typescript specific
      { token: "type.annotation", foreground: latte.yellow },
      { token: "keyword.operator.type", foreground: latte.sky },
      { token: "storage.type", foreground: latte.mauve },
      { token: "storage.modifier", foreground: latte.mauve },
      { token: "meta.type.annotation", foreground: latte.yellow },

      // invalid
      { token: "invalid", foreground: latte.red, fontStyle: "underline" },
    ],
    colors: {
      // editor chrome
      "editor.background": `#${latte.base}`,
      "editor.foreground": `#${latte.text}`,
      "editorLineNumber.foreground": `#${latte.surface2}`,
      "editorLineNumber.activeForeground": `#${latte.subtext0}`,
      "editorCursor.foreground": `#${latte.rosewater}`,
      "editorCursor.background": `#${latte.base}`,

      // selection & highlights
      "editor.selectionBackground": `#${latte.surface0}`,
      "editor.inactiveSelectionBackground": `#${latte.surface0}88`,
      "editor.selectionHighlightBackground": `#${latte.surface0}66`,
      "editor.wordHighlightBackground": `#${latte.surface0}`,
      "editor.wordHighlightStrongBackground": `#${latte.surface1}`,
      "editor.findMatchBackground": `#${latte.yellow}44`,
      "editor.findMatchHighlightBackground": `#${latte.yellow}22`,

      // line
      "editor.lineHighlightBackground": `#${latte.mantle}`,
      "editor.lineHighlightBorder": `#00000000`,

      // indent guides
      "editorIndentGuide.background1": `#${latte.surface0}`,
      "editorIndentGuide.activeBackground1": `#${latte.surface2}`,

      // gutter
      "editorGutter.background": `#${latte.base}`,
      "editorGutter.addedBackground": `#${latte.green}`,
      "editorGutter.modifiedBackground": `#${latte.yellow}`,
      "editorGutter.deletedBackground": `#${latte.red}`,

      // widgets
      "editorWidget.background": `#${latte.mantle}`,
      "editorWidget.border": `#${latte.surface1}`,
      "editorWidget.foreground": `#${latte.text}`,

      // suggest widget
      "editorSuggestWidget.background": `#${latte.mantle}`,
      "editorSuggestWidget.border": `#${latte.surface1}`,
      "editorSuggestWidget.foreground": `#${latte.text}`,
      "editorSuggestWidget.selectedForeground": `#${latte.text}`,
      "editorSuggestWidget.selectedBackground": `#${latte.surface0}`,
      "editorSuggestWidget.highlightForeground": `#${latte.blue}`,

      // hover widget
      "editorHoverWidget.background": `#${latte.mantle}`,
      "editorHoverWidget.border": `#${latte.surface1}`,
      "editorHoverWidget.foreground": `#${latte.text}`,

      // bracket matching
      "editorBracketMatch.background": `#${latte.surface1}`,
      "editorBracketMatch.border": `#${latte.overlay2}`,

      // errors & warnings
      "editorError.foreground": `#${latte.red}`,
      "editorWarning.foreground": `#${latte.yellow}`,
      "editorInfo.foreground": `#${latte.blue}`,

      // scrollbar
      "scrollbarSlider.background": `#${latte.surface1}88`,
      "scrollbarSlider.hoverBackground": `#${latte.surface2}88`,
      "scrollbarSlider.activeBackground": `#${latte.overlay0}88`,

      // list
      "list.hoverBackground": `#${latte.surface0}`,
      "list.hoverForeground": `#${latte.text}`,
      "list.activeSelectionBackground": `#${latte.surface1}`,
      "list.activeSelectionForeground": `#${latte.text}`,
      "list.inactiveSelectionBackground": `#${latte.surface0}`,
      "list.inactiveSelectionForeground": `#${latte.text}`,

      // minimap
      "minimap.background": `#${latte.mantle}`,

      // overview ruler
      "editorOverviewRuler.border": `#${latte.surface0}`,
      "editorOverviewRuler.errorForeground": `#${latte.red}`,
      "editorOverviewRuler.warningForeground": `#${latte.yellow}`,
    },
  });
}
