import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "bot/index": "src/bot/index.ts",
    "worker/index": "src/worker/index.ts",
  },
  format: "esm",
  outDir: "dist",
  outExtensions: () => ({ js: ".mjs" }),
});
