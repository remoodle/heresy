require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
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
    "max-depth": ["error", 4],
    "max-lines": [
      "error",
      { max: 2500, skipBlankLines: false, skipComments: false },
    ],
    "max-nested-callbacks": ["error", 7],
    "max-params": ["error", 7],
    "no-case-declarations": "off",
    "max-statements-per-line": ["error", { max: 1 }],
    curly: ["error", "all"],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "vue/multi-word-component-names": "off",
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
};
