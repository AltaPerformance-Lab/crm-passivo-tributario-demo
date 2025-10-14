/** @type {import('eslint').Linter.FlatConfig[]} */
import nextPlugin from "@next/eslint-plugin-next";

const config = [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    // Ignora ficheiros de build e configuração
    ignores: [".next/", "node_modules/"],
  },
];

export default config;
