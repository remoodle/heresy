import type { ResolvedConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export const getRollupOutputOptions = () => {
  return {
    entryFileNames: "[name].js",
    chunkFileNames: "[name].js",
    assetFileNames: "assets/[name][extname]",
  };
};

export const getRollupPlugins = () => {
  return [
    {
      name: "visualizer",
      apply: "build",
      enforce: "post",
      configResolved(config: ResolvedConfig) {
        // @ts-ignore
        config.plugins.push(
          visualizer({
            open: false,
            template: "treemap",
            filename: `${config.build.outDir}/___bundle.html`,
          }),
        );
      },
    },
  ];
};
