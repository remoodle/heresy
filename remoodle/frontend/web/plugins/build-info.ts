import type { Plugin, IndexHtmlTransformResult } from "vite";

interface BuildInfoPluginOptions {
  sha: string;
  packageJson: {
    version: string;
  };
}

const createBuildInfoPlugin = (options: BuildInfoPluginOptions): Plugin => {
  const { sha, packageJson } = options;

  return {
    name: "build-info",
    apply: "build",
    enforce: "pre",
    transformIndexHtml() {
      if (!sha) {
        console.warn("No sha found, skipping build info");
        return;
      }

      const els: IndexHtmlTransformResult = [];

      const version = packageJson.version;

      els.push({
        tag: "script",
        injectTo: "head",
        children: `window.__BUILD_INFO__ = ${JSON.stringify({
          version: `${version}.${sha.slice(0, 8)}`,
        })}`,
      });

      return els;
    },
  };
};

export default createBuildInfoPlugin;
