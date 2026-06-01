# Defects and Quality Findings

Findings surfaced while testing the two targets. The SauceDemo items are intentionally
seeded defects that the suite asserts as expected failures in the non-blocking
defect-watch lane; the Petstore items are observed behaviors of a shared public demo
API, some of which are debatable by design. Each entry links to the test or code that
covers it.

Severity reflects user impact if this were a production system, not the fact that a
demo seeds the behavior on purpose.

## SauceDemo (UI)

| ID   | Area              | Account      | Severity | Coverage                 |
| ---- | ----------------- | ------------ | -------- | ------------------------ |
| UI-1 | Checkout          | error_user   | Critical | Automated (defect-watch) |
| UI-2 | Product images    | problem_user | Medium   | Automated (defect-watch) |
| UI-3 | Sorting           | error_user   | Medium   | Automated (defect-watch) |
| UI-4 | Menu / navigation | all users    | Low      | Handled in page object   |
| UI-5 | Layout / visual   | visual_user  | Low      | Observed, not automated  |

### UI-1: error_user cannot complete a purchase (Finish is inert)

- Severity: Critical (blocks the core revenue path).
- Steps: log in as error_user, add a product, proceed through checkout to the overview, click Finish.
- Expected: the order completes and the confirmation page is shown.
- Actual: the click is accepted but nothing happens; the page stays on checkout step two and the order never completes.
- Covered by: [a started order should complete when Finish is clicked](tests/defect-watch/seeded-defects.spec.ts#L74)

### UI-2: problem_user shows the same image for every product

- Severity: Medium (shoppers cannot tell products apart visually and may buy the wrong item).
- Steps: log in as problem_user, open the inventory.
- Expected: each of the six products renders its own distinct image.
- Actual: every product renders the same image.
- Covered by: [each product should have a distinct image](tests/defect-watch/seeded-defects.spec.ts#L32)

### UI-3: error_user sort dropdown does not reorder the catalog

- Severity: Medium (a visible control that silently does nothing).
- Steps: log in as error_user, choose "Name (Z to A)" in the sort dropdown.
- Expected: the catalog reorders to match the selected option.
- Actual: the dropdown value changes but the list stays in the default order.
- Covered by: [the sort dropdown should reorder the catalog (Z to A)](tests/defect-watch/seeded-defects.spec.ts#L55)

### UI-4: Reset App State leaves the burger menu open

- Severity: Low (UX quirk that surfaces as blocked clicks on narrow viewports).
- Steps: open the burger menu, click Reset App State.
- Expected: the action runs and the menu closes, or at least does not obstruct the page.
- Actual: the menu stays open; on a narrow (mobile) viewport the open overlay sits over the cart link and intercepts the next click. Found during cross-browser runs on mobile Chrome.
- Handling: the menu component closes the menu after Reset App State so dependent flows are not blocked. See [src/components/burger-menu.component.ts](src/components/burger-menu.component.ts#L101)

### UI-5: visual_user layout defects

- Severity: Low (cosmetic).
- Steps: log in as visual_user, browse the storefront.
- Expected: layout matches the standard user.
- Actual: seeded CSS and layout differences.
- Coverage: not automated. Best caught with visual-regression snapshots (toHaveScreenshot), noted as future work rather than asserted with brittle ad hoc checks.

## Swagger Petstore (API)

These are observations about a permissive, shared, public demo API. Some are genuine
contract gaps; others are characteristics the suite is written to tolerate so the build
stays honest. Severity assumes a production API.

| ID    | Endpoint              | Severity      | Coverage              |
| ----- | --------------------- | ------------- | --------------------- |
| API-1 | POST /pet             | Medium        | Observed (documented) |
| API-2 | POST /pet             | Medium        | Automated (negative)  |
| API-3 | GET /pet/findByStatus | Medium        | Handled (skip on 5xx) |
| API-4 | GET /pet/findByStatus | Low           | Handled (filtered)    |
| API-5 | GET /pet/{id}         | Low           | Automated (negative)  |
| API-6 | write then read       | Informational | Handled (polling)     |

### API-1: required fields are not enforced on create

- Severity: Medium (data integrity).
- Request: POST /pet with a body that omits name and photoUrls, both required by the Petstore spec.
- Expected: rejection with a client error (400) and an error envelope.
- Actual: returns 200 and creates a contract-incomplete pet.
- Note: because the server accepts this, the negative suite probes input it genuinely rejects (see API-2) rather than asserting validation the server does not perform. Documented in [api/tests/pet-negative.spec.ts](api/tests/pet-negative.spec.ts#L50) and [api/api-tests.md](api/api-tests.md).

### API-2: malformed input returns 500 instead of 400

- Severity: Medium (wrong error class; a client cannot tell its own bad request from a server fault).
- Request: POST /pet with an unparseable body, and separately with a wrong-typed field (a string id).
- Expected: 400 Bad Request with a { code, type, message } envelope.
- Actual: 500 with an error envelope. The suite asserts any status of 400 or greater plus a valid envelope, and records the real status, rather than pinning a code the server does not honor.
- Covered by: [POST with a malformed body is rejected with an error envelope](api/tests/pet-negative.spec.ts#L46)

### API-3: one tenant's bad data can 5xx a shared query

- Severity: Medium (robustness and isolation on a multi-tenant endpoint).
- Request: GET /pet/findByStatus for available, pending, or sold.
- Expected: 200 with the matching pets.
- Actual: intermittently 500, when another user's stored pet fails to serialize server-side. Seen on both sold and available.
- Handling: the suite skips a bucket only on 5xx (recording the status) and fails loudly on any 4xx, and keeps a separate check that available inventory must return 200, so the skip path can never leave the suite green with nothing asserted. See [api/tests/pet-find-by-status.spec.ts](api/tests/pet-find-by-status.spec.ts#L29)

### API-4: findByStatus returns schema-violating foreign pets

- Severity: Low (data integrity in shared storage).
- Request: GET /pet/findByStatus.
- Expected: every returned pet is a well-formed Pet.
- Actual: the multi-tenant response routinely includes other users' pets that omit fields, for example with no status at all.
- Handling: the per-pet check ignores foreign pets that have no status (status is optional in the schema) but still fails on a wrong concrete status; full Pet-shape validation is reserved for pets the suite created. See [api/tests/pet-find-by-status.spec.ts](api/tests/pet-find-by-status.spec.ts#L42)

### API-5: non-numeric id is handled permissively

- Severity: Low.
- Request: GET /pet/not-a-number.
- Expected: a clear client error.
- Actual: does not return a pet; the suite records the actual status rather than assuming a specific code.
- Covered by: [GET with a non-numeric id does not return a pet](api/tests/pet-negative.spec.ts#L33)

### API-6: eventual consistency on read-after-write and read-after-delete

- Severity: Informational (a characteristic of the shared sandbox, not strictly a defect).
- Behavior: a just-created pet may not be immediately readable, and a deleted pet may linger briefly.
- Handling: reads after a write or delete poll with expect.poll instead of asserting once. See [api/tests/pet-crud.spec.ts](api/tests/pet-crud.spec.ts#L27)

## How these are tracked

The SauceDemo seeded defects (UI-1 through UI-3) are encoded as expected failures with
Playwright's test.fail() in the non-blocking
[defect-watch lane](tests/defect-watch/seeded-defects.spec.ts). While a bug exists the
test passes; the day it is fixed upstream the test reports an unexpected pass and only
that lane goes red, which is the signal to remove the marker. The Petstore items are
handled inline in the API specs so the suite reports honestly against a shared public
host.
