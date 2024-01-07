module.exports = {
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
  },
};
