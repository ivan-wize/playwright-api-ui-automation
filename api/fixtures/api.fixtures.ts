import { test as base } from '@playwright/test';
import { PetClient } from '../clients/pet.client';

/**
 * Test/fixture surface for the API suite. Every spec in api/tests imports `test`
 * and `expect` from here (not from @playwright/test) so it gets a per-test
 * `petClient` plus automatic cleanup of any pets that test created.
 */

type ApiFixtures = {
  petClient: PetClient;
};

export const test = base.extend<ApiFixtures>({
  // `request` is Playwright's built-in API context; the api project gives it
  // the Petstore baseURL.
  petClient: async ({ request }, use) => {
    const client = new PetClient(request);
    await use(client);
    // Best-effort teardown: delete any pets created during the test so a failure
    // mid-lifecycle doesn't leak data on the shared sandbox. Errors are swallowed
    // (an already-deleted pet 404s) so cleanup never masks the real result.
    for (const id of client.createdIds) {
      await client.delete(id).catch(() => {});
    }
  },
});

export { expect } from '@playwright/test';
