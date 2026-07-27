import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "build/**",
      ".react-router/**",
      ".pnpm-store/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // 依赖方向红线 1：页面与领域组件禁止直接 import 内容源（content/**），
  // 内容只能经 content-io -> repository 进入展示层（基线 §3/§6）。
  {
    files: ["src/pages/**/*", "src/domains/**/components/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@content/*", "@content/**", "**/content/**"],
              message:
                "页面/领域组件禁止直接 import content/**，请经领域 repository 获取类型化数据。",
            },
          ],
        },
      ],
    },
  },
  // 依赖方向红线 2：shared 是最底层，禁止反向依赖 domains/pages。
  {
    files: ["src/shared/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/domains/*",
                "@/domains/**",
                "@/pages/*",
                "@/pages/**",
                "**/domains/**",
                "**/pages/**",
              ],
              message:
                "shared 层禁止依赖 domains/pages（依赖方向：pages → domains → shared）。",
            },
          ],
        },
      ],
    },
  },
);
