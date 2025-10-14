import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import babelParser from "@babel/eslint-parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
      globals: globals.browser,
    },
    plugins: { react: pluginReact },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
