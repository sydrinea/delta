import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./app/lib"),
      "@delta/build": "../../packages/build/src/index.ts",
      "@delta/simulator": "../../packages/simulator/src/index.ts",
      "@delta/transform": "../../packages/transform/src/index.ts",
    },
  },
});
