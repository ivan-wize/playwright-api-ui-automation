# API Tests: Swagger Petstore

Automated tests for the Petstore **Pet** endpoints, living alongside the UI suite in this repo.

## Tools / frameworks

- **Playwright Test** (`@playwright/test`) as both the runner and the HTTP client (via `APIRequestContext`).
- **TypeScript** throughout.
- **Zod** for response schema / contract validation.

Playwright was chosen over Jest + a separate HTTP library so the whole repo runs on one test runner, one config, and one CI pipeline. The API tests are simply a separate Playwright project (`api`) that runs with no browser.

## How to run

From the repo root:

```bash
npm install
npm run test:api
```

The full suite (UI + API) runs with `npm test`; `npm run report` opens the last HTML report. The target is the public Swagger Petstore (`https://petstore.swagger.io`), configurable via `API_BASE_URL` in `.env`.

## Layout

- `api/clients/pet.client.ts`: typed wrapper over the `/pet` endpoints
- `api/schemas/pet.schema.ts`: Zod schemas (Pet + error envelope) and derived types
- `api/data/pet.factory.ts`: builds unique Pet payloads
- `api/fixtures/api.fixtures.ts`: injects the `PetClient` into specs and cleans up the pets they create
- `api/tests/*.spec.ts`: the specs

## Coverage

**CRUD lifecycle** (`pet-crud.spec.ts`)

- `POST /pet` → create; response validated against the Pet schema
- `GET /pet/{id}` → read the created pet back
- `PUT /pet` → update name + status
- `DELETE /pet/{id}` → delete, then confirm a follow-up `GET` returns `404`

**Query** (`pet-find-by-status.spec.ts`)

- `GET /pet/findByStatus` for `available` / `pending` / `sold`: asserts the filter contract, i.e. every returned pet that carries a `status` matches the queried one
- A positive-membership check: create an `available` pet, then poll `findByStatus(available)` until our own id appears, proving the filter actually surfaces a pet we know exists (so an always-empty response can't pass the contract above vacuously)
- A dedicated `available` check that requires a `200` (polling through transient 5xx) and a non-empty result: a safety net so the skip handling below can never leave every bucket skipped while the suite still reports green
- An unknown status value returns `200` with an empty, well-formed result, and nothing claiming the bogus status (the filter does not error on bad input)

**Negative** (`pet-negative.spec.ts`)

- `GET` on a deleted pet → `404` with a `{ code, type, message }` error body
- `GET` with a non-numeric id → does not return a pet (records the actual status)
- `POST /pet` with a malformed body (unparseable JSON, and a wrong-typed field) → rejected with a `{ code, type, message }` envelope, which is validated. This exercises the error contract directly: the sandbox accepts an _incomplete_ pet (a `POST` missing `name` / `photoUrls` still returns `200`), so we probe input it genuinely rejects rather than assert validation the server does not enforce
- `DELETE /pet/{id}` on an id that was never created → `404`, guarding against a silent delete-of-nothing success

## Deliberately out of scope

A reasonable subset was chosen over exhaustive coverage:

- `GET /pet/findByTags`: same query/filter shape as `findByStatus`, so it would mostly re-test behavior already covered.
- `POST /pet/{id}` (`updatePetWithForm`) and `POST /pet/{id}/uploadImage`: form-data / multipart endpoints whose extra plumbing isn't worth the marginal coverage here.
- `api_key` / auth handling: the public sandbox doesn't enforce it.

## Why the live sandbox, not a local Petstore

The tests run against the public `petstore.swagger.io`, not a local instance. The official image (`docker run -d -p 8080:8080 swaggerapi/petstore`) would give a clean, deterministic, single-tenant server and remove nearly every workaround in the next section: the 5xx skips, the eventual-consistency polling, the foreign-data filtering. The live sandbox was chosen deliberately: it's the exact target named in the task, it needs zero setup to run, and (more useful for a QE exercise) it forces the suite to cope with a shared, sometimes-broken, multi-tenant environment, which is far closer to testing a real staging API than a pristine local mock. For a regression suite I owned long-term I'd flip this: pin to the Docker image (or a dedicated test tenant) for determinism, and keep only a thin smoke lane against the live host.

## Notes from testing a shared public sandbox

These shaped the approach more than the endpoints themselves did:

- **Eventual consistency:** a just-created pet may not be immediately readable and a deleted one may linger, so read-after-write and read-after-delete use `expect.poll` instead of a single assertion.
- **Unique data:** the factory assigns random high ids so parallel tests (and other users) don't collide.
- **Cleanup:** each created id is recorded _before_ its `POST` and deleted in fixture teardown (errors swallowed, since an already-deleted pet `404`s), so a failure mid-lifecycle doesn't leak data on the shared sandbox.
- **Permissive validation:** the API often accepts invalid input, so negative tests record the actual behavior (e.g. the status returned for a non-numeric id) rather than asserting validation the server doesn't enforce.
- **Server instability on shared data:** `findByStatus` intermittently returns **5xx** for a bucket (seen on both `sold` and `available`), almost certainly other users' data failing to serialize server-side. That's an environment issue, not a filter defect, so a bucket that returns **5xx** is skipped with its status recorded. The skip is scoped to 5xx on purpose: any **4xx** (a renamed route, an auth/contract change) is a real regression and fails loudly instead of becoming a green skip.
- **Dirty foreign data:** `findByStatus` returns the whole multi-tenant inventory, which routinely includes other users' schema-violating pets inside an otherwise-`200` response. So the per-pet check ignores foreign pets that come back with no `status` at all (it's optional in the schema); a _wrong_ concrete status is still a real filter defect and fails. Full `Pet`-shape validation is reserved for pets the suite itself created (CRUD / negative), so dirty foreign data can't masquerade as our own contract drift.
- **Base URL:** the configured base is the host only; `/v2` lives in the client paths. Playwright resolves request paths against `baseURL` via the `URL` constructor, where a leading-slash path replaces the base's whole path, so a base of `.../v2` + path `/pet` would resolve to `.../pet` and 404.
