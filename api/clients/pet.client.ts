import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { type Pet, type PetStatus } from '../schemas/pet.schema';

/**
 * Wrapper over the Petstore /pet endpoints. The configured base URL is the host
 * only (https://petstore.swagger.io); the API version lives here in the client.
 *
 * Note on paths: Playwright resolves a request path against baseURL via the URL
 * constructor, where a leading-slash path replaces the base's whole path. So we
 * keep the base host-only and put the full "/v2/pet" path here, which resolves
 * to https://petstore.swagger.io/v2/pet correctly.
 */
export class PetClient {
  // Full path from the host root, in one place so the prefix isn't repeated.
  private readonly base = '/v2/pet';

  /** Ids of pets created through this client, recorded for best-effort cleanup. */
  readonly createdIds: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  create(pet: Pet): Promise<APIResponse> {
    // Record the id before the POST is sent, not after it resolves: if the
    // request fails mid-flight the fixture's teardown still attempts cleanup.
    this.createdIds.push(pet.id);
    return this.request.post(this.base, { data: pet });
  }

  /**
   * POST a raw, unvalidated body so negative tests can probe how the API handles
   * malformed JSON or a payload that violates the Pet contract (e.g. a wrong-typed
   * field). Not recorded for cleanup: a rejected POST creates nothing.
   */
  createRaw(body: string): Promise<APIResponse> {
    return this.request.post(this.base, {
      headers: { 'content-type': 'application/json' },
      data: body,
    });
  }

  getById(petId: number): Promise<APIResponse> {
    return this.request.get(`${this.base}/${petId}`);
  }

  /** Like getById but accepts a raw id, so negative tests can probe malformed input. */
  getByRawId(petId: string): Promise<APIResponse> {
    return this.request.get(`${this.base}/${petId}`);
  }

  update(pet: Pet): Promise<APIResponse> {
    return this.request.put(this.base, { data: pet });
  }

  findByStatus(status: PetStatus): Promise<APIResponse> {
    return this.request.get(`${this.base}/findByStatus`, { params: { status } });
  }

  /** Like findByStatus but accepts a raw value, so negative tests can query an invalid status. */
  findByRawStatus(status: string): Promise<APIResponse> {
    return this.request.get(`${this.base}/findByStatus`, { params: { status } });
  }

  delete(petId: number): Promise<APIResponse> {
    return this.request.delete(`${this.base}/${petId}`);
  }
}
