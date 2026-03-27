import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib": "./app/lib",
      "@delta/build": "../../packages/build/src/index.ts",
      "@delta/proto": "../../packages/proto/src/index.ts",
      "@delta/simulator": "../../packages/simulator/src/index.ts",
      "@delta/transform": "../../packages/transform/src/index.ts",
    },
  },
});
