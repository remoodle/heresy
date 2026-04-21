import { defineConfig } from "tsup";

export default defineConfig(() => ({
  entry: ["src/", "!src/**/*.spec.ts"],
  clean: true,
  format: ["cjs"],
  target: "node22",
  loader: {
    ".json": "copy",
  },
}));
