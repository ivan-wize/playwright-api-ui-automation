import { test, expect } from '../fixtures/api.fixtures';
import { buildPet } from '../data/pet.factory';
import { petSchema, type Pet } from '../schemas/pet.schema';

/**
 * Happy-path coverage for the full /pet lifecycle (POST -> GET -> PUT -> DELETE).
 * Guards the core promise of the API: a pet you create is readable, editable,
 * and removable, with every response matching the contract in pet.schema.
 * Runs the whole lifecycle in one test so each step builds on the previous
 * one's real server state instead of fabricated fixtures.
 */
test.describe('Pet CRUD lifecycle', () => {
  test('create, read, update, and delete a pet', async ({ petClient }) => {
    const pet = buildPet();

    await test.step('Create', async () => {
      const res = await petClient.create(pet);
      expect(res.status()).toBe(200);
      // parse() validates the response shape AND returns a typed object.
      const body = petSchema.parse(await res.json());
      expect(body).toMatchObject({ id: pet.id, name: pet.name, status: 'available' });
    });

    await test.step('Read back the created pet', async () => {
      // The public sandbox can lag, so poll until the GET succeeds rather than
      // asserting a single time.
      await expect
        .poll(async () => (await petClient.getById(pet.id)).status(), { timeout: 10_000 })
        .toBe(200);

      const res = await petClient.getById(pet.id);
      const body = petSchema.parse(await res.json());
      expect(body.id).toBe(pet.id);
      expect(body.name).toBe(pet.name);
    });

    await test.step('Update the pet', async () => {
      const updated: Pet = { ...pet, name: `${pet.name}-updated`, status: 'sold' };
      const res = await petClient.update(updated);
      expect(res.status()).toBe(200);
      const body = petSchema.parse(await res.json());
      expect(body.name).toBe(updated.name);
      expect(body.status).toBe('sold');
    });

    await test.step('Delete the pet', async () => {
      const res = await petClient.delete(pet.id);
      expect(res.status()).toBe(200);
    });

    await test.step('Confirm it is gone', async () => {
      // Poll again for the delete to take effect.
      await expect
        .poll(async () => (await petClient.getById(pet.id)).status(), { timeout: 10_000 })
        .toBe(404);
    });
  });
});
