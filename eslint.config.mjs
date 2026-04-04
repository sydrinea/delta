import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  typescript: true,
  ignores: [
    '**/public/docs/**',
    '**/public/examples/**',
    'node_modules/**',
    '**/dist/**',
    '**/.turbo/**',
    '**/coverage/**',
  ],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
})
