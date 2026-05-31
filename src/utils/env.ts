import 'dotenv/config';

/**
 * Central, typed access to environment config. Reading `.env` once here (not
 * scattered `process.env` lookups) keeps every consumer (playwright.config.ts,
 * the page objects, the API suite) pointed at the same values.
 */

/** Read an env var, falling back to a default (all of ours have sensible defaults). */
function envOr(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  baseUrl: envOr('BASE_URL', 'https://www.saucedemo.com'),
  // UI and API suites hit two unrelated hosts: SauceDemo for the storefront,
  // the public Swagger Petstore for the API tests. Hence the separate base URL.
  apiBaseUrl: envOr('API_BASE_URL', 'https://petstore.swagger.io'),
  // SauceDemo publishes this shared password openly; it's the real credential,
  // not a placeholder. Overridable so the suite can target a private clone.
  password: envOr('SAUCE_PASSWORD', 'secret_sauce'),
} as const;
