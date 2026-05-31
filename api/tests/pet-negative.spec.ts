import { test, expect } from '../fixtures/api.fixtures';
import { buildPet, randomPetId } from '../data/pet.factory';
import { apiErrorSchema } from '../schemas/pet.schema';

/**
 * Negative-path coverage for /pet. Protects against the API silently "succeeding"
 * on requests that should fail: a deleted pet must report 404, a malformed body
 * must be rejected with a proper error envelope, and a delete of nothing must 404.
 * Assertions are kept loose where the public sandbox is permissive (see per-test
 * notes), so the suite stays green on harmless server quirks but still catches a
 * real regression where bad input starts yielding 200s.
 */
test.describe('Pet endpoints: negative cases', () => {
  test('GET on a deleted pet returns 404 with an error envelope', async ({ petClient }) => {
    // Create then delete, so we hold an id that definitely no longer exists
    // (more reliable than guessing an unused id on a shared server).
    const pet = buildPet();
    await petClient.create(pet);
    await petClient.delete(pet.id);

    // Wait out the sandbox's delete lag, then assert the 404.
    await expect
      .poll(async () => (await petClient.getById(pet.id)).status(), { timeout: 10_000 })
      .toBe(404);

    const res = await petClient.getById(pet.id);
    expect(res.status()).toBe(404);
    // The Petstore returns a { code, type, message } error body.
    const body = apiErrorSchema.parse(await res.json());
    expect(body.message).toMatch(/not found/i);
  });

  test('GET with a non-numeric id does not return a pet', async ({ petClient }) => {
    const res = await petClient.getByRawId('not-a-number');

    // The public Petstore is permissive about input, so instead of asserting a
    // specific code we assert it doesn't succeed, and log the real status so the
    // actual behavior is documented rather than assumed.
    console.log(`GET /pet/not-a-number -> ${res.status()}`);
    expect(res.status()).not.toBe(200);
  });

  test('POST with a malformed body is rejected with an error envelope', async ({ petClient }) => {
    // The sandbox is permissive about *incomplete* pets (a POST that omits
    // name/photoUrls still returns 200), so we probe input it genuinely rejects:
    // an unparseable body, and a body that violates a field's type. Both come back
    // as a { code, type, message } envelope, which we validate, exercising the
    // error contract that the happy-path schema checks never reach.
    const badBodies = [
      { label: 'unparseable JSON', body: '{ not valid json' },
      {
        label: 'wrong-typed id (string, not number)',
        body: '{"id":"x","name":"pw","photoUrls":[]}',
      },
    ];

    for (const { label, body } of badBodies) {
      const res = await petClient.createRaw(body);
      console.log(`POST /pet (${label}) -> ${res.status()}`);
      // A rejection, not a silent 200 that creates a contract-violating pet.
      expect(res.status(), label).toBeGreaterThanOrEqual(400);
      const err = apiErrorSchema.parse(await res.json());
      expect(err.code, label).toBeGreaterThanOrEqual(400);
    }
  });

  test('DELETE of a non-existent pet returns 404', async ({ petClient }) => {
    // A high random id that was never created. Petstore reports 404 for a delete
    // that matches nothing, guarding against a silent "deleted something that was
    // not there" success.
    const res = await petClient.delete(randomPetId());
    expect(res.status()).toBe(404);
  });
});
