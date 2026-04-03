export type Theme = 'latte' | 'mocha'

interface ThemeNames {
  [key: string]: Theme
  light: Theme
  dark: Theme
}

export const themeNames: ThemeNames = {
  light: 'latte',
  dark: 'mocha',
}
