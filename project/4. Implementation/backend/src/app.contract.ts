import type { FastifyInstance } from 'fastify';

/**
 * Fastify composition root.
 *
 * Owns one database connection and one Fastify instance until the instance is closed. It resolves
 * runtime paths, applies migrations before serving requests, installs generated Zod validation,
 * registers routes and serves the built SPA when static files are present.
 */

/** Optional runtime paths used to isolate the app in tests or configure production storage. */
export interface BuildAppOptions {
  /** SQLite database file; defaults to data/calendar.sqlite below the process directory. */
  readonly databasePath?: string | undefined;
  /** Directory containing committed Drizzle migrations. */
  readonly migrationsDirectory?: string | undefined;
  /** Built frontend directory served by Fastify when it exists. */
  readonly staticDirectory?: string | undefined;
}

/** Builds one Fastify instance and transfers ownership of its resources to that instance. */
export type BuildApp = (options?: BuildAppOptions) => Promise<FastifyInstance>;
