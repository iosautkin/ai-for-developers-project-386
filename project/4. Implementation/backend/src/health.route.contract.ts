import type { FastifyInstance } from 'fastify';

/**
 * Infrastructure readiness route.
 *
 * The module is stateless. It registers the TypeSpec-derived response schemas and exposes the
 * readiness result without adding product behavior.
 */

/** Stable HTTP path declared by the TypeSpec getHealth operation. */
export const HEALTH_ROUTE_PATH = '/api/health';

/** Registers the readiness endpoint on an existing Fastify instance. */
export type RegisterHealthRoute = (
  app: FastifyInstance, // application instance that owns the registered route
) => void;
