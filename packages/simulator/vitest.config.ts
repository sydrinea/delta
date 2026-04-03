import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@delta/shared': '../shared/src/index.ts',
      '@delta/build': '../build/src/index.ts',
      '@delta/transform': '../transform/src/index.ts',
    },
  },
})
