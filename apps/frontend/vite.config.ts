import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { ValidateEnv } from "@julr/vite-plugin-validate-env";
import packageJson from "./package.json";

export default defineConfig((config) => {
  const { mode } = config;

  const env = loadEnv(mode, process.cwd(), "");

  const sha = env.COMMIT_SHA || env.CF_PAGES_COMMIT_SHA;
  const buildInfo = {
    version: `${packageJson.version}${sha ? "." + sha.slice(0, 8) : ""}`,
  };

  return {
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      ValidateEnv({ configFile: "env" }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      __BUILD_INFO__: JSON.stringify(buildInfo),
    },
  };
});
