import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["tailwind.config.ts", ".next/**", "**/*.mjs"],
  },
  ...coreWebVitals,
  ...nextTypescript,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ["db/repositories/sqlite/*.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  }
);
