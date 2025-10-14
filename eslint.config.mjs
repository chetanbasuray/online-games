import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    plugins: { js, react: pluginReact, prettier: pluginPrettier },
    languageOptions: { globals: globals.browser },
    rules: {
      // JS recommended rules
      ...js.configs.recommended.rules,

      // React recommended rules
      ...pluginReact.configs.recommended.rules,

      // Enable prettier
      "prettier/prettier": "error",
    },
  },
]);
