import { type Pet } from '../schemas/pet.schema';

/**
 * Random id in a high range that avoids the Petstore's sample data, while
 * staying small enough to be a safe JS integer. Keeps parallel tests from
 * stepping on each other's pets.
 */
export function randomPetId(): number {
  return Math.floor(1_000_000 + Math.random() * 99_000_000);
}

/** Build a valid Pet payload; pass overrides to customize any field. */
export function buildPet(overrides: Partial<Pet> = {}): Pet {
  const id = overrides.id ?? randomPetId();
  return {
    id,
    name: `pw-pet-${id}`,
    photoUrls: ['https://example.com/photo.jpg'],
    status: 'available',
    category: { id: 1, name: 'dogs' },
    tags: [{ id: 1, name: 'automation' }],
    ...overrides,
  };
}
