import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Ban the `React` UMD global namespace. TypeScript only errors on *value*
    // references (TS2686); type-only ones like `React.ReactNode` compile clean
    // even with no import, silently relying on the ambient global. Force the
    // named import (`import type { ReactNode } from "react"`) instead.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSQualifiedName[left.name='React']",
          message:
            "Import the type from 'react' (e.g. `import type { ReactNode } from 'react'`) instead of referencing the React UMD global.",
        },
        {
          selector: "MemberExpression[object.name='React']",
          message:
            "Import from 'react' instead of referencing the React UMD global.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
