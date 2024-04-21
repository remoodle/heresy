import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { ValidateEnv as validateEnv } from "@julr/vite-plugin-validate-env";
import injectCDNPrefix, {
  extractPrefixConfig,
  createRenderBuiltUrl,
} from "./plugins/cdn-prefix";
import injectBuildInfo from "./plugins/build-info";
import packageJson from "./package.json";

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const { cdnPrefixUrl = env.CF_PAGES_URL ?? null } = extractPrefixConfig({
    host: env.CDN_HOST,
    prefix: env.CDN_PREFIX,
  });

  return {
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    resolve: {
      alias: {
        "@": resolve("./src"),
      },
    },
    experimental: {
      renderBuiltUrl: (...args) => createRenderBuiltUrl(cdnPrefixUrl, ...args),
    },
    plugins: [
      vue(),
      vueDevTools(),
      validateEnv(),
      injectCDNPrefix({ cdnPrefixUrl }),
      injectBuildInfo({
        sha: env.COMMIT_SHA || env.CF_PAGES_COMMIT_SHA,
        packageJson,
      }),
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
