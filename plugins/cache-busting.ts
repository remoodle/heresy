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
          chunk.code = chunk.code.replace(
            /(from\s*|import\(?)(['"][^"')]+\.js)(['"]\)?)/g,
            (_, $1, $2, $3) => `${$1}${$2}?v=${version}${$3}`,
          );
        }
      }
    },
  };
};

export default createCBPlugin;
