import type { ApiError } from '@calendar/api-contract/schemas';

/**
 * Expected API failure shared by business services and the Fastify error boundary.
 *
 * The object carries only the public status and TypeSpec-derived body. Unexpected errors remain
 * ordinary errors and are converted to a generic 500 response by the composition root.
 */

/** HTTP statuses intentionally exposed by the Calendar API contract. */
export type ApiFailureStatus = 400 | 404 | 409;

/** Runtime shape recognized by the global Fastify error handler. */
export interface ApiFailureShape extends Error {
  readonly statusCode: ApiFailureStatus;
  readonly body: ApiError;
}
