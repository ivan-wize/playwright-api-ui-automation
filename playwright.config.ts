/**
 * Playwright runner config: the single entry point for how the suite executes.
 *
 * Two targets share one config: the SauceDemo UI tests (four browser/device
 * projects behind a one-time auth setup) and the Swagger Petstore API tests (no
 * browser, no auth). The npm `test:*` scripts pick projects from here via --project.
 */
import { defineConfig, devices } from '@playwright/test';
import { env } from './src/utils/env';

// Single source of truth for URLs + their defaults lives in src/utils/env.ts
// (which also loads dotenv), so the config doesn't duplicate the literals.
const BASE_URL = env.baseUrl;
const API_BASE_URL = env.apiBaseUrl;
const STORAGE_STATE = '.auth/standard.json';

// Seeded-defect specs live in tests/defect-watch/ and run only in the
// `defect-watch` project below. The browser projects share tests/, so they
// ignore this dir: that keeps the upstream-bug checks out of the blocking suite
// (and off all four browsers). See that project for the full rationale.
const DEFECT_WATCH_GLOB = '**/defect-watch/**';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail the build if a stray test.only is committed
  // CI retries twice to absorb infra/network flakiness against the live demo sites;
  // locally retries stay at 0 so a real failure surfaces immediately. Workers are
  // capped on CI for stable shared runners and left to Playwright's default elsewhere.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // CI adds the GitHub annotations + a JUnit file for the pipeline to ingest; local
  // runs use the lighter `list` reporter. Both keep the HTML report but never auto-open.
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    // SauceDemo tags elements with data-test, so getByTestId() targets that attribute
    // instead of Playwright's default data-testid.
    testIdAttribute: 'data-test',
    // Capture debugging artifacts only when something goes wrong (trace on the retry,
    // screenshot/video on failure) to keep passing runs fast and the output dir small.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // 1) Auth setup: runs first, logs in once, writes the session to .auth/standard.json
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
      use: { baseURL: BASE_URL },
    },
    // 2) UI (Swag Labs). Each browser `dependencies: ['setup']` runs the login once
    //    up front; storageState then replays that session, skipping per-test login.
    {
      name: 'chromium',
      testDir: './tests',
      testIgnore: DEFECT_WATCH_GLOB,
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URL, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testDir: './tests',
      testIgnore: DEFECT_WATCH_GLOB,
      use: { ...devices['Desktop Firefox'], baseURL: BASE_URL, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testDir: './tests',
      testIgnore: DEFECT_WATCH_GLOB,
      use: { ...devices['Desktop Safari'], baseURL: BASE_URL, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testDir: './tests',
      testIgnore: DEFECT_WATCH_GLOB,
      use: { ...devices['Pixel 5'], baseURL: BASE_URL, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    // 3) API (Swagger Petstore). No browser and no setup dependency (REST calls
    //    need no UI session), so it runs independently against ./api/tests.
    {
      name: 'api',
      testDir: './api/tests',
      use: { baseURL: API_BASE_URL },
    },
    // 4) Defect-watch: a deliberately NON-BLOCKING lane for SauceDemo's seeded
    //    bugs, asserted via test.fail(). These track a third party's bugs, so the
    //    day SauceDemo fixes one the test "unexpectedly passes" and the lane goes
    //    red; that must not block the real suite, so it runs as a separate
    //    `continue-on-error` CI job (see .github/workflows/ci.yml). Chromium-only,
    //    and no `setup` dependency (each spec logs in itself).
    {
      name: 'defect-watch',
      testDir: './tests/defect-watch',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URL },
    },
  ],
});
