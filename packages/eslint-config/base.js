/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const baseConfig = [
  {
    rules: {
      curly: ["error", "all"],
      "max-depth": ["error", 6],
      "max-nested-callbacks": ["error", 7],
      "max-params": ["error", 7],
      "max-statements-per-line": ["error", { max: 1 }],
      "no-case-declarations": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
