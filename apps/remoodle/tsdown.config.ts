import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.spec.ts", "!src/library/i18n/**"],
  exports: false,
  onSuccess: "cp -r src/db/migrations dist/db/migrations",
});
