import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import Vue from "@vitejs/plugin-vue";
import CDNPrefixer, {
  extractPrefixConfig,
  createRenderBuiltUrl,
} from "./plugins/cdn-prefix";
import BuildInfo from "./plugins/build-info";
import packageJson from "./package.json";

export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const { cdnPrefixUrl } = extractPrefixConfig(env);

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    experimental: {
      renderBuiltUrl: (...args) => createRenderBuiltUrl(cdnPrefixUrl, ...args),
    },
    plugins: [
      Vue(),
      CDNPrefixer({ cdnPrefixUrl }),
      BuildInfo({ sha: env.COMMIT_SHA, packageJson }),
    ],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  };
});
