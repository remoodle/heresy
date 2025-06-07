import { defineConfig } from "tsup";

export default defineConfig(() => ({
  entry: ["src/app.ts", "!src/**/*.spec.ts"],
  clean: true,
  format: ["cjs"],
  target: "node22",
  noExternal: ["@remoodle/utils", "@remoodle/db"],
}));
