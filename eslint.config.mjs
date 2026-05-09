import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

// eslint-config-next bundles its own typescript-eslint, so it registers
// @typescript-eslint from a different module instance than our top-level dep.
// Strip that registration here so tseslint.configs.recommendedTypeChecked
// below is the sole registrar — one instance, no flat-config plugin conflict.
function dropTsPlugin(configs) {
  return configs.map((cfg) => {
    if (!cfg.plugins?.["@typescript-eslint"]) return cfg;
    const { "@typescript-eslint": _, ...rest } = cfg.plugins;
    return { ...cfg, plugins: rest };
  });
}

export default tseslint.config(
  {
    ignores: ["tailwind.config.ts", ".next/**", "**/*.mjs"],
  },
  ...dropTsPlugin(coreWebVitals),
  ...dropTsPlugin(nextTypescript),
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
