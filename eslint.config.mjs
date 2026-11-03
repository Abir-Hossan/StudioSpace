import ts from "typescript-eslint";
export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next*/**",
      "**/dist/**",
      "**/next-env.d.ts",
    ],
  },
  ...ts.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
