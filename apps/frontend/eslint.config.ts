import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import oxlint from "eslint-plugin-oxlint";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import { baseConfig } from "@remoodle/eslint-config/base";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
  },

  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,

  baseConfig,

  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-unused-emit-declarations": "error",
    },
  },

  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },

  oxlint.configs["flat/recommended"],
  skipFormatting,
);
