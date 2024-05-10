import { extname } from "node:path";
import type { Plugin } from "vite";

export const createRenderBuiltUrl = (
  version: string | null,
  filename: string,
  { type }: { hostType: string; hostId: string; type: "public" | "asset" },
) => {
  if (type === "asset") {
    return `/${filename}?v=${version}`;
  }
};

interface CBPluginOptions {
  version: string;
}

const createCBPlugin = (options: CBPluginOptions): Plugin => {
  const { version } = options;

  return {
    name: "add-query-parameter-plugin",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const [filename, chunk] of Object.entries(bundle)) {
        if (extname(filename) === ".js" && "code" in chunk && chunk.code) {
          // replace regular imports
          chunk.code = chunk.code.replace(
            /(from\s*['"][^"')]+\.js)(['"])/g,
            (_, $1, $2) => `${$1}?v=${version}${$2}`,
          );

          // replace dynamic imports and regular imports without 'from'
          chunk.code = chunk.code.replace(
            /(import\(?['"][^"')]+\.js)(['"]\)?)/g,
            (_, $1, $2) => `${$1}?v=${version}${$2}`,
          );
        }
      }
    },
  };
};

export default createCBPlugin;
