import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/store': path.resolve(__dirname, './app/store'),
      '@/hooks': path.resolve(__dirname, './app/hooks'),
      '@delta/build': path.resolve(__dirname, '../../packages/build/src/index.ts'),
      '@delta/simulator': path.resolve(__dirname, '../../packages/simulator/src/index.ts'),
      '@delta/transform': path.resolve(__dirname, '../../packages/transform/src/index.ts'),
      '@delta/examples/recipes': path.resolve(__dirname, '../../examples/generated/recipes.ts'),
      '@delta/examples': path.resolve(__dirname, '../../examples/generated/index.ts'),
    },
  },
})
