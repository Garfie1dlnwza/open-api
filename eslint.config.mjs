import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.astro/**", "**/node_modules/**", "**/.wrangler/**", "**/*.generated.json", "**/*.astro"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["log", "error"] }],
    },
  },
  { files: ["**/*.mjs", "scripts/**/*.ts"], languageOptions: { globals: { process: "readonly", console: "readonly", URL: "readonly" } } },
  { files: ["**/*.test.ts", "**/*.test.tsx"], rules: { "@typescript-eslint/no-non-null-assertion": "off", "@typescript-eslint/no-explicit-any": "off" } },
);
