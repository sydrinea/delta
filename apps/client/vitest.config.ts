import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./app/lib"),
      "@": path.resolve(__dirname, "."),
      "@delta/build": "../../packages/build/src/index.ts",
      "@delta/proto": "../../packages/proto/src/index.ts",
      "@delta/simulator": "../../packages/simulator/src/index.ts",
      "@delta/transform": "../../packages/transform/src/index.ts",
    },
  },
});
