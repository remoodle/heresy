require("@rushstack/eslint-patch/modern-module-resolution");

const baseConfig = require("../../codestyle/config-eslint");

module.exports = {
  ...baseConfig,
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    "plugin:vue/vue3-strongly-recommended",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
    "@vue/eslint-config-prettier/skip-formatting",
  ],
  rules: {
    ...baseConfig.rules,
    "vue/multi-word-component-names": "off",
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
};
