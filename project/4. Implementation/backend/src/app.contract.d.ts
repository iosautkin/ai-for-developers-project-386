import type { FastifyInstance } from 'fastify';

export interface BuildAppOptions {
  readonly databasePath?: string | undefined;
  readonly migrationsDirectory?: string | undefined;
  readonly staticDirectory?: string | undefined;
}

/** Builds one Fastify instance and owns all resources until it is closed. */
export type BuildApp = (options?: BuildAppOptions) => Promise<FastifyInstance>;
