import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./app/lib"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
