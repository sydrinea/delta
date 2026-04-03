import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  ignores: [
    '**/public/docs/**',
    '**/public/examples/**',
    'node_modules/**',
    '**/dist/**',
    '**/.turbo/**',
    '**/coverage/**',
  ],
})
