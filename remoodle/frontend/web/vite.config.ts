import { fileURLToPath, URL } from "node:url";
import { extname } from "node:path";
import { defineConfig, loadEnv, type IndexHtmlTransformResult } from "vite";
import vue from "@vitejs/plugin-vue";
import packageJson from "./package.json";

export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const isCI = !!env.CI;
  const sha = env.COMMIT_SHA;
  const cdnPrefixUrl = `https://${env.CDN_PREFIX}.remoodle.pages.dev`;

  return {
    experimental: {
      renderBuiltUrl(
        filename: string,
        {
          hostId,
          hostType,
          type,
        }: {
          hostId: string;
          hostType: "js" | "css" | "html";
          type: "public" | "asset";
        },
      ) {
        if (type === "public") {
          return `${cdnPrefixUrl}/` + filename;
        } else if (extname(hostId) === ".js") {
          return { runtime: `window.__toCdnUrl(${JSON.stringify(filename)})` };
        } else {
          return `${cdnPrefixUrl}/` + filename;
        }
      },
    },
    plugins: [
      vue(),
      {
        name: "cdn-prefix",
        transformIndexHtml() {
          if (!cdnPrefixUrl) {
            return;
          }

          const els: IndexHtmlTransformResult = [];

          els.push({
            tag: "script",
            injectTo: "head",
            children: `window.__toCdnUrl = (filename) => {
              return '${cdnPrefixUrl}/' + filename;
            };`,
          });

          return els;
        },
      },
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
            children: `window.__BUILD_INFO__ = ${JSON.stringify({
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
