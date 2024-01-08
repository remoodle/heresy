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

  const cdnPrefixUrl =
    !!env.CDN_PREFIX && !!env.CDN_HOST
      ? `https://${env.CDN_PREFIX}.${env.CDN_HOST}`
      : null;

  return {
    build: {
      rollupOptions: {
        ...(cdnPrefixUrl !== null && {
          output: {
            entryFileNames: "[name].js",
            chunkFileNames: "[name].js",
            assetFileNames: "assets/[name][extname]",
          },
        }),
      },
    },
    experimental: {
      ...(cdnPrefixUrl !== null && {
        renderBuiltUrl(
          filename: string,
          {
            hostId,
          }: {
            hostId: string;
          },
        ) {
          if (extname(hostId) === ".js") {
            return {
              runtime: `window.__toCdnUrl(${JSON.stringify(filename)})`,
            };
          }

          return `${cdnPrefixUrl}/` + filename;
        },
      }),
    },
    plugins: [
      vue(),
      {
        name: "cdn-prefix",
        enforce: "pre",
        transformIndexHtml() {
          if (!isCI || !cdnPrefixUrl) {
            return;
          }

          const els: IndexHtmlTransformResult = [];

          els.push({
            tag: "link",
            injectTo: "head-prepend",
            attrs: {
              rel: "preconnect",
              href: cdnPrefixUrl,
            },
          });
          els.push({
            tag: "link",
            injectTo: "head-prepend",
            attrs: {
              rel: "preconnect",
              href: cdnPrefixUrl,
              crossorigin: true,
            },
          });
          els.push({
            tag: "link",
            injectTo: "head-prepend",
            attrs: {
              rel: "dns-prefetch",
              href: cdnPrefixUrl,
            },
          });

          els.push({
            tag: "script",
            injectTo: "head-prepend",
            children: `window.__toCdnUrl = (filename) => "${cdnPrefixUrl}/" + filename;`,
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
            injectTo: "head",
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
