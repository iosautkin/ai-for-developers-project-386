import type { FastifyInstance } from 'fastify';

import type { DatabaseConnection } from './database.contract.js';

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
  database: DatabaseConnection, // live SQLite connection checked by the handler
) => void;
