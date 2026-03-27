import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@delta/shared": "../shared/src/index.ts",
    },
  },
});
