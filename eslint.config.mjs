import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/app/**", // App layer can import anything
  ]),
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Shared cannot import features or widgets
            {
              group: ["@/features/*", "@/widgets/*"],
              message: "Shared layer cannot import from features or widgets.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Entities cannot import features or widgets
            {
              group: ["@/features/*", "@/widgets/*"],
              message: "Entities layer cannot import from features or widgets.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Features cannot import widgets
            {
              group: ["@/widgets/*"],
              message: "Features layer cannot import from widgets.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
