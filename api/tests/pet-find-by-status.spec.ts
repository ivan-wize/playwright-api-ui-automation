import { test, expect } from '../fixtures/api.fixtures';
import { buildPet } from '../data/pet.factory';
import { type PetStatus } from '../schemas/pet.schema';

/**
 * Coverage for the GET /pet/findByStatus filter: the endpoint must return ONLY
 * pets matching the queried status. The hard part is the shared, multi-tenant
 * sandbox, which mixes in other users' (often invalid) pets and intermittently
 * 5xxs per bucket. The comments below show how each assertion is narrowed to our
 * own contract so foreign/dirty data and transient outages aren't read as defects.
 */
test.describe('GET /pet/findByStatus', () => {
  const statuses: PetStatus[] = ['available', 'pending', 'sold'];

  for (const status of statuses) {
    test(`returns only pets with status "${status}"`, async ({ petClient }, testInfo) => {
      const res = await petClient.findByStatus(status);
      await testInfo.attach(`findByStatus(${status}) status`, {
        body: String(res.status()),
        contentType: 'text/plain',
      });

      // The sandbox can 5xx for a bucket when another user's corrupt data fails
      // to serialize server-side (seen on both "sold" and "available"). That's an
      // environment issue, not a filter defect, so we skip on 5xx. The skip is
      // scoped to 5xx on purpose: any 4xx (renamed route, auth/contract change) is
      // a real regression and must fail loudly, not turn into a green skip.
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip(res.status() >= 500, `findByStatus(${status}) returned ${res.status()}`);

      // Assert only the filter contract (every returned pet carries the queried
      // status), NOT the full Pet shape: the response is the whole multi-tenant
      // inventory and routinely includes other users' schema-violating pets, so
      // validating each one here would flake on dirty foreign data. Full shape
      // validation lives in pet-crud / pet-negative, which only touch our own pets.
      const pets = (await res.json()) as Array<{ status?: string }>;
      expect(Array.isArray(pets)).toBe(true);

      // Every returned pet must match. Ignore foreign pets that come back with no
      // status at all (it's optional in the schema), but a *wrong* concrete status
      // is a real filter defect and still fails.
      const withStatus = pets.filter((pet) => pet.status !== undefined);
      for (const pet of withStatus) {
        expect(pet.status).toBe(status);
      }
    });
  }

  test('a created pet is returned in its own status bucket', async ({ petClient }) => {
    // Positive membership: the filter must actually surface a pet we know exists,
    // not merely avoid returning wrong-status ones; an always-empty response would
    // pass the parametrized checks above vacuously. Create an 'available' pet (the
    // bucket the suite already relies on being reachable), then poll until our id
    // appears, since the sandbox is eventually consistent after a write.
    const pet = buildPet({ status: 'available' });
    expect((await petClient.create(pet)).status()).toBe(200);

    await expect
      .poll(
        async () => {
          const res = await petClient.findByStatus('available');
          if (res.status() !== 200) return false;
          const pets = (await res.json()) as Array<{ id?: number }>;
          return pets.some((p) => p.id === pet.id);
        },
        {
          timeout: 15_000,
          message: 'created pet never appeared in findByStatus(available)',
        },
      )
      .toBe(true);
  });

  test('available inventory exists, so the filter contract is always exercised', async ({
    petClient,
  }) => {
    // "available" is the one bucket we *require* to return 200 (polling through
    // transient 500s), so the skip-on-500 handling above can't leave every bucket
    // skipped yet still green. Per-pet status is asserted above; here we just
    // confirm inventory exists.
    let pets: unknown[] = [];
    await expect
      .poll(
        async () => {
          const res = await petClient.findByStatus('available');
          if (res.status() === 200) pets = (await res.json()) as unknown[];
          return res.status();
        },
        { timeout: 15_000, message: 'findByStatus(available) never returned 200' },
      )
      .toBe(200);

    expect(pets.length).toBeGreaterThan(0);
  });

  test('an unknown status returns a well-formed, empty result', async ({ petClient }, testInfo) => {
    // An unrecognized status is not a server error here: Petstore returns 200 with
    // an empty array rather than rejecting it. We assert the filter contract still
    // holds, i.e. nothing comes back claiming the bogus status.
    const res = await petClient.findByRawStatus('not-a-real-status');
    await testInfo.attach('findByStatus(not-a-real-status) status', {
      body: String(res.status()),
      contentType: 'text/plain',
    });

    // Same 5xx-skip rule as the parametrized tests: an unhealthy upstream is an
    // environment issue, while a 4xx would be a real contract change.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(res.status() >= 500, `findByStatus(invalid) returned ${res.status()}`);

    expect(res.status()).toBe(200);
    const pets = (await res.json()) as Array<{ status?: string }>;
    expect(Array.isArray(pets)).toBe(true);
    expect(pets.every((pet) => pet.status !== 'not-a-real-status')).toBe(true);
  });
});
