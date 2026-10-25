import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    exports: false,
    // Shared modules ship as TypeScript source, so they are bundled in; their dependencies are
    // declared here too because the bundle imports them from this package.
    deps: { alwaysBundle: [/^@heresy\/shared/] },
  },
});
