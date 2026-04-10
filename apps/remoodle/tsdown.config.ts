import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
  exports: true,
  onSuccess: "cp -r src/db/migrations dist/db/migrations",
});
