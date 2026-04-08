import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "bot/index": "src/bot/index.ts",
    "worker/index": "src/worker/index.ts",
    "db/migrate": "src/db/migrate.ts",
  },
  format: "esm",
  outDir: "dist",
  outExtensions: () => ({ js: ".mjs" }),
  onSuccess: "cp -r src/db/migrations dist/db/migrations",
});
