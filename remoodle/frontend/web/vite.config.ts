import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv, type IndexHtmlTransformResult } from "vite";
import vue from "@vitejs/plugin-vue";
import packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const isCI = !!env.CI;
  const sha = env.COMMIT_SHA;

  return {
    plugins: [
      vue(),
      {
        name: "build-info",
        transformIndexHtml() {
          if (!isCI || !sha) {
            return;
          }

          const els: IndexHtmlTransformResult = [];

          const version = packageJson.version;

          els.push({
            tag: "script",
            injectTo: "body",
            children: `__BUILD_INFO__ = ${JSON.stringify({
              version: `${version}.${sha.slice(0, 8)}`,
            })}`,
          });

          return els;
        },
      },
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
