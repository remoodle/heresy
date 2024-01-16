import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, splitVendorChunkPlugin } from "vite";
import vue from "@vitejs/plugin-vue";
import injectCDNPrefix, {
  extractPrefixConfig,
  createRenderBuiltUrl,
} from "./plugins/cdn-prefix";
import injectBuildInfo from "./plugins/build-info";
import packageJson from "./package.json";

export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const { cdnPrefixUrl } = extractPrefixConfig({
    host: env.CDN_HOST,
    prefix: env.CDN_PREFIX,
  });

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
      vue(),
      splitVendorChunkPlugin(),
      injectCDNPrefix({ cdnPrefixUrl }),
      injectBuildInfo({ sha: env.COMMIT_SHA, packageJson }),
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
