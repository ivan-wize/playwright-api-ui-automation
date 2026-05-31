/**
 * ESLint flat config for the suite (run via `npm run lint`).
 *
 * Layers, in order: JS recommended -> TypeScript recommended -> Playwright recommended
 * (scoped to the test dirs) -> prettier last so it disables every formatting rule and
 * leaves layout entirely to Prettier. Touch this when adding lint rules or a new code
 * directory that needs the Node globals / Playwright ruleset.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', '.auth'] },
  // Everything in this repo runs under Node (Playwright tests, the config, and
  // scripts/*.mjs), so expose Node globals (console, process, ...) everywhere.
  // Without this, eslint's no-undef flags scripts/setup.mjs and the run fails.
  { languageOptions: { globals: { ...globals.node } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'api/tests/**/*.ts', 'setup/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Assertions in this suite live inside page-object methods (expectLoaded,
      // expectError, expectCartCount, ...). This rule only detects literal
      // expect() calls in the test body, so it flags every POM-based test as a
      // false positive. Turned off deliberately; the assertions are real.
      'playwright/expect-expect': 'off',
    },
  },
  prettier, // MUST stay last: turns off rules that would conflict with Prettier
);
