import { z } from 'zod';

/**
 * Zod contract for the Petstore /pet resource and its error envelope, plus the
 * `Pet` / `PetStatus` types inferred from them. Specs call `petSchema.parse()`
 * on responses to assert shape and get a typed body in one step, so a contract
 * change on the API surfaces as a parse failure here rather than a vague
 * downstream assertion. Edit these schemas only to track the real Petstore spec.
 */

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const petStatusSchema = z.enum(['available', 'pending', 'sold']);

// name and photoUrls are the required fields per the Petstore spec; the rest
// are optional. Validating responses against this catches contract drift.
export const petSchema = z.object({
  id: z.number(),
  category: categorySchema.optional(),
  name: z.string(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagSchema).optional(),
  status: petStatusSchema.optional(),
});

// The standard Petstore error envelope, e.g. { code, type, message }.
export const apiErrorSchema = z.object({
  code: z.number(),
  type: z.string(),
  message: z.string(),
});

export type Pet = z.infer<typeof petSchema>;
export type PetStatus = z.infer<typeof petStatusSchema>;
