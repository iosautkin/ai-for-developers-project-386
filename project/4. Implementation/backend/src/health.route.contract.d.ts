import type { FastifyInstance } from 'fastify';

/** Registers the infrastructure-only readiness endpoint from the TypeSpec contract. */
export type RegisterHealthRoute = (app: FastifyInstance) => void;
