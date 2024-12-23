import eslint from "@eslint/js";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
 eslint.configs.recommended,
 typescriptEslint.configs.strict,
 typescriptEslint.configs.stylistic,
 { ignores: ["dist/"] },
 {
  rules: {
   // Força usar return nas arrow functions (melhora refatoração)
   "arrow-body-style": ["error", "always"],

   // Desativada pois o Next e Astro tem env.d com ///
   "@typescript-eslint/triple-slash-reference": "off",

   // Força utilizar type ao invés de interface
   "@typescript-eslint/consistent-type-definitions": ["error", "type"],

   // Força: { property: property } = { property }
   "object-shorthand": "error",

   // Força a concatenação de strings com ${} ao invés de +
   "prefer-template": "error",

   // Força ter que informar que é type no import
   "@typescript-eslint/consistent-type-imports": "error",
  },
 },
 {
  files: ["**/*.cjs"],
  rules: { "@typescript-eslint/no-require-imports": "off" },
  languageOptions: { globals: { ...globals.commonjs } },
 },
);
