# playwright-api-ui-automation

Automated UI and API tests for a QE practical task, built with Playwright and TypeScript. Two targets, one repo:

- **UI:** [Swag Labs](https://www.saucedemo.com), driven through real browsers.
- **API:** [Swagger Petstore](https://petstore.swagger.io) Pet endpoints.

Both share one toolchain (TypeScript in strict mode, Zod for API contract validation) and run from a single Playwright config. Everything below works the same on macOS, Linux, and Windows.

## Prerequisites

You need **Node.js 20** (pinned in `.nvmrc`) and **Git**. Confirm with `node --version` (expect `v20.x`) and `git --version`. Install whichever you're missing with your platform's package manager, or grab the installers from [nodejs.org](https://nodejs.org) and [git-scm.com](https://git-scm.com/downloads):

- **macOS** with [Homebrew](https://brew.sh): `brew install git node@20`
- **Windows** with [winget](https://learn.microsoft.com/windows/package-manager/winget/): `winget install Git.Git OpenJS.NodeJS.LTS`
- **Linux / macOS** with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (distro Node is often older than 20): `nvm install 20` (install Git via `apt`/`dnf`)

With nvm, run `nvm use` in the project root to pick up the pinned version automatically; `npm run setup` also checks your Node version before doing anything.

## Quick start

```bash
git clone https://github.com/ivan-wize/playwright-api-ui-automation.git
cd playwright-api-ui-automation
npm run setup   # installs dependencies + browsers, creates .env
npm test        # runs everything
```

`npm run setup` does the whole setup in one command, checks your Node version first, and runs identically on every OS. (By hand: `npm ci`, then `npx playwright install`, then copy `.env.example` to `.env`.) The first test run logs in once and reuses that session; when it finishes, `npm run report` opens the results.

## What a passing run looks like

```
204 passed (≈50s)
```

That's `npm test`, the blocking suite: the UI specs across four browsers, the API suite, and the one-time auth-setup step. The three seeded-defect checks aren't in this total; they run in a separate, non-blocking lane (below). (Exact counts can drift against the live sites, so treat the green summary line, not the number, as the verdict.)

### Defect-watch lane

```
npm run test:defect-watch   # 3 tests, Chromium only
```

These assert SauceDemo's _correct_ behavior for two intentionally-broken accounts (`problem_user`'s distinct images, `error_user`'s _sort_ and _Finish_) and are marked as expected failures with `test.fail()`. While each bug exists the test "fails as expected," so you'll see a red ✘ per test under a green summary. They're split out because they track a _third party's_ bugs: the day SauceDemo fixes one, that test flips to an _unexpected pass_ and this lane goes red, which must not block the real regression suite. See [Notes](#notes).

## Commands

| Command                              | What it runs                                       |
| ------------------------------------ | -------------------------------------------------- |
| `npm test`                           | Blocking suite: UI on all browsers + the API suite |
| `npm run test:ui`                    | UI on Chromium only (fast local loop)              |
| `npm run test:ui:all`                | UI on Chromium, Firefox, WebKit, and mobile Chrome |
| `npm run test:api`                   | API only (no browser)                              |
| `npm run test:defect-watch`          | Seeded-defect lane (Chromium, non-blocking)        |
| `npm run test:headed`                | UI with a visible browser window                   |
| `npm run test:debug`                 | Step through a test in the Playwright inspector    |
| `npm run report`                     | Open the last HTML report                          |
| `npm run lint` / `npm run typecheck` | Static checks                                      |
| `npm run format` / `format:check`    | Format with Prettier / check formatting            |

Scope a run to a path: `npx playwright test --project=chromium tests/checkout`.

## Configuration

The suite runs against the public targets with no setup. A `.env` is optional and only overrides defaults (`BASE_URL`, `API_BASE_URL`, `SAUCE_PASSWORD`). `.env.example` is the template, and setup copies it for you. (Usernames aren't configurable: the six SauceDemo accounts are fixed and live in `src/data/users.ts`.)

## Project structure

```
src/                 UI framework: page objects, components, fixtures, data, helpers
tests/               UI specs, grouped by feature
tests/defect-watch/  seeded-defect checks, run as a separate non-blocking lane
setup/               one-time login that saves a reusable session
api/                 API client, schemas, fixtures, specs, and api-tests.md
flows.txt            the UI scenarios, in plain language
BUGS.md              defects and quality findings (UI + API)
```

`src/` (the reusable framework) is kept separate from `tests/` (the specs) so the page objects stay a library rather than logic copied into each test.

## How it works

- **Page Object Model.** Each screen is a class owning its locators and actions; shared chrome (header, menu, footer) lives in reusable components, so a markup change has one place to fix.
- **Fixtures.** A custom `test` (`src/fixtures/pages.fixture.ts`) hands ready page objects to every spec, so tests never construct them.
- **Log in once.** A setup project saves the signed-in session and UI tests start authenticated. The login spec, the end-to-end journey, and the special-user specs deliberately start logged out.
- **Stable selectors, auto-retrying assertions.** Locators use SauceDemo's `data-test` attributes (falling back to role or text); checks retry instead of sleeping, which is what absorbs the intentionally slow `performance_glitch_user`.
- **API contract validation.** Created-pet and error responses are validated against Zod schemas, so a right-status, wrong-shape response still fails; the shared list endpoint asserts only the filter contract (its multi-tenant data is too noisy for strict shape checks). The public sandbox is handled with polling and unique data. Details in `api/api-tests.md`.

## CI

GitHub Actions runs four jobs on every push and PR to `main`: static checks (typecheck, lint, format), the UI suite, the API suite, and a **non-blocking** defect-watch job. The first three gate the build; defect-watch runs with `continue-on-error`, so an upstream SauceDemo fix surfaces (a red job plus its uploaded report) without failing the run or blocking the merge. Browser binaries are cached and superseded PR runs are cancelled; HTML reports and JUnit results are uploaded as artifacts. Traces, screenshots, and video are kept on failure.

## Notes

- **Defects found during testing are written up in [BUGS.md](BUGS.md).** A short list of the SauceDemo seeded defects and the Petstore quality observations the suite surfaced, each linked to the test or code that covers it.
- **The seeded-defect failures are expected, and isolated.** `problem_user`'s "distinct image" test and `error_user`'s "sort" and "Finish" tests each track a real Swag Labs defect via Playwright's `test.fail()`. They live in their own non-blocking lane (`tests/defect-watch/`, run with `npm run test:defect-watch`) precisely so that if one flips to an unexpected pass (meaning SauceDemo fixed the bug) only that lane goes red, not the blocking suite. When that happens, remove the marker.
- **Occasional API errors are usually the sandbox, not you.** The public Petstore is shared, so bad data from other users can make a search return a 500. Those cases skip with a note, and a re-run usually clears it (CI retries twice).

## Troubleshooting

- **`command not found` (git / node / npm):** the tool isn't installed, or you need a fresh terminal after installing it. See [Prerequisites](#prerequisites).
- **Node too old:** install the LTS, or run `nvm install 20 && nvm use`.
- **Browsers missing:** run `npx playwright install`.
- **Installs hang or can't connect:** a corporate VPN or proxy may be blocking the download hosts; try off-VPN or ask IT.
- **Clean slate:** delete `node_modules` and `.auth`, then re-run `npm run setup`.

## License

Released under the [MIT License](LICENSE).
